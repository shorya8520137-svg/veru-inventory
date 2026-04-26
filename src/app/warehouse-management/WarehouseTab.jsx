"use client";

import React, { useState, useEffect } from "react";
import { Plus, Building2, MapPin, Phone, User, Search, Edit2, Trash2, X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function WarehouseTab() {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState("");
    const [editingId, setEditingId] = useState(null);

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

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const resetForm = () => {
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
        setEditingId(null);
    };

    const handleEdit = (warehouse) => {
        setFormData({
            warehouse_code: warehouse.warehouse_code,
            warehouse_name: warehouse.warehouse_name,
            address: warehouse.address,
            city: warehouse.city,
            state: warehouse.state,
            country: warehouse.country || "India",
            pincode: warehouse.pincode,
            phone: warehouse.phone,
            email: warehouse.email,
            manager_name: warehouse.manager_name,
            capacity: warehouse.capacity
        });
        setEditingId(warehouse.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this warehouse?")) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/warehouse-management/warehouses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMessage("Warehouse deleted successfully!");
                fetchWarehouses();
            } else {
                setMessage(data.message || "Failed to delete warehouse");
            }
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            setMessage("Error deleting warehouse");
        }
    };

    const fetchWarehouses = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/warehouse-management/warehouses`, {
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
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId 
                ? `${API_BASE}/api/warehouse-management/warehouses/${editingId}`
                : `${API_BASE}/api/warehouse-management/warehouses`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                setMessage(editingId ? "Warehouse updated successfully!" : "Warehouse created successfully!");
                setShowForm(false);
                resetForm();
                fetchWarehouses();
            } else {
                setMessage(data.message || "Failed to save warehouse");
            }
        } catch (error) {
            console.error('Error saving warehouse:', error);
            setMessage("Error saving warehouse");
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
        <div style={{height:"100%",background:"#F5F7FA",fontFamily:"Inter,sans-serif",padding:"0",display:"flex",flexDirection:"column",minHeight:0}}>
            {/* Message Display */}
            {message && (
                <div style={{padding:"12px 24px",background:"#DCFCE7",color:"#166534",fontSize:"14px",borderBottom:"1px solid #BBF7D0",flexShrink:0}}>
                    {message}
                </div>
            )}

            {/* Header with Search and Add Button */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 24px",borderBottom:"1px solid #E5E7EB",background:"#fff",gap:"12px",flexShrink:0}}>
                <div style={{position:"relative",flex:1,maxWidth:"300px"}}>
                    <svg style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#9CA3AF",width:"16px",height:"16px"}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input
                        type="text"
                        placeholder="Search warehouses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{width:"100%",paddingLeft:"36px",paddingRight:"12px",paddingTop:"8px",paddingBottom:"8px",border:"1.5px solid #E5E7EB",borderRadius:"8px",fontSize:"13px",fontFamily:"inherit",outline:"none"}}
                    />
                </div>
                <button
                    onClick={() => {resetForm(); setShowForm(true);}}
                    style={{display:"flex",alignItems:"center",gap:"6px",background:"#3B82F6",color:"#fff",border:"none",padding:"8px 16px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"600",fontFamily:"inherit",flexShrink:0}}
                >
                    <Plus size={16} /> Add Warehouse
                </button>
            </div>

            {/* Warehouses Grid - Edge to Edge */}
            <div style={{flex:1,overflowY:"auto",padding:"0",minHeight:0}}>
                {loading && warehouses.length === 0 ? (
                    <div style={{textAlign:"center",paddingTop:"40px",color:"#9CA3AF",fontSize:"14px"}}>Loading warehouses...</div>
                ) : filteredWarehouses.length === 0 ? (
                    <div style={{textAlign:"center",paddingTop:"40px",color:"#9CA3AF",fontSize:"14px"}}>
                        {searchTerm ? "No warehouses found" : "No warehouses yet"}
                    </div>
                ) : (
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:"0",padding:"0"}}>
                        {filteredWarehouses.map((warehouse) => (
                            <div key={warehouse.id} style={{background:"#fff",borderRight:"1px solid #E5E7EB",borderBottom:"1px solid #E5E7EB",padding:"16px",display:"flex",flexDirection:"column",gap:"12px"}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
                                    <div style={{display:"flex",alignItems:"center",gap:"10px",flex:1}}>
                                        <div style={{width:"40px",height:"40px",borderRadius:"8px",background:"#DBEAFE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                            <Building2 size={20} color="#3B82F6" />
                                        </div>
                                        <div style={{minWidth:0}}>
                                            <div style={{fontSize:"14px",fontWeight:"600",color:"#111827"}}>{warehouse.warehouse_name}</div>
                                            <div style={{fontSize:"12px",color:"#9CA3AF"}}>{warehouse.warehouse_code}</div>
                                        </div>
                                    </div>
                                    <div style={{display:"flex",gap:"6px"}}>
                                        <button
                                            onClick={() => handleEdit(warehouse)}
                                            style={{background:"none",border:"none",cursor:"pointer",padding:"4px",color:"#6B7280",transition:"color 0.2s"}}
                                            onMouseEnter={(e) => e.target.style.color = "#3B82F6"}
                                            onMouseLeave={(e) => e.target.style.color = "#6B7280"}
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(warehouse.id)}
                                            style={{background:"none",border:"none",cursor:"pointer",padding:"4px",color:"#6B7280",transition:"color 0.2s"}}
                                            onMouseEnter={(e) => e.target.style.color = "#EF4444"}
                                            onMouseLeave={(e) => e.target.style.color = "#6B7280"}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{display:"flex",flexDirection:"column",gap:"6px",fontSize:"13px"}}>
                                    <div style={{display:"flex",alignItems:"center",gap:"8px",color:"#6B7280"}}>
                                        <MapPin size={14} /> {warehouse.city}, {warehouse.state}
                                    </div>
                                    {warehouse.phone && (
                                        <div style={{display:"flex",alignItems:"center",gap:"8px",color:"#6B7280"}}>
                                            <Phone size={14} /> {warehouse.phone}
                                        </div>
                                    )}
                                    {warehouse.manager_name && (
                                        <div style={{display:"flex",alignItems:"center",gap:"8px",color:"#6B7280"}}>
                                            <User size={14} /> {warehouse.manager_name}
                                        </div>
                                    )}
                                </div>

                                <div style={{fontSize:"11px",color:"#9CA3AF",paddingTop:"8px",borderTop:"1px solid #F3F4F6"}}>
                                    Created: {new Date(warehouse.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
                    <div style={{background:"#fff",borderRadius:"12px",padding:"24px",width:"100%",maxWidth:"500px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
                            <h2 style={{margin:0,fontSize:"18px",fontWeight:"700",color:"#111827"}}>{editingId ? "Edit Warehouse" : "Add Warehouse"}</h2>
                            <button onClick={() => {setShowForm(false); resetForm();}} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:"24px"}}>×</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                                <div>
                                    <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"4px"}}>Warehouse Code *</label>
                                    <input 
                                        type="text" 
                                        name="warehouse_code" 
                                        value={formData.warehouse_code} 
                                        onChange={handleInputChange} 
                                        placeholder="GGM_WH" 
                                        style={{width:"100%",padding:"8px",border:"1px solid #E5E7EB",borderRadius:"6px",fontSize:"13px",fontFamily:"inherit",outline:"none"}} 
                                        required 
                                    />
                                    <div style={{fontSize:"11px",color:"#9CA3AF",marginTop:"4px"}}>
                                        Used for inventory tracking (e.g., GGM_WH, BLR_WH)
                                    </div>
                                </div>
                                <div>
                                    <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"4px"}}>Warehouse Name *</label>
                                    <input type="text" name="warehouse_name" value={formData.warehouse_name} onChange={handleInputChange} placeholder="Main Warehouse" style={{width:"100%",padding:"8px",border:"1px solid #E5E7EB",borderRadius:"6px",fontSize:"13px",fontFamily:"inherit",outline:"none"}} required />
                                </div>
                            </div>

                            <div>
                                <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"4px"}}>Address *</label>
                                <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Complete address" rows="2" style={{width:"100%",padding:"8px",border:"1px solid #E5E7EB",borderRadius:"6px",fontSize:"13px",fontFamily:"inherit",outline:"none",resize:"none"}} required />
                            </div>

                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
                                <div>
                                    <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"4px"}}>City *</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" style={{width:"100%",padding:"8px",border:"1px solid #E5E7EB",borderRadius:"6px",fontSize:"13px",fontFamily:"inherit",outline:"none"}} required />
                                </div>
                                <div>
                                    <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"4px"}}>State *</label>
                                    <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="State" style={{width:"100%",padding:"8px",border:"1px solid #E5E7EB",borderRadius:"6px",fontSize:"13px",fontFamily:"inherit",outline:"none"}} required />
                                </div>
                                <div>
                                    <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"4px"}}>Pincode *</label>
                                    <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="123456" style={{width:"100%",padding:"8px",border:"1px solid #E5E7EB",borderRadius:"6px",fontSize:"13px",fontFamily:"inherit",outline:"none"}} required />
                                </div>
                            </div>

                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                                <div>
                                    <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"4px"}}>Phone</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91-9999999999" style={{width:"100%",padding:"8px",border:"1px solid #E5E7EB",borderRadius:"6px",fontSize:"13px",fontFamily:"inherit",outline:"none"}} />
                                </div>
                                <div>
                                    <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"4px"}}>Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="email@insora.in" style={{width:"100%",padding:"8px",border:"1px solid #E5E7EB",borderRadius:"6px",fontSize:"13px",fontFamily:"inherit",outline:"none"}} />
                                </div>
                            </div>

                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                                <div>
                                    <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"4px"}}>Manager</label>
                                    <input type="text" name="manager_name" value={formData.manager_name} onChange={handleInputChange} placeholder="Manager name" style={{width:"100%",padding:"8px",border:"1px solid #E5E7EB",borderRadius:"6px",fontSize:"13px",fontFamily:"inherit",outline:"none"}} />
                                </div>
                                <div>
                                    <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"4px"}}>Capacity (sq ft)</label>
                                    <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} placeholder="50000" style={{width:"100%",padding:"8px",border:"1px solid #E5E7EB",borderRadius:"6px",fontSize:"13px",fontFamily:"inherit",outline:"none"}} />
                                </div>
                            </div>

                            <div style={{display:"flex",justifyContent:"flex-end",gap:"10px",paddingTop:"12px"}}>
                                <button type="button" onClick={() => {setShowForm(false); resetForm();}} style={{padding:"8px 16px",border:"1px solid #E5E7EB",borderRadius:"6px",background:"#fff",color:"#6B7280",cursor:"pointer",fontSize:"13px",fontWeight:"600",fontFamily:"inherit"}}>Cancel</button>
                                <button type="submit" disabled={loading} style={{padding:"8px 16px",background:"#3B82F6",color:"#fff",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"13px",fontWeight:"600",fontFamily:"inherit",opacity:loading?0.5:1}}>
                                    {loading ? "Saving..." : editingId ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}