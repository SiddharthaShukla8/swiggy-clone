const express = require("express");
const {
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
} = require("../controllers/restaurant.controller");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware");
const { upload } = require("../config/cloudinary");

const router = express.Router();
const ownerOnly = [verifyJWT, authorizeRoles("RESTAURANT_OWNER", "ADMIN")];

// ── Public routes ──────────────────────────────────────────────────────────
router.get("/nearby",           getNearbyRestaurants);       // ?lat&lng&radius&page&limit&sortBy&veg&rating&cuisine&isOpen
router.get("/search",           searchRestaurants);           // ?q&lat&lng&veg&rating&sortBy&limit
router.get("/by-cuisine",       getRestaurantsByCuisine);    // ?cuisine&lat&lng&page&limit&sortBy&veg&rating
router.get("/trending-cuisines",getTrendingCuisines);        // ?limit&lat&lng
router.get("/stats",            getRestaurantStats);          // public stats

// ── Protected routes ───────────────────────────────────────────────────────
router.get("/my",                 ...ownerOnly, getMyRestaurant);
router.post("/",                  ...ownerOnly, upload.single("image"), addRestaurant);
router.put("/",                   ...ownerOnly, upload.single("image"), updateRestaurant);

// ── Parameterised (must come last) ────────────────────────────────────────
router.get("/:id/menu",         getRestaurantMenu);           // ?veg&category&q
router.get("/:id",              getRestaurantById);

module.exports = router;
