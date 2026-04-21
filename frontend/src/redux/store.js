import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import restaurantReducer from "./slices/restaurantSlice";
import cartReducer from "./slices/cartSlice";
import orderReducer from "./slices/orderSlice";
import locationReducer from "./slices/locationSlice";
import notificationReducer from "./slices/notificationSlice";
import reviewReducer from "./slices/reviewSlice";
import storage from "redux-persist/lib/storage"; // localStorage - persists across page refresh
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
    key: "swiggy_v2",
    storage,
    whitelist: ["auth", "cart", "location"], // Persist auth, cart and location
};

const rootReducer = combineReducers({
    auth: authReducer,
    restaurants: restaurantReducer,
    cart: cartReducer,
    orders: orderReducer,
    location: locationReducer,
    notifications: notificationReducer,
    reviews: reviewReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export const persistor = persistStore(store);
