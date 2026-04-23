"use client";

import React, { useState, useEffect } from "react";
import { Plus, Store, MapPin, Phone, User, Search } from "lucide-react";

const API_BASE = ""; // Use relative URLs for local API routes

export default function StoreTab() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState("");

    const [formData, setFormData] = useState({
        store_code: "",
        store_name: "",
        store_type: "retail",
        address: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        phone: "",
        email: "",
        manager_name: "",
        area_sqft: ""
    });

    // Load stores on component mount
    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/stores`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setStores(data.stores);
            } else {
                setMessage("Failed to load stores");
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
            setMessage("Error loading stores");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/stores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                setMessage("Store created successfully!");
                setShowForm(false);
                setFormData({
                    store_code: "",
                    store_name: "",
                    store_type: "retail",
                    address: "",
                    city: "",
                    state: "",
                    country: "India",
                    pincode: "",
                    phone: "",
                    email: "",
                    manager_name: "",
                    area_sqft: ""
                });
                fetchStores(); // Reload list
            } else {
                setMessage(data.message || "Failed to create store");
            }
        } catch (error) {
            console.error('Error creating store:', error);
            setMessage("Error creating store");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Filter stores based on search term
    const filteredStores = stores.filter(store =>
        store.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.store_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.store_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStoreTypeColor = (type) => {
        switch (type) {
            case 'retail': return 'bg-green-100 text-green-800';
            case 'wholesale': return 'bg-blue-100 text-blue-800';
            case 'online': return 'bg-purple-100 text-purple-800';
            case 'franchise': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search stores..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Store
                </button>
            </div>

            {/* Message Display */}
            {message && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
                    {message}
                </div>
            )}

            {/* Add Store Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-xl font-semibold text-slate-900">Add New Store</h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Store Code *
                                    </label>
                                    <input
                                        type="text"
                                        name="store_code"
                                        value={formData.store_code}
                                        onChange={handleInputChange}
                                        placeholder="e.g., GGM_ST01"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Store Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="store_name"
                                        value={formData.store_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Gurgaon Mall Store"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Store Type *
                                </label>
                                <select
                                    name="store_type"
                                    value={formData.store_type}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="retail">Retail</option>
                                    <option value="wholesale">Wholesale</option>
                                    <option value="online">Online</option>
                                    <option value="franchise">Franchise</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Address *
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Complete address"
                                    rows="2"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="City"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        placeholder="State"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Pincode *
                                    </label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        placeholder="Pincode"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Phone number"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Email address"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Manager Name
                                    </label>
                                    <input
                                        type="text"
                                        name="manager_name"
                                        value={formData.manager_name}
                                        onChange={handleInputChange}
                                        placeholder="Manager name"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Area (sq ft)
                                    </label>
                                    <input
                                        type="number"
                                        name="area_sqft"
                                        value={formData.area_sqft}
                                        onChange={handleInputChange}
                                        placeholder="Area in sq ft"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? "Creating..." : "Create Store"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stores List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && stores.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-slate-500">
                        Loading stores...
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-slate-500">
                        {searchTerm ? "No stores found matching your search" : "No stores found"}
                    </div>
                ) : (
                    filteredStores.map((store) => (
                        <div key={store.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Store size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{store.store_name}</h3>
                                        <p className="text-sm text-slate-500">{store.store_code}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStoreTypeColor(store.store_type)}`}>
                                    {store.store_type}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <MapPin size={16} />
                                    <span>{store.city}, {store.state}</span>
                                </div>
                                {store.phone && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Phone size={16} />
                                        <span>{store.phone}</span>
                                    </div>
                                )}
                                {store.manager_name && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <User size={16} />
                                        <span>{store.manager_name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-xs text-slate-500">
                                    Created: {new Date(store.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}