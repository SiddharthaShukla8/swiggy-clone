import api from "./api";
import {
    getBestEffortPosition,
    getGeolocationErrorMessage,
    getGeolocationPermissionState,
    isGeolocationSupported,
} from "../utils/geolocation";

const reverseGeocodeCoordinates = async (lat, lng) => {
    try {
        const response = await api.get("/location/reverse-geocode", {
            params: { lat, lng },
        });

        if (!response.data?.success) {
            return null;
        }

        return response.data.data;
    } catch (error) {
        console.error("Reverse geocode failed:", error);
        return null;
    }
};

const detectApproximateLocationFromGeoapify = async () => {
    const response = await api.get("/location/current");
    const detectedLocation = response.data?.data;

    if (
        !response.data?.success ||
        !Number.isFinite(detectedLocation?.lat) ||
        !Number.isFinite(detectedLocation?.lng)
    ) {
        throw new Error("Approximate location lookup failed");
    }

    return {
        address: detectedLocation.address || "Approximate Location",
        lat: detectedLocation.lat,
        lng: detectedLocation.lng,
        source: detectedLocation.source || "geoapify-ip",
        precision: detectedLocation.precision || "approximate",
        label: detectedLocation.city || detectedLocation.address || "your area",
        message: `Using approximate location near ${detectedLocation.city || "your area"}`,
    };
};

export const detectCurrentLocation = async () => {
    const permissionState = await getGeolocationPermissionState();
    const canUseBrowserLocation =
        isGeolocationSupported() &&
        (typeof window === "undefined" ? false : window.isSecureContext);

    let browserError = null;

    if (canUseBrowserLocation && permissionState !== "denied") {
        try {
            const position = await getBestEffortPosition();
            const { latitude, longitude } = position.coords;
            const accuracy = Math.round(position.coords?.accuracy || 0);
            const reverseGeocoded = await reverseGeocodeCoordinates(latitude, longitude);
            const address = reverseGeocoded?.address || "Current Location";
            const label = reverseGeocoded?.city || address.split(",")[0] || "Current Location";
            const precision = accuracy > 0 && accuracy <= 250 ? "precise" : "device-estimate";

            return {
                address,
                lat: latitude,
                lng: longitude,
                source: "browser",
                precision,
                accuracy,
                label,
                message: precision === "precise" ? `Located: ${label}` : `Located near ${label}`,
            };
        } catch (error) {
            browserError = error;
        }
    }

    try {
        return await detectApproximateLocationFromGeoapify();
    } catch (ipError) {
        const errorMessage = browserError
            ? getGeolocationErrorMessage(browserError, permissionState)
            : "We could not detect your location right now. Please try again.";

        const combinedError = new Error(errorMessage);
        combinedError.browserError = browserError;
        combinedError.ipError = ipError;
        combinedError.permissionState = permissionState;
        throw combinedError;
    }
};
