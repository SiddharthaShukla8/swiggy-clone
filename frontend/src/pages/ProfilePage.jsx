import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, Phone, Mail, ShieldCheck, Package, LogOut, Edit3, Check, X, Camera, Star, Clock } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { updateUser, logoutUser } from "../redux/slices/authSlice";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";

const AVATAR_COLORS = ["#ff5200","#fc8019","#282c3f","#60b246","#1e88e5","#8e24aa"];
const getAvatarColor = (name = "") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-gray-100">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <p className="text-xs font-black text-accent uppercase tracking-widest">{label}</p>
            <p className="text-xl font-black text-secondary">{value}</p>
        </div>
    </div>
);

const ProfilePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    const [form, setForm] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        address: user?.location?.address || "",
    });

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        setForm({
            name: user.name || "",
            phone: user.phone || "",
            address: user.location?.address || "",
        });
    }, [user, navigate]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get("/orders/my-orders");
                setOrders(res.data.data || []);
            } catch { /* silent */ }
            finally { setOrdersLoading(false); }
        };
        if (user) fetchOrders();
    }, [user]);

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error("Name cannot be empty");
        setSaving(true);
        try {
            const res = await api.patch("/auth/profile", {
                name: form.name,
                phone: form.phone,
                location: form.address ? { address: form.address } : undefined,
            });
            dispatch(updateUser(res.data.data));
            toast.success("Profile updated!");
            setEditing(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/login");
    };

    if (!user) return null;

    const avatarColor = getAvatarColor(user.name);
    const initials = (user.name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const completedOrders = orders.filter(o => o.status === "DELIVERED").length;

    return (
        <div className="min-h-screen bg-[#f1f1f6] pt-24 pb-16">
            <Helmet>
                <title>My Profile — Swiggy Clone</title>
            </Helmet>
            <Navbar />

            <div className="max-w-5xl mx-auto px-4">
                {/* Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6 flex flex-col md:flex-row items-center gap-8"
                >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div
                            className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-lg"
                            style={{ background: avatarColor }}
                        >
                            {initials}
                        </div>
                        <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center shadow cursor-pointer hover:bg-gray-50 transition-colors">
                            <Camera size={15} className="text-accent" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                            <h1 className="text-3xl font-black text-secondary">{user.name}</h1>
                            <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-orange-50 text-swiggy-orange border border-swiggy-orange/20">
                                {user.role?.replace("_", " ") || "CUSTOMER"}
                            </span>
                        </div>
                        <p className="text-accent font-bold flex items-center gap-2 justify-center md:justify-start">
                            <Mail size={14} /> {user.email}
                        </p>
                        {user.phone && (
                            <p className="text-accent font-bold flex items-center gap-2 justify-center md:justify-start mt-1">
                                <Phone size={14} /> {user.phone}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-2 bg-swiggy-orange text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-colors"
                        >
                            <Edit3 size={15} /> Edit Profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-gray-100 text-secondary px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors"
                        >
                            <LogOut size={15} /> Sign Out
                        </button>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard icon={Package} label="Total Orders" value={orders.length} color="bg-swiggy-orange" />
                    <StatCard icon={Check} label="Completed" value={completedOrders} color="bg-green-500" />
                    <StatCard icon={Star} label="Role" value={user.role?.split("_")[0] || "—"} color="bg-purple-500" />
                    <StatCard icon={ShieldCheck} label="Account" value="Verified" color="bg-blue-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Details */}
                    <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7"
                    >
                        <h2 className="text-lg font-black text-secondary uppercase tracking-tight mb-6 flex items-center gap-2">
                            <User size={18} /> Personal Details
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-accent uppercase tracking-widest block mb-1">Full Name</label>
                                <p className="font-black text-secondary text-lg">{user.name}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-accent uppercase tracking-widest block mb-1">Email</label>
                                <p className="font-bold text-secondary">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-accent uppercase tracking-widest block mb-1">Phone</label>
                                <p className="font-bold text-secondary">{user.phone || "Not set"}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Delivery Address */}
                    <motion.div
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7"
                    >
                        <h2 className="text-lg font-black text-secondary uppercase tracking-tight mb-6 flex items-center gap-2">
                            <MapPin size={18} /> Saved Address
                        </h2>
                        {user.location?.address ? (
                            <div className="bg-orange-50 border border-swiggy-orange/20 rounded-2xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-swiggy-orange flex items-center justify-center flex-shrink-0">
                                        <MapPin size={14} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-swiggy-orange uppercase tracking-widest">HOME</p>
                                        <p className="font-bold text-secondary mt-1">{user.location.address}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MapPin size={32} className="text-gray-200 mx-auto mb-3" />
                                <p className="text-accent font-bold text-sm">No address saved yet</p>
                                <button
                                    onClick={() => setEditing(true)}
                                    className="mt-4 text-swiggy-orange font-black text-xs uppercase tracking-widest border-b border-swiggy-orange/30 hover:border-swiggy-orange transition-colors"
                                >
                                    Add Address
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Recent Orders */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7 mt-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-secondary uppercase tracking-tight flex items-center gap-2">
                            <Package size={18} /> Recent Orders
                        </h2>
                        {orders.length > 0 && (
                            <button onClick={() => navigate("/orders")} className="text-swiggy-orange font-black text-xs uppercase tracking-widest hover:underline">
                                View All
                            </button>
                        )}
                    </div>

                    {ordersLoading ? (
                        <div className="space-y-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-10">
                            <Package size={40} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-accent font-bold">No orders yet</p>
                            <button onClick={() => navigate("/")} className="mt-4 bg-swiggy-orange text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-orange-600 transition-colors">
                                Order Now
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.slice(0, 5).map(order => (
                                <div
                                    key={order._id}
                                    onClick={() => navigate(`/order/tracking/${order._id}`)}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-orange-50 cursor-pointer transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <Package size={18} className="text-swiggy-orange" />
                                        </div>
                                        <div>
                                            <p className="font-black text-secondary text-sm group-hover:text-swiggy-orange transition-colors">
                                                {order.restaurantId?.name || "Order"}
                                            </p>
                                            <p className="text-[10px] text-accent font-bold">
                                                {order.items?.length} item{order.items?.length !== 1 ? "s" : ""} • ₹{order.totalAmount}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                            order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                                            order.status === "CANCELLED" || order.status === "FAILED" ? "bg-red-100 text-red-600" :
                                            "bg-orange-100 text-swiggy-orange"
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {editing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setEditing(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-secondary">Edit Profile</h2>
                                <button onClick={() => setEditing(false)} className="text-accent hover:text-secondary transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-accent uppercase tracking-widest block mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-secondary focus:outline-none focus:border-swiggy-orange transition-colors"
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-accent uppercase tracking-widest block mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-secondary focus:outline-none focus:border-swiggy-orange transition-colors"
                                        placeholder="+91 XXXXX XXXXX"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-accent uppercase tracking-widest block mb-2">Delivery Address</label>
                                    <textarea
                                        value={form.address}
                                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                        rows={3}
                                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-secondary focus:outline-none focus:border-swiggy-orange transition-colors resize-none"
                                        placeholder="Flat, Street, City, Pincode"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-7">
                                <button
                                    onClick={() => setEditing(false)}
                                    className="flex-1 border-2 border-gray-100 py-3 rounded-xl font-black text-secondary hover:bg-gray-50 transition-colors uppercase text-sm tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 bg-swiggy-orange text-white py-3 rounded-xl font-black hover:bg-orange-600 transition-colors disabled:opacity-50 uppercase text-sm tracking-widest flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <><Check size={15} /> Save</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;
