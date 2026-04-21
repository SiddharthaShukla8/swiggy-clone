const GEOLOCATION_ERROR_CODES = {
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
};

export const LEGACY_FALLBACK_LOCATION = {
    address: "MG Road, Bangalore, Karnataka",
    lat: 12.9716,
    lng: 77.6033,
};

const HIGH_ACCURACY_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
};

const STANDARD_ACCURACY_OPTIONS = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 300000,
};

export const isGeolocationSupported = () => {
    return typeof navigator !== "undefined" && "geolocation" in navigator;
};

export const getGeolocationPermissionState = async () => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
        return "unknown";
    }

    try {
        const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
        return permissionStatus.state;
    } catch {
        return "unknown";
    }
};

export const getCurrentPosition = (options) => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
};

export const getBestEffortPosition = async () => {
    try {
        return await getCurrentPosition(HIGH_ACCURACY_OPTIONS);
    } catch (error) {
        if (error?.code === GEOLOCATION_ERROR_CODES.PERMISSION_DENIED) {
            throw error;
        }

        return getCurrentPosition(STANDARD_ACCURACY_OPTIONS);
    }
};

export const getGeolocationErrorMessage = (error, permissionState = "unknown") => {
    if (permissionState === "denied" || error?.code === GEOLOCATION_ERROR_CODES.PERMISSION_DENIED) {
        return "Location access is blocked in your browser. Allow location for localhost:5173 from the address bar site settings, then try again.";
    }

    if (error?.code === GEOLOCATION_ERROR_CODES.POSITION_UNAVAILABLE) {
        return "Your device could not determine a precise location. Check Wi-Fi/GPS and try again.";
    }

    if (error?.code === GEOLOCATION_ERROR_CODES.TIMEOUT) {
        return "Location detection timed out. Try again with Wi-Fi or device location services enabled.";
    }

    return "We could not detect your location right now. Please try again.";
};
