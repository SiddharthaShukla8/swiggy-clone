import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Search as SearchIcon, X, Filter, ChevronDown } from "lucide-react";
import api from "../services/api";
import RestaurantCard from "../components/RestaurantCard";
import useDebounce from "../hooks/useDebounce";
import { Helmet } from "react-helmet-async";
import { RestaurantSkeleton } from "../components/skeletons/AppSkeletons";
import { getSiteContent } from "../services/siteContent";

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "relevance");
    const [isVeg, setIsVeg] = useState(searchParams.get("veg") === "true");
    const [minRating, setMinRating] = useState(Number(searchParams.get("rating") || 0));
    const [searchContent, setSearchContent] = useState(null);
    const [showFilters, setShowFilters] = useState(true);
    
    const { lat, lng } = useSelector((state) => state.location);
    const debouncedQuery = useDebounce(query, 500);
    const sortOptions = searchContent?.search?.sortOptions || [];
    const popularCuisines = searchContent?.search?.popularCuisines || [];
    const emptyStateSuggestions = searchContent?.search?.emptyStateSuggestions || [];

    useEffect(() => {
        getSiteContent()
            .then((content) => {
                setSearchContent(content);
            })
            .catch((error) => {
                console.error("Failed to load search content", error);
            });
    }, []);

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
            
            const params = {};
            if (debouncedQuery) params.q = debouncedQuery;
            if (sortBy !== "relevance") params.sortBy = sortBy;
            if (isVeg) params.veg = "true";
            if (minRating) params.rating = String(minRating);
            setSearchParams(params);
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
                        placeholder={searchContent?.landing?.hero?.searchPlaceholder || "Search for restaurants and food"} 
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
                    <button
                        onClick={() => setShowFilters((current) => !current)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full shadow-sm hover:border-swiggy-orange cursor-pointer transition-all"
                    >
                        <Filter size={14} className="text-swiggy-orange" />
                        <span className="text-xs font-black uppercase tracking-widest text-secondary">
                            {showFilters ? "Hide Filters" : "Show Filters"}
                        </span>
                    </button>

                    {showFilters && (
                        <>
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
                                    {sortOptions.map(opt => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => setSortBy(opt.id)}
                                            className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all ${sortBy === opt.id ? 'text-swiggy-orange' : 'text-accent'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    {!showFilters && (
                        <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-accent">
                            {`${isVeg ? "Veg" : "All"} • ${minRating ? `${minRating}+ Rating` : "Any Rating"} • ${sortBy}`}
                        </div>
                    )}
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
                            <p className="text-accent font-bold mt-2">
                                {emptyStateSuggestions.length > 0
                                    ? `Try searching for ${emptyStateSuggestions.join(", ")}`
                                    : "Try searching for a popular cuisine"}
                            </p>
                        </div>
                    )}

                    {query.length < 2 && (
                        <div>
                            <h2 className="text-xl font-black text-secondary mb-8 uppercase tracking-tighter">Popular Cuisines</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {popularCuisines.map((c) => (
                                    <div 
                                        key={c.name} 
                                        onClick={() => setQuery(c.name)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="aspect-square bg-white rounded-3xl p-1 border-2 border-gray-50 shadow-sm group-hover:border-swiggy-orange group-hover:shadow-md transition-all overflow-hidden mb-3">
                                            <img 
                                                src={c.imageUrl} 
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
