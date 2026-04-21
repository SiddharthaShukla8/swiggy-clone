const Review = require("../models/review.model");
const Restaurant = require("../models/restaurant.model");
const Order = require("../models/order.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

// @desc    Add a review for a restaurant/order
// @route   POST /api/v1/reviews
// @access  Private (CUSTOMER)
const addReview = asyncHandler(async (req, res) => {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating) {
        return res.status(400).json(new ApiResponse(400, null, "OrderId and rating are required"));
    }

    // 1. Check if the order exists and is DELIVERED
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json(new ApiResponse(404, null, "Order not found"));
    }

    if (order.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json(new ApiResponse(403, null, "You can only review your own orders"));
    }

    if (order.status !== "DELIVERED") {
        return res.status(400).json(new ApiResponse(400, null, "You can only review an order after it has been delivered"));
    }

    // 2. Check if a review already exists for this order
    const existingReview = await Review.findOne({ orderId, userId: req.user._id });
    if (existingReview) {
        return res.status(400).json(new ApiResponse(400, null, "You have already reviewed this order"));
    }

    // 3. Create the review
    const review = await Review.create({
        userId: req.user._id,
        restaurantId: order.restaurantId,
        orderId,
        rating,
        comment
    });

    // 4. Update Restaurant average rating and total reviews count
    const stats = await Review.aggregate([
        { $match: { restaurantId: order.restaurantId } },
        {
            $group: {
                _id: "$restaurantId",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await Restaurant.findByIdAndUpdate(order.restaurantId, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
            totalReviews: stats[0].totalReviews
        });
    }

    return res.status(201)
        .json(new ApiResponse(201, review, "Review added successfully"));
});

// @desc    Get all reviews for a restaurant
// @route   GET /api/v1/reviews/restaurant/:id
// @access  Public
const getRestaurantReviews = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const reviews = await Review.find({ restaurantId: id })
        .populate("userId", "name")
        .sort({ createdAt: -1 });

    return res.status(200)
        .json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});

module.exports = {
    addReview,
    getRestaurantReviews
};
