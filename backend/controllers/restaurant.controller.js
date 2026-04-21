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

// @desc    Get restaurants near a specific location
// @route   GET /api/v1/restaurants/nearby
// @access  Public
const getNearbyRestaurants = asyncHandler(async (req, res) => {
    const { lat, lng, radius = 5000, page = 1, limit = 10 } = req.query; // radius in meters
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const parsedRadius = Math.max(parseInt(radius, 10) || 5000, 1);
    const skip = (parsedPage - 1) * parsedLimit;
    const parsedLat = Number.parseFloat(lat);
    const parsedLng = Number.parseFloat(lng);
    const hasValidCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

    let restaurants = [];
    let total = 0;

    if (hasValidCoords) {
        const [nearbyResult] = await Restaurant.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [parsedLng, parsedLat],
                    },
                    distanceField: "distance",
                    maxDistance: parsedRadius,
                    query: { isApproved: true },
                    spherical: true,
                },
            },
            {
                $facet: {
                    restaurants: [
                        { $skip: skip },
                        { $limit: parsedLimit },
                    ],
                    metadata: [
                        { $count: "total" },
                    ],
                },
            },
        ]);

        restaurants = nearbyResult?.restaurants || [];
        total = nearbyResult?.metadata?.[0]?.total || 0;
    }

    // Fallback: If no coords or no nearby found, return initial set of top approved restaurants
    if (total === 0) {
        total = await Restaurant.countDocuments({ isApproved: true });
        restaurants = await Restaurant.find({ isApproved: true })
            .skip(skip)
            .limit(parsedLimit);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {
            restaurants,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                pages: Math.ceil(total / parsedLimit)
            }
        }, "Restaurants fetched successfully"));
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

    // Fetch menu items for this restaurant
    const menu = await FoodItem.find({ restaurantId: id });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { restaurant, menu },
                "Restaurant details fetched successfully"
            )
        );
});

// @desc    Search restaurants by name, cuisine, or food items
// @route   GET /api/v1/restaurants/search
// @access  Public
const searchRestaurants = asyncHandler(async (req, res) => {
    const { q, lat, lng, veg, rating, sortBy = "relevance" } = req.query;

    if (!q) {
        return res.status(400).json(new ApiResponse(400, null, "Query parameter 'q' is required"));
    }

    const aggregationPipeline = [];

    // 1. Geospatial Filtering (Optional but recommended if coords present)
    if (lat && lng) {
        aggregationPipeline.push({
            $geoNear: {
                near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                distanceField: "distance",
                maxDistance: 10000, // 10km radius
                query: { isApproved: true },
                spherical: true,
            },
        });
    } else {
        aggregationPipeline.push({ $match: { isApproved: true } });
    }

    // 2. Lookup Food Items for Dish-Level Search
    aggregationPipeline.push({
        $lookup: {
            from: "fooditems",
            localField: "_id",
            foreignField: "restaurantId",
            as: "menuItems",
        },
    });

    // 3. Match keyword in Name, Cuisines, or Menu
    const searchRegex = new RegExp(q, "i");
    aggregationPipeline.push({
        $match: {
            $or: [
                { name: searchRegex },
                { cuisines: { $in: [searchRegex] } },
                { "menuItems.name": searchRegex },
                { "menuItems.category": searchRegex },
            ],
        },
    });

    // 4. Additional Filters
    if (veg === "true") {
        aggregationPipeline.push({ $match: { isPureVeg: true } });
    }
    if (rating) {
        aggregationPipeline.push({ $match: { averageRating: { $gte: parseFloat(rating) } } });
    }

    // 5. Sorting
    if (sortBy === "rating") {
        aggregationPipeline.push({ $sort: { averageRating: -1 } });
    } else if (sortBy === "deliveryTime") {
        aggregationPipeline.push({ $sort: { deliveryTime: 1 } });
    } else if (sortBy === "distance" && lat && lng) {
        aggregationPipeline.push({ $sort: { distance: 1 } });
    } else {
        // Default relevance sort (simplified: just show approved/featured)
        aggregationPipeline.push({ $sort: { createdAt: -1 } });
    }

    // 6. Project clean output
    aggregationPipeline.push({
        $project: {
            menuItems: 0, // Don't send entire menu in search results
        },
    });

    const restaurants = await Restaurant.aggregate(aggregationPipeline);

    return res
        .status(200)
        .json(new ApiResponse(200, restaurants, "Search results fetched successfully"));
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

    const menu = await FoodItem.find({ restaurantId: id });

    return res.status(200)
        .json(new ApiResponse(200, menu, "Menu fetched successfully"));
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
    getMyRestaurant,
    getRestaurantMenu,
    updateRestaurant,
};
