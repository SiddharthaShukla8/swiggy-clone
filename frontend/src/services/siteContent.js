import api from "./api";

let cachedContent  = null;
let cachePromise   = null;
let lastFetchedAt  = 0;
let lastFailedAt   = 0;

const CACHE_TTL_MS  = 5 * 60 * 1000;  // 5 min success cache
const RETRY_DELAY_MS = 15 * 1000;      // 15 s before retrying after failure

export const getSiteContent = async ({ force = false } = {}) => {
    const now = Date.now();

    // Return cached success result if still fresh
    if (!force && cachedContent && now - lastFetchedAt < CACHE_TTL_MS) {
        return cachedContent;
    }

    // If a request is already in-flight, join it instead of firing a duplicate
    if (!force && cachePromise) {
        return cachePromise;
    }

    // Back-off: don't hammer the server if it recently failed
    if (!force && lastFailedAt && now - lastFailedAt < RETRY_DELAY_MS) {
        if (cachedContent) return cachedContent;   // serve stale content
        throw new Error("Site content unavailable — retrying soon.");
    }

    cachePromise = api.get("/content/site")
        .then((response) => {
            cachedContent = response.data?.data || null;
            lastFetchedAt = Date.now();
            lastFailedAt  = 0;
            return cachedContent;
        })
        .catch((err) => {
            lastFailedAt = Date.now();
            // If we have stale content, return it silently
            if (cachedContent) return cachedContent;
            throw err;
        })
        .finally(() => {
            cachePromise = null;
        });

    return cachePromise;
};

/** Force a fresh fetch (call after login / locale change) */
export const invalidateSiteContent = () => {
    cachedContent  = null;
    lastFetchedAt  = 0;
    lastFailedAt   = 0;
    cachePromise   = null;
};
