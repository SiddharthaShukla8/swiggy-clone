import React from "react";
import { Star, User, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const ReviewSection = ({ reviews, averageRating, totalReviews }) => {
    return (
        <div className="mt-20 border-t border-gray-100 pt-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                    <h2 className="text-2xl font-black text-secondary mb-2">Ratings & Reviews</h2>
                    <p className="text-accent font-bold uppercase tracking-[0.2em] text-[10px]">What other foodies are saying</p>
                </div>
                
                <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-3xl font-black text-secondary mb-1">
                            {averageRating || "0.0"} <Star size={24} className="text-swiggy-orange" fill="#fc8019" />
                        </div>
                        <p className="text-[10px] text-accent font-black uppercase tracking-widest">{totalReviews || 0} Ratings</p>
                    </div>
                    <div className="w-px h-12 bg-gray-200" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={10} fill={s <= Math.round(averageRating) ? "#fc8019" : "none"} className={s <= Math.round(averageRating) ? "text-swiggy-orange" : "text-gray-300"} />
                                ))}
                            </div>
                            <span className="text-xs font-black text-secondary uppercase">Consensus</span>
                        </div>
                        <p className="text-[10px] text-accent font-medium leading-tight max-w-[120px]">Based on verified verified deliveries</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews && reviews.length > 0 ? (
                    reviews.map((review, index) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={review._id}
                            className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-swiggy-orange group-hover:bg-swiggy-orange group-hover:text-white transition-colors">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-secondary text-sm uppercase tracking-tight">{review.userId?.name || "Verified User"}</h4>
                                        <div className="flex items-center gap-2 text-[10px] text-accent font-bold uppercase tracking-widest">
                                            <Calendar size={12} />
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-success/10 text-success px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-black">
                                    {review.rating} <Star size={12} fill="currentColor" />
                                </div>
                            </div>
                            
                            <p className="text-secondary font-medium leading-relaxed italic relative z-10">
                                "{review.comment}"
                            </p>
                            
                            {/* Decorative Quote Mark */}
                            <div className="absolute -bottom-4 -right-2 text-gray-50 font-black text-8xl select-none opacity-50 pointer-events-none">"</div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                        <div className="text-gray-300 mb-4 scale-150">
                            <Star size={32} />
                        </div>
                        <h4 className="text-secondary font-black uppercase tracking-widest text-sm mb-2">No reviews yet</h4>
                        <p className="text-accent text-[10px] font-bold uppercase tracking-tighter">Be the first one to share your feedback!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewSection;
