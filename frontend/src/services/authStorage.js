export const ACCESS_TOKEN_KEY = "swiggy_token";
export const PERSIST_ROOT_KEY = "persist:swiggy_v2";
export const AUTH_EXPIRED_EVENT = "swiggy:auth-expired";

const canUseStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

const parsePersistedAuthSlice = () => {
    if (!canUseStorage()) {
        return null;
    }

    try {
        const persistedRoot = localStorage.getItem(PERSIST_ROOT_KEY);

        if (!persistedRoot) {
            return null;
        }

        const parsedRoot = JSON.parse(persistedRoot);
        return parsedRoot?.auth ? JSON.parse(parsedRoot.auth) : null;
    } catch {
        return null;
    }
};

export const getStoredAccessToken = () => {
    if (!canUseStorage()) {
        return null;
    }

    const directToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (directToken) {
        return directToken;
    }

    return parsePersistedAuthSlice()?.accessToken || null;
};

export const setStoredAccessToken = (token) => {
    if (!canUseStorage()) {
        return;
    }

    if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        return;
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const clearStoredAccessToken = () => {
    if (!canUseStorage()) {
        return;
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const emitAuthExpired = () => {
    if (typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
};
