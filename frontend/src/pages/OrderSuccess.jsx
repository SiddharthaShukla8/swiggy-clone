import React, { useEffect } from "react";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const OrderSuccess = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white pb-20">
            <Navbar />
            <div className="max-w-xl mx-auto px-4 flex flex-col items-center justify-center pt-32">
                <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-24 h-24 bg-success rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-100 border-4 border-white"
                >
                    <CheckCircle size={48} className="text-white" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h1 className="text-4xl font-black text-secondary mb-4 tracking-tight">Order Received!</h1>
                    <p className="text-accent font-bold mb-10 leading-relaxed">
                        Your payment was successful and the restaurant has been notified. 
                        Hang tight while they prepare your delicious meal!
                    </p>
                </motion.div>

                {/* Status Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full bg-white rounded-[2rem] border border-gray-100 shadow-xl p-8 mb-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-success" />
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] text-accent font-black uppercase tracking-widest mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-success rounded-full animate-ping" />
                                <span className="text-secondary font-black uppercase text-sm tracking-tighter">Confirmed</span>
                            </div>
                        </div>
                        <Package size={24} className="text-gray-100" strokeWidth={3} />
                    </div>

                    <div className="space-y-4 border-t border-dashed border-gray-100 pt-6">
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-accent">Estimated Delivery</span>
                            <span className="text-secondary font-black">30 - 45 Mins</span>
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <button
                        onClick={() => navigate("/")}
                        className="flex-1 bg-swiggy-orange text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        Keep Discovering
                        <ArrowRight size={18} />
                    </button>
                    <button
                        onClick={() => navigate("/orders")}
                        className="flex-1 bg-secondary text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        <Package size={18} />
                        My Orders
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
