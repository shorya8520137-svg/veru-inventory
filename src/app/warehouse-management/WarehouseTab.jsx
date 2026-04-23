"use client";

import React, { useState, useEffect } from "react";
import { Plus, Building2, MapPin, Phone, User, Edit, Trash2, Search } from "lucide-react";

const API_BASE = "";

export default function WarehouseTab() {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState("");

    const [formData, setFormData] = useState({
        warehouse_code: "",
        warehouse_name: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        phone: "",
        email: "",
        manager_name: "",
        capacity: ""
    });

    // Load warehouses on component mount
    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/warehouses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setWarehouses(data.warehouses);
            } else {
                setMessage("Failed to load warehouses");
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
            setMessage("Error loading warehouses");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/warehouses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                setMessage("Warehouse created successfully!");
                setShowForm(false);
                setFormData({
                    warehouse_code: "",
                    warehouse_name: "",
                    address: "",
                    city: "",
                    state: "",
                    country: "India",
                    pincode: "",
                    phone: "",
                    email: "",
                    manager_name: "",
                    capacity: ""
                });
                fetchWarehouses(); // Reload list
            } else {
                setMessage(data.message || "Failed to create warehouse");
            }
        } catch (error) {
            console.error('Error creating warehouse:', error);
            setMessage("Error creating warehouse");
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

    // Filter warehouses based on search term
    const filteredWarehouses = warehouses.filter(warehouse =>
        warehouse.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.warehouse_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.state.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search warehouses..."
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
                    Add Warehouse
                </button>
            </div>

            {/* Message Display */}
            {message && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
                    {message}
                </div>
            )}

            {/* Add Warehouse Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-xl font-semibold text-slate-900">Add New Warehouse</h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Warehouse Code *
                                    </label>
                                    <input
                                        type="text"
                                        name="warehouse_code"
                                        value={formData.warehouse_code}
                                        onChange={handleInputChange}
                                        placeholder="e.g., GGM_WH"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Warehouse Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="warehouse_name"
                                        value={formData.warehouse_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Gurgaon Main Warehouse"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
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
                                        Capacity (sq ft)
                                    </label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleInputChange}
                                        placeholder="Capacity in sq ft"
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
                                    {loading ? "Creating..." : "Create Warehouse"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Warehouses List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && warehouses.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-slate-500">
                        Loading warehouses...
                    </div>
                ) : filteredWarehouses.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-slate-500">
                        {searchTerm ? "No warehouses found matching your search" : "No warehouses found"}
                    </div>
                ) : (
                    filteredWarehouses.map((warehouse) => (
                        <div key={warehouse.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Building2 size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{warehouse.warehouse_name}</h3>
                                        <p className="text-sm text-slate-500">{warehouse.warehouse_code}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <MapPin size={16} />
                                    <span>{warehouse.city}, {warehouse.state}</span>
                                </div>
                                {warehouse.phone && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Phone size={16} />
                                        <span>{warehouse.phone}</span>
                                    </div>
                                )}
                                {warehouse.manager_name && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <User size={16} />
                                        <span>{warehouse.manager_name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-xs text-slate-500">
                                    Created: {new Date(warehouse.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}