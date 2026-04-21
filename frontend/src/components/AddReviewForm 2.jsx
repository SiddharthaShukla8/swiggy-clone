import React, { useState } from "react";
import { Star, X, MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { submitReview } from "../redux/slices/reviewSlice";
import toast from "react-hot-toast";

const AddReviewForm = ({ order, isOpen, onClose, onReviewSuccess }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [hover, setHover] = useState(0);
    const dispatch = useDispatch();
    const { submitting } = useSelector((state) => state.reviews);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating < 1) return toast.error("Please select a rating");
        
        try {
            await dispatch(submitReview({
                orderId: order._id,
                rating,
                comment,
                restaurantId: order.restaurantId
            })).unwrap();
            
            toast.success("Review submitted! Thank you for your feedback.");
            if (onReviewSuccess) onReviewSuccess();
            onClose();
        } catch (err) {
            toast.error(err || "Failed to submit review");
        }
    };

    if (!order) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-secondary/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-60 overflow-hidden"
                    >
                        <div className="bg-swiggy-orange p-8 text-white relative">
                            <button 
                                onClick={onClose}
                                className="absolute right-6 top-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-1">Rate your order</h3>
                            <p className="text-white/80 text-xs font-black uppercase tracking-widest">Order from {order.restaurantName || "Restaurant"}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* Star Selector */}
                            <div className="text-center">
                                <p className="text-accent font-black uppercase tracking-widest text-[10px] mb-4">Select Rating</p>
                                <div className="flex justify-center gap-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHover(star)}
                                            onMouseLeave={() => setHover(0)}
                                            className="transition-transform active:scale-95"
                                        >
                                            <Star 
                                                size={40} 
                                                fill={(hover || rating) >= star ? "#fc8019" : "none"}
                                                className={(hover || rating) >= star ? "text-swiggy-orange" : "text-gray-200"}
                                                strokeWidth={1.5}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-4 text-secondary font-black text-sm uppercase tracking-tight">
                                    {rating === 1 && "Terrible 😞"}
                                    {rating === 2 && "Bad 🙁"}
                                    {rating === 3 && "Average 😐"}
                                    {rating === 4 && "Good 🙂"}
                                    {rating === 5 && "Excellent! 😍"}
                                </p>
                            </div>

                            {/* Comment Field */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-accent font-black uppercase tracking-widest text-[10px]">
                                    <MessageSquare size={14} />
                                    <span>Share your experience (Optional)</span>
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Tell us what you liked or what could be better..."
                                    className="w-full h-32 bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 focus:border-swiggy-orange outline-none transition-colors font-medium text-secondary resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-swiggy-orange text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Submit Review <Send size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddReviewForm;
