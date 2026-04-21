const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Food item name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
        },
        category: {
            type: String, // e.g., Pizza, Burger, North Indian
            required: [true, "Category is required"],
        },
        image: {
            type: String, // Cloudinary URL
        },
        isVeg: {
            type: Boolean,
            default: false,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        rating: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

foodItemSchema.index({ name: 1 });
foodItemSchema.index({ restaurantId: 1 });
foodItemSchema.index({ category: 1 });

const FoodItem = mongoose.model("FoodItem", foodItemSchema);

module.exports = FoodItem;
