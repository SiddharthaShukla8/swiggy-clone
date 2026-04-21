import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
    Users, 
    Store, 
    BarChart3, 
    ShieldCheck, 
    UserX, 
    CheckCircle2, 
    XCircle,
    TrendingUp,
    ShoppingBag,
    IndianRupee,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('analytics');
    const [users, setUsers] = useState([]);
    const [pendingRestaurants, setPendingRestaurants] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Filtering and Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'analytics') {
                const res = await api.get('/admin/analytics');
                setAnalytics(res.data.data.stats);
            } else if (activeTab === 'users') {
                const res = await api.get('/admin/users', {
                    params: { 
                        page, 
                        q: searchQuery, 
                        role: roleFilter 
                    }
                });
                setUsers(res.data.data.users);
                setTotalPages(res.data.data.pagination.pages);
            } else if (activeTab === 'approvals') {
                const res = await api.get('/admin/restaurants/pending');
                setPendingRestaurants(res.data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch admin data");
        } finally {
            setLoading(false);
        }
    }, [activeTab, page, searchQuery, roleFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleUser = async (userId) => {
        try {
            const res = await api.patch(`/admin/users/${userId}/toggle-status`);
            toast.success(res.data.message);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Action failed");
        }
    };

    const handleApproveRestaurant = async (id, approve) => {
        try {
            const res = await api.patch(`/admin/restaurants/${id}/approve`, { approve });
            toast.success(res.data.message);
            fetchData();
        } catch (error) {
            toast.error("Approval action failed");
        }
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-gray-100 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-accent text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-secondary">{value}</h3>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface p-4 md:p-8 pt-20">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary flex items-center gap-3 tracking-tighter">
                            <ShieldCheck className="text-primary w-8 h-8" />
                            Admin Command Center
                        </h1>
                        <p className="text-accent mt-1 font-medium">Manage platform growth and governance</p>
                    </div>
                </header>

                {/* Tabs Navigation */}
                <div className="flex bg-white p-1 rounded-2xl shadow-sm mb-8 w-fit border border-gray-100">
                    {[
                        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'approvals', label: 'Approvals', icon: Store },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setPage(1); // Reset page on tab change
                            }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                                activeTab === tab.id 
                                ? 'bg-secondary text-white shadow-xl scale-[1.02]' 
                                : 'text-accent hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'users' && !loading && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-gray-100 flex flex-col md:flex-row gap-4"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={18} />
                                <input 
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full pl-12 pr-4 py-3 bg-surface rounded-xl border-none focus:ring-2 focus:ring-primary/20 font-medium text-secondary"
                                />
                            </div>
                            <div className="flex items-center gap-3 bg-surface px-4 py-3 rounded-xl">
                                <Filter size={18} className="text-accent" />
                                <select 
                                    value={roleFilter}
                                    onChange={(e) => {
                                        setRoleFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="bg-transparent border-none focus:ring-0 font-bold text-secondary text-sm cursor-pointer"
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="CUSTOMER">Customers</option>
                                    <option value="RESTAURANT_OWNER">Owners</option>
                                    <option value="DELIVERY_PARTNER">Delivery</option>
                                </select>
                            </div>
                        </motion.div>
                    )}

                    {loading ? (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-40"
                        >
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-accent font-black uppercase tracking-[0.3em] text-[10px]">Processing platform data...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="pb-20"
                        >
                            {activeTab === 'analytics' && analytics && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard title="Total Customers" value={analytics.totalUsers} icon={Users} color="bg-blue-500" />
                                    <StatCard title="Restaurant Partners" value={analytics.totalOwners} icon={Store} color="bg-purple-500" />
                                    <StatCard title="Orders Delivered" value={analytics.totalOrders} icon={ShoppingBag} color="bg-green-500" />
                                    <StatCard title="Total Revenue" value={`₹${analytics.totalRevenue.toLocaleString()}`} icon={IndianRupee} color="bg-swiggy-orange" />
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <>
                                    <div className="bg-white rounded-[2rem] shadow-premium overflow-hidden border border-gray-100 mb-6">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100">
                                                    <tr>
                                                        <th className="px-8 py-5 text-xs font-black text-accent uppercase tracking-widest">User Details</th>
                                                        <th className="px-8 py-5 text-xs font-black text-accent uppercase tracking-widest">Platform Role</th>
                                                        <th className="px-8 py-5 text-xs font-black text-accent uppercase tracking-widest">Status</th>
                                                        <th className="px-8 py-5 text-xs font-black text-accent uppercase tracking-widest text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {users.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="4" className="px-8 py-20 text-center text-accent italic font-medium">No users found matching your criteria</td>
                                                        </tr>
                                                    ) : users.map((user) => (
                                                        <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                                            <td className="px-8 py-6">
                                                                <div className="font-black text-secondary group-hover:text-primary transition-colors">{user.name || user.fullName}</div>
                                                                <div className="text-sm text-accent font-medium">{user.email}</div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={`text-[10px] px-3 py-1.5 rounded-lg font-black tracking-widest border ${
                                                                    user.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                    user.role === 'RESTAURANT_OWNER' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    'bg-green-50 text-green-600 border-green-100'
                                                                }`}>
                                                                    {user.role}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
                                                                    <span className="text-sm text-secondary font-bold">{user.isActive ? 'Active' : 'Restricted'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                {user.role !== 'ADMIN' && (
                                                                    <motion.button 
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => handleToggleUser(user._id)}
                                                                        className={`p-3 rounded-xl transition-all ${
                                                                            user.isActive 
                                                                            ? 'text-red-500 bg-red-50/50 hover:bg-red-500 hover:text-white' 
                                                                            : 'text-green-500 bg-green-50/50 hover:bg-green-500 hover:text-white'
                                                                        }`}
                                                                    >
                                                                        {user.isActive ? <UserX size={20} /> : <CheckCircle2 size={20} />}
                                                                    </motion.button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-4">
                                            <button 
                                                disabled={page === 1}
                                                onClick={() => setPage(prev => prev - 1)}
                                                className="p-3 rounded-2xl bg-white shadow-sm border border-gray-100 disabled:opacity-30 hover:shadow-md transition-all text-secondary"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <div className="flex gap-2">
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <button
                                                        key={i + 1}
                                                        onClick={() => setPage(i + 1)}
                                                        className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${
                                                            page === i + 1 
                                                            ? 'bg-secondary text-white shadow-lg scale-110' 
                                                            : 'bg-white text-accent hover:bg-gray-50 border border-gray-100'
                                                        }`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                disabled={page === totalPages}
                                                onClick={() => setPage(prev => prev + 1)}
                                                className="p-3 rounded-2xl bg-white shadow-sm border border-gray-100 disabled:opacity-30 hover:shadow-md transition-all text-secondary"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'approvals' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {pendingRestaurants.length === 0 ? (
                                        <div className="col-span-full py-40 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
                                            <Store className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                            <p className="text-accent font-bold uppercase tracking-widest text-xs">All restaurant applications cleared</p>
                                        </div>
                                    ) : (
                                        pendingRestaurants.map((record) => (
                                            <motion.div 
                                                key={record._id} 
                                                layout
                                                className="bg-white p-6 rounded-[2rem] shadow-premium border border-gray-100 hover:shadow-hover transition-all"
                                            >
                                                <div className="flex gap-4 mb-6">
                                                    <div className="relative">
                                                        <img src={record.image || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                                                        <div className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-lg">
                                                            <Store size={14} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-secondary leading-tight">{record.name}</h4>
                                                        <p className="text-xs text-accent font-medium line-clamp-2 mt-1">{record.address}</p>
                                                        <div className="mt-4 flex flex-col gap-1">
                                                            <span className="text-[10px] uppercase font-black tracking-widest text-accent">Applied By</span>
                                                            <span className="text-xs font-bold text-secondary">{record.ownerId?.name || record.ownerId?.fullName}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={() => handleApproveRestaurant(record._id, true)}
                                                        className="flex-1 bg-green-500 text-white py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-green-100 hover:bg-green-600 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                                                    >
                                                        <CheckCircle2 size={16} /> Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleApproveRestaurant(record._id, false)}
                                                        className="flex-1 bg-surface text-secondary py-3.5 rounded-2xl text-xs font-black hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest border border-gray-100"
                                                    >
                                                        <XCircle size={16} /> Reject
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminDashboard;
