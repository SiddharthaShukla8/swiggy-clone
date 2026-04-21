const cron = require("node-cron");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const { assignNearestPartner } = require("./delivery.service");

/**
 * PRODUCTION FAIL-SAFE ENGINE
 * Checks for orders that were assigned but the driver went offline or is non-responsive.
 */
const startFailSafeEngine = () => {
    // Run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        console.log("[FailSafe] Running sweep for stuck orders...");

        try {
            // 1. Find orders that are CONFIRMED/PREPARING but driver is OFFLINE or hasn't updated in 10 mins
            // (In a real app, we'd check a 'lastActive' timestamp on the User model)
            const stuckOrders = await Order.find({
                status: { $in: ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP"] },
                deliveryPartnerId: { $ne: null },
                updatedAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) } // 10 minutes of inactivity
            }).populate("restaurantId");

            for (const order of stuckOrders) {
                console.log(`[FailSafe] Order ${order._id} appears stuck. Re-assigning...`);

                // Mark current driver as suspicious/offline if we had a lastActive check
                // For now, just unassign him.
                await User.findByIdAndUpdate(order.deliveryPartnerId, {
                    isAvailable: false, // Maybe he's having app issues, mark inactive
                    currentOrderId: null
                });

                // Set order back to PLACED for re-assignment
                order.deliveryPartnerId = null;
                order.status = "PLACED";
                await order.save();

                // Trigger re-assignment
                await assignNearestPartner(order._id, order.restaurantId.location);
            }

            // 2. Find orders that are PLACED but have no driver (waiting in queue)
            const unassignedOrders = await Order.find({
                status: "PLACED",
                deliveryPartnerId: null,
                createdAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) } // Waiting more than 2 mins
            }).populate("restaurantId");

            for (const order of unassignedOrders) {
                console.log(`[FailSafe] Order ${order._id} is waiting for partner. Retrying assignment...`);
                await assignNearestPartner(order._id, order.restaurantId.location);
            }

        } catch (error) {
            console.error("[FailSafe] Error during sweep:", error);
        }
    });

    console.log("Fail-Safe Resilience Engine started (Interval: 5m)");
};

module.exports = {
    startFailSafeEngine
};
