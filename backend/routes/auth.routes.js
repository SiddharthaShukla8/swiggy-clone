const express = require("express");
const { 
    signup, 
    login, 
    logout, 
    refreshAccessToken,
    getMe,
    updateProfile
} = require("../controllers/auth.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

const passport = require("passport");
const { generateAccessAndRefereshTokens } = require("../controllers/auth.controller");
const ApiResponse = require("../utils/apiResponse");

const router = express.Router();

// Role-Specific Google Login Initiation
router.get("/google", (req, res, next) => {
    const { role = "CUSTOMER" } = req.query;
    const state = Buffer.from(JSON.stringify({ role })).toString('base64');
    
    passport.authenticate("google", {
        scope: ["profile", "email"],
        state: state
    })(req, res, next);
});

// Google OAuth Callback
router.get("/google/callback", 
    passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
    async (req, res) => {
        try {
            const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(req.user._id);

            const options = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax"
            };

            // Option 1: Set cookies and redirect
            // Option 2: Redirect with token in query (easier for some SPAs)
            // We'll do both or choose one. Best for security is cookies + small redirect.
            return res
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .redirect(`${process.env.FRONTEND_URL}/google-callback?token=${accessToken}&role=${req.user.role}`);
        } catch (error) {
            console.error("OAuth Callback Error:", error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=token_gen_failed`);
        }
    }
);

router.post("/signup", signup);
router.post("/login", login);

// Protected routes
router.post("/logout", verifyJWT, logout);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", verifyJWT, getMe);
router.patch("/profile", verifyJWT, updateProfile);

module.exports = router;
