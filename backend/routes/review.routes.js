const express = require("express");
const { addReview, getRestaurantReviews } = require("../controllers/review.controller");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

// Public route to get reviews
router.get("/restaurant/:id", getRestaurantReviews);

// Protected routes (Only customers can add reviews)
router.use(verifyJWT);
router.post("/", authorizeRoles("CUSTOMER"), addReview);

module.exports = router;
