import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trash2, X } from "lucide-react";
import { resetConflict, clearCartLocal, addToCart } from "../redux/slices/cartSlice";
import toast from "react-hot-toast";

const CartConflictModal = () => {
    const dispatch = useDispatch();
    const { conflict } = useSelector((state) => state.cart) || {};

    if (!conflict?.show) return null;

    const handleClearAndAdd = async () => {
        const itemPromise = dispatch(clearCartLocal());
        toast.promise(itemPromise, {
            loading: "Clearing existing cart...",
            success: "Cart cleared!",
            error: "Failed to clear cart"
        });

        if (conflict.pendingItem) {
            dispatch(addToCart(conflict.pendingItem));
        }
        dispatch(resetConflict());
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-secondary/60 backdrop-blur-md"
                    onClick={() => dispatch(resetConflict())}
                />
                
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative z-10 overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-swiggy-orange" />
                    
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle size={40} className="text-swiggy-orange" />
                        </div>
                        
                        <h2 className="text-2xl font-black text-secondary leading-tight mb-4 uppercase tracking-tight">
                            Replace cart items?
                        </h2>
                        
                        <p className="text-accent font-bold leading-relaxed mb-8">
                            Your cart contains items from another restaurant. Start a new cart with this item?
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button
                                onClick={() => dispatch(resetConflict())}
                                className="py-4 rounded-2xl font-black text-secondary border-2 border-gray-100 hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs"
                            >
                                No, Keep Existing
                            </button>
                            
                            <button
                                onClick={handleClearAndAdd}
                                className="py-4 rounded-2xl font-black text-white bg-swiggy-orange shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                            >
                                <Trash2 size={16} />
                                Start Fresh
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={() => dispatch(resetConflict())}
                        className="absolute top-6 right-6 text-accent hover:text-secondary transition-colors"
                    >
                        <X size={24} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CartConflictModal;
