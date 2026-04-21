const { z } = require("zod");

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    role: z.enum(["CUSTOMER", "RESTAURANT_OWNER", "DELIVERY_PARTNER", "ADMIN"]).optional(),
    location: z.object({
        type: z.literal("Point"),
        coordinates: z.array(z.number()).length(2),
        address: z.string().optional(),
    }).optional(),
});

const loginSchema = z.object({
    identifier: z.string().min(1, "Email or phone is required"),
    password: z.string().min(1, "Password is required"),
});

module.exports = {
    signupSchema,
    loginSchema,
};
