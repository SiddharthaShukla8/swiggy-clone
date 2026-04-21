const express = require("express");
const { 
    getAllUsers, 
    toggleUserStatus, 
    getPendingRestaurants, 
    approveRestaurant, 
    getAnalytics 
} = require("../controllers/admin.controller");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

// All admin routes restricted to ADMIN role only
router.use(verifyJWT);
router.use(authorizeRoles("ADMIN"));

router.get("/users", getAllUsers);
router.patch("/users/:id/toggle-status", toggleUserStatus);
router.get("/restaurants/pending", getPendingRestaurants);
router.patch("/restaurants/:id/approve", approveRestaurant);
router.get("/analytics", getAnalytics);

module.exports = router;
