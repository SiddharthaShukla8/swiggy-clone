const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

/**
 * @desc    Get address from coordinates (Reverse Geocoding)
 * @route   GET /api/v1/location/reverse-geocode
 */
const reverseGeocode = asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json(new ApiResponse(400, null, "Latitude and Longitude are required"));
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return res.status(200).json(
                new ApiResponse(200, {
                    address: result.formatted,
                    city: result.city,
                    state: result.state,
                    postcode: result.postcode,
                }, "Reverse geocoding successful")
            );
        }

        return res.status(404).json(new ApiResponse(404, null, "No address found for these coordinates"));
    } catch (error) {
        console.error("Geoapify Error:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Failed to fetch address from Geoapify"));
    }
});

/**
 * @desc    Get address suggestions (Autocomplete)
 * @route   GET /api/v1/location/autocomplete
 */
const autocomplete = asyncHandler(async (req, res) => {
    const { text } = req.query;

    if (!text) {
        return res.status(400).json(new ApiResponse(400, null, "Search text is required"));
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.features) {
            const suggestions = data.features.map(feat => ({
                formatted: feat.properties.formatted,
                lat: feat.properties.lat,
                lng: feat.properties.lon,
                placeId: feat.properties.place_id
            }));
            return res.status(200).json(new ApiResponse(200, suggestions, "Suggestions fetched successfully"));
        }

        return res.status(200).json(new ApiResponse(200, [], "No suggestions found"));
    } catch (error) {
        console.error("Geoapify Autocomplete Error:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Failed to fetch suggestions"));
    }
});

module.exports = {
    reverseGeocode,
    autocomplete,
};
