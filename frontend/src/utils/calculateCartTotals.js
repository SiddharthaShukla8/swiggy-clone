/**
 * Centralized Pricing Utility for MERN Swiggy Clone
 * Standardizes calculation across Frontend, Backend, and Payments.
 * Uses integer math (paise) to prevent floating-point errors.
 */
export const calculateCartTotals = (items) => {
    if (!items || items.length === 0) {
        return {
            itemTotal: 0,
            deliveryFee: 0,
            platformFee: 0,
            gst: 0,
            totalToPay: 0,
            totalPaise: 0
        };
    }

    // 1. Calculate Item Total in Paise (using Math.floor as per safeguard 1)
    const itemTotalPaise = items.reduce((acc, item) => {
        // Handle both populated (frontend) and raw (backend) item formats
        const foodItem = item.foodItemId || item;
        const price = foodItem.price || 0;
        const quantity = item.quantity || 0;
        return acc + (Math.floor(price * 100) * quantity);
    }, 0);

    // 2. Fixed Fees in Paise
    const deliveryPaise = itemTotalPaise > 0 ? 4000 : 0; // ₹40
    const platformPaise = itemTotalPaise > 0 ? 500 : 0;  // ₹5

    // 3. GST (5%) strictly on Item Total only (as per requirement 2)
    const gstPaise = Math.round(itemTotalPaise * 0.05);

    // 4. Grand Total in Paise
    const totalPaise = itemTotalPaise + deliveryPaise + platformPaise + gstPaise;

    // 5. Return everything (converted to INR decimals for display)
    return {
        itemTotal: itemTotalPaise / 100,
        deliveryFee: deliveryPaise / 100,
        platformFee: platformPaise / 100,
        gst: gstPaise / 100,
        totalToPay: totalPaise / 100,
        totalPaise // Required for Razorpay Order creation
    };
};
