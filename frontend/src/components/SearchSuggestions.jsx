import { Search, MapPin, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import restaurantFallbackImg from "../assets/images/restaurant_fallback.png";

const SearchSuggestions = ({ results, visible, onSelect, loading }) => {
    if (!visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] max-h-[400px] overflow-y-auto no-scrollbar"
            >
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-4 border-swiggy-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-accent font-bold text-xs uppercase tracking-widest">Searching matches...</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-secondary font-black">No results found</p>
                        <p className="text-accent text-sm font-medium mt-1">Try searching for other items or cuisines</p>
                    </div>
                ) : (
                    <div className="p-2">
                        {results.map((item) => (
                            <div 
                                key={item._id}
                                onClick={() => onSelect(item)}
                                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                            >
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                    <img 
                                        src={item.image || restaurantFallbackImg} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        alt={item.name}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-secondary group-hover:text-swiggy-orange transition-colors truncate">
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-wider">
                                        <span className="flex items-center gap-0.5">
                                            <Star size={10} className="text-swiggy-orange fill-swiggy-orange" />
                                            {item.averageRating || "4.2"}
                                        </span>
                                        <span>•</span>
                                        <span>{item.cuisines?.slice(0, 2).join(", ")}</span>
                                        {item.distance && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-0.5">
                                                    <MapPin size={10} />
                                                    {(item.distance / 1000).toFixed(1)} km
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default SearchSuggestions;
