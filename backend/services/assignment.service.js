const User = require("../models/user.model");
const { emitToRoom } = require("./socket.service");

/**
 * Automatically find and notify the nearest delivery agents for an order
 * @param {object} order - The order object
 * @param {object} restaurantCoordinates - [longitude, latitude] of the restaurant
 */
const notifyNearestAgents = async (order, restaurantCoordinates) => {
    try {
        const [lng, lat] = restaurantCoordinates;

        // Find available delivery partners within 5km
        const nearbyAgents = await User.find({
            role: "DELIVERY_PARTNER",
            isActive: true,
            isAvailable: true,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    $maxDistance: 5000, // 5km
                },
            },
        }).limit(5);

        if (nearbyAgents.length === 0) {
            console.log("No delivery partners found near the restaurant");
            return;
        }

        // Notify each agent via socket
        nearbyAgents.forEach((agent) => {
            console.log(`Notifying agent: ${agent.name} (${agent._id})`);
            emitToRoom(`agent_${agent._id}`, "new_delivery_request", {
                orderId: order._id,
                restaurantName: order.restaurantName || "Nearby Restaurant",
                totalAmount: order.totalAmount,
                distance: "Calculated near you",
            });
        });
    } catch (error) {
        console.error("Auto-assignment notification error:", error);
    }
};

module.exports = {
    notifyNearestAgents,
};
