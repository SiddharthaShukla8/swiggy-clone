const User = require("../models/user.model");
const Order = require("../models/order.model");

/**
 * Calculates distance between two points (Haversine Formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Proximity-based Atomic Delivery Assignment
 */
const assignNearestPartner = async (orderId, restaurantLocation) => {
    try {
        const [resLng, resLat] = restaurantLocation.coordinates;

        // 1. Find all available delivery partners in the system
        // In a large app, we would use $near radius, but here we scan and sort locally
        // to handle specific Swiggy-level business logic.
        const partners = await User.find({
            role: "DELIVERY_PARTNER",
            isAvailable: true,
            currentOrderId: null
        });

        if (partners.length === 0) {
            console.log(`[DeliveryService] No available partners for Order: ${orderId}`);
            return null;
        }

        // 2. Sort by distance
        const sortedPartners = partners
            .map(p => {
                const [pLng, pLat] = p.location.coordinates;
                return {
                    partner: p,
                    distance: calculateDistance(resLat, resLng, pLat, pLng)
                };
            })
            .sort((a, b) => a.distance - b.distance);

        // 3. ATOMIC ASSIGNMENT - The first one found who is still available
        for (const entry of sortedPartners) {
            const updatedPartner = await User.findOneAndUpdate(
                {
                    _id: entry.partner._id,
                    isAvailable: true,
                    currentOrderId: null
                },
                {
                    isAvailable: false,
                    currentOrderId: orderId
                },
                { new: true }
            );

            if (updatedPartner) {
                // Partner successfully locked! Update order.
                const order = await Order.findByIdAndUpdate(
                    orderId,
                    {
                        deliveryPartnerId: updatedPartner._id,
                        status: "CONFIRMED", // Move to confirmed when assigned
                        "statusTimestamps.confirmedAt": new Date()
                    },
                    { new: true }
                ).populate("deliveryPartnerId", "name phone");

                console.log(`[DeliveryService] Order ${orderId} assigned to ${updatedPartner.name} (${entry.distance.toFixed(2)}km)`);
                return order;
            }
        }

        return null;
    } catch (error) {
        console.error("[DeliveryService] Assignment error:", error);
        return null;
    }
};

module.exports = {
    assignNearestPartner
};
