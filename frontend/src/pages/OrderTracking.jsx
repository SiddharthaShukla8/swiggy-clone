import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package, Clock, Utensils, Bike, CheckCircle2,
    MapPin, Phone, ArrowLeft, RefreshCw, ReceiptText,
    ChefHat, ShoppingBag, AlertCircle
} from "lucide-react";
import { Helmet } from "react-helmet-async";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords?.[0] && coords?.[1]) map.setView(coords, 15);
    }, [coords, map]);
    return null;
};

// --- Order Steps Definition ---
const STEPS = [
    { status: "PLACED",           label: "Order Placed",          sub: "We received your order",              icon: ShoppingBag },
    { status: "CONFIRMED",        label: "Restaurant Confirmed",   sub: "Restaurant accepted your order",      icon: CheckCircle2 },
    { status: "PREPARING",        label: "Being Prepared",         sub: "Your food is being cooked",           icon: ChefHat },
    { status: "READY_FOR_PICKUP", label: "Ready for Pickup",       sub: "Waiting for delivery partner",        icon: Package },
    { status: "PICKED_UP",        label: "Picked Up",              sub: "Partner has your order",              icon: Bike },
    { status: "ON_THE_WAY",       label: "On the Way",             sub: "Almost there!",                       icon: Bike },
    { status: "DELIVERED",        label: "Delivered",              sub: "Enjoy your meal!",                    icon: CheckCircle2 },
];

const STATUS_COLORS = {
    PLACED:           "bg-blue-500",
    CONFIRMED:        "bg-green-500",
    PREPARING:        "bg-orange-500",
    READY_FOR_PICKUP: "bg-purple-500",
    PICKED_UP:        "bg-indigo-500",
    ON_THE_WAY:       "bg-swiggy-orange",
    DELIVERED:        "bg-green-600",
    CANCELLED:        "bg-red-500",
    FAILED:           "bg-red-600",
    PENDING:          "bg-gray-400",
};

const OrderTracking = () => {
    const { orderId } = useParams();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [agentLocation, setAgentLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBill, setShowBill] = useState(false);

    const fetchOrder = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/orders/${orderId}`);
            const data = res.data?.data;
            if (!data) throw new Error("No order data in response");
            setOrder(data);
        } catch (err) {
            console.error("Failed to fetch order:", err);
            setError(err.response?.data?.message || "Could not load order details.");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    // Real-time socket updates
    useEffect(() => {
        if (!socket || !orderId) return;

        socket.emit("join_order", orderId);

        const onStatusUpdate = (data) => {
            setOrder(prev => prev ? { ...prev, status: data.status } : prev);
        };
        const onAgentLocation = (data) => {
            if (data?.lat && data?.lng) setAgentLocation([data.lat, data.lng]);
        };
        const onDeliveryAssigned = (data) => {
            setOrder(prev => prev ? { ...prev, deliveryPartnerId: data.agent || data.agentId } : prev);
        };

        socket.on("order_status_update", onStatusUpdate);
        socket.on("agent_location_update", onAgentLocation);
        socket.on("delivery_assigned", onDeliveryAssigned);

        return () => {
            socket.off("order_status_update", onStatusUpdate);
            socket.off("agent_location_update", onAgentLocation);
            socket.off("delivery_assigned", onDeliveryAssigned);
        };
    }, [socket, orderId]);

    // --- Loading State ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f9fa]">
                <Navbar />
                <div className="pt-24 max-w-4xl mx-auto px-4">
                    <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse mb-6" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-[500px] bg-gray-200 rounded-3xl animate-pulse" />
                        <div className="space-y-4">
                            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error || !order) {
        return (
            <div className="min-h-screen bg-[#f8f9fa]">
                <Navbar />
                <div className="pt-24 flex flex-col items-center justify-center gap-6 p-8">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                        <AlertCircle size={40} className="text-red-400" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-secondary mb-2">Order Not Found</h2>
                        <p className="text-accent font-bold">{error || "This order doesn't exist or you don't have access."}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchOrder} className="flex items-center gap-2 bg-swiggy-orange text-white px-6 py-3 rounded-xl font-black text-sm">
                            <RefreshCw size={15} /> Retry
                        </button>
                        <button onClick={() => navigate("/orders")} className="flex items-center gap-2 bg-gray-100 text-secondary px-6 py-3 rounded-xl font-black text-sm">
                            <ArrowLeft size={15} /> My Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Safe coordinate extraction ---
    const deliveryLat = order.deliveryAddress?.lat ?? order.deliveryAddress?.coordinates?.[1] ?? null;
    const deliveryLng = order.deliveryAddress?.lng ?? order.deliveryAddress?.coordinates?.[0] ?? null;
    const hasDeliveryCoords = deliveryLat && deliveryLng;

    const restaurantLat = order.restaurantId?.location?.coordinates?.[1] ?? null;
    const restaurantLng = order.restaurantId?.location?.coordinates?.[0] ?? null;
    const hasRestaurantCoords = restaurantLat && restaurantLng;

    // Fallback to Delhi if no coords at all
    const DEFAULT_POS = [28.6139, 77.2090];
    const customerPos = hasDeliveryCoords ? [deliveryLat, deliveryLng] : DEFAULT_POS;
    const restaurantPos = hasRestaurantCoords ? [restaurantLat, restaurantLng] : customerPos;
    const mapCenter = agentLocation || customerPos;

    const currentStepIndex = STEPS.findIndex(s => s.status === order.status);
    const etaMinutes = order.restaurantId?.deliveryTime || 30;
    const agentPhone = order.deliveryPartnerId?.phone;
    const isTerminal = ["DELIVERED", "CANCELLED", "FAILED"].includes(order.status);
    const statusColor = STATUS_COLORS[order.status] || "bg-gray-400";
    const bill = order.billDetails || {};

    return (
        <div className="min-h-screen bg-[#f8f9fa]">
            <Helmet>
                <title>Tracking Order — Swiggy Clone</title>
            </Helmet>
            <Navbar />

            <div className="pt-20 max-w-7xl mx-auto px-4">
                {/* Back button + Title */}
                <div className="flex items-center gap-4 py-5">
                    <button
                        onClick={() => navigate("/orders")}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={18} className="text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-secondary">Track Order</h1>
                        <p className="text-xs text-accent font-bold">#{orderId.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className={`ml-auto px-4 py-1.5 rounded-full text-white text-[11px] font-black uppercase tracking-widest ${statusColor}`}>
                        {order.status?.replace(/_/g, " ")}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
                    {/* LEFT: Map */}
                    <div className="lg:col-span-7">
                        <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 h-[420px] lg:h-[600px] relative">
                            <MapContainer
                                center={mapCenter}
                                zoom={13}
                                style={{ height: "100%", width: "100%", zIndex: 1 }}
                                zoomControl={true}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />

                                {hasRestaurantCoords && (
                                    <Marker position={restaurantPos}>
                                        <Popup><strong>{order.restaurantId?.name || "Restaurant"}</strong></Popup>
                                    </Marker>
                                )}

                                {hasDeliveryCoords && (
                                    <Marker position={customerPos}>
                                        <Popup>Your delivery location</Popup>
                                    </Marker>
                                )}

                                {agentLocation && (
                                    <Marker
                                        position={agentLocation}
                                        icon={L.divIcon({
                                            className: "custom-div-icon",
                                            html: `<div style="background:#FF5200;color:white;padding:8px;border-radius:50%;box-shadow:0 0 15px rgba(255,82,0,0.5);display:flex;align-items:center;justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6H4l-3 10"/><path d="M15 6l4 10"/><path d="M1 16l14-3"/></svg></div>`,
                                            iconSize: [40, 40],
                                            iconAnchor: [20, 20]
                                        })}
                                    >
                                        <Popup>Your delivery partner is here!</Popup>
                                    </Marker>
                                )}

                                <RecenterMap coords={mapCenter} />
                            </MapContainer>

                            {/* Map overlay — no coords message */}
                            {!hasDeliveryCoords && !agentLocation && (
                                <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center rounded-3xl">
                                    <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl text-center shadow-xl">
                                        <MapPin size={28} className="text-swiggy-orange mx-auto mb-2" />
                                        <p className="font-black text-secondary text-sm">Live tracking will appear once</p>
                                        <p className="text-accent text-xs font-bold">a delivery partner is assigned</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Delivery address card */}
                        {order.deliveryAddress?.address && (
                            <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm border border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <MapPin size={18} className="text-swiggy-orange" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-accent uppercase tracking-widest">Delivering to</p>
                                    <p className="font-bold text-secondary text-sm">{order.deliveryAddress.address}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Status Timeline + Details */}
                    <div className="lg:col-span-5 space-y-5">
                        {/* ETA Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">
                                    {isTerminal ? "Status" : "Estimated Arrival"}
                                </p>
                                <h2 className="text-4xl font-black text-secondary">
                                    {isTerminal ? order.status.replace(/_/g, " ") : `${etaMinutes} Mins`}
                                </h2>
                                <p className="text-accent font-bold text-xs mt-1">
                                    {order.restaurantId?.name || "Your restaurant"}
                                </p>
                            </div>
                            <div className={`p-4 rounded-2xl ${statusColor} bg-opacity-10`}>
                                <Clock size={32} className="text-swiggy-orange" />
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-black text-secondary text-sm uppercase tracking-widest mb-6">Order Progress</h3>
                            <div className="space-y-0">
                                {STEPS.map((step, index) => {
                                    const Icon = step.icon;
                                    const isDone = index < currentStepIndex;
                                    const isCurrent = index === currentStepIndex;
                                    const isFuture = index > currentStepIndex;

                                    return (
                                        <div key={step.status} className="flex gap-4">
                                            {/* Icon column */}
                                            <div className="flex flex-col items-center">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                                                    isDone ? "bg-green-500" :
                                                    isCurrent ? "bg-swiggy-orange shadow-lg shadow-orange-200 ring-4 ring-orange-100" :
                                                    "bg-gray-100"
                                                }`}>
                                                    <Icon size={16} className={isDone || isCurrent ? "text-white" : "text-gray-400"} />
                                                </div>
                                                {index < STEPS.length - 1 && (
                                                    <div className={`w-0.5 h-8 my-1 rounded-full ${isDone ? "bg-green-400" : "bg-gray-100"}`} />
                                                )}
                                            </div>

                                            {/* Text column */}
                                            <div className="pb-2 pt-1.5">
                                                <p className={`font-black text-sm leading-tight ${isFuture ? "text-gray-300" : "text-secondary"}`}>
                                                    {step.label}
                                                </p>
                                                {isCurrent && (
                                                    <motion.p
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-swiggy-orange text-[11px] font-bold mt-0.5"
                                                    >
                                                        {step.sub}
                                                    </motion.p>
                                                )}
                                                {isDone && (
                                                    <p className="text-green-500 text-[11px] font-bold mt-0.5">Completed</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bill Summary (collapsible) */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <button
                                onClick={() => setShowBill(b => !b)}
                                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <ReceiptText size={18} className="text-swiggy-orange" />
                                    <span className="font-black text-secondary text-sm uppercase tracking-widest">Bill Details</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-secondary">₹{order.totalAmount}</span>
                                    <motion.div animate={{ rotate: showBill ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                        <ArrowLeft size={14} className="text-accent rotate-[-90deg]" />
                                    </motion.div>
                                </div>
                            </button>

                            <AnimatePresence>
                                {showBill && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 space-y-3 border-t border-gray-100 pt-4 text-sm font-bold text-accent">
                                            {/* Items */}
                                            {order.items?.length > 0 && (
                                                <div className="space-y-2 pb-3 border-b border-dashed border-gray-100">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between">
                                                            <span>{item.quantity}× {item.name}</span>
                                                            <span className="text-secondary">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {bill.itemTotal != null && <div className="flex justify-between"><span>Item Total</span><span className="text-secondary">₹{bill.itemTotal}</span></div>}
                                            {bill.deliveryFee != null && <div className="flex justify-between"><span>Delivery Fee</span><span className="text-secondary">₹{bill.deliveryFee}</span></div>}
                                            {bill.platformFee != null && <div className="flex justify-between"><span>Platform Fee</span><span className="text-secondary">₹{bill.platformFee}</span></div>}
                                            {bill.gst != null && <div className="flex justify-between"><span>GST (5%)</span><span className="text-secondary">₹{bill.gst}</span></div>}
                                            {bill.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Coupon ({bill.couponCode})</span><span>-₹{bill.discountAmount}</span></div>}
                                            <div className="flex justify-between border-t border-dashed border-gray-100 pt-3 text-secondary font-black text-base">
                                                <span>Total Paid</span><span>₹{order.totalAmount}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Support / Call Partner */}
                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 flex-shrink-0">
                                <Bike size={22} className="text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-accent uppercase tracking-widest">Delivery Partner</p>
                                <p className="font-black text-secondary text-sm truncate">
                                    {order.deliveryPartnerId?.name || "Assigning partner..."}
                                </p>
                            </div>
                            {agentPhone ? (
                                <a
                                    href={`tel:${agentPhone}`}
                                    className="w-11 h-11 bg-green-500 text-white rounded-2xl flex items-center justify-center hover:bg-green-600 transition-colors flex-shrink-0"
                                >
                                    <Phone size={18} />
                                </a>
                            ) : (
                                <div className="px-3 py-2 bg-gray-100 rounded-xl text-[10px] font-black text-accent uppercase tracking-widest flex-shrink-0">
                                    Pending
                                </div>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchOrder}
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-secondary py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCw size={14} /> Refresh Status
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
