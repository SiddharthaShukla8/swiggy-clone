import React from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import restaurantFallbackImg from "../assets/images/restaurant_fallback.png";

const RestaurantCard = ({ restaurant }) => {
    const navigate = useNavigate();
    
    if (!restaurant) return null;

    const { 
        _id,
        name, 
        cuisines = [], 
        averageRating, 
        deliveryTime, 
        image 
    } = restaurant;

    return (
        <motion.div
            whileHover={{ scale: 0.95 }}
            onClick={() => _id && navigate(`/restaurant/${_id}`)}
            className="flex flex-col gap-3 cursor-pointer group"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] w-full rounded-[1.5rem] overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-300">
                <img
                    src={image || restaurantFallbackImg}
                    alt={name || "Restaurant"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Offer Badge Overlay - High fidelity */}
                <div className="absolute top-4 left-4 bg-gradient-to-r from-swiggy-orange to-primary text-white text-[11px] font-black px-3 py-1.5 rounded-lg shadow-xl uppercase tracking-tighter">
                    {Math.random() > 0.5 ? "BOGO 1+1" : "60% OFF UPTO ₹120"}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-white font-black text-xs uppercase tracking-[0.25em]">Explore Menu</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-0.5 mt-1">
                <h3 className="font-black text-[1.2rem] leading-tight text-secondary line-clamp-1 group-hover:text-swiggy-orange transition-colors tracking-tight">
                    {name || "Unnamed Restaurant"}
                </h3>
                
                <div className="flex items-center gap-2.5 font-black text-secondary text-[13px]">
                    <div className="flex items-center gap-1 bg-success text-white px-1.5 py-0.5 rounded-md text-[10px]">
                        <Star size={10} fill="white" strokeWidth={3} />
                        <span>{averageRating || "4.2"}</span>
                    </div>
                    <span className="text-secondary uppercase tracking-tighter flex items-center gap-1">
                        {deliveryTime || "25"} MINS
                    </span>
                    {restaurant.distance && (
                        <>
                            <span className="text-accent/30">•</span>
                            <span className="text-accent uppercase tracking-tighter">
                                {(restaurant.distance / 1000).toFixed(1)} KM
                            </span>
                        </>
                    )}
                </div>

                <p className="text-accent text-sm font-bold line-clamp-1 mt-0.5 opacity-80">
                    {cuisines?.length > 0 ? cuisines.join(", ") : "Multi-cuisine"}
                </p>
            </div>
        </motion.div>
    );
};

export default RestaurantCard;
