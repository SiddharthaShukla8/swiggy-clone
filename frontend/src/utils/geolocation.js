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

export const isLegacyFallbackLocationState = (location) => {
    if (!location) {
        return false;
    }

    return (
        !location.source &&
        location.address === LEGACY_FALLBACK_LOCATION.address &&
        location.lat === LEGACY_FALLBACK_LOCATION.lat &&
        location.lng === LEGACY_FALLBACK_LOCATION.lng
    );
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

const WATCH_ACCURACY_OPTIONS = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 20000,
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

const clearActiveWatch = (watchId) => {
    if (watchId !== null && watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
    }
};

export const watchPrecisePosition = ({
    desiredAccuracy = 120,
    maxWaitMs = 18000,
    acceptableAccuracy = 250,
} = {}) => {
    return new Promise((resolve, reject) => {
        let watchId = null;
        let timeoutId = null;
        let bestPosition = null;
        let settled = false;
        let lastError = null;

        const finish = (callback, value) => {
            if (settled) {
                return;
            }

            settled = true;
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
            clearActiveWatch(watchId);
            callback(value);
        };

        const maybeAcceptPosition = (position) => {
            const accuracy = position?.coords?.accuracy ?? Number.POSITIVE_INFINITY;

            if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
                bestPosition = position;
            }

            if (accuracy <= desiredAccuracy) {
                finish(resolve, position);
            }
        };

        try {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    maybeAcceptPosition(position);
                },
                (error) => {
                    lastError = error;

                    if (error?.code === GEOLOCATION_ERROR_CODES.PERMISSION_DENIED) {
                        finish(reject, error);
                    }
                },
                WATCH_ACCURACY_OPTIONS
            );
        } catch (error) {
            reject(error);
            return;
        }

        timeoutId = window.setTimeout(() => {
            if (bestPosition && bestPosition.coords.accuracy <= acceptableAccuracy) {
                finish(resolve, bestPosition);
                return;
            }

            if (bestPosition) {
                finish(resolve, bestPosition);
                return;
            }

            finish(reject, lastError || new Error("Unable to determine precise location"));
        }, maxWaitMs);
    });
};

export const getBestEffortPosition = async () => {
    try {
        return await watchPrecisePosition();
    } catch (watchError) {
        if (watchError?.code === GEOLOCATION_ERROR_CODES.PERMISSION_DENIED) {
            throw watchError;
        }

        try {
            return await getCurrentPosition(HIGH_ACCURACY_OPTIONS);
        } catch (error) {
            if (error?.code === GEOLOCATION_ERROR_CODES.PERMISSION_DENIED) {
                throw error;
            }

            return getCurrentPosition(STANDARD_ACCURACY_OPTIONS);
        }
    }
};

export const getGeolocationErrorMessage = (error, permissionState = "unknown") => {
    if (permissionState === "denied" || error?.code === GEOLOCATION_ERROR_CODES.PERMISSION_DENIED) {
        return "Location access is blocked in your browser, and approximate detection also failed. Allow location for localhost:5173 from the address bar site settings, then try again.";
    }

    if (error?.code === GEOLOCATION_ERROR_CODES.POSITION_UNAVAILABLE) {
        return "Your device could not determine a precise location, and approximate detection also failed. Check Wi-Fi/GPS and try again.";
    }

    if (error?.code === GEOLOCATION_ERROR_CODES.TIMEOUT) {
        return "Location detection timed out, and approximate detection also failed. Try again with Wi-Fi or device location services enabled.";
    }

    return "We could not detect your location right now. Please try again.";
};
