import React, { useState } from "react";
import { Search, ShoppingCart, User, ChevronDown, LogOut, Bell, ShoppingBag } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../redux/slices/authSlice";
import { useSocket } from "../context/SocketContext";
import NotificationBell from "./NotificationBell";
import toast from "react-hot-toast";

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { cart } = useSelector((state) => state.cart);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const cartCount = cart?.items?.length || 0;

    const getDashboardPath = () => {
        if (!user) return "/login";
        if (user.role === "RESTAURANT_OWNER") return "/owner-dashboard";
        if (user.role === "DELIVERY_PARTNER") return "/delivery-dashboard";
        if (user.role === "ADMIN") return "/admin";
        return "/profile";
    };

    const handleLogout = async () => {
        await dispatch(logoutUser());
        toast.success("Logged out successfully");
        navigate("/");
    };

    return (
        <nav className="fixed top-0 left-0 right-0 bg-swiggy-orange z-[100] h-20 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                <div className="flex items-center gap-10">
                    {/* Logo */}
                    <Link to="/">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <svg width="34" height="49" viewBox="0 0 34 49" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M30.6 15.6C26.5 11.5 21.1 9.2 15.3 9.2C9.5 9.2 4.1 11.5 0 15.6L15.3 30.9L30.6 15.6Z" fill="white"/>
                                <path d="M15.3 48.2L30.6 32.9L34 36.3L15.3 55L-3.4 36.3L0 32.9L15.3 48.2Z" fill="white"/>
                            </svg>
                            <span className="text-white font-black text-2xl tracking-tighter">Swiggy</span>
                        </motion.div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden lg:flex items-center gap-10 text-white/90 font-bold text-sm">
                        <span className="hover:text-white cursor-pointer transition-colors">Swiggy Corporate</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Partner with us</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 md:gap-10 text-white font-bold">
                    <Link to="/search" className="hidden md:flex items-center gap-2 hover:text-white/80 transition-opacity">
                        <Search size={22} strokeWidth={2.5} />
                        <span className="text-[15px]">Search</span>
                    </Link>

                    {isAuthenticated && user && (
                        <NotificationBell />
                    )}
                    
                    {isAuthenticated && user ? (
                        <div className="relative" onMouseEnter={() => setIsProfileOpen(true)} onMouseLeave={() => setIsProfileOpen(false)}>
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                className="bg-black text-white px-5 py-2.5 rounded-xl text-[14px] font-black tracking-tight hover:bg-gray-800 transition-colors flex items-center gap-2"
                            >
                                <User size={16} />
                                {user.name?.split(' ')[0] || "Me"}
                                <ChevronDown size={14} className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </motion.button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-[200] overflow-hidden"
                                    >
                                        <div className="px-5 py-3 border-b border-gray-50 mb-2">
                                            <p className="text-[10px] text-accent font-black uppercase tracking-widest mb-1">Signed in as</p>
                                            <p className="text-secondary font-black truncate">{user.email}</p>
                                        </div>
                                        
                                        <Link to={getDashboardPath()} className="flex items-center gap-3 px-5 py-3 text-secondary font-bold text-sm hover:bg-gray-50 transition-colors">
                                            <User size={18} className="text-accent" />
                                            My Dashboard
                                        </Link>

                                        <Link to="/orders" className="flex items-center gap-3 px-5 py-3 text-secondary font-bold text-sm hover:bg-gray-50 transition-colors">
                                            <ShoppingBag size={18} className="text-accent" />
                                            Active Orders
                                        </Link>

                                        <div className="h-px bg-gray-50 my-2" />

                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-5 py-3 text-red-500 font-bold text-sm hover:bg-red-50/50 transition-colors"
                                        >
                                            <LogOut size={18} />
                                            Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link to="/login" className="flex items-center">
                            <motion.div 
                                whileTap={{ scale: 0.95 }}
                                className="bg-black text-white px-6 py-2.5 rounded-xl text-[15px] font-black tracking-tight hover:bg-gray-800 transition-colors"
                            >
                                Sign in
                            </motion.div>
                        </Link>
                    )}

                    <Link to="/cart" className="flex items-center gap-2 relative group mt-1">
                        <div className="relative">
                            <ShoppingCart size={24} strokeWidth={2.5} />
                            <span className="absolute -top-2.5 -right-3 bg-white text-swiggy-orange text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow-md border-2 border-swiggy-orange">
                                {cartCount}
                            </span>
                        </div>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
