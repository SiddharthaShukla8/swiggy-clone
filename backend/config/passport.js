const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user.model");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // Determine role from state (passed during initiation)
                // Default to CUSTOMER if not provided
                let role = "CUSTOMER";
                
                if (req.query.state) {
                    try {
                        const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
                        role = state.role || "CUSTOMER";
                    } catch (e) {
                        console.error("Failed to parse OAuth state", e);
                    }
                }

                // Check if user already exists by googleId
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // Check if user exists by email (link accounts)
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        user.googleId = profile.id;
                        // For existing users, we don't forcefully overwrite their role 
                        // unless specifically asked, but here we prioritize existing role.
                        await user.save();
                    } else {
                        // Create new user
                        user = await User.create({
                            name: profile.displayName,
                            email: profile.emails[0].value,
                            googleId: profile.id,
                            role: role,
                            isActive: true,
                        });
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
