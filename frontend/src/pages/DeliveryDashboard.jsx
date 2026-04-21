import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAvailableDeliveryOrders, updateOrderStatus, removeOrderLocal } from "../redux/slices/orderSlice";
import { useSocket } from "../context/SocketContext";
import Navbar from "../components/Navbar";
import { MapPin, Navigation, Package, CheckCircle, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";

const DeliveryDashboard = () => {
    const dispatch = useDispatch();
    const { socket } = useSocket();
    const { availableOrders, loading } = useSelector((state) => state.orders);
    const { user } = useSelector((state) => state.auth);
    const [activeOrder, setActiveOrder] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    
    // Heartbeat for location updates
    const locationInterval = useRef(null);

    useEffect(() => {
        dispatch(fetchAvailableDeliveryOrders());
        
        // Check for active orders assigned to me on load
        const checkActive = async () => {
            try {
                const res = await api.get("/delivery/my-order");
                if (res.data.data) setActiveOrder(res.data.data);
            } catch (err) {}
        };
        checkActive();

        return () => {
            if (locationInterval.current) clearInterval(locationInterval.current);
        };
    }, [dispatch, user]);

    useEffect(() => {
        if (socket) {
            socket.on("new_delivery_request", (data) => {
                dispatch(fetchAvailableDeliveryOrders());
                toast("New delivery request nearby!", { icon: '🛵' });
            });

            return () => socket.off("new_delivery_request");
        }
    }, [socket, dispatch]);

    useEffect(() => {
        // Only track location if I have an active order to deliver
        if (activeOrder && ["PICKED_UP", "ON_THE_WAY"].includes(activeOrder.status)) {
            locationInterval.current = setInterval(() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                    const { latitude, longitude } = pos.coords;
                    api.patch("/delivery/location", { lat: latitude, lng: longitude });
                    socket?.emit("agent_location_update", { orderId: activeOrder._id, lat: latitude, lng: longitude });
                }, (err) => console.log("Loc error", err));
            }, 10000); // Every 10 seconds
        } else {
            if (locationInterval.current) clearInterval(locationInterval.current);
        }
    }, [activeOrder, socket]);

    const handleAcceptOrder = async (orderId) => {
        try {
            const res = await api.patch(`/delivery/orders/${orderId}/accept`);
            if (res.data.success) {
                dispatch(removeOrderLocal(orderId));
                setActiveOrder(res.data.data);
                toast.success("Delivery accepted! Navigate to restaurant.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to accept order");
        }
    };

    const handleUpdateStatus = (orderId, status) => {
        dispatch(updateOrderStatus({ orderId, status })).then((res) => {
            if (res.payload) {
                setActiveOrder(res.payload);
                if (status === "DELIVERED") {
                    setActiveOrder(null);
                    dispatch(fetchAvailableDeliveryOrders());
                    toast.success("Great job! Delivery completed.");
                }
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-20 font-sans">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black text-secondary tracking-tight">Delivery Board</h1>
                    <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full border border-success/20">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">Online & Active</span>
                    </div>
                </div>

                {activeOrder ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-primary text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        
                        <div className="relative z-10">
                            <h2 className="text-sm font-bold opacity-80 uppercase tracking-[0.2em] mb-4">Current Delivery Task</h2>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                <div>
                                    <p className="text-4xl font-black mb-1">#{activeOrder._id?.slice(-6).toUpperCase() || "ORDER"}</p>
                                    <div className="flex items-center gap-2 opacity-90">
                                        <Package size={18} />
                                        <span>{activeOrder.items?.length || 0} Items • ₹{activeOrder.totalAmount}</span>
                                    </div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                                    <p className="text-xs font-bold opacity-80 uppercase mb-1">Status</p>
                                    <p className="text-xl font-black">{(activeOrder.status || "PENDING").replace("_", " ")}</p>
                                </div>
                            </div>

                            <div className="space-y-6 mb-12">
                                <div className="flex gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl h-fit">
                                        <Navigation size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold opacity-80 uppercase mb-1">Customer Address</p>
                                        <p className="text-lg font-bold leading-tight">{activeOrder.deliveryAddress?.address || "Address not provided"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activeOrder.status === "READY_FOR_PICKUP" && (
                                    <button 
                                        onClick={() => handleUpdateStatus(activeOrder._id, "PICKED_UP")}
                                        className="bg-white text-primary py-4 rounded-2xl font-black text-lg hover:shadow-xl transition-all active:scale-[0.98]"
                                    >
                                        ORDER PICKED UP
                                    </button>
                                )}
                                {activeOrder.status === "PICKED_UP" && (
                                    <button 
                                        onClick={() => handleUpdateStatus(activeOrder._id, "ON_THE_WAY")}
                                        className="bg-white text-primary py-4 rounded-2xl font-black text-lg hover:shadow-xl transition-all active:scale-[0.98]"
                                    >
                                        START JOURNEY
                                    </button>
                                )}
                                {activeOrder.status === "ON_THE_WAY" && (
                                    <button 
                                        onClick={() => handleUpdateStatus(activeOrder._id, "DELIVERED")}
                                        className="bg-success text-white py-4 rounded-2xl font-black text-lg hover:shadow-xl transition-all border border-white/20 active:scale-[0.98]"
                                    >
                                        MARK DELIVERED
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-secondary px-2 flex items-center gap-2">
                             Nearby Available Orders 
                            <span className="text-accent text-sm font-medium">({availableOrders?.length || 0})</span>
                        </h2>

                        <AnimatePresence mode="popLayout">
                            {!availableOrders || availableOrders.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white p-16 text-center rounded-3xl border border-gray-100"
                                >
                                    <Smartphone className="mx-auto text-gray-200 mb-6" size={64} />
                                    <p className="text-accent text-lg font-medium">Waiting for new orders in your area...</p>
                                </motion.div>
                            ) : (
                                availableOrders.map((order) => (
                                    <motion.div
                                        key={order._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
                                    >
                                        <div className="flex gap-5 items-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-primary">
                                                <Package size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-secondary">₹{order.totalAmount}</h3>
                                                <p className="text-sm text-accent font-medium flex items-center gap-1">
                                                    <MapPin size={14} /> {order.deliveryAddress?.address?.split(",")[0] || "Near Location"}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAcceptOrder(order._id)}
                                            className="w-full sm:w-auto bg-secondary text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                                        >
                                            Accept Delivery
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryDashboard;
