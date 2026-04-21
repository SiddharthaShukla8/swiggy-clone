import React, { useState, useEffect } from "react";
import { Search, MapPin, Navigation } from "lucide-react";
import { useDispatch } from "react-redux";
import { setLocation } from "../redux/slices/locationSlice";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
    getBestEffortPosition,
    getGeolocationErrorMessage,
    getGeolocationPermissionState,
    isGeolocationSupported,
} from "../utils/geolocation";

const LocationSearch = ({ onLocationSelected }) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length > 2) {
                fetchSuggestions(query);
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const fetchSuggestions = async (text) => {
        try {
            const response = await api.get("/location/autocomplete", {
                params: { text },
            });
            setSuggestions(response.data.data);
        } catch (error) {
            console.error("Autocomplete failed:", error);
        }
    };

    const handleSelect = (s) => {
        const loc = {
            address: s.formatted,
            lat: s.lat,
            lng: s.lng,
            source: "search",
        };
        dispatch(setLocation(loc));
        setQuery(s.formatted);
        setSuggestions([]);
        if (onLocationSelected) onLocationSelected(loc);
    };

    const handleCurrentLocation = () => {
        if (!isGeolocationSupported()) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Detecting your live location...");

        getBestEffortPosition()
            .then(async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const response = await api.get("/location/reverse-geocode", {
                        params: { lat: latitude, lng: longitude },
                    });
                    const loc = {
                        address: response.data.data.address || "Current Location",
                        lat: latitude,
                        lng: longitude,
                        source: "browser",
                    };
                    dispatch(setLocation(loc));
                    setQuery(loc.address);
                    toast.success("Location detected", { id: toastId });
                    if (onLocationSelected) onLocationSelected(loc);
                } catch (error) {
                    console.error("Reverse geocoding failed:", error);
                    const loc = {
                        address: "Current Location",
                        lat: latitude,
                        lng: longitude,
                        source: "browser",
                    };
                    dispatch(setLocation(loc));
                    setQuery(loc.address);
                    toast.success("Location detected", { id: toastId });
                    if (onLocationSelected) onLocationSelected(loc);
                }
            })
            .catch(async (error) => {
                console.error("Geolocation failed:", error);
                const permissionState = await getGeolocationPermissionState();
                toast.error(getGeolocationErrorMessage(error, permissionState), {
                    id: toastId,
                    duration: 6500,
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            <div className="relative group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your delivery location"
                    className="w-full h-14 pl-12 pr-32 rounded-lg border-2 border-gray-100 focus:border-primary focus:outline-none text-secondary text-lg shadow-sm transition-all bg-white"
                />
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-accent group-focus-within:text-primary transition-colors" />
                
                <button
                    onClick={handleCurrentLocation}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary font-semibold hover:bg-orange-50 px-3 py-1.5 rounded-md transition-all active:scale-95"
                >
                    <Navigation size={18} className={loading ? "animate-spin" : ""} />
                    {loading ? "Locating..." : "Locate Me"}
                </button>
            </div>

            <AnimatePresence>
                {suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
                    >
                        {suggestions.map((s, index) => (
                            <div
                                key={s.placeId || index}
                                onClick={() => handleSelect(s)}
                                className="flex items-start gap-4 p-4 hover:bg-orange-50 cursor-pointer transition-colors border-b last:border-b-0 border-gray-50"
                            >
                                <MapPin size={20} className="mt-1 text-accent flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-secondary">{s.formatted}</p>
                                    <p className="text-sm text-accent">{`${s.lat}, ${s.lng}`}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LocationSearch;
