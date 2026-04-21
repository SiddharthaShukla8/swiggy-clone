import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { fetchNearbyRestaurants } from "../redux/slices/restaurantSlice";
import { motion } from "framer-motion";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Search, MapPin, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { setLocation } from "../redux/slices/locationSlice";
import useDebounce from "../hooks/useDebounce";
import SearchSuggestions from "../components/SearchSuggestions";
import { Helmet } from "react-helmet-async";
import { CategorySkeleton, RestaurantSkeleton } from "../components/skeletons/AppSkeletons";
import {
    LEGACY_FALLBACK_LOCATION,
    getBestEffortPosition,
    getGeolocationErrorMessage,
    getGeolocationPermissionState,
    isGeolocationSupported,
} from "../utils/geolocation";

// Premium Local Assets
import biryaniImg from "../assets/images/biryani.png";
import burgerImg from "../assets/images/burger.png";
import chineseImg from "../assets/images/chinese.png";
import dessertsImg from "../assets/images/desserts.png";
import vegetablesImg from "../assets/images/vegetables.png";
import fruitsImg from "../assets/images/fruits.png";
import dairyImg from "../assets/images/dairy.png";
import staplesImg from "../assets/images/staples.png";
import masalasImg from "../assets/images/masalas.png";
import pizzaImg from "../assets/images/pizza.png";
import northIndianImg from "../assets/images/north_indian.png";
import southIndianImg from "../assets/images/south_indian.png";
import rollsImg from "../assets/images/rolls.png";
import restaurantFallbackImg from "../assets/images/restaurant_fallback.png";
import dineoutPubImg from "../assets/images/dineout_pub.png";
import dineoutFineDineImg from "../assets/images/dineout_fine_dine.png";
import foodHeroImg from "../assets/images/food_hero.png";

const LandingPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { lat, lng, address, source } = useSelector((state) => state.location) || {};
    const { nearbyRestaurants, loading } = useSelector((state) => state.restaurants) || {};
    const [isDetecting, setIsDetecting] = useState(false);
    const lastRequestTime = React.useRef(0);

    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const debouncedQuery = useDebounce(searchQuery, 300);
    const hasLegacyFallbackLocation =
        source === null &&
        address === LEGACY_FALLBACK_LOCATION.address &&
        lat === LEGACY_FALLBACK_LOCATION.lat &&
        lng === LEGACY_FALLBACK_LOCATION.lng;
    const activeAddress = hasLegacyFallbackLocation ? null : address;
    const activeLat = hasLegacyFallbackLocation ? null : lat;
    const activeLng = hasLegacyFallbackLocation ? null : lng;

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.trim().length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }
            setIsSuggesting(true);
            setShowSuggestions(true);
            try {
                const locParams = (activeLat && activeLng) ? `&lat=${activeLat}&lng=${activeLng}` : "";
                const res = await api.get(`/restaurants/search?q=${debouncedQuery}${locParams}`);
                setSuggestions(res.data.data.slice(0, 8));
            } catch (err) {
                console.error("Suggestions failed", err);
            } finally {
                setIsSuggesting(false);
            }
        };
        fetchSuggestions();
    }, [debouncedQuery, activeLat, activeLng]);

    const handleLocationDetection = async () => {
        const now = Date.now();
        // Shield against rapid triggers (throttle to 5 seconds)
        if (isDetecting || (now - lastRequestTime.current < 5000)) {
            console.log("Location detection suppressed to prevent flooding");
            return;
        }
        
        if (!isGeolocationSupported()) {
            toast.error("Geolocation is not supported by your browser", { id: "location-error" });
            return;
        }

        if (!window.isSecureContext) {
            toast.error("Live location works only on localhost or HTTPS.", { id: "location-error" });
            return;
        }

        setIsDetecting(true);
        lastRequestTime.current = now;
        const toastId = toast.loading("Detecting your live location...");

        try {
            const permissionState = await getGeolocationPermissionState();

            if (permissionState === "denied") {
                toast.error(
                    "Location access is blocked in Chrome. Click the site icon near the address bar, allow Location for localhost:5173, then try again.",
                    { id: toastId, duration: 6500 }
                );
                return;
            }

            const position = await getBestEffortPosition();
            const { latitude, longitude } = position.coords;

            let detectedAddress = "Current Location";
            let detectedLabel = "Current Location";

            try {
                const res = await api.get("/location/reverse-geocode", {
                    params: { lat: latitude, lng: longitude },
                });

                if (res.data.success) {
                    detectedAddress = res.data.data.address || detectedAddress;
                    detectedLabel = res.data.data.city || detectedAddress.split(",")[0] || detectedLabel;
                }
            } catch (error) {
                console.error("Reverse geocode failed:", error);
            }

            dispatch(setLocation({
                address: detectedAddress,
                lat: latitude,
                lng: longitude,
                source: "browser",
            }));

            toast.success(`Located: ${detectedLabel}`, { id: toastId });
        } catch (error) {
            const permissionState = await getGeolocationPermissionState();
            toast.error(getGeolocationErrorMessage(error, permissionState), {
                id: toastId,
                duration: 6500,
            });
        } finally {
            setIsDetecting(false);
        }
    };

    // Bulletproof high-fidelity assets using professional local photography
    const foodOptions = [
        { name: "Biryani", img: biryaniImg },
        { name: "North Indian", img: northIndianImg },
        { name: "Pizza", img: pizzaImg },
        { name: "South Indian", img: southIndianImg },
        { name: "Chinese", img: chineseImg },
        { name: "Burger", img: burgerImg },
        { name: "Rolls", img: rollsImg },
        { name: "Desserts", img: dessertsImg }
    ];

    const handleHeroSearch = (e) => {
        if (e.key === 'Enter' && searchQuery) {
            navigate(`/search?q=${searchQuery}`);
        }
    };

    const handleSuggestionSelect = (item) => {
        navigate(`/restaurant/${item._id}`);
    };

    useEffect(() => {
        // Load featured restaurants immediately, and refine by location once coords exist.
        dispatch(fetchNearbyRestaurants(activeLat && activeLng ? { lat: activeLat, lng: activeLng } : {}));
    }, [activeLat, activeLng, dispatch]);


    return (
        <div className="min-h-screen bg-white font-sans pt-20" onClick={() => setShowSuggestions(false)}>
            <Helmet>
                <title>Swiggy Clone | Better food, Delivered fast</title>
                <meta name="description" content="Order your favorite meals from top restaurants, track in real-time and enjoy great discounts!" />
            </Helmet>
            <Navbar />
            
            {/* HERO SECTION - Vivid Swiggy Orange (Image 1 Style) */}
            <div className="bg-swiggy-orange w-full py-16 px-4 md:py-24 overflow-hidden relative">
                <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10 text-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white text-3xl md:text-5xl font-black mb-12 tracking-tight leading-tight"
                    >
                        Deliciousness delivered <br className="hidden md:block" /> right to your doorstep.
                    </motion.h1>

                    {/* Integrated Search Bar as per Image 1 */}
                    <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl p-1 md:p-2 flex flex-col md:flex-row items-center gap-2">
                        <div className="flex-1 flex items-center gap-3 px-4 border-b md:border-b-0 md:border-r border-gray-100 py-3 w-full group cursor-pointer" onClick={handleLocationDetection}>
                            <MapPin className="text-swiggy-orange" size={20} />
                            <div className="flex-1 text-left px-1">
                                <p className="text-[10px] text-accent font-black uppercase tracking-widest leading-none mb-1">Deliver to</p>
                                <p className="w-full bg-transparent outline-none font-bold text-secondary truncate max-w-[200px]">
                                    {isDetecting ? "Detecting your location..." : (activeAddress || "Use current location")}
                                </p>
                            </div>
                            <div className="bg-orange-50 p-1.5 rounded-lg text-swiggy-orange group-hover:bg-swiggy-orange group-hover:text-white transition-colors">
                                <ChevronRight size={16} strokeWidth={3} />
                            </div>
                        </div>
                        <div className="flex-[1.5] flex items-center gap-3 px-4 py-3 w-full" onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for restaurant, item or more" 
                                className="w-full bg-transparent outline-none font-medium text-secondary"
                                onKeyDown={handleHeroSearch}
                                onFocus={() => searchQuery && setShowSuggestions(true)}
                            />
                            <Search className="text-gray-400 cursor-pointer" size={20} onClick={() => navigate(`/search?q=${searchQuery}`)} />
                            
                            <SearchSuggestions 
                                visible={showSuggestions}
                                results={suggestions}
                                loading={isSuggesting}
                                onSelect={handleSuggestionSelect}
                            />
                        </div>
                    </div>

                    {/* Entry Cards (Image 1 - Lower Part) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 w-full max-w-5xl">
                        {/* Food Delivery Card */}
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-[2.5rem] p-8 flex items-center justify-between shadow-lg cursor-pointer group overflow-hidden"
                            onClick={() => navigate("/search")}
                        >
                            <div className="text-left">
                                <h2 className="text-3xl font-black text-secondary leading-tight">FOOD DELIVERY</h2>
                                <p className="text-accent font-bold mt-1">FROM RESTAURANTS</p>
                                <div className="mt-4 bg-orange-50 text-swiggy-orange text-xs font-black px-3 py-1 rounded inline-block">UPTO 60% OFF</div>
                                <motion.div className="mt-8 flex items-center gap-2 text-white bg-swiggy-orange px-6 py-3 rounded-2xl font-black text-sm group-hover:bg-orange-600 transition-colors">
                                    Explore <ArrowRight size={16} />
                                </motion.div>
                            </div>
                            <img src={foodHeroImg} className="w-44 h-44 object-cover rounded-3xl rotate-12 group-hover:rotate-0 transition-transform" />
                        </motion.div>

                        {/* Instamart Card */}
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-[2.5rem] p-8 flex items-center justify-between shadow-lg cursor-pointer group overflow-hidden"
                        >
                            <div className="text-left">
                                <h2 className="text-3xl font-black text-secondary leading-tight uppercase">Instamart</h2>
                                <p className="text-accent font-bold mt-1 uppercase">Instant Grocery</p>
                                <div className="mt-4 bg-orange-50 text-swiggy-orange text-xs font-black px-3 py-1 rounded inline-block">UPTO 60% OFF</div>
                                <motion.div className="mt-8 flex items-center gap-2 text-white bg-swiggy-orange px-6 py-3 rounded-2xl font-black text-sm group-hover:bg-orange-600 transition-colors">
                                    Explore <ArrowRight size={16} />
                                </motion.div>
                            </div>
                            <img src={vegetablesImg} className="w-44 h-44 object-cover rounded-3xl -rotate-12 group-hover:rotate-0 transition-transform" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* CATEGORY CAROUSEL - (Image 2 Style) */}
            <div className="max-w-7xl mx-auto px-4 py-20 pb-12">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">Order our best food options</h2>
                    <div className="flex gap-3">
                        <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ChevronLeft size={20} /></button>
                        <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ChevronRight size={20} /></button>
                    </div>
                </div>
                
                {loading && !nearbyRestaurants?.length ? (
                    <CategorySkeleton />
                ) : (
                    <div className="flex overflow-x-auto gap-12 no-scrollbar pb-8 px-2">
                        {foodOptions.map((opt, i) => (
                            <motion.div 
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                className="flex-shrink-0 cursor-pointer text-center group"
                                onClick={() => navigate(`/search?q=${opt.name}`)}
                            >
                                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all border-4 border-transparent group-hover:border-swiggy-orange">
                                    <img src={opt.img} alt={opt.name} className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0" />
                                </div>
                                <span className="font-bold text-accent group-hover:text-secondary transition-colors">{opt.name}</span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* INSTAMART SECTION - (Image 4/5 Style) */}
            <div className="bg-white border-t border-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight uppercase">Shop groceries on Instamart</h2>
                        <div className="flex gap-3">
                            <button className="p-2 bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
                            <button className="p-2 bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4">
                        {[
                            { name: "Fresh Vegetables", img: vegetablesImg },
                            { name: "Fresh Fruits", img: fruitsImg },
                            { name: "Dairy, Bread and Eggs", img: dairyImg },
                            { name: "Rice, Atta and Dals", img: staplesImg },
                            { name: "Masalas and Dry Fruits", img: masalasImg },
                        ].map((item, i) => (
                            <div key={i} className="flex-shrink-0 w-48 group cursor-pointer text-center">
                                <div className="bg-gray-50 rounded-[2.5rem] p-4 h-56 flex flex-col items-center justify-center border-2 border-transparent group-hover:border-swiggy-orange group-hover:bg-white transition-all shadow-sm group-hover:shadow-md mb-3 overflow-hidden">
                                    <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="font-black text-sm text-secondary leading-tight tracking-tight px-2 uppercase">{item.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RESTAURANT LISTING (Fallback always shown now) */}
            <div className="max-w-7xl mx-auto px-4 py-20 pb-32">
                <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight mb-10">
                    {activeAddress ? `Top restaurants in ${activeAddress.split(',')[0]}` : "Featured Restaurant Chains"}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {loading && !nearbyRestaurants?.length ? (
                        <RestaurantSkeleton count={8} />
                    ) : nearbyRestaurants && nearbyRestaurants.length > 0 ? (
                        nearbyRestaurants.map((res) => (
                            <div key={res._id} className="cursor-pointer group" onClick={() => navigate(`/restaurant/${res._id}`)}>
                                <div className="relative overflow-hidden rounded-3xl mb-4 aspect-[4/3] shadow-sm group-hover:shadow-xl transition-all">
                                    <img src={res.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-5">
                                        <p className="text-white font-black text-xl leading-none">60% OFF</p>
                                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1">UPTO ₹120</p>
                                    </div>
                                </div>
                                <h3 className="font-black text-lg text-secondary">{res.name}</h3>
                                <div className="flex items-center gap-1 mt-1 text-secondary font-black text-sm">
                                    <span>{res.averageRating || 4.2}</span>
                                    <span>•</span>
                                    <span>{res.deliveryTime} mins</span>
                                </div>
                                <p className="text-accent text-sm font-medium mt-1 truncate">{res.cuisines?.join(", ")}</p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                            <MapPin className="mx-auto text-gray-200 mb-4" size={48} />
                            <p className="text-2xl font-black text-secondary uppercase tracking-tight">No restaurants found</p>
                            <p className="text-accent font-bold mt-2">Try searching for a different location or adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>
            {/* DINEOUT SECTION - (Image 5 Style) */}
            <div className="bg-white border-t border-gray-100 py-20 pb-40">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">Discover best restaurants on Dineout</h2>
                        <div className="flex gap-3">
                            <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ChevronLeft size={20} /></button>
                            <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div className="flex overflow-x-auto gap-8 no-scrollbar scroll-smooth">
                        {[
                            { name: "The Bier Library", img: dineoutPubImg, discount: "Up to 50% OFF" },
                            { name: "Toit Brewpub", img: dineoutFineDineImg, discount: "Up to 25% OFF" },
                            { name: "Windmills Craftworks", img: dineoutPubImg, discount: "Up to 30% OFF" },
                            { name: "Bricklane", img: dineoutFineDineImg, discount: "Flat 15% OFF" }
                        ].map((item, i) => (
                            <div key={i} className="flex-shrink-0 w-80 group cursor-pointer relative">
                                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-sm group-hover:shadow-xl transition-all relative">
                                    <img src={item.img} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                                        <p className="text-white font-black text-xl leading-tight">{item.name}</p>
                                        <p className="text-swiggy-orange font-black text-sm uppercase tracking-widest mt-1">{item.discount}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
