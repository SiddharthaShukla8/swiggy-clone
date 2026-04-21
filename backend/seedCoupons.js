const mongoose = require("mongoose");
const Coupon = require("./models/coupon.model");
const dotenv = require("dotenv");

dotenv.config();

const seedCoupons = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing coupons
        await Coupon.deleteMany({});

        const coupons = [
            {
                code: "WELCOME100",
                discountType: "FLAT",
                discountValue: 100,
                minOrderAmount: 400,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                usageLimit: 1000,
            },
            {
                code: "SWIGGY50",
                discountType: "PERCENTAGE",
                discountValue: 50,
                maxDiscount: 100,
                minOrderAmount: 150,
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                usageLimit: 500,
            },
            {
                code: "EXPIRED10",
                discountType: "PERCENTAGE",
                discountValue: 10,
                minOrderAmount: 100,
                expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                usageLimit: 100,
                isActive: true
            }
        ];

        await Coupon.insertMany(coupons);
        console.log("Coupons seeded successfully!");
        process.exit();
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedCoupons();
