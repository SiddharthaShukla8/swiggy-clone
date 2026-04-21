const Notification = require("../models/notification.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const { emitToRoom } = require("../services/socket.service");

/**
 * Controller for managing app notifications
 */

// Helper function to send notification (Internal use)
const sendNotification = async ({ userId, title, message, type = "ORDER_UPDATE", orderId, restaurantId }) => {
    try {
        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            orderId,
            restaurantId
        });

        // Emit via Socket.io to visual room
        emitToRoom(`user_${userId}`, "notification", notification);
        
        return notification;
    } catch (error) {
        console.error("Failed to send notification:", error);
    }
};

// @desc    Get all notifications for logged-in user
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);
    
    return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/mark-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );
    
    return res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
});

// @desc    Mark specific notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $set: { isRead: true } },
        { new: true }
    );
    
    if (!notification) {
        return res.status(404).json(new ApiResponse(404, null, "Notification not found"));
    }

    return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
});

module.exports = {
    sendNotification,
    getNotifications,
    markAllAsRead,
    markAsRead
};
