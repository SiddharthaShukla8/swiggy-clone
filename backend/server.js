const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const { createServer } = require("http");
const passport = require("passport");
const session = require("express-session");
const { initializeSocket } = require("./services/socket.service");
const { startFailSafeEngine } = require("./services/failsafe.service");
require("./config/passport"); // Import passport configuration

const sanitizeObject = (value) => {
    if (Array.isArray(value)) {
        return value.map(sanitizeObject);
    }

    if (value && typeof value === "object") {
        return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
            if (key.includes("$") || key.includes(".")) {
                return accumulator;
            }

            accumulator[key] = sanitizeObject(nestedValue);
            return accumulator;
        }, {});
    }

    return value;
};

const sanitizeRequest = (req, res, next) => {
    req.body = sanitizeObject(req.body);
    req.params = sanitizeObject(req.params);
    req.query = sanitizeObject(req.query);
    next();
};

// Load env vars
dotenv.config();

// Connect to database
connectDB();
// Connect to Redis
connectRedis();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Security Middlewares
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https:", "http://localhost:5001"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(hpp());
app.use(cors({
    origin: [
        process.env.CORS_ORIGIN || "http://localhost:5173",
        "https://swiggy-clone-v2.vercel.app" // Placeholder for user's future production URL
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Sanitize user-controlled input to guard Mongo queries without relying on
// express-mongo-sanitize, which breaks under this Express 5 stack.
app.use(sanitizeRequest);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100 
});
app.use("/api", limiter);

// Standard Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(morgan("dev"));
app.use(cookieParser());

// Session configuration (required for passport)
app.use(session({
    secret: process.env.SESSION_SECRET || "keyboard_cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));

// Import Routes
const authRoutes = require("./routes/auth.routes.js");
const restaurantRoutes = require("./routes/restaurant.routes.js");
const locationRoutes = require("./routes/location.routes.js");
const cartRoutes = require("./routes/cart.routes.js");
const orderRoutes = require("./routes/order.routes.js");
const ownerRoutes = require("./routes/owner.routes.js");
const deliveryRoutes = require("./routes/delivery.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const foodRoutes = require("./routes/foodItem.routes.js");
const notificationRoutes = require("./routes/notification.routes.js");
const reviewRoutes = require("./routes/review.routes.js");
const contentRoutes = require("./routes/content.routes.js");

// Routes Declaration
app.use("/auth", authRoutes); // Added root-level auth for Google Callback compatibility
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/restaurants", restaurantRoutes);
app.use("/api/v1/location", locationRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/owner", ownerRoutes);
app.use("/api/v1/delivery", deliveryRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/food", foodRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/reviews", require("./routes/review.routes"));
app.use("/api/v1/coupons", require("./routes/coupon.routes"));
app.use("/api/v1/content", contentRoutes);

// API Health Check
app.get("/api/v1", (req, res) => {
    res.json({ success: true, message: "Swiggy Clone API is live on v1" });
});

// Root Route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Swiggy Clone API" });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
});

// Port configuration
const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    startFailSafeEngine();
});
