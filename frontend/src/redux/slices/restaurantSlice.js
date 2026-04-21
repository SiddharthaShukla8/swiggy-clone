import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ── Async thunks ──────────────────────────────────────────────────────────

export const fetchNearbyRestaurants = createAsyncThunk(
    "restaurants/fetchNearby",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await api.get("/restaurants/nearby", { params });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch restaurants");
        }
    }
);

export const fetchRestaurantsByCuisine = createAsyncThunk(
    "restaurants/fetchByCuisine",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await api.get("/restaurants/by-cuisine", { params });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch by cuisine");
        }
    }
);

export const fetchTrendingCuisines = createAsyncThunk(
    "restaurants/fetchTrendingCuisines",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await api.get("/restaurants/trending-cuisines", { params });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch cuisines");
        }
    }
);

export const fetchRestaurantStats = createAsyncThunk(
    "restaurants/fetchStats",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/restaurants/stats");
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch stats");
        }
    }
);

// ── Initial state ─────────────────────────────────────────────────────────

const initialState = {
    nearbyRestaurants: [],
    cuisineRestaurants: [],
    trendingCuisines: [],
    stats: null,
    loading: false,
    cuisineLoading: false,
    error: null,
    pagination: {
        total: 0,
        page: 1,
        limit: 12,
        pages: 1,
        hasMore: false,
    },
    // Active filters applied to the nearby listing
    filters: {
        sortBy: "relevance",
        veg: false,
        rating: null,
        cuisine: null,
        isOpen: false,
    },
};

// ── Slice ─────────────────────────────────────────────────────────────────

const restaurantSlice = createSlice({
    name: "restaurants",
    initialState,
    reducers: {
        setFilter(state, action) {
            state.filters = { ...state.filters, ...action.payload };
        },
        resetFilters(state) {
            state.filters = initialState.filters;
        },
        clearCuisineRestaurants(state) {
            state.cuisineRestaurants = [];
        },
    },
    extraReducers: (builder) => {
        // Nearby
        builder
            .addCase(fetchNearbyRestaurants.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNearbyRestaurants.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload;
                // Support both old shape (array) and new shape ({restaurants, pagination})
                state.nearbyRestaurants = payload?.restaurants || payload || [];
                state.pagination        = payload?.pagination  || initialState.pagination;
            })
            .addCase(fetchNearbyRestaurants.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // By Cuisine
        builder
            .addCase(fetchRestaurantsByCuisine.pending, (state) => {
                state.cuisineLoading = true;
            })
            .addCase(fetchRestaurantsByCuisine.fulfilled, (state, action) => {
                state.cuisineLoading     = false;
                state.cuisineRestaurants = action.payload?.restaurants || [];
                state.pagination         = action.payload?.pagination  || initialState.pagination;
            })
            .addCase(fetchRestaurantsByCuisine.rejected, (state, action) => {
                state.cuisineLoading = false;
                state.error          = action.payload;
            });

        // Trending Cuisines
        builder
            .addCase(fetchTrendingCuisines.fulfilled, (state, action) => {
                state.trendingCuisines = action.payload || [];
            });

        // Stats
        builder
            .addCase(fetchRestaurantStats.fulfilled, (state, action) => {
                state.stats = action.payload;
            });
    },
});

export const { setFilter, resetFilters, clearCuisineRestaurants } = restaurantSlice.actions;
export default restaurantSlice.reducer;
