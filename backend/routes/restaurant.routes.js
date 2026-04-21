const express = require("express");
const { 
    addRestaurant, 
    getNearbyRestaurants, 
    getRestaurantById,
    searchRestaurants,
    getMyRestaurant,
    getRestaurantMenu,
    updateRestaurant
} = require("../controllers/restaurant.controller");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware");
const { upload } = require("../config/cloudinary");

const router = express.Router();
const ownerOnly = [verifyJWT, authorizeRoles("RESTAURANT_OWNER", "ADMIN")];

// Public routes
router.get("/nearby", getNearbyRestaurants);
router.get("/search", searchRestaurants);
router.get("/:id/menu", getRestaurantMenu);
router.get("/my", ...ownerOnly, getMyRestaurant);
router.post("/", ...ownerOnly, upload.single("image"), addRestaurant);
router.put("/", ...ownerOnly, upload.single("image"), updateRestaurant);
router.get("/:id", getRestaurantById);

module.exports = router;
