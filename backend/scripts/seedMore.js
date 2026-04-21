const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://siddharthashuklajee8_db_user:JNtPu7Bzifxm46fu@cluster0.z22uelm.mongodb.net/';
const OWNER_ID = '69d677011ef3ff8ffb9f7f68';

const additionalRestaurants = [
    {
        name: "Wok of Fame",
        description: "Classic Cantonese and Szechuan specialties",
        address: "70 Silk Road, Whitefield, Bangalore",
        location: { type: "Point", coordinates: [77.7500, 12.9667] },
        cuisines: ["Chinese", "Asian"],
        deliveryTime: 30,
        isPureVeg: false,
        isApproved: true,
        image: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80"
    },
    {
        name: "Southern Spice",
        description: "Authentic Chettinad and Kerala delicacies",
        address: "12 Banana Leaf St, Malleshwaram, Bangalore",
        location: { type: "Point", coordinates: [77.5736, 13.0031] },
        cuisines: ["South Indian", "Seafood"],
        deliveryTime: 35,
        isPureVeg: false,
        isApproved: true,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80"
    },
    {
        name: "The Salad Bar",
        description: "Freshly tossed healthy power bowls",
        address: "5 Green Avenue, HSR Layout, Bangalore",
        location: { type: "Point", coordinates: [77.6371, 12.9141] },
        cuisines: ["Salads", "Healthy Food"],
        deliveryTime: 20,
        isPureVeg: true,
        isApproved: true,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
    },
    {
        name: "Taco Fiesta",
        description: "Vibrant Mexican street food and nachos",
        address: "15 Sombrero Way, Kalyan Nagar, Bangalore",
        location: { type: "Point", coordinates: [77.6450, 13.0232] },
        cuisines: ["Mexican", "Tex-Mex"],
        deliveryTime: 25,
        isPureVeg: false,
        isApproved: true,
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865ef4?w=800&q=80"
    },
    {
        name: "Sweet Tooth Patisserie",
        description: "Exquisite desserts, cakes, and artisanal pastries",
        address: "99 Sugar Lane, CBD, Bangalore",
        location: { type: "Point", coordinates: [77.5966, 12.9723] },
        cuisines: ["Desserts", "Bakery"],
        deliveryTime: 15,
        isPureVeg: true,
        isApproved: true,
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80"
    }
];

async function seedMore() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected for phase 2 seeding...");

        for (const res of additionalRestaurants) {
            await mongoose.connection.db.collection('restaurants').insertOne({
                ...res,
                ownerId: new mongoose.Types.ObjectId(OWNER_ID),
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        console.log("Phase 2 Seeding completed: Total 10+ premium restaurants now available.");
        process.exit(0);
    } catch (error) {
        console.error("Phase 2 Seeding failed:", error);
        process.exit(1);
    }
}

seedMore();
