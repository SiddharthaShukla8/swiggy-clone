const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const {
    getAutocompleteSuggestions,
    getReverseGeocode,
    getIpGeolocation,
} = require("../services/geoapify.service");

const LEGACY_LOOPBACK_IPS = new Set(["127.0.0.1", "::1"]);

const normalizeIp = (value) => {
    if (!value) {
        return null;
    }

    return value.replace(/^::ffff:/, "");
};

const isPrivateIp = (ip) => {
    if (!ip) {
        return true;
    }

    if (LEGACY_LOOPBACK_IPS.has(ip)) {
        return true;
    }

    if (ip.startsWith("10.") || ip.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) {
        return true;
    }

    if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) {
        return true;
    }

    return false;
};

const getPublicClientIp = (req) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedCandidate = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor?.split(",")[0]?.trim();
    const socketCandidate = req.socket?.remoteAddress;
    const normalized = normalizeIp(forwardedCandidate || socketCandidate);

    return normalized && !isPrivateIp(normalized) ? normalized : undefined;
};

const buildApproximateAddress = (...parts) => parts.filter(Boolean).join(", ");

/**
 * @desc    Get address from coordinates (Reverse Geocoding)
 * @route   GET /api/v1/location/reverse-geocode
 */
const reverseGeocode = asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json(new ApiResponse(400, null, "Latitude and Longitude are required"));
    }

    try {
        const result = await getReverseGeocode(Number(lat), Number(lng));

        if (result) {
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

    try {
        const features = await getAutocompleteSuggestions(text);

        if (features) {
            const suggestions = features.map(feat => ({
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

/**
 * @desc    Detect approximate location from the active IP using Geoapify
 * @route   GET /api/v1/location/current
 */
const detectCurrentLocation = asyncHandler(async (req, res) => {
    try {
        const ip = getPublicClientIp(req);
        const detectedLocation = await getIpGeolocation(ip);
        const lat = detectedLocation?.location?.latitude;
        const lng = detectedLocation?.location?.longitude;

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return res.status(404).json(new ApiResponse(404, null, "No approximate location found"));
        }

        const city = detectedLocation?.city?.name || null;
        const state = detectedLocation?.state?.name || null;
        const country = detectedLocation?.country?.name || null;
        const postcode = detectedLocation?.postcode || null;
        const address = buildApproximateAddress(city, state, country);

        return res.status(200).json(
            new ApiResponse(200, {
                address,
                city,
                state,
                country,
                postcode,
                lat,
                lng,
                source: "geoapify-ip",
                precision: "approximate",
            }, "Approximate location detected successfully")
        );
    } catch (error) {
        console.error("Geoapify IP Detection Error:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Failed to detect approximate location"));
    }
});

module.exports = {
    reverseGeocode,
    autocomplete,
    detectCurrentLocation,
};
