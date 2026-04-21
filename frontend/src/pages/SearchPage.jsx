import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Search as SearchIcon, X, Filter, Star, Clock, MapPin, ChevronDown } from "lucide-react";
import api from "../services/api";
import RestaurantCard from "../components/RestaurantCard";
import useDebounce from "../hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { RestaurantSkeleton } from "../components/skeletons/AppSkeletons";

// Premium Local Assets
import biryaniImg from "../assets/images/biryani.png";
import burgerImg from "../assets/images/burger.png";
import pizzaImg from "../assets/images/pizza.png";
import dessertsImg from "../assets/images/desserts.png";
import chineseImg from "../assets/images/chinese.png";
import northIndianImg from "../assets/images/north_indian.png";

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState("relevance");
    const [isVeg, setIsVeg] = useState(false);
    const [minRating, setMinRating] = useState(0);
    
    const { lat, lng } = useSelector((state) => state.location);
    const debouncedQuery = useDebounce(query, 500);

    const fetchResults = async () => {
        if (debouncedQuery.trim().length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const locParams = (lat && lng) ? `&lat=${lat}&lng=${lng}` : '';
            const filterParams = `&veg=${isVeg}&rating=${minRating}&sortBy=${sortBy}`;
            
            const res = await api.get(`/restaurants/search?q=${debouncedQuery}${locParams}${filterParams}`);
            setResults(res.data.data);
            
            // Sync URL
            setSearchParams({ q: debouncedQuery });
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, [debouncedQuery, isVeg, minRating, sortBy, lat, lng]);

    return (
        <div className="min-h-screen bg-white pt-20">
            <Helmet>
                <title>Search for Restaurants & Dishes | Swiggy Clone</title>
                <meta name="description" content="Find the best food near you. Search for cuisines, dishes or your favorite restaurants." />
            </Helmet>
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="max-w-4xl mx-auto relative flex items-center bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm focus-within:border-swiggy-orange transition-colors">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for restaurants and food" 
                        className="w-full bg-transparent outline-none text-lg font-black text-secondary px-4 h-10 placeholder:text-gray-300 placeholder:font-bold"
                        autoFocus
                    />
                    {query ? (
                        <X className="text-accent cursor-pointer mr-4" size={20} onClick={() => setQuery("")} />
                    ) : (
                        <SearchIcon className="text-accent mr-4" size={24} />
                    )}
                </div>

                {/* Filter Bar */}
                <div className="max-w-4xl mx-auto mt-6 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full shadow-sm hover:border-swiggy-orange cursor-pointer transition-all">
                        <Filter size={14} className="text-swiggy-orange" />
                        <span className="text-xs font-black uppercase tracking-widest text-secondary">Filters</span>
                    </div>

                    <button 
                        onClick={() => setIsVeg(!isVeg)}
                        className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${isVeg ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-100 text-accent hover:border-gray-200'}`}
                    >
                        Pure Veg
                    </button>

                    <button 
                        onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
                        className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${minRating === 4 ? 'bg-orange-50 border-orange-200 text-swiggy-orange' : 'bg-white border-gray-100 text-accent hover:border-gray-200'}`}
                    >
                        Ratings 4.0+
                    </button>

                    <div className="relative group ml-auto">
                        <button className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-secondary hover:border-swiggy-orange transition-all">
                            Sort By: <span className="text-swiggy-orange">{sortBy}</span>
                            <ChevronDown size={14} />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                            {['relevance', 'rating', 'deliveryTime', 'distance'].map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => setSortBy(opt)}
                                    className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all ${sortBy === opt ? 'text-swiggy-orange' : 'text-accent'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="mt-12">
                    {loading && results.length === 0 && (
                        <RestaurantSkeleton count={8} />
                    )}
                    
                    {!loading && results.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {results.map((res) => (
                                <RestaurantCard key={res._id} restaurant={res} />
                            ))}
                        </div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-2xl font-black text-secondary italic">No matches found for "{query}"</p>
                            <p className="text-accent font-bold mt-2">Try searching for Pizza, Burger or North Indian</p>
                        </div>
                    )}

                    {query.length < 2 && (
                        <div>
                            <h2 className="text-xl font-black text-secondary mb-8 uppercase tracking-tighter">Popular Cuisines</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {[
                                    { name: "Biryani", img: biryaniImg },
                                    { name: "Burgers", img: burgerImg },
                                    { name: "Pizza", img: pizzaImg },
                                    { name: "Desserts", img: dessertsImg },
                                    { name: "Chinese", img: chineseImg },
                                    { name: "North Indian", img: northIndianImg },
                                ].map((c) => (
                                    <div 
                                        key={c.name} 
                                        onClick={() => setQuery(c.name)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="aspect-square bg-white rounded-3xl p-1 border-2 border-gray-50 shadow-sm group-hover:border-swiggy-orange group-hover:shadow-md transition-all overflow-hidden mb-3">
                                            <img 
                                                src={c.img} 
                                                alt={c.name} 
                                                className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-500" 
                                            />
                                        </div>
                                        <p className="text-center font-black text-secondary group-hover:text-swiggy-orange transition-colors uppercase text-sm tracking-tighter">{c.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
