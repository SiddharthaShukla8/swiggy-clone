const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: false, // Optional for Social Login
        },
        phone: {
            type: String,
            required: false, // Optional for Social Login
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true, // Allows null/missing for email-only accounts
        },
        role: {
            type: String,
            enum: ["CUSTOMER", "RESTAURANT_OWNER", "DELIVERY_PARTNER", "ADMIN"],
            default: "CUSTOMER",
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0],
            },
            address: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isAvailable: {
            type: Boolean,
            default: true, // Only relevant for DELIVERY_PARTNER
        },
        currentOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null, // Only relevant for DELIVERY_PARTNER
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

// Geo-spatial index for location
userSchema.index({ location: "2dsphere" });

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Access Token Generation
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role,
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: "1h", // Access token expiration
        }
    );
};

// Refresh Token Generation
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: "7d", // Refresh token expiration
        }
    );
};

const User = mongoose.model("User", userSchema);

module.exports = User;
