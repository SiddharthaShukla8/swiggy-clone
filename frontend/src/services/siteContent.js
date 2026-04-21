import api from "./api";

let cachedContent = null;
let cachePromise = null;
let lastFetchedAt = 0;

const CACHE_TTL_MS = 5 * 60 * 1000;

export const getSiteContent = async ({ force = false } = {}) => {
    const now = Date.now();

    if (!force && cachedContent && now - lastFetchedAt < CACHE_TTL_MS) {
        return cachedContent;
    }

    if (!force && cachePromise) {
        return cachePromise;
    }

    cachePromise = api.get("/content/site")
        .then((response) => {
            cachedContent = response.data?.data || null;
            lastFetchedAt = Date.now();
            return cachedContent;
        })
        .finally(() => {
            cachePromise = null;
        });

    return cachePromise;
};
