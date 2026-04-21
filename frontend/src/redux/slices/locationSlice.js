import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    address: null,
    lat: null,
    lng: null,
    isSet: false,
    source: null,
    precision: null,
    accuracy: null,
};

const locationSlice = createSlice({
    name: "location",
    initialState,
    reducers: {
        setLocation: (state, action) => {
            const { address, lat, lng, source = "manual", precision = "manual", accuracy = null } = action.payload;
            state.address = address;
            state.lat = lat;
            state.lng = lng;
            state.isSet = true;
            state.source = source;
            state.precision = precision;
            state.accuracy = accuracy;
        },
        resetLocation: (state) => {
            state.address = null;
            state.lat = null;
            state.lng = null;
            state.isSet = false;
            state.source = null;
            state.precision = null;
            state.accuracy = null;
        },
    },
});

export const { setLocation, resetLocation } = locationSlice.actions;
export default locationSlice.reducer;
