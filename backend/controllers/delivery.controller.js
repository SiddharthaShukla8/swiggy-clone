const User = require("../models/user.model");
const Order = require("../models/order.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

/**
 * @desc    Toggle delivery partner availability
 */
const toggleAvailability = asyncHandler(async (req, res) => {
    const { isAvailable } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { isAvailable }, { new: true });
    return res.status(200).json(new ApiResponse(200, user, `Status: ${isAvailable ? "Online" : "Offline"}`));
});

/**
 * @desc    Update delivery partner location
 */
const updateLocation = asyncHandler(async (req, res) => {
    const { lat, lng } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, {
        location: { type: "Point", coordinates: [lng, lat] }
    }, { new: true });
    return res.status(200).json(new ApiResponse(200, user, "Location updated"));
});

/**
 * @desc    Get current assigned active order
 */
const getMyActiveOrder = asyncHandler(async (req, res) => {
    const order = await Order.findOne({
        deliveryPartnerId: req.user._id,
        status: { $in: ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "ON_THE_WAY"] }
    }).populate("restaurantId", "name address location image");

    return res.status(200).json(new ApiResponse(200, order, "Active order fetched"));
});

/**
 * @desc    Fetch available orders nearby (Manual assignment fallback)
 */
const getAvailableOrders = asyncHandler(async (req, res) => {
    // In our "Smart" system, we auto-assign, but this is a fallback for driver to see "Proposed" CONFIRMED orders
    const orders = await Order.find({
        status: "CONFIRMED",
        deliveryPartnerId: null
    }).populate("restaurantId", "name address location");

    return res.status(200).json(new ApiResponse(200, orders, "Available orders fetched"));
});

/**
 * @desc    Manual Acceptance check
 */
const acceptDelivery = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // ATOMIC LOCK
    const user = await User.findOneAndUpdate(
        { _id: req.user._id, isAvailable: true, currentOrderId: null },
        { isAvailable: false, currentOrderId: id },
        { new: true }
    );

    if (!user) return res.status(400).json(new ApiResponse(400, null, "You are busy or offline"));

    const order = await Order.findByIdAndUpdate(id, {
        deliveryPartnerId: user._id,
        "statusTimestamps.confirmedAt": new Date()
    }, { new: true }).populate("restaurantId", "name address location image");

    return res.status(200).json(new ApiResponse(200, order, "Delivery task accepted"));
});

module.exports = {
    toggleAvailability,
    updateLocation,
    getMyActiveOrder,
    getAvailableOrders,
    acceptDelivery
};
