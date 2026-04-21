const express = require("express");
const { 
    getAvailableOrders, 
    getMyActiveOrder,
    acceptDelivery, 
    toggleAvailability,
    updateLocation 
} = require("../controllers/delivery.controller");
const { verifyJWT, requireDelivery } = require("../middlewares/auth.middleware");

const router = express.Router();

// All delivery routes restricted to DELIVERY_PARTNER
router.use(verifyJWT);
router.use(requireDelivery);

router.get("/available", getAvailableOrders);
router.get("/my-order", getMyActiveOrder);
router.patch("/availability", toggleAvailability);
router.patch("/location", updateLocation);
router.patch("/orders/:id/accept", acceptDelivery);

module.exports = router;
