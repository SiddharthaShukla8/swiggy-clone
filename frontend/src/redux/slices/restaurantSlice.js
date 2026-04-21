import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchNearbyRestaurants = createAsyncThunk(
    "restaurants/fetchNearby",
    async ({ lat, lng, radius }, { rejectWithValue }) => {
        try {
            const response = await api.get("/restaurants/nearby", {
                params: { lat, lng, radius },
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch restaurants");
        }
    }
);

const initialState = {
    location: {
        address: "Bangalore, Karnataka",
        lat: 12.9716,
        lng: 77.5946,
        isDefault: true, // Flag to indicate using fallback
    },
    nearbyRestaurants: [],
    loading: false,
    error: null,
};

const restaurantSlice = createSlice({
    name: "restaurants",
    initialState,
    reducers: {
        setLocation: (state, action) => {
            state.location = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNearbyRestaurants.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNearbyRestaurants.fulfilled, (state, action) => {
                state.loading = false;
                state.nearbyRestaurants = action.payload?.restaurants || action.payload || [];
            })
            .addCase(fetchNearbyRestaurants.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setLocation } = restaurantSlice.actions;
export default restaurantSlice.reducer;
