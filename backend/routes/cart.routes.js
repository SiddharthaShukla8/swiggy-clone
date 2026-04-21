const express = require("express");
const { 
    addToCart, 
    getCart, 
    updateQuantity, 
    removeFromCart,
    clearCart
} = require("../controllers/cart.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

const router = express.Router();

// All cart routes are private
router.use(verifyJWT);

router.post("/add", addToCart);
router.get("/", getCart);
router.put("/update", updateQuantity);
router.delete("/remove/:foodItemId", removeFromCart);
router.delete("/clear", clearCart);

module.exports = router;
