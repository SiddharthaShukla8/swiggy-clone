import React, { useEffect, useState } from "react";
import { X, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSiteContent } from "../services/siteContent";

const FoodItemForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const createDefaultFormData = () => ({
        name: "",
        description: "",
        price: "",
        category: "",
        isVeg: true,
        image: "",
        isAvailable: true
    });
    const [formData, setFormData] = useState(initialData || createDefaultFormData());
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(initialData?.image || "");
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setPreviewUrl(initialData.image || "");
        } else {
            setFormData(createDefaultFormData());
            setPreviewUrl("");
        }
        setImageFile(null);
    }, [initialData]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        getSiteContent({ force: true })
            .then((content) => {
                const nextCategories = content?.forms?.menuCategories || [];
                setCategories(nextCategories);

                if (!initialData && nextCategories.length > 0) {
                    setFormData((current) => ({
                        ...current,
                        category: current.category || nextCategories[0],
                    }));
                }
            })
            .catch((error) => {
                console.error("Failed to load menu categories", error);
            });
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== 'image') data.append(key, formData[key]);
        });
        if (imageFile) {
            data.append('image', imageFile);
        } else if (formData.image) {
            data.append('image', formData.image);
        }
        onSubmit(data);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-secondary/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative z-10 overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">
                            {initialData ? "Edit Food Item" : "Add New Item"}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} className="text-accent" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Item Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-secondary focus:ring-2 focus:ring-swiggy-orange outline-none transition-all"
                                    placeholder="e.g. Butter Chicken"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Price (₹)</label>
                                <input
                                    required
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-secondary focus:ring-2 focus:ring-swiggy-orange outline-none transition-all"
                                    placeholder="299"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-secondary focus:ring-2 focus:ring-swiggy-orange outline-none transition-all appearance-none"
                                >
                                    {!formData.category && <option value="">Select category</option>}
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-secondary focus:ring-2 focus:ring-swiggy-orange outline-none transition-all h-24 resize-none"
                                placeholder="Tell us about this dish..."
                            />
                        </div>

                        <div>
                            <label className="text-[10px] text-accent font-black uppercase tracking-widest ml-1 mb-1 block">Item Image</label>
                            <div className="flex flex-col gap-4">
                                {previewUrl && (
                                    <div className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner">
                                        <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                        <button 
                                            type="button"
                                            onClick={() => { setImageFile(null); setPreviewUrl(""); }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-white transition-all shadow-lg"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="food-image-upload"
                                    />
                                    <label
                                        htmlFor="food-image-upload"
                                        className="flex items-center justify-center gap-3 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-swiggy-orange hover:bg-orange-50/30 transition-all group"
                                    >
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-accent group-hover:text-swiggy-orange transition-colors">
                                            <Upload size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-secondary uppercase tracking-tight">
                                                {imageFile ? "Change Image" : "Upload Image"}
                                            </p>
                                            <p className="text-[10px] text-accent font-bold uppercase tracking-widest">JPG, PNG or WEBP (Max 5MB)</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-2">
                                <div 
                                    onClick={() => setFormData({ ...formData, isVeg: !formData.isVeg })}
                                    className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${formData.isVeg ? 'bg-success' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isVeg ? 'right-1' : 'left-1'}`} />
                                </div>
                                <span className="font-bold text-secondary text-sm">{formData.isVeg ? 'Veg Only' : 'Contains Non-Veg'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div 
                                    onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                                    className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${formData.isAvailable ? 'bg-swiggy-orange' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isAvailable ? 'right-1' : 'left-1'}`} />
                                </div>
                                <span className="font-bold text-secondary text-sm">Available</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!formData.category}
                            className="w-full bg-swiggy-orange text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all uppercase tracking-widest mt-4"
                        >
                            {initialData ? "Update Item" : "Create Food Item"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FoodItemForm;
