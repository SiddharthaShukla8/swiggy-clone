import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getCart, updateCartQuantity, removeFromCart } from "../redux/slices/cartSlice";
import Navbar from "../components/Navbar";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Search, MapPin, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { applyCoupon, removeCoupon } from "../redux/slices/cartSlice";
import toast from "react-hot-toast";
import { Tag, Ticket } from "lucide-react";

// Premium Local Assets
import restaurantFallbackImg from "../assets/images/restaurant_fallback.png";
import { getFoodItemImage } from "../utils/restaurantImages";

const CartPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { cart, totals, appliedCoupon, loading } = useSelector((state) => state.cart);
    const [couponCode, setCouponCode] = React.useState("");
    const [isApplying, setIsApplying] = React.useState(false);

    useEffect(() => {
        dispatch(getCart());
    }, [dispatch]);

    const handleUpdateQuantity = (foodItemId, newQty) => {
        if (newQty < 1) {
            dispatch(removeFromCart(foodItemId));
        } else {
            dispatch(updateCartQuantity({ foodItemId, quantity: newQty }));
        }
    };

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode.trim()) return;
        
        setIsApplying(true);
        try {
            const result = await dispatch(applyCoupon({ 
                code: couponCode, 
                cartTotal: totals.itemTotal 
            })).unwrap();
            toast.success(`Coupon "${result.code}" applied! Save ₹${result.discountAmount}`);
        } catch (err) {
            toast.error(err || "Failed to apply coupon");
        } finally {
            setIsApplying(false);
        }
    };

    if (loading && !cart) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex flex-col items-center justify-center pt-40 px-4">
                    <div className="w-12 h-12 border-4 border-swiggy-orange border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-accent font-black uppercase tracking-widest text-[10px]">Rehydrating your cart...</p>
                </div>
            </div>
        );
    }

    if (!cart?.items || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex flex-col items-center justify-center pt-40 px-4">
                    <div className="w-48 h-48 bg-orange-50 rounded-full flex items-center justify-center mb-8 border-4 border-orange-100">
                        <ShoppingBag size={80} className="text-swiggy-orange opacity-40" />
                    </div>
                    <h2 className="text-2xl font-black text-secondary mb-2 tracking-tight uppercase">Your cart is empty</h2>
                    <p className="text-accent font-bold mb-8">Good food is always just a few clicks away!</p>
                    <button 
                        onClick={() => navigate("/")}
                        className="bg-swiggy-orange text-white px-10 py-4 rounded-xl font-black text-sm hover:shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                    >
                        SEE RESTAURANTS NEAR YOU
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f1f1f6] pt-24 pb-20">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Item List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h1 className="text-xl font-black text-secondary mb-8 flex items-center gap-3 uppercase tracking-tighter">
                            <ShoppingBag className="text-swiggy-orange" />
                            Your Selection
                        </h1>
                        
                        <div className="space-y-8">
                            <AnimatePresence>
                                {cart.items.filter(item => item && item.foodItemId).map((item, index) => (
                                    <motion.div 
                                        key={item.foodItemId?._id || `${cart?._id || "cart"}-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex items-center gap-6 py-6 border-b last:border-b-0 border-gray-100 group"
                                    >
                                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                                            <img 
                                                src={getFoodItemImage(item.foodItemId)} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                alt={item.foodItemId?.name}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-3 h-3 border-2 ${item.foodItemId?.isVeg ? 'border-success' : 'border-red-500'} flex items-center justify-center rounded-sm`}>
                                                    <div className={`w-1 h-1 rounded-full ${item.foodItemId?.isVeg ? 'bg-success' : 'bg-red-500'}`} />
                                                </div>
                                                <h3 className="font-black text-secondary text-lg group-hover:text-swiggy-orange transition-colors">{item.foodItemId?.name || "Food Item"}</h3>
                                            </div>
                                            <p className="text-secondary font-heading font-black">₹{item.foodItemId?.price || 0}</p>
                                        </div>

                                        <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
                                            <button 
                                                onClick={() => handleUpdateQuantity(item.foodItemId?._id, item.quantity - 1)}
                                                className="w-8 h-8 flex items-center justify-center hover:text-swiggy-orange transition-colors"
                                            >
                                                <Minus size={16} strokeWidth={3} />
                                            </button>
                                            <span className="font-black text-swiggy-orange w-4 text-center text-sm">{item.quantity}</span>
                                            <button 
                                                onClick={() => handleUpdateQuantity(item.foodItemId?._id, item.quantity + 1)}
                                                className="w-8 h-8 flex items-center justify-center hover:text-swiggy-orange transition-colors"
                                            >
                                                <Plus size={16} strokeWidth={3} />
                                            </button>
                                        </div>

                                        <div className="text-right min-w-[100px]">
                                            <p className="font-black text-secondary text-lg font-heading">₹{(item.foodItemId?.price || 0) * item.quantity}</p>
                                        </div>

                                        <button 
                                            onClick={() => dispatch(removeFromCart(item.foodItemId?._id))}
                                            className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right: Summary */}
                <div className="space-y-4">
                    {/* Coupon Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-black text-secondary mb-4 flex items-center gap-2 uppercase tracking-tight">
                            <Ticket className="text-swiggy-orange" size={20} />
                            Offers & Benefits
                        </h2>
                        
                        {!appliedCoupon ? (
                            <form onSubmit={handleApplyCoupon} className="relative group">
                                <input 
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="ENTER COUPON CODE"
                                    className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3.5 font-black text-secondary focus:border-swiggy-orange focus:bg-white outline-none transition-all placeholder:text-gray-300 text-sm uppercase"
                                />
                                <button 
                                    type="submit"
                                    disabled={isApplying || !couponCode}
                                    className="absolute right-2 top-2 bottom-2 bg-secondary text-white px-4 rounded-lg font-black text-[10px] hover:bg-swiggy-orange disabled:opacity-50 transition-all uppercase tracking-widest"
                                >
                                    {isApplying ? "..." : "Apply"}
                                </button>
                            </form>
                        ) : (
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-swiggy-orange shadow-sm">
                                        <Tag size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-secondary uppercase tracking-tight">"{appliedCoupon.code}" APPLIED</p>
                                        <p className="text-[10px] text-accent font-bold uppercase">{appliedCoupon.description}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => dispatch(removeCoupon())}
                                    className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-28 border border-gray-100">
                        <h2 className="text-xl font-bold text-secondary mb-6">Bill Details</h2>
                        <div className="space-y-4 text-sm font-medium">
                            <div className="flex justify-between text-accent">
                                <span>Item Total</span>
                                <span>₹{totals.itemTotal}</span>
                            </div>
                            <div className="flex justify-between text-accent">
                                <span>Delivery Fee</span>
                                <span>₹{totals.deliveryFee}</span>
                            </div>
                            <div className="flex justify-between text-accent">
                                <span>Platform Fee</span>
                                <span>₹{totals.platformFee}</span>
                            </div>
                            <div className="flex justify-between text-accent">
                                <span>Taxes & GST (5%)</span>
                                <span>₹{totals.gst}</span>
                            </div>
                            
                            {totals.discountAmount > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-between text-success font-black bg-green-50/50 p-2 rounded-lg"
                                >
                                    <span className="flex items-center gap-1"><Tag size={14} /> Coupon Savings</span>
                                    <span>-₹{totals.discountAmount}</span>
                                </motion.div>
                            )}

                            <hr className="border-gray-100" />
                            <div className="flex justify-between text-lg font-bold text-secondary">
                                <span>TO PAY</span>
                                <span>₹{totals.totalToPay}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => navigate("/checkout")}
                            className="w-full mt-8 bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all hover:shadow-lg active:scale-[0.98]"
                        >
                            PROCEED TO CHECKOUT
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
