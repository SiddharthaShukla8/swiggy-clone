const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
            maxLength: [500, "Comment cannot exceed 500 characters"],
        },
    },
    { timestamps: true }
);

// Prevent multiple reviews for the same order
reviewSchema.index({ orderId: 1, userId: 1 }, { unique: true });
// Facilitate fetching reviews for a restaurant
reviewSchema.index({ restaurantId: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
