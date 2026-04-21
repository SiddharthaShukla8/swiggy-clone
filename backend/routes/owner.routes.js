const express = require("express");
const { getRestaurantOrders, updateOrderStatus } = require("../controllers/owner.controller");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

// All owner routes restricted to RESTAURANT_OWNER and ADMIN
router.use(verifyJWT);
router.use(authorizeRoles("RESTAURANT_OWNER", "ADMIN"));

router.get("/orders", getRestaurantOrders);
router.patch("/orders/:id/status", updateOrderStatus);

module.exports = router;
