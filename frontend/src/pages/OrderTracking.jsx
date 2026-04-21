import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, Utensils, Bike, CheckCircle } from "lucide-react";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, 15);
    }, [coords, map]);
    return null;
};

const OrderTracking = () => {
    const { orderId } = useParams();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [agentLocation, setAgentLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/orders/${orderId}`);
                setOrder(res.data.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch order", err);
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    useEffect(() => {
        if (socket && orderId) {
            socket.emit("join_order", orderId);

            socket.on("order_status_update", (data) => {
                setOrder(prev => ({ ...prev, status: data.status }));
            });

            socket.on("agent_location_update", (data) => {
                setAgentLocation([data.lat, data.lng]);
            });

            socket.on("delivery_assigned", (data) => {
                setOrder((prev) => prev ? { ...prev, deliveryPartnerId: data.agentId } : prev);
            });

            return () => {
                socket.off("order_status_update");
                socket.off("agent_location_update");
                socket.off("delivery_assigned");
            };
        }
    }, [socket, orderId]);

    if (loading) return <div className="pt-24 text-center">Locating your order...</div>;
    if (!order) return <div className="pt-24 text-center">Order not found.</div>;

    const steps = [
        { status: "PLACED", label: "Order Placed", icon: <CheckCircle size={20} /> },
        { status: "CONFIRMED", label: "Restaurant Confirmed", icon: <CheckCircle size={20} /> },
        { status: "PREPARING", label: "Cooking", icon: <Utensils size={20} /> },
        { status: "READY_FOR_PICKUP", label: "Prepared", icon: <Package size={20} /> },
        { status: "PICKED_UP", label: "Picked Up", icon: <Bike size={20} /> },
        { status: "ON_THE_WAY", label: "On the way", icon: <Bike size={20} /> },
        { status: "DELIVERED", label: "Delivered", icon: <CheckCircle size={20} /> },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === order.status);

    // Initial map positions
    const customerPos = [order.deliveryAddress.lat || 12.9716, order.deliveryAddress.lng || 77.6033];
    const restaurantPos = order.restaurantId?.location?.coordinates
        ? [order.restaurantId.location.coordinates[1], order.restaurantId.location.coordinates[0]]
        : customerPos;
    const etaMinutes = order.restaurantId?.deliveryTime || 25;
    const supportAction = order.deliveryPartnerId?.phone ? `tel:${order.deliveryPartnerId.phone}` : null;

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="pt-20 grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-80px)]">
                
                {/* Left Side: Map Tracking */}
                <div className="lg:col-span-8 relative bg-gray-100">
                    <MapContainer 
                        center={agentLocation || customerPos} 
                        zoom={13} 
                        style={{ height: "100%", width: "100%", zIndex: 1 }}
                        zoomControl={false}
                    >
                        <TileLayer 
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        
                        <Marker position={restaurantPos}>
                            <Popup>Restaurant</Popup>
                        </Marker>
                        
                        <Marker position={customerPos}>
                            <Popup>Your Home</Popup>
                        </Marker>
                        
                        {agentLocation && (
                            <Marker 
                                position={agentLocation}
                                icon={L.divIcon({
                                    className: "custom-div-icon",
                                    html: `<div style="background-color: #FC8019; color: white; padding: 10px; border-radius: 50%; box-shadow: 0 0 15px rgba(252,128,25,0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18H5a2 2 0 0 1-2-2V9l6-3 6 3v2"/><path d="M19 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/><path d="M19 17v-6l-4-2"/><circle cx="12" cy="5" r="2"/></svg></div>`,
                                    iconSize: [44, 44],
                                    iconAnchor: [22, 22]
                                })}
                            >
                                <Popup>Your Delivery Partner is here!</Popup>
                            </Marker>
                        )}
                        
                        <RecenterMap coords={agentLocation || customerPos} />
                    </MapContainer>
                </div>

                {/* Right Side: Status and Details */}
                <div className="lg:col-span-4 bg-white shadow-2xl z-20 flex flex-col p-8 overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-xs text-accent uppercase font-black tracking-widest mb-1">Estimated Arrival</p>
                            <h2 className="text-4xl font-black text-secondary">{etaMinutes} Mins</h2>
                        </div>
                        <div className="bg-success/10 text-success p-3 rounded-2xl">
                            <Clock size={32} />
                        </div>
                    </div>

                    <div className="relative mb-12">
                        {steps.map((step, index) => (
                            <div key={step.status} className="flex gap-6 mb-8 relative last:mb-0">
                                <div className="flex flex-col items-center">
                                    <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${index <= currentStepIndex ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                                        {step.icon}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-1 h-full absolute top-10 ${index < currentStepIndex ? 'bg-primary' : 'bg-gray-100'}`} />
                                    )}
                                </div>
                                <div className="pt-2">
                                    <p className={`font-bold ${index <= currentStepIndex ? 'text-secondary' : 'text-gray-300'}`}>{step.label}</p>
                                    {index === currentStepIndex && (
                                        <motion.p 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }}
                                            className="text-primary text-xs font-bold"
                                        >
                                            In progress...
                                        </motion.p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto p-6 bg-gray-50 rounded-3xl border border-gray-100 text-center">
                        <p className="text-accent text-sm mb-4">
                            {supportAction ? "Need help with your order? Reach your delivery partner directly." : "Your order updates will appear here in real time."}
                        </p>
                        {supportAction ? (
                            <a href={supportAction} className="block w-full bg-secondary text-white py-3 rounded-2xl font-bold hover:bg-black transition-all">
                                Call Delivery Partner
                            </a>
                        ) : (
                            <button className="w-full bg-secondary/60 text-white py-3 rounded-2xl font-bold cursor-not-allowed">
                                Awaiting Delivery Partner
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
