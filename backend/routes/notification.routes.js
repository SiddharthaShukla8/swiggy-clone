const express = require("express");
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead 
} = require("../controllers/notification.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(verifyJWT);

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

module.exports = router;
