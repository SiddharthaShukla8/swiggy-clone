import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { clearCartLocal } from "../redux/slices/cartSlice";
import { MapPin, CreditCard, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const CheckoutPage = () => {
    const { cart, totals, appliedCoupon } = useSelector((state) => state.cart);
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    // Guard: Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            toast.error("Please login to proceed to checkout");
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    // Guard: Redirect to cart if empty
    useEffect(() => {
        if (isAuthenticated && (!cart?.items || cart.items.length === 0)) {
            navigate("/cart");
        }
    }, [cart, isAuthenticated, navigate]);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (loading) return; // Safeguard 2 (Idempotency)
        
        setLoading(true);
        const res = await loadRazorpay();

        if (!res) {
            toast.error("Razorpay SDK failed to load. Check your connection.");
            setLoading(false);
            return;
        }

        try {
            // 1. Initiate Checkout on Backend (Source of Truth)
            const checkoutRes = await api.post("/orders/checkout", {
                couponCode: appliedCoupon?.code
            });
            const { razorpayOrderId, amount, currency } = checkoutRes.data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Sb2qWVxlircSdx",
                amount, // already in paise from backend
                currency,
                name: "Swiggy 2.0",
                description: "Secure Order Payment",
                image: "https://media.dotpe.in/v1/media/e8982775-d5de-43ff-8327-d4f41edb27d4/razorpay.png",
                order_id: razorpayOrderId,
                handler: async (response) => {
                    try {
                        const verifyRes = await api.post("/orders/verify", {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            deliveryAddress: {
                                address: user?.location?.address || "Default Address",
                                lat: user?.location?.coordinates[1] || 0,
                                lng: user?.location?.coordinates[0] || 0,
                            },
                        });

                        if (verifyRes.data.success) {
                            dispatch(clearCartLocal());
                            navigate("/order-success");
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.message || "Payment verification failed!");
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone,
                },
                theme: {
                    color: "#ff5200",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to initiate checkout");
            setLoading(false);
        }
    };

    if (!user || !cart?.items || cart.items.length === 0) return null;

    return (
        <div className="min-h-screen bg-[#f1f1f6] pt-24 pb-32">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-8 mt-4">
                    
                    {/* LEFT SIDE: FLOW (Selection) */}
                    <div className="flex-grow space-y-6">
                        {/* 1. Account Selection */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm flex items-start gap-6 border-l-4 border-swiggy-orange">
                            <div className="bg-secondary text-white p-2 rounded-lg">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-secondary uppercase tracking-tight">Account Check</h2>
                                <p className="text-accent font-bold mt-1">Logged in as <span className="text-secondary font-black">{user.name}</span></p>
                            </div>
                        </div>

                        {/* 2. Delivery Address */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border-l-4 border-swiggy-orange">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="bg-secondary text-white p-2 rounded-lg">
                                    <MapPin size={20} />
                                </div>
                                <h2 className="text-xl font-black text-secondary uppercase tracking-tight">Delivery Address</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border-2 border-swiggy-orange bg-orange-50/30 p-5 rounded-2xl relative">
                                    <div className="absolute top-4 right-4 bg-swiggy-orange text-white text-[10px] font-black px-2 py-1 rounded-md">HOME</div>
                                    <p className="font-black text-secondary">{user.name}</p>
                                    <p className="text-accent text-sm font-bold mt-2 leading-relaxed">
                                        {user.location?.address || "No address saved. Please update in profile."}
                                    </p>
                                    <button className="text-swiggy-orange font-black text-xs uppercase mt-6 tracking-widest border-b-2 border-swiggy-orange/20 hover:border-swiggy-orange transition-all">Deliver Here</button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Payment Selection */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border-l-4 border-gray-200 opacity-60">
                            <h2 className="text-xl font-black text-secondary uppercase tracking-tight mb-2">Payment</h2>
                            <p className="text-accent font-bold text-sm">Select payment mode after verifying address</p>
                        </div>
                    </div>

                    {/* RIGHT SIDE: BILL SUMMARY */}
                    <div className="lg:w-[400px] flex-shrink-0">
                        <div className="bg-white p-8 rounded-2xl shadow-md space-y-6 sticky top-28 border border-gray-100">
                            <h2 className="text-xl font-black text-secondary border-b pb-4">Bill Details</h2>
                            
                            <div className="space-y-4 text-sm font-bold text-accent">
                                <div className="flex justify-between items-center">
                                    <span>Item Total</span>
                                    <span className="text-secondary">₹{totals.itemTotal}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Delivery Fee</span>
                                    <span className="text-secondary">₹{totals.deliveryFee}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Platform Fee</span>
                                    <span className="text-secondary">₹{totals.platformFee}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Taxes & GST (5%)</span>
                                    <span className="text-secondary">₹{totals.gst}</span>
                                </div>
                                
                                {totals.discountAmount > 0 && (
                                    <div className="flex justify-between items-center text-success bg-green-50 p-2 rounded-lg">
                                        <span className="flex items-center gap-1 font-black uppercase text-[10px]">Coupon Discount</span>
                                        <span className="font-black">-₹{totals.discountAmount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center border-t border-dashed pt-4">
                                    <span className="text-secondary font-black">TO PAY</span>
                                    <span className="text-swiggy-orange font-black text-lg font-heading">₹{totals.totalToPay}</span>
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full bg-swiggy-orange text-white py-4 rounded-xl font-black text-[15px] shadow-xl hover:shadow-orange-200 transition-all disabled:grayscale disabled:opacity-50 mt-4 leading-none relative overflow-hidden"
                            >
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <motion.span 
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center justify-center gap-2"
                                        >
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            SECURELY PROCESSING...
                                        </motion.span>
                                    ) : (
                                        <motion.span
                                            key="idle"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            PAY & PLACE ORDER
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                            
                            <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl mt-6">
                                <ShieldCheck className="text-success" size={20} />
                                <p className="text-[10px] text-accent font-bold uppercase leading-tight tracking-tighter">Safe and secure payments. 100% Authentic products.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex flex-col items-center justify-center text-white"
                    >
                        <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-xs text-center">
                            <div className="w-16 h-16 border-4 border-swiggy-orange border-t-transparent rounded-full animate-spin" />
                            <div>
                                <h3 className="text-secondary font-black text-xl mb-2">Processing Payment</h3>
                                <p className="text-accent font-bold text-sm">Please do not refresh or close this window.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CheckoutPage;
