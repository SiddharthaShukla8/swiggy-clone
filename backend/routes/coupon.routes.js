const express = require("express");
const { applyCoupon, getCoupons } = require("../controllers/coupon.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", getCoupons);
router.post("/apply", verifyJWT, applyCoupon);

module.exports = router;
