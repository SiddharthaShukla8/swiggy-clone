import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { calculateCartTotals } from "../../utils/calculateCartTotals";

export const addToCart = createAsyncThunk(
    "cart/add",
    async (itemData, { rejectWithValue }) => {
        try {
            const response = await api.post("/cart/add", itemData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to add to cart");
        }
    }
);

export const getCart = createAsyncThunk(
    "cart/get",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/cart");
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch cart");
        }
    }
);

export const updateCartQuantity = createAsyncThunk(
    "cart/update",
    async ({ foodItemId, quantity }, { rejectWithValue }) => {
        try {
            const response = await api.put("/cart/update", { foodItemId, quantity });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update quantity");
        }
    }
);

export const removeFromCart = createAsyncThunk(
    "cart/remove",
    async (foodItemId, { rejectWithValue }) => {
        try {
            const response = await api.delete(`/cart/remove/${foodItemId}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to remove item");
        }
    }
);

export const applyCoupon = createAsyncThunk(
    "cart/applyCoupon",
    async ({ code, cartTotal }, { rejectWithValue }) => {
        try {
            const response = await api.post("/coupons/apply", { code, cartTotal });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to apply coupon");
        }
    }
);

const initialState = {
    cart: null,
    totals: {
        itemTotal: 0,
        deliveryFee: 0,
        platformFee: 0,
        gst: 0,
        discountAmount: 0,
        totalToPay: 0,
    },
    appliedCoupon: null,
    conflict: {
        show: false,
        pendingItem: null,
    },
    loading: false,
    error: null,
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        clearCartLocal: (state) => {
            state.cart = null;
            state.totals = initialState.totals;
            state.appliedCoupon = null;
            state.conflict = initialState.conflict;
        },
        removeCoupon: (state) => {
            state.appliedCoupon = null;
            if (state.cart?.items) {
                state.totals = calculateCartTotals(state.cart.items);
            }
        },
        recalculateTotals: (state) => {
            if (state.cart?.items) {
                state.totals = calculateCartTotals(state.cart.items);
            }
        },
        setConflict: (state, action) => {
            state.conflict = {
                show: true,
                pendingItem: action.payload,
            };
        },
        resetConflict: (state) => {
            state.conflict = initialState.conflict;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(getCart.fulfilled, (state, action) => {
                state.loading = false;
                state.cart = action.payload;
                state.totals = calculateCartTotals(action.payload?.items || []);
            })
            .addCase(getCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                state.cart = action.payload;
                state.totals = calculateCartTotals(action.payload?.items || []);
            })
            .addCase(updateCartQuantity.fulfilled, (state, action) => {
                state.cart = action.payload;
                state.totals = calculateCartTotals(action.payload?.items || []);
            })
            .addCase(removeFromCart.fulfilled, (state, action) => {
                state.cart = action.payload;
                state.totals = calculateCartTotals(action.payload?.items || []);
                state.appliedCoupon = null; // Reset coupon if cart changes
            })
            .addCase(applyCoupon.fulfilled, (state, action) => {
                state.appliedCoupon = action.payload;
                state.totals = {
                    ...state.totals,
                    discountAmount: action.payload.discountAmount,
                    totalToPay: action.payload.finalAmount
                };
            });
    },
});

export const { clearCartLocal, recalculateTotals, setConflict, resetConflict, removeCoupon } = cartSlice.actions;
export default cartSlice.reducer;
