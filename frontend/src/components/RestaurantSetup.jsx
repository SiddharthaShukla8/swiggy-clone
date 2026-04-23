import React, { useState } from "react";
import { Store, MapPin, Upload } from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";

const RestaurantSetup = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        address: "",
        lat: 28.7041,
        lng: 77.1025,
        cuisines: "",
        deliveryTime: 30,
        isPureVeg: false
    });
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("description", formData.description);
            data.append("address", formData.address);
            data.append("deliveryTime", formData.deliveryTime);
            data.append("isPureVeg", formData.isPureVeg);
            
            // Add cuisines as array
            const cuisinesArray = formData.cuisines.split(",").map(c => c.trim()).filter(Boolean);
            cuisinesArray.forEach(c => data.append("cuisines", c));

            // Append location as JSON string for safe parsing
            data.append("location", JSON.stringify({ 
                type: "Point", 
                coordinates: [Number(formData.lng), Number(formData.lat)] 
            }));

            if (imageFile) {
                data.append("image", imageFile);
            }

            const res = await api.post("/restaurants", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success("Restaurant profile created successfully!");
            onComplete(res.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to setup restaurant");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-orange-50 text-swiggy-orange rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Store size={40} />
                </div>
                <h2 className="text-3xl font-black text-secondary uppercase tracking-tight">Set up your Restaurant</h2>
                <p className="text-accent font-bold mt-2">Before you can manage your menu or receive orders, you need to create your restaurant profile.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Restaurant Name</label>
                    <input
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-secondary focus:ring-2 focus:ring-swiggy-orange outline-none"
                        placeholder="E.g. Sushi Sakura"
                    />
                </div>

                <div>
                    <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Address</label>
                    <input
                        required
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-secondary focus:ring-2 focus:ring-swiggy-orange outline-none"
                        placeholder="E.g. 123 Main St, New Delhi"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Cuisines (Comma separated)</label>
                        <input
                            required
                            value={formData.cuisines}
                            onChange={e => setFormData({...formData, cuisines: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-secondary focus:ring-2 focus:ring-swiggy-orange outline-none"
                            placeholder="E.g. Indian, Chinese"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Delivery Time (Mins)</label>
                        <input
                            required
                            type="number"
                            value={formData.deliveryTime}
                            onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-secondary focus:ring-2 focus:ring-swiggy-orange outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-secondary focus:ring-2 focus:ring-swiggy-orange outline-none resize-none h-24"
                        placeholder="Tell customers about your place..."
                    />
                </div>

                <div>
                    <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Restaurant Cover Image</label>
                    <div className="relative h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-swiggy-orange transition-colors">
                        {previewUrl ? (
                            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                            <div className="text-center text-accent">
                                <Upload size={24} className="mx-auto mb-2" />
                                <span className="font-bold text-sm">Upload Photo</span>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl">
                    <div 
                        onClick={() => setFormData({ ...formData, isPureVeg: !formData.isPureVeg })}
                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${formData.isPureVeg ? 'bg-success' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isPureVeg ? 'right-1' : 'left-1'}`} />
                    </div>
                    <span className="font-bold text-secondary text-sm">Pure Veg Restaurant</span>
                </div>

                <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full bg-swiggy-orange text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-colors"
                >
                    {loading ? "Creating..." : "Create Restaurant Profile"}
                </button>
            </form>
        </div>
    );
};

export default RestaurantSetup;
