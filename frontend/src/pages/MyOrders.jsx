import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Clock, MapPin, ChevronRight, ShoppingBag, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import AddReviewForm from "../components/AddReviewForm";

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("active"); // active, past
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            const res = await api.get("/orders/my-orders");
            setOrders(res.data.data?.orders || []);
            setLoading(false);
        } catch (err) {
            toast.error("Failed to load orders");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const activeOrders = orders.filter(o => !["DELIVERED", "CANCELLED", "FAILED"].includes(o.status));
    const pastOrders = orders.filter(o => ["DELIVERED", "CANCELLED", "FAILED"].includes(o.status));

    const getStatusStyles = (status) => {
        switch (status) {
            case "PLACED": return "bg-blue-50 text-blue-600 border-blue-100";
            case "CONFIRMED": return "bg-green-50 text-green-600 border-green-100";
            case "PREPARING": return "bg-orange-50 text-orange-600 border-orange-100";
            case "READY_FOR_PICKUP": return "bg-purple-50 text-purple-600 border-purple-100";
            case "PICKED_UP": return "bg-indigo-50 text-indigo-600 border-indigo-100";
            case "DELIVERED": return "bg-gray-50 text-gray-500 border-gray-100";
            default: return "bg-red-50 text-red-600 border-red-100";
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] pt-24 pb-20">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <h1 className="text-4xl font-black text-secondary tracking-tight">My Orders</h1>
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                        <button 
                            onClick={() => setActiveTab("active")}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === "active" ? "bg-secondary text-white shadow-lg" : "text-accent hover:bg-gray-50"}`}
                        >
                            Active ({activeOrders.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab("past")}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === "past" ? "bg-secondary text-white shadow-lg" : "text-accent hover:bg-gray-50"}`}
                        >
                            Past Orders
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse" />)}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            {(activeTab === "active" ? activeOrders : pastOrders).length === 0 ? (
                                <motion.div 
                                    key="empty"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="bg-white p-16 text-center rounded-[2.5rem] border border-gray-100"
                                >
                                    <ShoppingBag className="mx-auto text-gray-100 mb-6" size={64} />
                                    <h3 className="text-xl font-black text-secondary mb-2">No orders here yet!</h3>
                                    <p className="text-accent font-bold mb-8">Hungry? Discover restaurants nearby and place your first order.</p>
                                    <button 
                                        onClick={() => navigate("/")}
                                        className="bg-swiggy-orange text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all"
                                    >
                                        Browse Restaurants
                                    </button>
                                </motion.div>
                            ) : (
                                (activeTab === "active" ? activeOrders : pastOrders).map((order) => (
                                    <motion.div
                                        key={order._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-xl transition-all"
                                    >
                                        {/* Status Bar */}
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-secondary border border-gray-100">
                                                            <Package size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black text-secondary leading-tight">
                                                                {order.restaurantId?.name || "Restaurant"}
                                                            </h3>
                                                            <p className="text-accent text-xs font-bold uppercase tracking-wider">
                                                                {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                                                        {order.status.replace("_", " ")}
                                                    </span>
                                                </div>

                                                <div className="pl-[60px] space-y-2">
                                                    <p className="text-accent text-sm font-bold truncate max-w-md">
                                                        {order.items.map(i => `${i.quantity} x ${i.name}`).join(", ")}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-secondary font-black text-lg">
                                                        <span>₹{order.totalAmount}</span>
                                                        <ChevronRight size={16} className="text-accent" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:w-48 flex flex-col justify-center gap-3">
                                                {activeTab === "active" ? (
                                                    <button 
                                                        onClick={() => navigate(`/order/tracking/${order._id}`)}
                                                        className="w-full bg-swiggy-orange text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        Track Order
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => navigate(`/restaurant/${order.restaurantId?._id}`)}
                                                        className="w-full bg-gray-50 text-secondary py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                                                    >
                                                        Reorder
                                                    </button>
                                                )}
                                                
                                                {/* Rate Order Button for Delivered Orders */}
                                                {order.status === "DELIVERED" && (
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedOrder({
                                                                ...order,
                                                                restaurantName: order.restaurantId?.name,
                                                                restaurantId: order.restaurantId?._id
                                                            });
                                                            setIsReviewOpen(true);
                                                        }}
                                                        className="w-full bg-orange-50 text-swiggy-orange py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-swiggy-orange hover:text-white transition-all border border-orange-100"
                                                    >
                                                        Rate Now
                                                    </button>
                                                )}

                                                <button 
                                                    onClick={() => {/* View Details Modal */}}
                                                    className="w-full bg-white border border-gray-100 text-accent py-3 font-bold text-xs rounded-2xl hover:bg-gray-50 transition-all"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <AddReviewForm 
                order={selectedOrder}
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                onReviewSuccess={fetchOrders}
            />
        </div>
    );
};

export default MyOrders;
