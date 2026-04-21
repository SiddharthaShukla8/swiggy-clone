const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        items: [
            {
                foodItemId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "FoodItem",
                    required: true,
                },
                name: String,
                price: Number,
                quantity: {
                    type: Number,
                    required: true,
                },
            },
        ],
        billDetails: {
            itemTotal: Number,
            deliveryFee: Number,
            platformFee: Number,
            gst: Number,
            couponCode: String,
            discountAmount: { type: Number, default: 0 },
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED", "FAILED"],
            default: "PENDING",
        },
        deliveryPartnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        paymentInfo: {
            razorpayOrderId: { type: String, unique: true, sparse: true },
            razorpayPaymentId: String,
            status: {
                type: String,
                enum: ["PENDING", "COMPLETED", "FAILED"],
                default: "PENDING",
            },
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 15 * 60 * 1000),
        },
        deliveryAddress: {
            address: String,
            lat: Number,
            lng: Number,
        },
        statusTimestamps: {
            placedAt: { type: Date, default: Date.now },
            confirmedAt: Date,
            preparingAt: Date,
            readyAt: Date,
            pickedUpAt: Date,
            deliveredAt: Date,
            cancelledAt: Date,
        },
    },
    { timestamps: true }
);

// Index for faster queries on dashboards
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ deliveryPartnerId: 1, status: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
