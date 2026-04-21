const axios = require("axios");

const GEOAPIFY_API_URL = "https://api.geoapify.com/v1";

/**
 * Get suggestions for a place/address as the user types
 * @param {string} text - The input text for autocomplete
 */
const getAutocompleteSuggestions = async (text) => {
    try {
        const response = await axios.get(`${GEOAPIFY_API_URL}/geocode/autocomplete`, {
            params: {
                text,
                apiKey: process.env.GEOAPIFY_API_KEY,
                limit: 5,
            },
        });
        return response.data.features;
    } catch (error) {
        console.error("Geoapify Autocomplete Error:", error.response?.data || error.message);
        throw new Error("Failed to fetch address suggestions");
    }
};

/**
 * Get address details from latitude and longitude
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
const getReverseGeocode = async (lat, lng) => {
    try {
        const response = await axios.get(`${GEOAPIFY_API_URL}/geocode/reverse`, {
            params: {
                lat,
                lon: lng,
                apiKey: process.env.GEOAPIFY_API_KEY,
            },
        });
        return response.data.features[0]?.properties || null;
    } catch (error) {
        console.error("Geoapify Reverse Geocoding Error:", error.response?.data || error.message);
        throw new Error("Failed to fetch address details");
    }
};

module.exports = {
    getAutocompleteSuggestions,
    getReverseGeocode,
};
