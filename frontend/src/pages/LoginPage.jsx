import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, resetError } from "../redux/slices/authSlice";
import Navbar from "../components/Navbar";
import { Mail, Lock, ArrowRight, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const getAuthBaseUrl = () => {
    const configuredApiUrl = import.meta.env.VITE_API_URL;

    if (configuredApiUrl) {
        return configuredApiUrl.replace(/\/api\/v\d+\/?$/, "");
    }

    return import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
};

const LoginPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated && user) {
            const redirectPath = user.role === "RESTAURANT_OWNER" ? "/owner-dashboard" : 
                               user.role === "DELIVERY_PARTNER" ? "/delivery-dashboard" :
                               user.role === "ADMIN" ? "/admin" : "/";
            navigate(redirectPath);
        }
    }, [isAuthenticated, user, navigate]);

    const handleGoogleLogin = (role) => {
        // Redirect to backend OAuth route with the selected role
        window.location.href = `${getAuthBaseUrl()}/auth/google?role=${role}`;
    };

    const roles = [
        {
            id: "CUSTOMER",
            title: "Customer",
            description: "Order food and track deliveries",
            icon: "🍔",
            color: "from-orange-400 to-swiggy-orange"
        },
        {
            id: "RESTAURANT_OWNER",
            title: "Restaurant Owner",
            description: "Manage your menu and orders",
            icon: "🏪",
            color: "from-blue-400 to-blue-600"
        },
        {
            id: "DELIVERY_PARTNER",
            title: "Delivery Partner",
            description: "Deliver orders and earn money",
            icon: "🛵",
            color: "from-green-400 to-green-600"
        }
    ];

    return (
        <div className="min-h-screen bg-[#f1f1f6] pt-24 pb-20 font-sans">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 mt-12">
                <div className="text-center mb-12">
                    <motion.h2 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-black text-secondary tracking-tight uppercase"
                    >
                        CHOOSE YOUR PATH
                    </motion.h2>
                    <p className="text-accent font-bold mt-2 text-lg">Sign in exclusively with Google to continue</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {roles.map((role, i) => (
                        <motion.div
                            key={role.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-[3rem] p-8 shadow-2xl border-2 border-transparent hover:border-swiggy-orange transition-all cursor-pointer flex flex-col items-center text-center group"
                            onClick={() => handleGoogleLogin(role.id)}
                        >
                            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center text-4xl mb-6 shadow-xl group-hover:scale-110 transition-transform`}>
                                {role.icon}
                            </div>
                            <h3 className="text-2xl font-black text-secondary mb-2">{role.title}</h3>
                            <p className="text-accent text-sm font-bold mb-8 leading-relaxed">{role.description}</p>
                            
                            <button className="w-full bg-white border-2 border-gray-100 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all font-black text-xs uppercase tracking-widest text-secondary shadow-sm">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                Login with Google
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-blue-50 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-4 rounded-2xl text-blue-500">
                            <Info size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-black text-secondary uppercase text-sm tracking-tight">One Account. All Roles.</p>
                            <p className="text-accent font-bold text-xs">Switch roles anytime while staying secure with Google Auth.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-50 px-6 py-3 rounded-2xl border border-yellow-100">
                        <span className="animate-pulse">🔒</span>
                        <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">End-to-End Encrypted Login</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
