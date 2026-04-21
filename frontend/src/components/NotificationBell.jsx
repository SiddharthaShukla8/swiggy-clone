import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, Package, Truck, Info, Clock } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { markAllRead } from "../redux/slices/notificationSlice";

const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const { notifications, unreadCount } = useSelector((state) => state.notifications);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAllRead = () => {
        dispatch(markAllRead());
    };

    const getIcon = (type) => {
        switch (type) {
            case "NEW_ORDER": return <Package className="text-swiggy-orange" size={16} />;
            case "ORDER_UPDATE": return <Truck className="text-blue-500" size={16} />;
            default: return <Info className="text-accent" size={16} />;
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
            >
                <Bell className={`text-secondary group-hover:text-swiggy-orange transition-colors ${unreadCount > 0 ? 'animate-bounce-subtle' : ''}`} size={22} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-swiggy-orange text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                    >
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-black text-secondary uppercase tracking-tighter">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAllRead}
                                    className="text-[10px] font-black text-swiggy-orange uppercase tracking-widest hover:underline"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="text-gray-300" size={24} />
                                    </div>
                                    <p className="text-accent font-bold text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div 
                                        key={notif._id}
                                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-orange-50/30' : ''}`}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className="font-black text-secondary text-sm truncate pr-2">{notif.title}</h4>
                                                {!notif.isRead && <div className="w-2 h-2 bg-swiggy-orange rounded-full flex-shrink-0 mt-1.5" />}
                                            </div>
                                            <p className="text-accent text-xs font-medium leading-relaxed mb-2">{notif.message}</p>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-accent/60 uppercase">
                                                <Clock size={10} />
                                                {formatTimeAgo(notif.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                                <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:text-secondary transition-colors">
                                    View all activity
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
