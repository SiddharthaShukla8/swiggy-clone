const Cart = require("../models/cart.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

// @desc    Add item to cart
// @route   POST /api/v1/cart/add
const addToCart = asyncHandler(async (req, res) => {
    const { foodItemId, restaurantId, quantity = 1 } = req.body;
    const userId = req.user._id;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
        // Create new cart
        cart = await Cart.create({
            userId,
            restaurantId,
            items: [{ foodItemId, quantity }],
        });
    } else {
        // If restaurantId is different, clear cart and add new item (Swiggy logic)
        if (cart.restaurantId.toString() !== restaurantId.toString()) {
            cart.restaurantId = restaurantId;
            cart.items = [{ foodItemId, quantity }];
        } else {
            // Check if item already exists
            const itemIndex = cart.items.findIndex((item) => item.foodItemId.toString() === foodItemId.toString());

            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ foodItemId, quantity });
            }
        }
        await cart.save();
    }

    return res.status(200).json(new ApiResponse(200, cart, "Item added to cart"));
});

// @desc    Get user cart
// @route   GET /api/v1/cart
const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ userId: req.user._id }).populate("items.foodItemId");

    if (!cart) {
        return res.status(200).json(new ApiResponse(200, { items: [] }, "Cart is empty"));
    }

    return res.status(200).json(new ApiResponse(200, cart, "Cart fetched successfully"));
});

// @desc    Update item quantity
// @route   PUT /api/v1/cart/update
const updateQuantity = asyncHandler(async (req, res) => {
    const { foodItemId, quantity } = req.body;
    const userId = req.user._id;

    if (quantity < 1) {
        return res.status(400).json(new ApiResponse(400, null, "Quantity must be at least 1"));
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return res.status(404).json(new ApiResponse(404, null, "Cart not found"));
    }

    const itemIndex = cart.items.findIndex((item) => item.foodItemId.toString() === foodItemId.toString());

    if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
    } else {
        return res.status(404).json(new ApiResponse(404, null, "Item not found in cart"));
    }

    return res.status(200).json(new ApiResponse(200, cart, "Cart updated successfully"));
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/remove/:foodItemId
const removeFromCart = asyncHandler(async (req, res) => {
    const { foodItemId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return res.status(404).json(new ApiResponse(404, null, "Cart not found"));
    }

    cart.items = cart.items.filter((item) => item.foodItemId.toString() !== foodItemId.toString());

    if (cart.items.length === 0) {
        await Cart.deleteOne({ userId });
        return res.status(200).json(new ApiResponse(200, { items: [] }, "Cart cleared"));
    }

    await cart.save();
    return res.status(200).json(new ApiResponse(200, cart, "Item removed from cart"));
});

module.exports = {
    addToCart,
    getCart,
    updateQuantity,
    removeFromCart,
};
