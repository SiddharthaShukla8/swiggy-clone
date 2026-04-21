const Coupon = require("../models/coupon.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

// @desc    Validate and apply a coupon
// @route   POST /api/v1/coupons/apply
// @access  Private
const applyCoupon = asyncHandler(async (req, res) => {
    const { code, cartTotal } = req.body;

    if (!code || cartTotal === undefined) {
        return res.status(400).json(new ApiResponse(400, null, "Coupon code and cart total are required"));
    }

    const coupon = await Coupon.findOne({ 
        code: code.toUpperCase(), 
        isActive: true 
    });

    if (!coupon) {
        return res.status(404).json(new ApiResponse(404, null, "Invalid coupon code"));
    }

    // 1. Check Expiry
    if (new Date() > new Date(coupon.expiryDate)) {
        return res.status(400).json(new ApiResponse(400, null, "This coupon has expired"));
    }

    // 2. Check Usage Limit
    if (coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json(new ApiResponse(400, null, "Coupon usage limit reached"));
    }

    // 3. Check Minimum Order Amount
    if (cartTotal < coupon.minOrderAmount) {
        return res.status(400).json(new ApiResponse(400, null, `Minimum order amount of ₹${coupon.minOrderAmount} required`));
    }

    // 4. Calculate Discount
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (cartTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
    } else {
        discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal);

    return res.status(200).json(
        new ApiResponse(200, {
            code: coupon.code,
            discountAmount,
            finalAmount: cartTotal - discountAmount,
            description: coupon.discountType === "PERCENTAGE" 
                ? `${coupon.discountValue}% off up to ₹${coupon.maxDiscount || '∞'}`
                : `Flat ₹${coupon.discountValue} off`
        }, "Coupon applied successfully")
    );
});

// @desc    Get all active coupons (for user to see available offers)
// @route   GET /api/v1/coupons
// @access  Public
const getCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find({ 
        isActive: true, 
        expiryDate: { $gt: new Date() } 
    }).select("-usedCount -usageLimit");

    return res.status(200).json(new ApiResponse(200, coupons, "Coupons fetched successfully"));
});

module.exports = {
    applyCoupon,
    getCoupons
};
