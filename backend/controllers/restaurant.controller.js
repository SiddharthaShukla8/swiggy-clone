const Restaurant = require("../models/restaurant.model");
const FoodItem = require("../models/foodItem.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

// @desc    Add a new restaurant
// @route   POST /api/v1/restaurants
// @access  Private (Owner/Admin)
const addRestaurant = asyncHandler(async (req, res) => {
    const { name, description, address, location, cuisines, deliveryTime, isPureVeg } = req.body;
    const imageUrl = req.file ? req.file.path : undefined;

    if (!name || !address || !location) {
        return res.status(400).json(new ApiResponse(400, null, "Name, address and location are required"));
    }

    const restaurant = await Restaurant.create({
        name,
        description,
        address,
        location,
        cuisines,
        deliveryTime,
        isPureVeg,
        image: imageUrl,
        ownerId: req.user._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, restaurant, "Restaurant added successfully"));
});

// @desc    Get restaurants near a specific location with filters/sort/pagination
// @route   GET /api/v1/restaurants/nearby
// @access  Public
const getNearbyRestaurants = asyncHandler(async (req, res) => {
    const {
        lat, lng,
        radius = 5000,
        page = 1,
        limit = 12,
        sortBy = "relevance",    // relevance | rating | deliveryTime | distance
        veg,                      // "true" → isPureVeg only
        rating,                   // min rating e.g. "4"
        cuisine,                  // cuisine filter e.g. "Biryani"
        isOpen,                   // "true" → only open restaurants
    } = req.query;

    const parsedPage   = Math.max(parseInt(page,   10) || 1,     1);
    const parsedLimit  = Math.max(parseInt(limit,  10) || 12,    1);
    const parsedRadius = Math.max(parseInt(radius, 10) || 5000,  1);
    const skip         = (parsedPage - 1) * parsedLimit;
    const parsedLat    = Number.parseFloat(lat);
    const parsedLng    = Number.parseFloat(lng);
    const hasCoords    = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

    // Build the additional match filters that apply after the initial geo/approval filter
    const extraMatch = {};
    if (veg === "true")        extraMatch.isPureVeg     = true;
    if (isOpen === "true")     extraMatch.isOpen        = true;
    if (rating)                extraMatch.averageRating = { $gte: parseFloat(rating) };
    if (cuisine)               extraMatch.cuisines      = { $regex: new RegExp(cuisine, "i") };

    // Build sort stage
    let sortStage = { createdAt: -1 };
    if (sortBy === "rating")        sortStage = { averageRating: -1 };
    else if (sortBy === "deliveryTime") sortStage = { deliveryTime: 1 };
    else if (sortBy === "distance" && hasCoords) sortStage = { distance: 1 };

    let restaurants = [];
    let total = 0;

    if (hasCoords) {
        const pipeline = [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [parsedLng, parsedLat] },
                    distanceField: "distance",
                    maxDistance: parsedRadius,
                    query: { isApproved: true, ...extraMatch },
                    spherical: true,
                },
            },
            {
                $facet: {
                    restaurants: [{ $sort: sortStage }, { $skip: skip }, { $limit: parsedLimit }],
                    metadata: [{ $count: "total" }],
                },
            },
        ];

        const [result] = await Restaurant.aggregate(pipeline);
        restaurants = result?.restaurants || [];
        total       = result?.metadata?.[0]?.total || 0;
    }

    // Fallback if no coords or no geo results
    if (total === 0) {
        const query = { isApproved: true, ...extraMatch };
        total       = await Restaurant.countDocuments(query);
        restaurants = await Restaurant.find(query)
            .sort(sortStage)
            .skip(skip)
            .limit(parsedLimit)
            .lean();
    }

    return res.status(200).json(
        new ApiResponse(200, {
            restaurants,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                pages: Math.ceil(total / parsedLimit),
                hasMore: parsedPage < Math.ceil(total / parsedLimit),
            },
            appliedFilters: { veg, rating, cuisine, isOpen, sortBy },
        }, "Restaurants fetched successfully")
    );
});

// @desc    Get restaurant detail and menu
// @route   GET /api/v1/restaurants/:id
// @access  Public
const getRestaurantById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
        return res.status(404).json(new ApiResponse(404, null, "Restaurant not found"));
    }

    // Fetch menu grouped by category for better UX
    const menuItems = await FoodItem.find({ restaurantId: id }).lean();
    const categories = [...new Set(menuItems.map(i => i.category).filter(Boolean))];
    const menuByCategory = categories.map(cat => ({
        category: cat,
        items: menuItems.filter(i => i.category === cat),
    }));

    return res.status(200).json(
        new ApiResponse(200, {
            restaurant,
            menu: menuItems,
            menuByCategory,
            categories,
        }, "Restaurant details fetched successfully")
    );
});

// @desc    Search restaurants by name, cuisine, or food items
// @route   GET /api/v1/restaurants/search
// @access  Public
const searchRestaurants = asyncHandler(async (req, res) => {
    const { q, lat, lng, veg, rating, sortBy = "relevance", limit = 20 } = req.query;

    if (!q) {
        return res.status(400).json(new ApiResponse(400, null, "Query parameter 'q' is required"));
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const pipeline = [];
    const searchRegex = new RegExp(q.trim(), "i");

    // Geo stage (optional)
    if (lat && lng) {
        pipeline.push({
            $geoNear: {
                near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                distanceField: "distance",
                maxDistance: 10000,
                query: { isApproved: true },
                spherical: true,
            },
        });
    } else {
        pipeline.push({ $match: { isApproved: true } });
    }

    // Lookup food items for dish-level matching
    pipeline.push({
        $lookup: {
            from: "fooditems",
            localField: "_id",
            foreignField: "restaurantId",
            as: "menuItems",
        },
    });

    // Search across name, cuisines array elements, menu item names & categories
    pipeline.push({
        $match: {
            $or: [
                { name: searchRegex },
                { cuisines: searchRegex },          // Works correctly on string arrays
                { description: searchRegex },
                { "menuItems.name": searchRegex },
                { "menuItems.category": searchRegex },
            ],
        },
    });

    // Additional filters
    if (veg === "true")  pipeline.push({ $match: { isPureVeg: true } });
    if (rating)          pipeline.push({ $match: { averageRating: { $gte: parseFloat(rating) } } });

    // Sorting
    if (sortBy === "rating")       pipeline.push({ $sort: { averageRating: -1 } });
    else if (sortBy === "deliveryTime") pipeline.push({ $sort: { deliveryTime: 1 } });
    else if (sortBy === "distance" && lat && lng) pipeline.push({ $sort: { distance: 1 } });
    else                           pipeline.push({ $sort: { averageRating: -1, createdAt: -1 } });

    pipeline.push({ $limit: parsedLimit });

    // Project: strip internal menu items from response
    pipeline.push({ $project: { menuItems: 0 } });

    const restaurants = await Restaurant.aggregate(pipeline);
    const total = restaurants.length;

    return res.status(200).json(
        new ApiResponse(200, { restaurants, total }, "Search results fetched successfully")
    );
});

// @desc    Get restaurants filtered by cuisine
// @route   GET /api/v1/restaurants/by-cuisine
// @access  Public
const getRestaurantsByCuisine = asyncHandler(async (req, res) => {
    const {
        cuisine,
        lat, lng,
        page = 1, limit = 12,
        sortBy = "rating",
        veg, rating,
    } = req.query;

    if (!cuisine) {
        return res.status(400).json(new ApiResponse(400, null, "cuisine parameter is required"));
    }

    const parsedPage  = Math.max(parseInt(page,  10) || 1,  1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 12, 1);
    const skip        = (parsedPage - 1) * parsedLimit;
    const parsedLat   = Number.parseFloat(lat);
    const parsedLng   = Number.parseFloat(lng);
    const hasCoords   = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

    const cuisineRegex = new RegExp(cuisine.trim(), "i");
    const baseQuery    = { isApproved: true, cuisines: cuisineRegex };
    if (veg === "true") baseQuery.isPureVeg = true;
    if (rating)         baseQuery.averageRating = { $gte: parseFloat(rating) };

    let sortStage = { averageRating: -1, totalReviews: -1 };
    if (sortBy === "deliveryTime") sortStage = { deliveryTime: 1 };

    let restaurants = [];
    let total = 0;

    if (hasCoords) {
        const pipeline = [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [parsedLng, parsedLat] },
                    distanceField: "distance",
                    maxDistance: 10000,
                    query: baseQuery,
                    spherical: true,
                },
            },
            {
                $facet: {
                    restaurants: [
                        { $sort: sortBy === "distance" ? { distance: 1 } : sortStage },
                        { $skip: skip },
                        { $limit: parsedLimit },
                    ],
                    metadata: [{ $count: "total" }],
                },
            },
        ];
        const [result] = await Restaurant.aggregate(pipeline);
        restaurants = result?.restaurants || [];
        total       = result?.metadata?.[0]?.total || 0;
    }

    if (total === 0) {
        total       = await Restaurant.countDocuments(baseQuery);
        restaurants = await Restaurant.find(baseQuery).sort(sortStage).skip(skip).limit(parsedLimit).lean();
    }

    return res.status(200).json(
        new ApiResponse(200, {
            cuisine,
            restaurants,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                pages: Math.ceil(total / parsedLimit),
                hasMore: parsedPage < Math.ceil(total / parsedLimit),
            },
        }, `Restaurants for cuisine '${cuisine}' fetched successfully`)
    );
});

// @desc    Get trending cuisine tags with restaurant counts
// @route   GET /api/v1/restaurants/trending-cuisines
// @access  Public
const getTrendingCuisines = asyncHandler(async (req, res) => {
    const { limit = 12, lat, lng } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 12, 20);

    const baseMatch = { isApproved: true };

    const results = await Restaurant.aggregate([
        { $match: baseMatch },
        { $unwind: "$cuisines" },
        { $group: { _id: "$cuisines", count: { $sum: 1 }, avgRating: { $avg: "$averageRating" } } },
        { $sort: { count: -1, avgRating: -1 } },
        { $limit: parsedLimit },
        { $project: { _id: 0, cuisine: "$_id", count: 1, avgRating: { $round: ["$avgRating", 1] } } },
    ]);

    return res.status(200).json(
        new ApiResponse(200, results, "Trending cuisines fetched successfully")
    );
});

// @desc    Get quick restaurant stats for homepage
// @route   GET /api/v1/restaurants/stats
// @access  Public
const getRestaurantStats = asyncHandler(async (req, res) => {
    const [total, topRated, pureVeg, avgDelivery] = await Promise.all([
        Restaurant.countDocuments({ isApproved: true }),
        Restaurant.countDocuments({ isApproved: true, averageRating: { $gte: 4 } }),
        Restaurant.countDocuments({ isApproved: true, isPureVeg: true }),
        Restaurant.aggregate([
            { $match: { isApproved: true } },
            { $group: { _id: null, avg: { $avg: "$deliveryTime" } } },
        ]),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            totalRestaurants: total,
            topRated,
            pureVeg,
            avgDeliveryTime: Math.round(avgDelivery[0]?.avg || 30),
        }, "Stats fetched successfully")
    );
});

// @desc    Get restaurant owned by current user
// @route   GET /api/v1/restaurants/my
// @access  Private (Owner/Admin)
const getMyRestaurant = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
        return res.status(200).json(new ApiResponse(200, null, "No restaurant registered for this owner"));
    }

    return res.status(200)
        .json(new ApiResponse(200, restaurant, "Owner restaurant fetched successfully"));
});

// @desc    Get menu of a specific restaurant
// @route   GET /api/v1/restaurants/:id/menu
// @access  Public
const getRestaurantMenu = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { veg, category, q } = req.query;

    const filter = { restaurantId: id, isAvailable: true };
    if (veg === "true") filter.isVeg = true;
    if (category)       filter.category = { $regex: new RegExp(category, "i") };
    if (q)              filter.name = { $regex: new RegExp(q, "i") };

    const menu = await FoodItem.find(filter).lean();
    const categories = await FoodItem.distinct("category", { restaurantId: id, isAvailable: true });

    return res.status(200)
        .json(new ApiResponse(200, { menu, categories }, "Menu fetched successfully"));
});

// @desc    Update restaurant details (including image)
// @route   PUT /api/v1/restaurants/
// @access  Private (Owner/Admin)
const updateRestaurant = asyncHandler(async (req, res) => {
    const { name, description, address, location, cuisines, deliveryTime, isPureVeg } = req.body;
    const updateData = { name, description, address, location, cuisines, deliveryTime, isPureVeg };

    if (req.file) {
        updateData.image = req.file.path;
    }

    const restaurant = await Restaurant.findOneAndUpdate(
        { ownerId: req.user._id },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!restaurant) {
        return res.status(404).json(new ApiResponse(404, null, "Restaurant not found"));
    }

    return res.status(200)
        .json(new ApiResponse(200, restaurant, "Restaurant updated successfully"));
});

module.exports = {
    addRestaurant,
    getNearbyRestaurants,
    getRestaurantById,
    searchRestaurants,
    getRestaurantsByCuisine,
    getTrendingCuisines,
    getRestaurantStats,
    getMyRestaurant,
    getRestaurantMenu,
    updateRestaurant,
};
