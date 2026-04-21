import React from 'react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, Package, CheckCircle2, Clock, Trash2 } from 'lucide-react';

const NotificationPanel = ({ isOpen, onClose }) => {
    const { notifications, markAllAsRead } = useSocket();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[150]"
                    />
                    
                    {/* Panel */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="absolute right-0 top-16 w-[380px] bg-white rounded-[2rem] shadow-2xl z-[160] border border-gray-100 overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-surface/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-swiggy-orange/10 rounded-xl">
                                    <BellRing className="text-swiggy-orange w-5 h-5" />
                                </div>
                                <h3 className="font-black text-secondary tracking-tight">Activity Feed</h3>
                            </div>
                            {notifications.some(n => !n.read) && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-orange-600 transition-colors"
                                >
                                    Clear New
                                </button>
                            )}
                        </div>

                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <Bell className="text-gray-300 w-8 h-8" />
                                    </div>
                                    <p className="text-secondary font-black text-sm">No notifications yet</p>
                                    <p className="text-accent text-xs font-medium mt-1">We'll notify you when something important happens</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {notifications.map((notif) => (
                                        <div 
                                            key={notif.id}
                                            className={`p-5 border-b border-gray-50 hover:bg-gray-50 transition-all flex gap-4 relative group ${!notif.read ? 'bg-orange-50/20' : ''}`}
                                        >
                                            {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-swiggy-orange" />}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                notif.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {notif.type === 'success' ? <CheckCircle2 size={20} /> : <Package size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4 className="font-black text-secondary text-sm">{notif.title}</h4>
                                                    <div className="flex items-center gap-1 text-accent">
                                                        <Clock size={10} />
                                                        <span className="text-[10px] font-bold">{notif.time}</span>
                                                    </div>
                                                </div>
                                                <p className="text-accent text-xs font-medium leading-relaxed">{notif.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-4 bg-gray-50/50 text-center">
                                <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Showing latest 10 updates</p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationPanel;
