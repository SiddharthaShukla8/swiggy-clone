const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Restaurant = require("./models/restaurant.model");
const FoodItem = require("./models/foodItem.model");
const Coupon = require("./models/coupon.model");

const User = require("./models/user.model");

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const restaurants = [
    {
        name: "The Gourmet Hub",
        image: "",
        cuisines: ["North Indian", "Continental"],
        averageRating: 4.5,
        deliveryTime: 25,
        address: "Indiranagar, Bangalore",
        location: {
            type: "Point",
            coordinates: [77.5946, 12.9716] // Longitude first
        },
        isApproved: true
    },
    {
        name: "Burger Castle",
        image: "",
        cuisines: ["American", "Fast Food"],
        averageRating: 4.2,
        deliveryTime: 20,
        address: "Koramangala, Bangalore",
        location: {
            type: "Point",
            coordinates: [77.6245, 12.9352]
        },
        isApproved: true
    },
    {
        name: "Pizza Paradise",
        image: "",
        cuisines: ["Italian", "Pizzas"],
        averageRating: 4.8,
        deliveryTime: 30,
        address: "MG Road, Bangalore",
        location: {
            type: "Point",
            coordinates: [77.5993, 12.9767]
        },
        isApproved: true
    },
    {
        name: "Biryani Blues",
        image: "",
        cuisines: ["Hyderabadi", "Biryani"],
        averageRating: 4.6,
        deliveryTime: 35,
        address: "HSR Layout, Bangalore",
        location: {
            type: "Point",
            coordinates: [77.6411, 12.9141]
        },
        isApproved: true
    },
    {
        name: "Royal Chinese",
        image: "",
        cuisines: ["Chinese", "Asian"],
        averageRating: 4.3,
        deliveryTime: 25,
        address: "BTM Layout, Bangalore",
        location: {
            type: "Point",
            coordinates: [77.6101, 12.9166]
        },
        isApproved: true
    }
];

const foodItems = [
    {
        name: "Premium Veg Platter",
        description: "Assorted vegetables grilled to perfection with signature spices.",
        price: 499,
        image: "",
        category: "Main Course",
        isVegetarian: true
    },
    {
        name: "Classic Cheese Burger",
        description: "Juicy patty with melted cheddar and fresh lettuce.",
        price: 299,
        image: "",
        category: "Fast Food",
        isVegetarian: false
    },
    {
        name: "Pepperoni Pizza",
        description: "Classic pizza with spicy pepperoni and double cheese.",
        price: 599,
        image: "",
        category: "Pizzas",
        isVegetarian: false
    },
    {
        name: "Hydrabadi Chicken Biryani",
        description: "Authentic slow-cooked biryani with tender chicken pieces.",
        price: 450,
        image: "",
        category: "Biryani",
        isVegetarian: false
    }
];

const seedDB = async () => {
    try {
        console.log("Connecting to MongoDB for seeding...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected Successfully!");

        // Find a user to act as owner
        const seedOwner = await User.findOne();
        if (!seedOwner) {
            console.error("❌ No users found in database. Please create a user/login first.");
            process.exit(1);
        }

        // Clear existing data
        console.log("Clearing existing data...");
        await Restaurant.deleteMany({});
        await FoodItem.deleteMany({});
        await Coupon.deleteMany({});

        // Insert Restaurants
        console.log("Inserting Restaurants...");
        const restaurantsWithOwner = restaurants.map(r => ({ ...r, ownerId: seedOwner._id }));
        const createdRestaurants = await Restaurant.insertMany(restaurantsWithOwner);

        // Insert Food Items for each restaurant
        console.log("Inserting Food Items...");
        for (const restaurant of createdRestaurants) {
            const itemsWithRef = foodItems.map(item => ({
                ...item,
                restaurantId: restaurant._id
            }));
            await FoodItem.insertMany(itemsWithRef);
        }

        // Insert a sample Coupon
        console.log("Inserting Coupons...");
        await Coupon.create({
            code: "WELCOME50",
            discountType: "PERCENTAGE",
            discountValue: 50,
            minOrderAmount: 200,
            maxDiscount: 100,
            expiryDate: new Date("2030-01-01"),
            usageLimit: 1000,
            isActive: true,
            usedCount: 0
        });

        console.log("✅ Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDB();
