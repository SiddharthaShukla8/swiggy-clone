import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { addToCart, setConflict } from "../redux/slices/cartSlice";
import { Star, Clock, Info, Plus, ChevronLeft, Search as SearchIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { fetchRestaurantReviews } from "../redux/slices/reviewSlice";
import ReviewSection from "../components/ReviewSection";
import { getFoodItemImage } from "../utils/restaurantImages";

const RestaurantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const { reviews, loading: reviewsLoading } = useSelector((state) => state.reviews);

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                const res = await api.get(`/restaurants/${id}`);
                const { restaurant: resData, menu: menuData } = res.data.data;
                setRestaurant(resData);
                setMenu(menuData || []);
            } catch (err) {
                toast.error("Failed to load restaurant details");
                navigate("/");
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurant();
        dispatch(fetchRestaurantReviews(id));
    }, [id, navigate, dispatch]);

    const { cart } = useSelector((state) => state.cart);
    const { isAuthenticated } = useSelector((state) => state.auth);

    const handleAddToCart = async (item) => {
        if (!isAuthenticated) {
            toast.error("Please sign in to add items to cart");
            return navigate("/login");
        }

        // Check for restaurant conflict (Swiggy logic)
        if (cart && cart.restaurantId && cart.restaurantId !== id) {
            dispatch(setConflict({ 
                restaurantId: id, 
                foodItemId: item._id, 
                quantity: 1 
            }));
            return;
        }

        try {
            await dispatch(addToCart({ 
                restaurantId: id, 
                foodItemId: item._id, 
                quantity: 1 
            })).unwrap();
            toast.success(`${item.name} added to cart!`);
        } catch (err) {
            toast.error(err || "Failed to add item to cart");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="h-screen flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-swiggy-orange border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-secondary font-black uppercase tracking-[0.3em] text-[10px]">Cooking up the menu...</p>
            </div>
        </div>
    );

    if (!restaurant) return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="h-screen flex flex-col items-center justify-center px-4 text-center">
                <div className="text-swiggy-orange mb-6">
                    <Info size={48} />
                </div>
                <h2 className="text-2xl font-black text-secondary mb-2 uppercase tracking-tight">Restaurant not found</h2>
                <p className="text-accent font-bold mb-8">This restaurant might have closed its kitchen or moved.</p>
                <button 
                    onClick={() => navigate("/")}
                    className="bg-swiggy-orange text-white px-10 py-4 rounded-xl font-black text-sm hover:shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                >
                    Back to discovery
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white pt-24 pb-20">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] text-accent font-black uppercase tracking-widest mb-10">
                    <span className="cursor-pointer hover:text-swiggy-orange transition-colors" onClick={() => navigate("/")}>Home</span>
                    <span>/</span>
                    <span className="text-secondary">{restaurant?.name || "Restaurant"}</span>
                </div>

                {/* Restaurant Info Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-secondary mb-4">{restaurant?.name}</h1>
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-8 space-y-4">
                        <div className="flex items-center gap-4 border-b border-dashed pb-4">
                            <div className="flex items-center gap-1.5 bg-success text-white px-2 py-1 rounded-md text-xs font-black">
                                <Star size={14} fill="white" />
                                <span>{restaurant?.averageRating || "4.2"}</span>
                            </div>
                            <span className="text-accent font-bold">•</span>
                            <span className="text-secondary font-black">{restaurant?.cuisines?.join(", ") || "Cuisines Not Listed"}</span>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 font-black text-secondary uppercase tracking-tighter">
                                <Clock size={18} className="text-accent" />
                                <span>{restaurant?.deliveryTime || 30} mins</span>
                            </div>
                            <div className="flex items-center gap-2 font-black text-secondary uppercase tracking-tighter">
                                <span className="text-accent">₹</span>
                                <span>{restaurant?.costForTwo || 400} for two</span>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center gap-2 text-swiggy-orange font-black text-xs uppercase bg-orange-50/50 p-3 rounded-xl border border-orange-100/50">
                            <Info size={14} />
                            <span>Free delivery on orders above ₹199</span>
                        </div>
                    </div>
                </div>

                {/* Menu Section */}
                <div className="space-y-12">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                        <h2 className="text-2xl font-black text-secondary underline decoration-swiggy-orange decoration-4 underline-offset-8">Recommended</h2>
                        <SearchIcon className="text-accent" size={20} />
                    </div>

                    <div className="divide-y divide-gray-100">
                        {menu?.length > 0 ? menu.map((item) => (
                            <div key={item._id} className="py-10 flex justify-between gap-10 group">
                                <div className="flex-1 space-y-2">
                                    <div className={`w-4 h-4 border-2 ${item.isVeg ? 'border-success' : 'border-red-500'} flex items-center justify-center rounded-sm`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-success' : 'bg-red-500'}`} />
                                    </div>
                                    <h3 className="text-xl font-black text-secondary group-hover:text-swiggy-orange transition-colors">{item.name}</h3>
                                    <p className="font-heading font-black text-secondary">₹{item.price}</p>
                                    <p className="text-accent text-sm font-medium leading-relaxed max-w-lg">{item.description}</p>
                                </div>
                                <div className="relative flex-shrink-0">
                                    <div className="w-40 h-40 rounded-3xl overflow-hidden shadow-lg border border-gray-50 bg-gray-50">
                                        <img 
                                            src={getFoodItemImage(item)} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                    </div>
                                    <motion.button 
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleAddToCart(item)}
                                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white text-success border border-gray-100 px-8 py-2.5 rounded-xl font-black text-sm shadow-xl hover:bg-gray-50 transition-colors uppercase tracking-widest whitespace-nowrap"
                                    >
                                        Add <Plus size={16} strokeWidth={4} className="inline ml-1 mb-0.5" />
                                    </motion.button>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center text-accent font-black italic">
                                No items available in the menu yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                <ReviewSection 
                    reviews={reviews} 
                    averageRating={restaurant?.averageRating} 
                    totalReviews={restaurant?.totalReviews} 
                />
            </div>
        </div>
    );
};

export default RestaurantDetail;
