import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle, Package, Clock, Utensils, Plus, Edit, Trash2, X, Upload } from "lucide-react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import FoodItemForm from "../components/FoodItemForm";
import { acceptOrder, fetchOwnerOrders, updateOrderStatus } from "../redux/slices/orderSlice";
import toast from "react-hot-toast";
import restaurantFallbackImg from "../assets/images/restaurant_fallback.png";
import foodHeroImg from "../assets/images/food_hero.png";

const OwnerDashboard = () => {
    const dispatch = useDispatch();
    const { orders, loading } = useSelector((state) => state.orders);
    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState("PLACED");
    const [menuItems, setMenuItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [showMenuManager, setShowMenuManager] = useState(false);

    const fetchMyRestaurant = async () => {
        try {
            const res = await api.get("/restaurants/my");
            setRestaurant(res.data.data);
            if (res.data.data) {
                const menuRes = await api.get(`/restaurants/${res.data.data._id}/menu`);
                setMenuItems(menuRes.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch restaurant data");
        }
    };

    useEffect(() => {
        dispatch(fetchOwnerOrders());
        fetchMyRestaurant();
    }, [dispatch]);

    const handleUpdateStatus = (orderId, status) => {
        if (status === "CONFIRMED") {
            dispatch(acceptOrder(orderId)).then((res) => {
                if (!res.error) toast.success("Order accepted! Assignment engine started.");
            });
        } else {
            dispatch(updateOrderStatus({ orderId, status }));
        }
    };

    const handleMenuSubmit = async (formData) => {
        try {
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };
            
            if (editingItem) {
                await api.put(`/food/${editingItem._id}`, formData, config);
                toast.success("Item updated successfully");
            } else {
                formData.append('restaurantId', restaurant._id);
                await api.post("/food", formData, config);
                toast.success("New item added to menu");
            }
            setShowMenuManager(false);
            setEditingItem(null);
            fetchMyRestaurant();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleRestaurantImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };
            // Use PUT to update the existing restaurant
            await api.put(`/restaurants/`, formData, config); 
            toast.success("Restaurant image updated!");
            fetchMyRestaurant();
        } catch (error) {
            toast.error("Failed to upload restaurant image");
        }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await api.delete(`/food/${id}`);
            toast.success("Item removed from menu");
            fetchMyRestaurant();
        } catch (error) {
            toast.error("Failed to delete item");
        }
    };

    const filteredOrders = orders.filter(o => o.status === activeTab);

    const tabs = [
        { id: "PLACED", label: "New", icon: <Bell className="text-swiggy-orange" /> },
        { id: "CONFIRMED", label: "Confirmed", icon: <CheckCircle className="text-success" /> },
        { id: "PREPARING", label: "Preparing", icon: <Clock className="text-blue-500" /> },
        { id: "READY_FOR_PICKUP", label: "Ready", icon: <Package className="text-purple-500" /> },
        { id: "MENU", label: "Manage Menu", icon: <Utensils className="text-secondary" /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-20">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-secondary font-heading">Restaurant Dashboard</h1>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? "bg-primary text-white shadow-md shadow-orange-100" 
                                    : "text-accent hover:bg-gray-50"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? "bg-white/20" : "bg-gray-100"}`}>
                                    {orders.filter(o => o.status === tab.id).length}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
                                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                                    <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
                                </div>
                                <div className="md:w-64 h-24 bg-gray-50 rounded-xl animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : activeTab === "MENU" ? (
                    <div className="space-y-8">
                        {/* Menu Header Area */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-50 shadow-inner">
                                        <img src={restaurant?.image || restaurantFallbackImg} className="w-full h-full object-cover" />
                                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                            <Upload size={20} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleRestaurantImageUpload} />
                                        </label>
                                    </div>
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-black text-secondary uppercase tracking-tight">{restaurant?.name || "Kitchen"}</h2>
                                    <p className="text-accent font-bold">Menu Items: {menuItems.length}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setEditingItem(null); setShowMenuManager(true); }}
                                className="bg-swiggy-orange text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all flex items-center gap-2 uppercase tracking-widest"
                            >
                                <Plus size={20} strokeWidth={3} /> Add New Dish
                            </button>
                        </div>

                        {/* Menu Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {menuItems.length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                    <Utensils className="mx-auto text-gray-200 mb-4" size={48} />
                                    <p className="text-accent font-bold">Your menu is empty. Start adding delicious items!</p>
                                </div>
                            ) : (
                                menuItems.map((item) => (
                                    <motion.div 
                                        key={item._id}
                                        whileHover={{ y: -5 }}
                                        className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all"
                                    >
                                        <div className="h-48 relative overflow-hidden">
                                            <img 
                                                src={item.image || foodHeroImg} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.isVeg ? 'bg-success text-white' : 'bg-red-500 text-white'}`}>
                                                    {item.isVeg ? 'Veg' : 'Non-Veg'}
                                                </span>
                                                {!item.isAvailable && (
                                                    <span className="bg-secondary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        Sold Out
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-black text-secondary leading-tight">{item.name}</h3>
                                                <span className="text-lg font-black text-swiggy-orange">₹{item.price}</span>
                                            </div>
                                            <p className="text-accent font-medium text-sm line-clamp-2 mb-6">{item.description}</p>
                                            
                                            <div className="flex gap-2 pt-4 border-t border-gray-50">
                                                <button 
                                                    onClick={() => { setEditingItem(item); setShowMenuManager(true); }}
                                                    className="flex-1 bg-gray-50 text-secondary py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors uppercase"
                                                >
                                                    <Edit size={14} /> Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteItem(item._id)}
                                                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <FoodItemForm 
                            isOpen={showMenuManager}
                            onClose={() => setShowMenuManager(false)}
                            onSubmit={handleMenuSubmit}
                            initialData={editingItem}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredOrders.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200"
                                >
                                    <Package className="mx-auto text-gray-200 mb-4" size={48} />
                                    <p className="text-accent font-medium text-lg">No {activeTab.toLowerCase()} orders at the moment.</p>
                                </motion.div>
                            ) : (
                                filteredOrders.map((order) => (
                                    <motion.div
                                        key={order._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="bg-orange-50 text-swiggy-orange px-3 py-1 rounded-full text-xs font-bold font-mono">
                                                        #{order._id.slice(-6).toUpperCase()}
                                                    </span>
                                                    <span className="text-accent text-sm">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                                <div className="space-y-3">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-secondary font-medium">
                                                            <span>{item.quantity} x {item.name}</span>
                                                            <span>₹{item.price * item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="md:w-64 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-50 pt-4 md:pt-0 md:pl-6">
                                                <div className="mb-4">
                                                    <p className="text-xs text-accent uppercase font-bold tracking-widest mb-1">Total Bill</p>
                                                    <p className="text-2xl font-black text-secondary font-heading">₹{order.totalAmount}</p>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    {order.status === "PLACED" && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleUpdateStatus(order._id, "CONFIRMED")}
                                                                className="flex-1 bg-success text-white py-2 rounded-lg font-bold hover:shadow-lg transition-all"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button 
                                                                onClick={() => handleUpdateStatus(order._id, "CANCELLED")}
                                                                className="flex-1 bg-gray-100 text-gray-500 py-2 rounded-lg font-bold hover:bg-red-50 hover:text-red-500 transition-all"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {order.status === "CONFIRMED" && (
                                                        <button 
                                                            onClick={() => handleUpdateStatus(order._id, "PREPARING")}
                                                            className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold hover:shadow-lg transition-all"
                                                        >
                                                            Start Preparing
                                                        </button>
                                                    )}
                                                    {order.status === "PREPARING" && (
                                                        <button 
                                                            onClick={() => handleUpdateStatus(order._id, "READY_FOR_PICKUP")}
                                                            className="w-full bg-purple-500 text-white py-2 rounded-lg font-bold hover:shadow-lg transition-all"
                                                        >
                                                            Mark as Ready
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
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

export default OwnerDashboard;
