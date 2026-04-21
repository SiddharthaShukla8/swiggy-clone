import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    address: null,
    lat: null,
    lng: null,
    isSet: false,
    source: null,
};

const locationSlice = createSlice({
    name: "location",
    initialState,
    reducers: {
        setLocation: (state, action) => {
            const { address, lat, lng, source = "manual" } = action.payload;
            state.address = address;
            state.lat = lat;
            state.lng = lng;
            state.isSet = true;
            state.source = source;
        },
        resetLocation: (state) => {
            state.address = null;
            state.lat = null;
            state.lng = null;
            state.isSet = false;
            state.source = null;
        },
    },
});

export const { setLocation, resetLocation } = locationSlice.actions;
export default locationSlice.reducer;
