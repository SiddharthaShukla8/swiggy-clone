import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";

const getPersistedAccessToken = () => {
    return localStorage.getItem("swiggy_token");
};

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies with requests
});

api.interceptors.request.use((config) => {
    const accessToken = getPersistedAccessToken();

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

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
                const refreshedToken = refreshResponse.data?.data?.accessToken;

                if (refreshedToken) {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
                }

                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, log out user (we'll implement this later)
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
