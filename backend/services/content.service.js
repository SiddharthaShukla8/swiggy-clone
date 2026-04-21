const Restaurant = require("../models/restaurant.model");
const FoodItem = require("../models/foodItem.model");

// ─── All available local image filenames (backend/public/images/) ─────────────
// These are the ONLY images we ever serve — zero external dependencies.
const ALL_LOCAL_IMAGES = [
    "biryani.png",
    "burger.png",
    "chinese.png",
    "dairy.png",
    "dessert.png",
    "fruits.png",
    "masala.png",
    "north_indian.png",
    "pizza.png",
    "promo_food.png",
    "promo_instamart.png",
    "rolls.png",
    "south_indian.png",
    "staples.png",
    "veg.png",
];

// ─── Exhaustive cuisine/category → image mapping ──────────────────────────────
// Covers every conceivable term a restaurant or food-item might use.
// Falls back to hash-picking from ALL_LOCAL_IMAGES — never promo_food.png alone.
const CATEGORY_IMAGE_MAP = {
    // Biryani & Mughlai
    biryani: "biryani.png",
    hyderabadi: "biryani.png",
    mughlai: "biryani.png",
    awadhi: "biryani.png",
    dum: "biryani.png",

    // North Indian
    "north indian": "north_indian.png",
    punjabi: "north_indian.png",
    rajasthani: "north_indian.png",
    chettinad: "north_indian.png",
    kebabs: "north_indian.png",
    tandoori: "north_indian.png",
    "main course": "north_indian.png",

    // South Indian
    "south indian": "south_indian.png",
    kerala: "south_indian.png",
    andhra: "south_indian.png",
    dosa: "south_indian.png",
    idli: "south_indian.png",
    seafood: "south_indian.png",
    fish: "south_indian.png",

    // Pizza / Italian / Continental
    pizza: "pizza.png",
    pizzas: "pizza.png",
    italian: "pizza.png",
    pasta: "pizza.png",
    continental: "pizza.png",
    "fine dining": "pizza.png",

    // Burger / Fast Food / Rolls
    burger: "burger.png",
    burgers: "burger.png",
    "fast food": "burger.png",
    american: "burger.png",
    sandwiches: "burger.png",
    sandwich: "burger.png",
    wraps: "rolls.png",
    rolls: "rolls.png",
    roll: "rolls.png",
    frankie: "rolls.png",

    // Chinese / Asian / Japanese
    chinese: "chinese.png",
    asian: "chinese.png",
    thai: "chinese.png",
    japanese: "chinese.png",
    sushi: "chinese.png",
    ramen: "chinese.png",
    noodles: "chinese.png",
    dimsum: "chinese.png",
    "dim sum": "chinese.png",

    // Desserts / Sweets / Bakery
    desserts: "dessert.png",
    dessert: "dessert.png",
    bakery: "dessert.png",
    cakes: "dessert.png",
    "ice cream": "dessert.png",
    icecream: "dessert.png",
    sweets: "dessert.png",
    mithai: "dessert.png",
    waffle: "dessert.png",
    waffles: "dessert.png",

    // Cafe / Coffee / Pub / Bar
    cafe: "promo_food.png",
    coffee: "promo_food.png",
    beverages: "promo_food.png",
    pub: "promo_instamart.png",
    bar: "promo_instamart.png",
    brewery: "promo_instamart.png",

    // Healthy / Salads / Vegan / Vegetarian
    healthy: "veg.png",
    salads: "veg.png",
    salad: "veg.png",
    vegan: "veg.png",
    vegetarian: "veg.png",
    vegetables: "veg.png",
    "fresh vegetables": "veg.png",
    veg: "veg.png",

    // Grocery / Instamart
    grocery: "staples.png",
    instamart: "promo_instamart.png",
    staples: "staples.png",
    "rice, atta and dals": "staples.png",
    "atta and dals": "staples.png",
    rice: "staples.png",
    dal: "staples.png",
    dals: "staples.png",

    // Dairy / Fruits / Dry Fruits
    dairy: "dairy.png",
    milk: "dairy.png",
    paneer: "dairy.png",
    fruits: "fruits.png",
    fruit: "fruits.png",
    "dry fruits": "fruits.png",
    "dry fruit": "fruits.png",
    nuts: "fruits.png",

    // Masalas / Spices
    masala: "masala.png",
    masalas: "masala.png",
    spices: "masala.png",
    "pickles and condiments": "masala.png",
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

/**
 * Deterministic hash: same string → same non-negative integer.
 * Used to spread restaurants/categories across the image pool.
 */
const hashString = (str = "") => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
    }
    return hash;
};

/**
 * Returns a LOCAL image filename for a given cuisine/category term.
 * If no direct match, falls back to a deterministic pick from ALL_LOCAL_IMAGES
 * so different unknown terms get DIFFERENT images.
 *
 * @param {string} term
 * @returns {string} image filename (not URL)
 */
const getImageNameForTerm = (term) => {
    const normalized = normalizeKey(term);

    // Exact match
    if (CATEGORY_IMAGE_MAP[normalized]) {
        return CATEGORY_IMAGE_MAP[normalized];
    }

    // Partial match — check if any CATEGORY_IMAGE_MAP key is a substring of term or vice-versa
    for (const [key, img] of Object.entries(CATEGORY_IMAGE_MAP)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return img;
        }
    }

    // Deterministic fallback — spread unknowns across the full local pool
    return ALL_LOCAL_IMAGES[hashString(normalized) % ALL_LOCAL_IMAGES.length];
};

/**
 * Resolves a local image URL for a restaurant based on its cuisines array.
 * Never touches restaurant.image (could be a broken external URL from seed data).
 *
 * @param {object} req - Express request (for origin building)
 * @param {object} restaurant - Restaurant document
 * @returns {string} fully-qualified local image URL
 */
const resolveRestaurantImageUrl = (req, restaurant) => {
    const id = String(restaurant._id || restaurant.name || "");
    const cuisines = (restaurant.cuisines || []).map((c) => normalizeKey(c));

    for (const cuisine of cuisines) {
        // Exact match
        if (CATEGORY_IMAGE_MAP[cuisine]) {
            return buildImageUrl(req, CATEGORY_IMAGE_MAP[cuisine]);
        }
        // Partial match
        for (const [key, img] of Object.entries(CATEGORY_IMAGE_MAP)) {
            if (cuisine.includes(key) || key.includes(cuisine)) {
                return buildImageUrl(req, img);
            }
        }
    }

    // Final fallback: hash the restaurant ID across the image pool for variety
    const fallbackImage = ALL_LOCAL_IMAGES[hashString(id) % ALL_LOCAL_IMAGES.length];
    return buildImageUrl(req, fallbackImage);
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

const buildDiscoveryItems = async (req, names, limit) => {
    const unique = uniqueByName(
        names.map((name) => ({
            id: normalizeKey(name).replace(/\s+/g, "-"),
            name,
            imageUrl: buildImageUrl(req, getImageNameForTerm(name)),
            href: toSearchHref({ q: name }),
        }))
    ).slice(0, limit);

    // Enrich with live restaurant counts
    const withCounts = await Promise.all(
        unique.map(async (item) => {
            try {
                const count = await Restaurant.countDocuments({
                    isApproved: true,
                    cuisines: { $regex: new RegExp(item.name, "i") },
                });
                return { ...item, count };
            } catch {
                return item;
            }
        })
    );

    return withCounts;
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

const getSpotlightRestaurants = async (limit = 8) => {
    return Restaurant.find({ isApproved: true })
        .sort({ averageRating: -1, totalReviews: -1, createdAt: -1 })
        .limit(limit)
        .select("name image cuisines averageRating deliveryTime isPureVeg")
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
        // Always resolve from cuisines — never use restaurant.image (may be external/broken)
        imageUrl: resolveRestaurantImageUrl(req, restaurant),
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

const buildHeroCards = (req, metrics) => {
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
            imageUrl: buildImageUrl(req, "promo_instamart.png"),
        },
    ];
};

const buildSiteContent = async (req) => {
    const [topFoodCategories, topRestaurantCuisines, spotlightRestaurants, metrics] = await Promise.all([
        getTopFoodCategories(10),
        getTopRestaurantCuisines(10),
        getSpotlightRestaurants(8),
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

    const [featuredCategories, allCollectionCandidates] = await Promise.all([
        buildDiscoveryItems(req, featuredCategoryNames, 10),
        buildDiscoveryItems(req, collectionNames, 20),
    ]);

    const curatedCollections = allCollectionCandidates
        .filter((item) => !featuredCategories.some((fc) => normalizeKey(fc.name) === normalizeKey(item.name)))
        .slice(0, 6);

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
                primaryCards: buildHeroCards(req, metrics),
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
