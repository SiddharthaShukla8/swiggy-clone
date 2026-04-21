const Order = require("../models/order.model");
const Restaurant = require("../models/restaurant.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const { emitToRoom } = require("../services/socket.service");
const { notifyNearestAgents } = require("../services/assignment.service");
const { sendNotification } = require("./notification.controller");

// @desc    Get all orders for a restaurant owned by the user
// @route   GET /api/v1/owner/orders
const getRestaurantOrders = asyncHandler(async (req, res) => {
    // 1. Find the restaurant(s) owned by this user
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
        return res.status(404).json(new ApiResponse(404, null, "No restaurant found for this owner"));
    }

    // 2. Fetch orders for this restaurant
    const orders = await Order.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Restaurant orders fetched successfully"));
});

// @desc    Update order status (Accept/Reject/Prepare)
// @route   PATCH /api/v1/owner/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // ACCEPTED, PREPARING, READY, CANCELLED

    const order = await Order.findById(id);

    if (!order) {
        return res.status(404).json(new ApiResponse(404, null, "Order not found"));
    }

    // Authorization: Check if user owns the restaurant of this order
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json(new ApiResponse(403, null, "Unauthorized to manage this order"));
    }

    order.status = status;
    await order.save();

    // Notify Customer about status change
    await sendNotification({
        userId: order.userId,
        title: "Order Status Updated!",
        message: `Your order from ${restaurant.name} is now: ${status.replace("_", " ")}.`,
        orderId: order._id,
        restaurantId: order.restaurantId
    });

    // Notify Customer via tracking channel
    emitToRoom(`order_${id}`, "order_status_update", { status });

    // 3. If order is CONFIRMED, trigger delivery agent assignment
    if (status === "CONFIRMED") {
        console.log("Order confirmed. Triggering delivery assignment...");
        notifyNearestAgents(order, restaurant.location.coordinates);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, `Order status updated to ${status}`));
});

module.exports = {
    getRestaurantOrders,
    updateOrderStatus,
};
