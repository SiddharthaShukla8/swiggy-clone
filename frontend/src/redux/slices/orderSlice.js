import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Thunks for various roles
export const fetchOwnerOrders = createAsyncThunk(
    "orders/fetchOwner",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/owner/orders");
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch restaurant orders");
        }
    }
);

export const fetchAvailableDeliveryOrders = createAsyncThunk(
    "orders/fetchAvailable",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/delivery/available");
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch available deliveries");
        }
    }
);

export const acceptOrder = createAsyncThunk(
    "orders/accept",
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await api.post(`/orders/${orderId}/accept`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to accept order");
        }
    }
);

export const updateOrderStatus = createAsyncThunk(
    "orders/updateStatus",
    async ({ orderId, status }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/orders/${orderId}/status`, { status });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update order status");
        }
    }
);

const initialState = {
    orders: [],
    availableOrders: [],
    currentOrder: null,
    loading: false,
    error: null,
};

const orderSlice = createSlice({
    name: "orders",
    initialState,
    reducers: {
        setLiveStatusUpdate: (state, action) => {
            const { orderId, status } = action.payload;
            const index = state.orders.findIndex(o => o._id === orderId);
            if (index !== -1) {
                state.orders[index].status = status;
            }
            if (state.currentOrder?._id === orderId) {
                state.currentOrder.status = status;
            }
        },
        removeOrderLocal: (state, action) => {
            state.availableOrders = state.availableOrders.filter(o => o._id !== action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOwnerOrders.fulfilled, (state, action) => {
                state.orders = action.payload;
                state.loading = false;
            })
            .addCase(fetchAvailableDeliveryOrders.fulfilled, (state, action) => {
                state.availableOrders = action.payload;
                state.loading = false;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                const index = state.orders.findIndex(o => o._id === action.payload._id);
                if (index !== -1) {
                    state.orders[index] = action.payload;
                }
            });
    },
});

export const { setLiveStatusUpdate, removeOrderLocal } = orderSlice.actions;
export default orderSlice.reducer;
