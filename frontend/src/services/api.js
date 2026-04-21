import axios from "axios";
import {
    clearStoredAccessToken,
    emitAuthExpired,
    getStoredAccessToken,
    setStoredAccessToken,
} from "./authStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";
let refreshPromise = null;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies with requests
});

api.interceptors.request.use((config) => {
    const accessToken = getStoredAccessToken();

    if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

// Response interceptor to handle token refresh automatically
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || "";
        const shouldSkipRefresh =
            originalRequest?.skipAuthRefresh ||
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/signup") ||
            requestUrl.includes("/auth/refresh-token");

        if (error.response?.status === 401 && !originalRequest?._retry && !shouldSkipRefresh) {
            originalRequest._retry = true;

            try {
                if (!refreshPromise) {
                    refreshPromise = axios
                        .post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true, skipAuthRefresh: true })
                        .then((refreshResponse) => {
                            const refreshedToken = refreshResponse.data?.data?.accessToken;
                            setStoredAccessToken(refreshedToken);
                            return refreshedToken;
                        })
                        .finally(() => {
                            refreshPromise = null;
                        });
                }

                const refreshedToken = await refreshPromise;

                if (refreshedToken) {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
                }

                return api(originalRequest);
            } catch (refreshError) {
                clearStoredAccessToken();
                emitAuthExpired();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
