import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Higher-order component to protect routes based on authentication and roles
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
    const location = useLocation();

    // If still checking auth status (e.g., initial load/refresh)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-swiggy-orange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // 1. Not logged in -> Redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Logged in but doesn't have required role
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Find safe landing spot
        const fallback = user?.role === "RESTAURANT_OWNER" ? "/owner-dashboard" 
                      : user?.role === "DELIVERY_PARTNER" ? "/delivery-dashboard" 
                      : "/";
        return <Navigate to={fallback} replace />;
    }

    // 3. Authorized
    return children;
};

export default ProtectedRoute;
