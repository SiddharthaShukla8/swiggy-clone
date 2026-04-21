import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { fetchNearbyRestaurants } from "../redux/slices/restaurantSlice";
import { motion } from "framer-motion";
import "react-loading-skeleton/dist/skeleton.css";
import { Search, MapPin, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { setLocation } from "../redux/slices/locationSlice";
import useDebounce from "../hooks/useDebounce";
import SearchSuggestions from "../components/SearchSuggestions";
import { Helmet } from "react-helmet-async";
import { CategorySkeleton, RestaurantSkeleton } from "../components/skeletons/AppSkeletons";
import api from "../services/api";
import { detectCurrentLocation } from "../services/locationService";
import { getSiteContent } from "../services/siteContent";
import { getRestaurantBadge } from "../utils/restaurantPresentation";

const LandingPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { lat, lng, address, precision } = useSelector((state) => state.location) || {};
    const { nearbyRestaurants, loading } = useSelector((state) => state.restaurants) || {};
    const [isDetecting, setIsDetecting] = useState(false);
    const [siteContent, setSiteContent] = useState(null);
    const [contentLoading, setContentLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const debouncedQuery = useDebounce(searchQuery, 300);
    const featuredCategoriesRef = useRef(null);
    const curatedCollectionsRef = useRef(null);
    const spotlightRef = useRef(null);

    const hero = siteContent?.landing?.hero;
    const primaryCards = hero?.primaryCards || [];
    const featuredCategoriesSection = siteContent?.landing?.featuredCategoriesSection;
    const curatedCollectionsSection = siteContent?.landing?.curatedCollectionsSection;
    const spotlightSection = siteContent?.landing?.spotlightSection;

    useEffect(() => {
        getSiteContent()
            .then((content) => {
                setSiteContent(content);
            })
            .catch((error) => {
                console.error("Failed to load site content", error);
                toast.error("We could not load the latest homepage content.");
            })
            .finally(() => {
                setContentLoading(false);
            });
    }, []);

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
                const locParams = (lat && lng) ? `&lat=${lat}&lng=${lng}` : "";
                const res = await api.get(`/restaurants/search?q=${debouncedQuery}${locParams}`);
                setSuggestions(res.data.data.slice(0, 8));
            } catch (err) {
                console.error("Suggestions failed", err);
            } finally {
                setIsSuggesting(false);
            }
        };
        fetchSuggestions();
    }, [debouncedQuery, lat, lng]);

    const scrollCarousel = (carouselRef, direction) => {
        if (!carouselRef.current) {
            return;
        }

        carouselRef.current.scrollBy({
            left: direction === "left" ? -320 : 320,
            behavior: "smooth",
        });
    };

    const handleLocationDetection = async () => {
        if (isDetecting) {
            return;
        }

        setIsDetecting(true);
        const toastId = toast.loading("Detecting your location...");

        try {
            const detectedLocation = await detectCurrentLocation();
            dispatch(setLocation(detectedLocation));
            toast.success(detectedLocation.message, { id: toastId, duration: 5000 });
        } catch (error) {
            toast.error(error.message || "We could not detect your location right now.", {
                id: toastId,
                duration: 6500,
            });
        } finally {
            setIsDetecting(false);
        }
    };

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
        dispatch(fetchNearbyRestaurants(lat && lng ? { lat, lng } : {}));
    }, [lat, lng, dispatch]);


    return (
        <div className="min-h-screen bg-white font-sans pt-20" onClick={() => setShowSuggestions(false)}>
            <Helmet>
                <title>Swiggy Clone | Better food, Delivered fast</title>
                <meta name="description" content="Order your favorite meals from top restaurants, track in real-time and enjoy great discounts!" />
            </Helmet>
            <Navbar />
            
            <div className="bg-swiggy-orange w-full py-16 px-4 md:py-24 overflow-hidden relative">
                <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10 text-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white text-3xl md:text-5xl font-black mb-12 tracking-tight leading-tight"
                    >
                        {hero?.title || "Deliciousness delivered right to your doorstep."}
                    </motion.h1>

                    <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl p-1 md:p-2 flex flex-col md:flex-row items-center gap-2">
                        <div className="flex-1 flex items-center gap-3 px-4 border-b md:border-b-0 md:border-r border-gray-100 py-3 w-full group cursor-pointer" onClick={handleLocationDetection}>
                            <MapPin className="text-swiggy-orange" size={20} />
                            <div className="flex-1 text-left px-1">
                                <p className="text-[10px] text-accent font-black uppercase tracking-widest leading-none mb-1">Deliver to</p>
                                <p className="w-full bg-transparent outline-none font-bold text-secondary truncate max-w-[200px]">
                                    {isDetecting ? "Detecting your location..." : (address || "Use current location")}
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
                                placeholder={hero?.searchPlaceholder || "Search for restaurant, item or more"} 
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 w-full max-w-5xl">
                        {primaryCards.map((card, index) => (
                            <motion.div 
                                key={card.id}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white rounded-[2.5rem] p-8 flex items-center justify-between shadow-lg cursor-pointer group overflow-hidden"
                                onClick={() => navigate(card.href)}
                            >
                                <div className="text-left">
                                    <h2 className="text-3xl font-black text-secondary leading-tight uppercase">{card.title}</h2>
                                    <p className="text-accent font-bold mt-1 uppercase">{card.subtitle}</p>
                                    <div className="mt-4 bg-orange-50 text-swiggy-orange text-xs font-black px-3 py-1 rounded inline-block">{card.badge}</div>
                                    <motion.div className="mt-8 flex items-center gap-2 text-white bg-swiggy-orange px-6 py-3 rounded-2xl font-black text-sm group-hover:bg-orange-600 transition-colors">
                                        {card.actionLabel} <ArrowRight size={16} />
                                    </motion.div>
                                </div>
                                <img src={card.imageUrl} className={`w-44 h-44 object-cover rounded-3xl ${index % 2 === 0 ? "rotate-12" : "-rotate-12"} group-hover:rotate-0 transition-transform`} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-20 pb-12">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">
                        {featuredCategoriesSection?.title || "Order our best food options"}
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => scrollCarousel(featuredCategoriesRef, "left")} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ChevronLeft size={20} /></button>
                        <button onClick={() => scrollCarousel(featuredCategoriesRef, "right")} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ChevronRight size={20} /></button>
                    </div>
                </div>
                
                {contentLoading ? (
                    <CategorySkeleton />
                ) : (
                    <div ref={featuredCategoriesRef} className="flex overflow-x-auto gap-12 no-scrollbar pb-8 px-2">
                        {(featuredCategoriesSection?.items || []).map((opt) => (
                            <motion.div 
                                key={opt.id}
                                whileHover={{ scale: 1.05 }}
                                className="flex-shrink-0 cursor-pointer text-center group"
                                onClick={() => navigate(opt.href)}
                            >
                                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all border-4 border-transparent group-hover:border-swiggy-orange">
                                    <img src={opt.imageUrl} alt={opt.name} className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0" />
                                </div>
                                <span className="font-bold text-accent group-hover:text-secondary transition-colors">{opt.name}</span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white border-t border-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight uppercase">
                            {curatedCollectionsSection?.title || "Browse trending cuisines"}
                        </h2>
                        <div className="flex gap-3">
                            <button onClick={() => scrollCarousel(curatedCollectionsRef, "left")} className="p-2 bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
                            <button onClick={() => scrollCarousel(curatedCollectionsRef, "right")} className="p-2 bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div ref={curatedCollectionsRef} className="flex overflow-x-auto gap-6 no-scrollbar pb-4">
                        {(curatedCollectionsSection?.items || []).map((item) => (
                            <div key={item.id} className="flex-shrink-0 w-48 group cursor-pointer text-center" onClick={() => navigate(item.href)}>
                                <div className="bg-gray-50 rounded-[2.5rem] p-4 h-56 flex flex-col items-center justify-center border-2 border-transparent group-hover:border-swiggy-orange group-hover:bg-white transition-all shadow-sm group-hover:shadow-md mb-3 overflow-hidden">
                                    <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
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
                    {address ? `Top restaurants in ${address.split(',')[0]}${precision === "approximate" ? " (approx.)" : ""}` : "Featured Restaurant Chains"}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {loading && !nearbyRestaurants?.length ? (
                        <RestaurantSkeleton count={8} />
                    ) : nearbyRestaurants && nearbyRestaurants.length > 0 ? (
                        nearbyRestaurants.map((res) => {
                            const badge = getRestaurantBadge(res);
                            const badgeAccent = badge.accent === "veg"
                                ? "from-green-500 to-emerald-500"
                                : "from-swiggy-orange to-primary";

                            return (
                            <div key={res._id} className="cursor-pointer group" onClick={() => navigate(`/restaurant/${res._id}`)}>
                                <div className="relative overflow-hidden rounded-3xl mb-4 aspect-[4/3] shadow-sm group-hover:shadow-xl transition-all">
                                    <img src={res.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-5">
                                        <div className={`inline-flex w-fit items-center rounded-xl bg-gradient-to-r ${badgeAccent} px-3 py-2 shadow-lg`}>
                                            <div>
                                                <p className="text-white font-black text-lg leading-none uppercase">{badge.title}</p>
                                                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1">{badge.subtitle}</p>
                                            </div>
                                        </div>
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
                        )})
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
                        <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">
                            {spotlightSection?.title || "Discover top restaurants"}
                        </h2>
                        <div className="flex gap-3">
                            <button onClick={() => scrollCarousel(spotlightRef, "left")} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ChevronLeft size={20} /></button>
                            <button onClick={() => scrollCarousel(spotlightRef, "right")} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div ref={spotlightRef} className="flex overflow-x-auto gap-8 no-scrollbar scroll-smooth">
                        {(spotlightSection?.items || []).map((item) => (
                            <div key={item.id} className="flex-shrink-0 w-80 group cursor-pointer relative" onClick={() => navigate(item.href)}>
                                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-sm group-hover:shadow-xl transition-all relative">
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                                        <p className="text-white font-black text-xl leading-tight">{item.name}</p>
                                        <p className="text-swiggy-orange font-black text-sm uppercase tracking-widest mt-1">{item.badge}</p>
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
