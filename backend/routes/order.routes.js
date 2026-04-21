const express = require("express");
const rateLimit = require("express-rate-limit");
const { 
    initiateCheckout, 
    verifyPayment, 
    getMyOrders,
    getMyOrderById,
} = require("../controllers/order.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

const router = express.Router();

// Strict limiter for financial transactions
const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP/User to 5 checkout attempts per window
    message: {
        success: false,
        message: "Too many checkout attempts. Please try again after 15 minutes."
    }
});

router.use(verifyJWT);

router.post("/checkout", checkoutLimiter, initiateCheckout);
router.post("/verify", checkoutLimiter, verifyPayment);
router.get("/my-orders", getMyOrders);
router.get("/:id", getMyOrderById);

module.exports = router;
