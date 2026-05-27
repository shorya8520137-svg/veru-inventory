"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Building2,
    Edit2,
    MapPin,
    Plus,
    Search,
    Trash2,
    Truck,
    User,
    X
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const shellStyle = {
    height: "100%",
    background: "#ffffff",
    fontFamily: "Inter,sans-serif",
    display: "flex",
    flexDirection: "column",
    minHeight: 0
};

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    background: "#fff"
};

export default function MasterDataTab({ type }) {
    const isLogistics = type === "logistics";
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState("");
    const [form, setForm] = useState({ name: "", location_code: "" });

    const locationOptions = useMemo(() => {
        const wh = warehouses.map((w) => ({
            code: w.warehouse_code,
            label: `${w.warehouse_name} (${w.warehouse_code})`,
            type: "Warehouse"
        }));
        const st = stores.map((s) => ({
            code: s.store_code,
            label: `${s.store_name} (${s.store_code})`,
            type: "Store"
        }));
        return [...wh, ...st];
    }, [warehouses, stores]);

    useEffect(() => {
        fetchItems();
        if (!isLogistics) {
            fetchLocations();
        }
    }, [type]);

    async function requestJson(url, options = {}) {
        const token = localStorage.getItem("token");
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {})
            }
        });
        return response.json();
    }

    async function fetchItems() {
        setLoading(true);
        try {
            const path = isLogistics ? "logistics" : "processed-by";
            const data = await requestJson(`${API_BASE}/api/warehouse-management/${path}`);
            if (data.success) {
                setItems(isLogistics ? data.logistics || [] : data.processedBy || []);
            } else {
                setMessage(data.message || "Failed to load data");
            }
        } catch (error) {
            console.error("Master data load error:", error);
            setMessage("Error loading data");
        } finally {
            setLoading(false);
        }
    }

    async function fetchLocations() {
        try {
            const [warehouseData, storeData] = await Promise.all([
                requestJson(`${API_BASE}/api/warehouse-management/warehouses`),
                requestJson(`${API_BASE}/api/warehouse-management/stores`)
            ]);
            if (warehouseData.success) setWarehouses(warehouseData.warehouses || []);
            if (storeData.success) setStores(storeData.stores || []);
        } catch (error) {
            console.error("Location load error:", error);
        }
    }

    function resetForm() {
        setForm({ name: "", location_code: "" });
        setEditingItem(null);
    }

    function openCreate() {
        resetForm();
        setShowForm(true);
    }

    function openEdit(item) {
        setEditingItem(item);
        setForm({
            name: item.name || "",
            location_code: item.location_code || ""
        });
        setShowForm(true);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const path = isLogistics ? "logistics" : "processed-by";
        const url = editingItem
            ? `${API_BASE}/api/warehouse-management/${path}/${editingItem.id}`
            : `${API_BASE}/api/warehouse-management/${path}`;

        const payload = isLogistics
            ? { name: form.name }
            : { name: form.name, location_code: form.location_code };

        try {
            const data = await requestJson(url, {
                method: editingItem ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            if (data.success) {
                setMessage(data.message || "Saved successfully");
                setShowForm(false);
                resetForm();
                fetchItems();
            } else {
                setMessage(data.message || "Failed to save");
            }
        } catch (error) {
            console.error("Master data save error:", error);
            setMessage("Error saving data");
        }
    }

    async function handleDelete(id) {
        if (!confirm(`Delete this ${isLogistics ? "logistics partner" : "processed-by user"}?`)) return;
        const path = isLogistics ? "logistics" : "processed-by";

        try {
            const data = await requestJson(`${API_BASE}/api/warehouse-management/${path}/${id}`, {
                method: "DELETE"
            });
            if (data.success) {
                setMessage(data.message || "Deleted successfully");
                fetchItems();
            } else {
                setMessage(data.message || "Failed to delete");
            }
        } catch (error) {
            console.error("Master data delete error:", error);
            setMessage("Error deleting data");
        }
    }

    const filteredItems = items.filter((item) => {
        const q = searchTerm.toLowerCase();
        return (
            String(item.name || "").toLowerCase().includes(q) ||
            String(item.location_code || "").toLowerCase().includes(q)
        );
    });

    const title = isLogistics ? "Logistics" : "Processed By";
    const addLabel = isLogistics ? "Add Logistics" : "Add User";
    const Icon = isLogistics ? Truck : User;

    return (
        <div style={shellStyle}>
            {message && (
                <div style={{ padding: "12px 24px", background: "#F0FDF4", color: "#166534", fontSize: "14px", borderBottom: "1px solid #BBF7D0", flexShrink: 0 }}>
                    {message}
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #E5E7EB", background: "#fff", gap: "12px", flexShrink: 0 }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "340px" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                    <input
                        type="text"
                        placeholder={`Search ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        style={{ ...inputStyle, paddingLeft: "38px", background: "#F9FAFB" }}
                    />
                </div>
                <button
                    onClick={openCreate}
                    style={{ display: "flex", alignItems: "center", gap: "7px", background: "#2563EB", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "inherit", boxShadow: "0 10px 20px rgba(37,99,235,0.18)" }}
                >
                    <Plus size={16} /> {addLabel}
                </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0", minHeight: 0 }}>
                {loading && items.length === 0 ? (
                    <div style={{ textAlign: "center", paddingTop: "40px", color: "#9CA3AF", fontSize: "14px" }}>Loading {title.toLowerCase()}...</div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ textAlign: "center", paddingTop: "40px", color: "#9CA3AF", fontSize: "14px" }}>
                        {searchTerm ? `No ${title.toLowerCase()} found` : `No ${title.toLowerCase()} yet`}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 0 }}>
                        {filteredItems.map((item) => (
                            <div key={item.id} style={{ background: "#fff", borderRight: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                                        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: isLogistics ? "#EFF6FF" : "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Icon size={20} color={isLogistics ? "#2563EB" : "#7C3AED"} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                                            {!isLogistics && (
                                                <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", color: "#6B7280", fontSize: "12px" }}>
                                                    <MapPin size={13} /> {item.location_code}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "4px" }}>
                                        <button onClick={() => openEdit(item)} style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", color: "#6B7280" }} title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", color: "#6B7280" }} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.28)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(8px)" }}>
                    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 30px 80px rgba(15,23,42,0.22)", border: "1px solid #EEF2F7" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "750", color: "#111827" }}>{editingItem ? `Edit ${title}` : addLabel}</h2>
                                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B7280" }}>
                                    {isLogistics ? "Available in self-transfer logistics dropdown." : "Available in self-transfer Processed By dropdown."}
                                </p>
                            </div>
                            <button onClick={() => { setShowForm(false); resetForm(); }} style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", cursor: "pointer", color: "#64748B", width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {!isLogistics && (
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#6B7280", marginBottom: "6px" }}>Warehouse or Store *</label>
                                    <div style={{ position: "relative" }}>
                                        <select
                                            value={form.location_code}
                                            onChange={(event) => setForm((prev) => ({ ...prev, location_code: event.target.value }))}
                                            style={{ ...inputStyle, appearance: "none", paddingRight: "38px" }}
                                            required
                                        >
                                            <option value="">Select location</option>
                                            {locationOptions.map((location) => (
                                                <option key={location.code} value={location.code}>
                                                    {location.type}: {location.label}
                                                </option>
                                            ))}
                                        </select>
                                        <Building2 size={16} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#6B7280", marginBottom: "6px" }}>{isLogistics ? "Logistics Name" : "User Name"} *</label>
                                <input
                                    value={form.name}
                                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                    placeholder={isLogistics ? "Delhivery" : "Staff name"}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                style={{ marginTop: "6px", border: "none", background: "#111827", color: "#fff", borderRadius: "10px", padding: "11px 16px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
                            >
                                {editingItem ? "Save Changes" : "Create"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
