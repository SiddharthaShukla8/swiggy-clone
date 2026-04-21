import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const SignupPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Since we now use a unified role-selection Google login on LoginPage,
        // we redirect everyone there to choose their role and sign in via Google.
        navigate("/login");
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f1f1f6]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-swiggy-orange" size={48} />
                <p className="font-black text-secondary uppercase tracking-tight">Redirecting to Social Auth...</p>
            </div>
        </div>
    );
};

export default SignupPage;
