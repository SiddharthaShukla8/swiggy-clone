const FoodItem = require("../models/foodItem.model");
const Restaurant = require("../models/restaurant.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

// @desc    Add a new food item to restaurant
// @route   POST /api/v1/food
// @access  Private (Owner/Admin)
const addFoodItem = asyncHandler(async (req, res) => {
    const { name, description, price, category, isVeg, restaurantId } = req.body;
    const imageUrl = req.file ? req.file.path : req.body.image;

    if (!name || !price || !category || !restaurantId) {
        return res.status(400).json(new ApiResponse(400, null, "All required fields must be provided"));
    }

    // Authorization: Check if user owns this restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        return res.status(404).json(new ApiResponse(404, null, "Restaurant not found"));
    }

    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json(new ApiResponse(403, null, "Unauthorized to add items to this restaurant"));
    }

    const foodItem = await FoodItem.create({
        name,
        description,
        price,
        category,
        isVeg,
        restaurantId,
        image: imageUrl
    });

    return res.status(201)
        .json(new ApiResponse(201, foodItem, "Food item added successfully"));
});

// @desc    Update a food item
// @route   PUT /api/v1/food/:id
// @access  Private (Owner/Admin)
const updateFoodItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, isVeg, isAvailable } = req.body;
    const imageUrl = req.file ? req.file.path : req.body.image;

    const foodItem = await FoodItem.findById(id);
    if (!foodItem) {
        return res.status(404).json(new ApiResponse(404, null, "Food item not found"));
    }

    // Authorization
    const restaurant = await Restaurant.findById(foodItem.restaurantId);
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json(new ApiResponse(403, null, "Unauthorized to update this item"));
    }

    const updatedItem = await FoodItem.findByIdAndUpdate(
        id,
        { name, description, price, category, isVeg, isAvailable, image: imageUrl },
        { new: true, runValidators: true }
    );

    return res.status(200)
        .json(new ApiResponse(200, updatedItem, "Food item updated successfully"));
});

// @desc    Delete a food item
// @route   DELETE /api/v1/food/:id
// @access  Private (Owner/Admin)
const deleteFoodItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const foodItem = await FoodItem.findById(id);
    if (!foodItem) {
        return res.status(404).json(new ApiResponse(404, null, "Food item not found"));
    }

    // Authorization
    const restaurant = await Restaurant.findById(foodItem.restaurantId);
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json(new ApiResponse(403, null, "Unauthorized to delete this item"));
    }

    await FoodItem.findByIdAndDelete(id);

    return res.status(200)
        .json(new ApiResponse(200, null, "Food item deleted successfully"));
});

module.exports = {
    addFoodItem,
    updateFoodItem,
    deleteFoodItem
};
