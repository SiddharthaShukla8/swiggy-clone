const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Coupon = require("../models/coupon.model");
const User = require("../models/user.model");
const { createRazorpayOrder, verifyPaymentSignature } = require("../services/razorpay.service");
const { assignNearestPartner } = require("../services/delivery.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const { sendNotification } = require("./notification.controller");
const calculateCartTotals = require("../utils/calculateCartTotals");

/**
 * @desc    Initiate checkout - Create Razorpay order
 * @route   POST /api/v1/orders/checkout
 */
const initiateCheckout = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { couponCode } = req.body;

    // 1. Get user cart and populate food items
    const cart = await Cart.findOne({ userId }).populate("items.foodItemId");
    if (!cart || cart.items.length === 0) {
        return res.status(400).json(new ApiResponse(400, null, "Cart is empty"));
    }

    // 2. Handle Coupon Validation
    let coupon = null;
    if (couponCode) {
        coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (coupon && new Date() > new Date(coupon.expiryDate)) coupon = null;
        if (coupon && coupon.usedCount >= coupon.usageLimit) coupon = null;
    }

    // 3. BACKEND-SIDE TOTAL RECALCULATION (Security Check)
    const totals = calculateCartTotals(cart.items, coupon);
    const { totalToPay, totalPaise } = totals;
    const restaurantId = cart.items[0].foodItemId.restaurantId;

    // 4. Create Razorpay Order
    const razorpayOrder = await createRazorpayOrder(totalToPay); // Service handles conversion to paise

    // 5. Create Order in Pending State with ITEM SNAPSHOTS
    const order = await Order.create({
        userId,
        restaurantId,
        items: cart.items.map(item => ({
            foodItemId: item.foodItemId._id,
            name: item.foodItemId.name,
            quantity: item.quantity,
            price: item.foodItemId.price // SNAPSHOT
        })),
        totalAmount: totalToPay,
        billDetails: {
            itemTotal: totals.itemTotal,
            deliveryFee: totals.deliveryFee,
            platformFee: totals.platformFee,
            gst: totals.gst,
            couponCode: coupon ? coupon.code : undefined,
            discountAmount: totals.discountAmount || 0,
        },
        paymentInfo: {
            razorpayOrderId: razorpayOrder.id,
            status: "PENDING"
        },
        status: "PENDING"
    });

    return res.status(200).json(new ApiResponse(200, {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalToPay * 100, // For checkout script
        currency: "INR"
    }, "Checkout initiated"));
});

/**
 * @desc    Verify payment and trigger Restaurant Notification
 */
const verifyPayment = asyncHandler(async (req, res) => {
    const { orderId, razorpayPaymentId, razorpaySignature, deliveryAddress } = req.body;

    const order = await Order.findById(orderId).populate("restaurantId");
    if (!order) {
        return res.status(404).json(new ApiResponse(404, null, "Order record not found"));
    }

    const isValid = verifyPaymentSignature(
        order.paymentInfo.razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
    );

    if (!isValid) {
        order.status = "FAILED";
        order.paymentInfo.status = "FAILED";
        await order.save();
        return res.status(400).json(new ApiResponse(400, null, "Invalid payment signature"));
    }

    // Update Lifecycle to PLACED
    order.status = "PLACED";
    order.paymentInfo.razorpayPaymentId = razorpayPaymentId;
    order.paymentInfo.status = "COMPLETED";
    order.deliveryAddress = deliveryAddress;
    order.statusTimestamps = { ...order.statusTimestamps, placedAt: new Date() };
    await order.save();

    // Notify Restaurant Owner
    if (order.restaurantId?.ownerId) {
        await sendNotification({
            userId: order.restaurantId.ownerId,
            title: "New Order!",
            message: `You have a new order (Total: ₹${order.totalAmount})`,
            type: "NEW_ORDER",
            orderId: order._id
        });
    }

    // Clear User Cart
    await Cart.deleteOne({ userId: order.userId });

    return res.status(200).json(new ApiResponse(200, order, "Order placed successfully"));
});

/**
 * @desc    Restaurant Accepts Order -> Auto-assign Partner
 */
const acceptOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("restaurantId");

    if (!order) return res.status(404).json(new ApiResponse(404, null, "Order not found"));
    if (order.status !== "PLACED") {
        return res.status(400).json(new ApiResponse(400, null, "Order cannot be accepted in current state"));
    }

    // 1. Move to CONFIRMED
    order.status = "CONFIRMED";
    order.statusTimestamps.confirmedAt = new Date();
    await order.save();

    // 2. Trigger Auto-Assignment Engine
    const updatedOrder = await assignNearestPartner(order._id, order.restaurantId.location);

    if (!updatedOrder) {
        // No driver found, keep in CONFIRMED but mark as WAITING_FOR_PARTNER if needed
        console.log(`[Order] No drivers found for Order ${orderId}. Waiting for available partners...`);
    }

    return res.status(200).json(new ApiResponse(200, updatedOrder || order, "Order accepted and assignment initiated"));
});

/**
 * @desc    Universal Status Uppdater (State Machine)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedTransitions = {
        "CONFIRMED": ["PREPARING", "CANCELLED"],
        "PREPARING": ["READY_FOR_PICKUP"],
        "READY_FOR_PICKUP": ["PICKED_UP"],
        "PICKED_UP": ["ON_THE_WAY"],
        "ON_THE_WAY": ["DELIVERED"]
    };

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json(new ApiResponse(404, null, "Order not found"));

    if (allowedTransitions[order.status] && !allowedTransitions[order.status].includes(status)) {
        return res.status(400).json(new ApiResponse(400, null, `Invalid transition from ${order.status} to ${status}`));
    }

    order.status = status;
    
    // Update specific timestamps
    const timestampKey = `${status.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase())}At`;
    if (order.statusTimestamps[timestampKey] === undefined) {
        // Fallback for custom formatted keys if needed
    }
    order.statusTimestamps[timestampKey] = new Date();

    // Special Logic for DELIVERED
    if (status === "DELIVERED") {
        const partner = await User.findByIdAndUpdate(order.deliveryPartnerId, {
            isAvailable: true,
            currentOrderId: null
        });
        console.log(`[Lifecycle] Partner ${partner?.name} is now available again.`);
    }

    await order.save();

    // Notify Customer of Status Update
    await sendNotification({
        userId: order.userId,
        title: `Order Update: ${status}`,
        message: `Your order status is now: ${status}`,
        orderId: order._id
    });

    return res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
});

const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.user._id })
        .populate("restaurantId", "name image")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, orders, "Orders fetched"));
});

const getMyOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id })
        .populate("restaurantId", "name image address")
        .populate("deliveryPartnerId", "name phone");

    if (!order) return res.status(404).json(new ApiResponse(404, null, "Order not found"));
    return res.status(200).json(new ApiResponse(200, order, "Order fetched"));
});

module.exports = {
    initiateCheckout,
    verifyPayment,
    acceptOrder,
    updateOrderStatus,
    getMyOrders,
    getMyOrderById,
};
