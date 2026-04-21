import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchRestaurantReviews = createAsyncThunk(
    "reviews/fetchByRestaurant",
    async (restaurantId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/reviews/restaurant/${restaurantId}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch reviews");
        }
    }
);

export const submitReview = createAsyncThunk(
    "reviews/submit",
    async (reviewData, { rejectWithValue }) => {
        try {
            const response = await api.post("/reviews", reviewData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to submit review");
        }
    }
);

const reviewSlice = createSlice({
    name: "reviews",
    initialState: {
        reviews: [],
        loading: false,
        submitting: false,
        error: null,
    },
    reducers: {
        clearReviewError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Reviews
            .addCase(fetchRestaurantReviews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRestaurantReviews.fulfilled, (state, action) => {
                state.loading = false;
                state.reviews = action.payload;
            })
            .addCase(fetchRestaurantReviews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Submit Review
            .addCase(submitReview.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(submitReview.fulfilled, (state, action) => {
                state.submitting = false;
                state.reviews.unshift(action.payload); // Add new review at top
            })
            .addCase(submitReview.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });
    },
});

export const { clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;
