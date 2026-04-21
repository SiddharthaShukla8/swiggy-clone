const User = require("../models/user.model");
const Restaurant = require("../models/restaurant.model");
const Order = require("../models/order.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const { sendNotification } = require("./notification.controller");

// @desc    Get all users (Paginated, Filtered, Searched)
// @route   GET /api/v1/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { q, role } = req.query;

    const query = {};
    
    // Search by name or email
    if (q) {
        query.$or = [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } }
        ];
    }

    // Filter by role
    if (role && role !== "ALL") {
        query.role = role;
    }

    const users = await User.find(query)
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return res.status(200).json(new ApiResponse(200, {
        users,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
        }
    }, "Users fetched successfully"));
});

// @desc    Toggle user active status (Block/Unblock)
// @route   PATCH /api/v1/admin/users/:id/toggle-status
const toggleUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
        return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    if (user.role === "ADMIN") {
        return res.status(400).json(new ApiResponse(400, null, "Cannot block an admin"));
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json(new ApiResponse(200, user, `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`));
});

// @desc    Get restaurants awaiting approval
// @route   GET /api/v1/admin/restaurants/pending
const getPendingRestaurants = asyncHandler(async (req, res) => {
    const restaurants = await Restaurant.find({ isApproved: false }).populate("ownerId", "name email");
    return res.status(200).json(new ApiResponse(200, restaurants, "Pending restaurants fetched successfully"));
});

// @desc    Approve/Reject restaurant
// @route   PATCH /api/v1/admin/restaurants/:id/approve
const approveRestaurant = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approve } = req.body; // true to approve, false to delete/reject

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
        return res.status(404).json(new ApiResponse(404, null, "Restaurant not found"));
    }

    if (approve) {
        restaurant.isApproved = true;
        await restaurant.save();

        // Notify Owner
        await sendNotification({
            userId: restaurant.ownerId,
            title: "Restaurant Approved!",
            message: `Congratulations! Your restaurant ${restaurant.name} has been approved. You can now start receiving orders.`,
            type: "SYSTEM",
            restaurantId: restaurant._id
        });

        return res.status(200).json(new ApiResponse(200, restaurant, "Restaurant approved successfully"));
    } else {
        await Restaurant.findByIdAndDelete(id);
        return res.status(200).json(new ApiResponse(200, null, "Restaurant rejected and removed"));
    }
});

// @desc    Get platform analytics
// @route   GET /api/v1/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments({ role: "CUSTOMER" });
    const totalOwners = await User.countDocuments({ role: "RESTAURANT_OWNER" });
    const totalOrders = await Order.countDocuments({ status: "DELIVERED" });
    
    const revenueData = await Order.aggregate([
        { $match: { status: "DELIVERED" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    return res.status(200).json(new ApiResponse(200, {
        stats: {
            totalUsers,
            totalOwners,
            totalOrders,
            totalRevenue
        }
    }, "Analytics fetched successfully"));
});

module.exports = {
    getAllUsers,
    toggleUserStatus,
    getPendingRestaurants,
    approveRestaurant,
    getAnalytics
};
