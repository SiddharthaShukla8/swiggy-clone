const Restaurant = require("../models/restaurant.model");
const FoodItem = require("../models/foodItem.model");

const CATEGORY_IMAGE_MAP = {
    biryani: "biryani.png",
    burger: "burger.png",
    burgers: "burger.png",
    chinese: "chinese.png",
    dessert: "dessert.png",
    desserts: "dessert.png",
    dairy: "dairy.png",
    fruits: "fruits.png",
    "north indian": "north_indian.png",
    "south indian": "south_indian.png",
    pizza: "pizza.png",
    rolls: "rolls.png",
    staples: "staples.png",
    "rice, atta and dals": "staples.png",
    "atta and dals": "staples.png",
    vegetables: "veg.png",
    "fresh vegetables": "veg.png",
    veg: "veg.png",
    masala: "masala.png",
    masalas: "masala.png",
    "dry fruits": "fruits.png",
};

const DEFAULT_DISCOVERY_TERMS = [
    "Biryani",
    "North Indian",
    "Pizza",
    "South Indian",
    "Chinese",
    "Burger",
    "Rolls",
    "Desserts",
];

const SORT_OPTIONS = [
    { id: "relevance", label: "Relevance" },
    { id: "rating", label: "Rating" },
    { id: "deliveryTime", label: "Delivery Time" },
    { id: "distance", label: "Distance" },
];

const ROLE_CARDS = [
    {
        id: "CUSTOMER",
        title: "Customer",
        description: "Order food, discover restaurants and track deliveries",
        icon: "🍔",
        color: "from-orange-400 to-swiggy-orange",
    },
    {
        id: "RESTAURANT_OWNER",
        title: "Restaurant Owner",
        description: "Manage your restaurant, menu and live orders",
        icon: "🏪",
        color: "from-blue-400 to-blue-600",
    },
    {
        id: "DELIVERY_PARTNER",
        title: "Delivery Partner",
        description: "Accept delivery tasks and update live order status",
        icon: "🛵",
        color: "from-green-400 to-green-600",
    },
];

const normalizeKey = (value = "") => value.toString().trim().toLowerCase();

const buildOrigin = (req) => {
    return process.env.PUBLIC_APP_ORIGIN || `${req.protocol}://${req.get("host")}`;
};

const buildImageUrl = (req, imageName) => `${buildOrigin(req)}/images/${imageName}`;

const getImageNameForTerm = (term) => {
    const normalized = normalizeKey(term);
    return CATEGORY_IMAGE_MAP[normalized] || "promo_food.png";
};

const toSearchHref = ({ q, sortBy, rating, veg } = {}) => {
    const params = new URLSearchParams();

    if (q) {
        params.set("q", q);
    }

    if (sortBy && sortBy !== "relevance") {
        params.set("sortBy", sortBy);
    }

    if (rating) {
        params.set("rating", String(rating));
    }

    if (veg) {
        params.set("veg", "true");
    }

    const query = params.toString();
    return query ? `/search?${query}` : "/search";
};

const uniqueByName = (items) => {
    const seen = new Set();
    return items.filter((item) => {
        const key = normalizeKey(item.name);
        if (!key || seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
};

const buildDiscoveryItems = (req, names, limit) => {
    return uniqueByName(
        names.map((name) => ({
            id: normalizeKey(name).replace(/\s+/g, "-"),
            name,
            imageUrl: buildImageUrl(req, getImageNameForTerm(name)),
            href: toSearchHref({ q: name }),
        }))
    ).slice(0, limit);
};

const getTopFoodCategories = async (limit = 12) => {
    const results = await FoodItem.aggregate([
        {
            $lookup: {
                from: "restaurants",
                localField: "restaurantId",
                foreignField: "_id",
                as: "restaurant",
            },
        },
        { $unwind: "$restaurant" },
        {
            $match: {
                isAvailable: true,
                "restaurant.isApproved": true,
            },
        },
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: limit },
    ]);

    return results.map((entry) => entry._id).filter(Boolean);
};

const getTopRestaurantCuisines = async (limit = 12) => {
    const results = await Restaurant.aggregate([
        { $match: { isApproved: true } },
        { $unwind: "$cuisines" },
        {
            $group: {
                _id: "$cuisines",
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: limit },
    ]);

    return results.map((entry) => entry._id).filter(Boolean);
};

const getSpotlightRestaurants = async (limit = 6) => {
    return Restaurant.find({ isApproved: true })
        .sort({ averageRating: -1, totalReviews: -1, createdAt: -1 })
        .limit(limit)
        .select("name image cuisines averageRating deliveryTime")
        .lean();
};

const getRestaurantMetrics = async () => {
    const [liveRestaurants, topRatedRestaurants, pureVegRestaurants] = await Promise.all([
        Restaurant.countDocuments({ isApproved: true }),
        Restaurant.countDocuments({ isApproved: true, averageRating: { $gte: 4 } }),
        Restaurant.countDocuments({ isApproved: true, isPureVeg: true }),
    ]);

    return {
        liveRestaurants,
        topRatedRestaurants,
        pureVegRestaurants,
    };
};

const buildSpotlightCards = (req, restaurants) => {
    return restaurants.map((restaurant) => ({
        id: restaurant._id.toString(),
        name: restaurant.name,
        imageUrl: restaurant.image || buildImageUrl(req, "promo_food.png"),
        cuisines: restaurant.cuisines || [],
        averageRating: restaurant.averageRating || 0,
        deliveryTime: restaurant.deliveryTime || 30,
        href: `/restaurant/${restaurant._id}`,
        badge: restaurant.averageRating >= 4.5 ? "Top Rated" : `Delivery in ${restaurant.deliveryTime || 30} mins`,
    }));
};

const buildNavigationLinks = (featuredItems) => {
    const firstFeatured = featuredItems[0]?.name || "Top Rated";

    return [
        {
            id: "discover",
            label: "Discover",
            href: toSearchHref({ q: firstFeatured }),
            type: "internal",
        },
        {
            id: "partner",
            label: "Partner with us",
            href: "/login",
            type: "internal",
        },
    ];
};

const buildHeroCards = (req, metrics, spotlightRestaurants) => {
    const featuredRestaurantImage = spotlightRestaurants[0]?.imageUrl || buildImageUrl(req, "promo_instamart.png");

    return [
        {
            id: "food-delivery",
            title: "Food Delivery",
            subtitle: "From restaurants",
            badge: `${metrics.liveRestaurants}+ live kitchens`,
            actionLabel: "Explore",
            href: "/search",
            imageUrl: buildImageUrl(req, "promo_food.png"),
        },
        {
            id: "top-rated",
            title: "Top Rated",
            subtitle: "Most loved picks",
            badge: `${metrics.topRatedRestaurants}+ rated 4.0+`,
            actionLabel: "Browse",
            href: toSearchHref({ sortBy: "rating", rating: 4 }),
            imageUrl: featuredRestaurantImage,
        },
    ];
};

const buildSiteContent = async (req) => {
    const [topFoodCategories, topRestaurantCuisines, spotlightRestaurants, metrics] = await Promise.all([
        getTopFoodCategories(),
        getTopRestaurantCuisines(),
        getSpotlightRestaurants(),
        getRestaurantMetrics(),
    ]);

    const featuredCategoryNames = [
        ...topFoodCategories,
        ...topRestaurantCuisines,
        ...DEFAULT_DISCOVERY_TERMS,
    ];
    const collectionNames = [
        ...topRestaurantCuisines,
        ...topFoodCategories,
        ...DEFAULT_DISCOVERY_TERMS,
    ];

    const featuredCategories = buildDiscoveryItems(req, featuredCategoryNames, 8);
    const curatedCollections = buildDiscoveryItems(
        req,
        collectionNames.filter(
            (name) => !featuredCategories.some((item) => normalizeKey(item.name) === normalizeKey(name))
        ),
        5
    );
    const spotlightCards = buildSpotlightCards(req, spotlightRestaurants);
    const menuCategories = uniqueByName(
        [...topFoodCategories, ...DEFAULT_DISCOVERY_TERMS].map((name) => ({ name }))
    ).map((item) => item.name);

    return {
        header: {
            navLinks: buildNavigationLinks(featuredCategories),
        },
        landing: {
            hero: {
                title: "Deliciousness delivered right to your doorstep.",
                subtitle: "Discover approved restaurants, popular cuisines and live delivery options around you.",
                searchPlaceholder: "Search for restaurant, item or more",
                primaryCards: buildHeroCards(req, metrics, spotlightCards),
            },
            featuredCategoriesSection: {
                title: "Order our best food options",
                items: featuredCategories,
            },
            curatedCollectionsSection: {
                title: "Browse trending cuisines",
                items: curatedCollections.length > 0 ? curatedCollections : featuredCategories.slice(0, 5),
            },
            spotlightSection: {
                title: "Discover top restaurants",
                items: spotlightCards,
            },
        },
        search: {
            sortOptions: SORT_OPTIONS,
            popularCuisines: featuredCategories.slice(0, 6),
            emptyStateSuggestions: featuredCategories.slice(0, 3).map((item) => item.name),
        },
        forms: {
            menuCategories,
        },
        auth: {
            roleCards: ROLE_CARDS,
        },
    };
};

module.exports = {
    buildSiteContent,
};
