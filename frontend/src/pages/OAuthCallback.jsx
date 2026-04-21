import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/slices/authSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const finalizeLogin = async () => {
            const token = searchParams.get("token");
            
            if (!token) {
                toast.error("Authentication failed. Please try again.");
                navigate("/login");
                return;
            }

            try {
                // Fetch user data with the token we just got
                // This ensures we have the full user object (role, etc.)
                const response = await api.get("/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    const userData = response.data.data;
                    
                    // Save to Redux
                    dispatch(setCredentials({ 
                        user: userData, 
                        accessToken: token 
                    }));

                    toast.success(`Welcome back, ${userData.name}!`);

                    // Redirect based on role
                    const role = userData.role;
                    if (role === "RESTAURANT_OWNER") navigate("/owner-dashboard");
                    else if (role === "DELIVERY_PARTNER") navigate("/delivery-dashboard");
                    else if (role === "ADMIN") navigate("/admin");
                    else navigate("/");
                }
            } catch (error) {
                console.error("OAuth Finalize Error:", error);
                toast.error("Failed to sync your profile. Please login again.");
                navigate("/login");
            }
        };

        finalizeLogin();
    }, [searchParams, dispatch, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f1f6]">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center text-center">
                <Loader2 className="text-swiggy-orange animate-spin mb-6" size={48} />
                <h2 className="text-2xl font-black text-secondary tracking-tight">SECURING YOUR CONNECTION</h2>
                <p className="text-accent font-bold mt-2">Almost there! We're syncing your Google profile...</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
