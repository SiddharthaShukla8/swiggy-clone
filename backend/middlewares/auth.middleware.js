const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json(new ApiResponse(401, null, "Unauthorized request"));
        }

        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            return res.status(401).json(new ApiResponse(401, null, "Invalid Access Token"));
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json(new ApiResponse(401, null, error?.message || "Invalid access token"));
    }
});

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json(
                new ApiResponse(403, null, `Role: ${req.user.role} is not allowed to access this resource`)
            );
        }
        next();
    };
};

const requireUser = authorizeRoles("CUSTOMER");
const requireOwner = authorizeRoles("RESTAURANT_OWNER");
const requireDelivery = authorizeRoles("DELIVERY_PARTNER");
const requireAdmin = authorizeRoles("ADMIN");

module.exports = {
    verifyJWT,
    authorizeRoles,
    requireUser,
    requireOwner,
    requireDelivery,
    requireAdmin
};
