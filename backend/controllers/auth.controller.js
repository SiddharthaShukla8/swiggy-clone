const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const jwt = require("jsonwebtoken");
const { signupSchema, loginSchema } = require("../validations/auth.validation");

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
});

const getValidationMessage = (validationError) =>
    validationError?.issues?.[0]?.message || "Invalid request data";

// Helper to generate tokens and save refresh token in DB
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error("Something went wrong while generating tokens");
    }
};

const signup = asyncHandler(async (req, res) => {
    const validation = signupSchema.safeParse(req.body);
    
    if (!validation.success) {
        return res.status(400).json(
            new ApiResponse(400, null, getValidationMessage(validation.error))
        );
    }

    const { name, email, password, phone, role, location } = validation.data;

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        return res.status(409).json(new ApiResponse(409, null, "User with email already exists"));
    }

    const user = await User.create({
        name,
        email,
        password,
        phone,
        role: role || "CUSTOMER",
        location: location || { type: "Point", coordinates: [0, 0] },
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        return res.status(500).json(new ApiResponse(500, null, "Something went wrong while registering the user"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const options = getCookieOptions();

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                201,
                { user: createdUser, accessToken },
                "User registered successfully"
            )
        );
});

const login = asyncHandler(async (req, res) => {
    const validation = loginSchema.safeParse(req.body);
    
    if (!validation.success) {
        return res.status(400).json(
            new ApiResponse(400, null, getValidationMessage(validation.error))
        );
    }

    const { identifier, password } = validation.data;

    const user = await User.findOne({
        $or: [
            { email: identifier },
            { phone: identifier }
        ]
    });

    if (!user) {
        return res.status(404).json(new ApiResponse(404, null, "User does not exist"));
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        return res.status(401).json(new ApiResponse(401, null, "Invalid user credentials"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = getCookieOptions();

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                },
                "User logged in successfully"
            )
        );
});

const logout = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = getCookieOptions();

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized request"));
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            return res.status(401).json(new ApiResponse(401, null, "Invalid refresh token"));
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json(new ApiResponse(401, null, "Refresh token is expired or used"));
        }

        const options = getCookieOptions();

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        return res.status(401).json(new ApiResponse(401, null, error?.message || "Invalid refresh token"));
    }
});

const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken");
    
    if (!user) {
        return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    return res.status(200).json(
        new ApiResponse(200, user, "User fetched successfully")
    );
});

const updateProfile = asyncHandler(async (req, res) => {
    const { name, phone, location } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();
    if (location?.address) {
        updates.location = {
            type: "Point",
            address: location.address,
            coordinates: [
                parseFloat(location.lng || 0),
                parseFloat(location.lat || 0)
            ]
        };
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated successfully")
    );
});

module.exports = {
    signup,
    login,
    logout,
    refreshAccessToken,
    generateAccessAndRefereshTokens,
    getMe,
    updateProfile,
};
