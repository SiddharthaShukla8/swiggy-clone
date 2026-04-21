const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://siddharthashuklajee8_db_user:JNtPu7Bzifxm46fu@cluster0.z22uelm.mongodb.net/swiggy_clone';
const OWNER_ID = '69d677011ef3ff8ffb9f7f68';

const seedRestaurants = [
    {
        name: "The Gourmet Burger Kitchen",
        description: "Premium handcrafted burgers with organic ingredients",
        address: "123 Food Street, Downtown, Bangalore",
        location: { type: "Point", coordinates: [77.5946, 12.9716] }, // Bangalore
        cuisines: ["Burgers", "American", "Fast Food"],
        deliveryTime: 25,
        isPureVeg: false,
        isApproved: true,
        image: "http://localhost:5001/images/burger.png"
    },
    {
        name: "Pizza Napoletana",
        description: "Authentic wood-fired pizzas from Naples",
        address: "45 Olive Lane, Koramangala, Bangalore",
        location: { type: "Point", coordinates: [77.6309, 12.9352] },
        cuisines: ["Italian", "Pizza"],
        deliveryTime: 35,
        isPureVeg: false,
        isApproved: true,
        image: "http://localhost:5001/images/pizza.png"
    },
    {
        name: "Spice Symphony",
        description: "Grand Indian flavors and aromatic biryanis",
        address: "88 Curry Road, Indiranagar, Bangalore",
        location: { type: "Point", coordinates: [77.6412, 12.9784] },
        cuisines: ["North Indian", "Biryani"],
        deliveryTime: 40,
        isPureVeg: false,
        isApproved: true,
        image: "http://localhost:5001/images/biryani.png"
    },
    {
        name: "Green Garden Salads",
        description: "Fresh, healthy and 100% organic vegetarian food",
        address: "10 Health Way, Jayanagar, Bangalore",
        location: { type: "Point", coordinates: [77.5824, 12.9250] },
        cuisines: ["Salads", "Healthy Food"],
        deliveryTime: 20,
        isPureVeg: true,
        isApproved: true,
        image: "http://localhost:5001/images/north_indian.png"
    },
    {
        name: "Sushi Sakura",
        description: "Fine Japanese dining and fresh sushi rolls",
        address: "22 Zen Square, MG Road, Bangalore",
        location: { type: "Point", coordinates: [77.6033, 12.9747] },
        cuisines: ["Japanese", "Sushi"],
        deliveryTime: 45,
        isPureVeg: false,
        isApproved: true,
        image: "http://localhost:5001/images/chinese.png"
    }
];

const seedMenu = [
    { name: "Classic Cheeseburger", price: 299, description: "Juicy beef patty with cheddar cheese" },
    { name: "Spicy Chicken Burger", price: 349, description: "Crispy chicken with peri-peri mayo" },
    { name: "Margherita Pizza", price: 499, description: "Classic tomato and mozzarella" },
    { name: "Hyderabadi Biryani", price: 399, description: "Slow-cooked aromatic basmati rice" },
    { name: "Avocado Salad", price: 250, description: "Fresh greens with lemon dressing" }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB...");

        // 1. Approve all existing restaurants
        const updateResult = await mongoose.connection.db.collection('restaurants').updateMany(
            {},
            { $set: { isApproved: true } }
        );
        console.log(`Approved ${updateResult.modifiedCount} existing restaurants.`);

        // 2. Add New Realistic Restaurants
        for (const res of seedRestaurants) {
            const restaurant = await mongoose.connection.db.collection('restaurants').insertOne({
                ...res,
                ownerId: new mongoose.Types.ObjectId(OWNER_ID),
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Add Menu Items for each restaurant
            const menuItems = seedMenu.map(item => ({
                ...item,
                restaurantId: restaurant.insertedId,
                image: res.image,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
            await mongoose.connection.db.collection('fooditems').insertMany(menuItems);
        }

        console.log("Seeding completed successfully with 5 premium restaurants and full menus!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
