const express = require("express");
const { 
    addFoodItem, 
    updateFoodItem, 
    deleteFoodItem 
} = require("../controllers/foodItem.controller");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware");
const { upload } = require("../config/cloudinary");

const router = express.Router();

// Protected routes (Only Owners or Admins)
router.use(verifyJWT);
router.use(authorizeRoles("RESTAURANT_OWNER", "ADMIN"));

router.post("/", upload.single("image"), addFoodItem);
router.put("/:id", upload.single("image"), updateFoodItem);
router.delete("/:id", deleteFoodItem);

module.exports = router;
