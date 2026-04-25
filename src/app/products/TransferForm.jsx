"use client";
import React, { useEffect, useState } from "react";
import { X, Package, ArrowRight, Plus, Minus, Search, Truck, User, FileText, Ruler, Weight } from "lucide-react";

/* API ENDPOINTS */
const API = `${process.env.NEXT_PUBLIC_API_BASE}/api/dispatch`;
const PRODUCTS_API = `${process.env.NEXT_PUBLIC_API_BASE}/api/products`;

export default function TransferForm({ onClose }) {
    const [warehouses, setWarehouses] = useState([]);
    const [stores, setStores] = useState([]);
    const [logistics, setLogistics] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [products, setProducts] = useState([{ name: "", qty: 1, suggestions: [] }]);

    // Stock checking + UI states
    const [stockData, setStockData] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState("");

    const initialForm = {
        transferType: "W to W", // Main transfer type selector
        sourceWarehouse: "",
        sourceStore: "",
        destinationWarehouse: "",
        destinationStore: "",
        orderRef: "",
        awb: "",
        logistics: "",
        paymentMode: "",
        processedBy: "",
        invoiceAmount: "",
        weight: "",
        length: "",
        width: "",
        height: "",
        remarks: "",
    };

    const [form, setForm] = useState(initialForm);
    const update = (k, v) => setForm({ ...form, [k]: v });

    /* ------------------ LOAD DROPDOWNS ------------------ */
    useEffect(() => {
        const token = localStorage.getItem('token');
        
        // Load warehouses from dispatch API
        fetch(`${API}/warehouses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(setWarehouses);
        
        // Load logistics from dispatch API
        fetch(`${API}/logistics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(setLogistics);
        
        // Load executives from dispatch API
        fetch(`${API}/processed-persons`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(setExecutives);
        
        // Load stores from products API
        fetch(`${PRODUCTS_API}/stores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setStores(data.data);
                }
            })
            .catch(err => console.error('Error fetching stores:', err));
    }, []);

    /* ------------------ STOCK CHECKER ------------------ */
    const checkStock = async (barcode) => {
        if (!barcode || stockData[barcode]) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/product-tracking/${barcode}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStockData(prev => ({ ...prev, [barcode]: data.finalStock || 0 }));
        } catch {
            setStockData(prev => ({ ...prev, [barcode]: null }));
        }
    };

    /* ------------------ PRODUCT SEARCH ------------------ */
    const searchProduct = async (index, value) => {
        const updated = [...products];
        updated[index].name = value;

        if (value.length > 2) {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/search-products?query=${value}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            updated[index].suggestions = await res.json();
        } else {
            updated[index].suggestions = [];
        }
        setProducts(updated);

        // Extract barcode for stock check
        const barcodeMatch = value.match(/\| (\w+)$/);
        if (barcodeMatch) checkStock(barcodeMatch[1]);
    };

    const selectProduct = (index, value) => {
        const updated = [...products];
        updated[index].name = value;
        updated[index].suggestions = [];
        setProducts(updated);

        // Extract barcode for stock check
        const barcodeMatch = value.match(/\| (\w+)$/);
        if (barcodeMatch) checkStock(barcodeMatch[1]);
    };

    const addProduct = () =>
        setProducts([...products, { name: "", qty: 1, suggestions: [] }]);

    const removeProduct = (i) =>
        setProducts(products.filter((_, idx) => idx !== i));

    /* ------------------ SUBMIT TRANSFER ------------------ */
    const submitTransfer = async () => {
        if (loading) return;

        // Determine source and destination types
        let sourceType, sourceId, destinationType, destinationId;
        
        if (form.transferType === 'W to W') {
            sourceType = 'warehouse';
            sourceId = form.sourceWarehouse;
            destinationType = 'warehouse';
            destinationId = form.destinationWarehouse;
        } else if (form.transferType === 'W to S') {
            sourceType = 'warehouse';
            sourceId = form.sourceWarehouse;
            destinationType = 'store';
            destinationId = form.destinationStore;
        } else if (form.transferType === 'S to W') {
            sourceType = 'store';
            sourceId = form.sourceStore;
            destinationType = 'warehouse';
            destinationId = form.destinationWarehouse;
        } else if (form.transferType === 'S to S') {
            sourceType = 'store';
            sourceId = form.sourceStore;
            destinationType = 'store';
            destinationId = form.destinationStore;
        }

        // Build items array from products
        const items = products
            .filter(p => p.name && p.qty > 0)
            .map(p => ({
                productId: p.name.split('|')[2]?.trim() || p.name, // Extract barcode if available
                transferQty: p.qty,
                unit: 'units'
            }));

        if (items.length === 0) {
            setError('Please add at least one product');
            return;
        }

        const payload = {
            sourceType,
            sourceId,
            destinationType,
            destinationId,
            items,
            requiresShipment: false,
            notes: form.remarks,
            transferDate: new Date().toISOString()
        };

        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/self-transfer`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create transfer");
            }

            setShowSuccess(true);
            setTimeout(() => {
                setForm(initialForm);
                setProducts([{ name: "", qty: 1, suggestions: [] }]);
                setStockData({});
                setShowSuccess(false);
                onClose();
            }, 3000);

        } catch (err) {
            setError(err.message || "Transfer submission failed");
            setTimeout(() => setError(""), 5000);
        } finally {
            setLoading(false);
        }
    };

    /* ------------------ SUCCESS SCREEN ------------------ */
    if (showSuccess) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center',
                    maxWidth: '400px',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' }}>
                        Transfer Created Successfully!
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '20px' }}>
                        Transfer <strong>{form.orderRef}</strong> has been created successfully.
                    </p>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto'
                    }} />
                </div>
            </div>
        );
    }

    /* ------------------ MAIN FORM ------------------ */
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }} onClick={e => e.stopPropagation()}>
                {/* ERROR TOAST */}
                {error && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #fecaca',
                        zIndex: 1001,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>⚠️ {error}</span>
                        <button 
                            onClick={() => setError("")}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >×</button>
                    </div>
                )}

                {/* HEADER */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#0f172a',
                    padding: '24px',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Package size={24} />
                        <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>New Self Transfer</h1>
                        <span style={{
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}>
                            STF-{new Date().getFullYear()}-{String(Date.now()).slice(-4)}
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                        Move inventory between internal warehouse locations
                    </p>
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: '#f1f5f9',
                            border: 'none',
                            color: '#64748b',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#e2e8f0';
                            e.target.style.color = '#0f172a';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#f1f5f9';
                            e.target.style.color = '#64748b';
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* FORM CONTENT */}
                <div style={{ 
                    overflowY: 'auto', 
                    maxHeight: 'calc(90vh - 200px)',
                    padding: '0'
                }}>
                    <form onSubmit={(e) => { e.preventDefault(); submitTransfer(); }}>
                        {/* TRANSFER DETAILS SECTION */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <div style={{
                                    backgroundColor: '#0f172a',
                                    color: '#ffffff',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>1</div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                                    TRANSFER DETAILS
                                </h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                {/* Transfer Type */}
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        Transfer Type
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select 
                                            value={form.transferType} 
                                            onChange={e => {
                                                const newType = e.target.value;
                                                setForm({
                                                    ...form,
                                                    transferType: newType,
                                                    sourceWarehouse: "",
                                                    sourceStore: "",
                                                    destinationWarehouse: "",
                                                    destinationStore: ""
                                                });
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                backgroundColor: '#ffffff',
                                                cursor: 'pointer'
                                            }}
                                            required
                                        >
                                            <option value="W to W">Standard Inventory Move</option>
                                            <option value="W to S">Warehouse to Store</option>
                                            <option value="S to S">Store to Store</option>
                                            <option value="S to W">Store to Warehouse</option>
                                        </select>
                                        <Package size={16} style={{
                                            position: 'absolute',
                                            right: '32px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#9ca3af',
                                            pointerEvents: 'none'
                                        }} />
                                    </div>
                                </div>

                                {/* Logistics Partner */}
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        Logistics Partner
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select 
                                            value={form.logistics} 
                                            onChange={e => update("logistics", e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                backgroundColor: '#ffffff',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="">Select Logistics Partner</option>
                                            {logistics.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                        <Truck size={16} style={{
                                            position: 'absolute',
                                            right: '32px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#9ca3af',
                                            pointerEvents: 'none'
                                        }} />
                                    </div>
                                </div>
                            </div>

                            {/* Source and Destination Row */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr auto 1fr', 
                                gap: '16px', 
                                alignItems: 'end',
                                marginTop: '20px'
                            }}>
                                {/* Source Location */}
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        Source Location
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        {(form.transferType === 'W to W' || form.transferType === 'W to S') ? (
                                            <select 
                                                value={form.sourceWarehouse} 
                                                onChange={e => update("sourceWarehouse", e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 40px 10px 12px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    backgroundColor: '#ffffff'
                                                }}
                                                required
                                            >
                                                <option value="">Select Source Warehouse</option>
                                                {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                                            </select>
                                        ) : (
                                            <select 
                                                value={form.sourceStore} 
                                                onChange={e => update("sourceStore", e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 40px 10px 12px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    backgroundColor: '#ffffff'
                                                }}
                                                required
                                            >
                                                <option value="">Search Store...</option>
                                                {stores.map(store => (
                                                    <option key={store.store_code} value={store.store_code}>
                                                        {store.store_name} - {store.city}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <Search size={16} style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#9ca3af'
                                        }} />
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    padding: '10px'
                                }}>
                                    <div style={{
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <ArrowRight size={16} color="#6b7280" />
                                    </div>
                                </div>

                                {/* Destination Location */}
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        Destination Location
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        {(form.transferType === 'W to W' || form.transferType === 'S to W') ? (
                                            <select 
                                                value={form.destinationWarehouse} 
                                                onChange={e => update("destinationWarehouse", e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 40px 10px 12px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    backgroundColor: '#ffffff'
                                                }}
                                                required
                                            >
                                                <option value="">Select Destination Warehouse</option>
                                                {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                                            </select>
                                        ) : (
                                            <select 
                                                value={form.destinationStore} 
                                                onChange={e => update("destinationStore", e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 40px 10px 12px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    backgroundColor: '#ffffff'
                                                }}
                                                required
                                            >
                                                <option value="">Search Store...</option>
                                                {stores.map(store => (
                                                    <option key={store.store_code} value={store.store_code}>
                                                        {store.store_name} - {store.city}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <Search size={16} style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#9ca3af'
                                        }} />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Fields Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        Order Reference
                                    </label>
                                    <input
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Enter Order Reference"
                                        value={form.orderRef}
                                        onChange={e => update("orderRef", e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        AWB Number
                                    </label>
                                    <input
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Enter AWB Number"
                                        value={form.awb}
                                        onChange={e => update("awb", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        Payment Mode
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select 
                                            value={form.paymentMode} 
                                            onChange={e => update("paymentMode", e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                backgroundColor: '#ffffff'
                                            }}
                                        >
                                            <option value="">Select Payment Mode</option>
                                            <option>Internal</option>
                                            <option>Transfer</option>
                                            <option>Adjustment</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        Processed By
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select 
                                            value={form.processedBy} 
                                            onChange={e => update("processedBy", e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 40px 10px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                backgroundColor: '#ffffff'
                                            }}
                                        >
                                            <option value="">Select Executive</option>
                                            {executives.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        <User size={16} style={{
                                            position: 'absolute',
                                            right: '32px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#9ca3af',
                                            pointerEvents: 'none'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PARCEL DIMENSIONS SECTION */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <div style={{
                                    backgroundColor: '#0f172a',
                                    color: '#ffffff',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>2</div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                                    PARCEL DIMENSIONS
                                </h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                <div>
                                    <label style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        <Weight size={14} />
                                        Weight (kg)
                                    </label>
                                    <input
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Enter weight"
                                        value={form.weight}
                                        onChange={e => update("weight", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        <Ruler size={14} />
                                        Length (cm)
                                    </label>
                                    <input
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Enter length"
                                        value={form.length}
                                        onChange={e => update("length", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        <Ruler size={14} />
                                        Width (cm)
                                    </label>
                                    <input
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Enter width"
                                        value={form.width}
                                        onChange={e => update("width", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        color: '#374151', 
                                        marginBottom: '6px' 
                                    }}>
                                        <Ruler size={14} />
                                        Height (cm)
                                    </label>
                                    <input
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Enter height"
                                        value={form.height}
                                        onChange={e => update("height", e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div style={{ marginTop: '20px' }}>
                                <label style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '13px', 
                                    fontWeight: '500', 
                                    color: '#374151', 
                                    marginBottom: '6px' 
                                }}>
                                    <FileText size={14} />
                                    Internal Notes
                                </label>
                                <textarea
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        minHeight: '80px'
                                    }}
                                    placeholder="Add any special instructions or handling details here..."
                                    value={form.remarks}
                                    onChange={e => update("remarks", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* PRODUCT LIST SECTION */}
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        backgroundColor: '#0f172a',
                                        color: '#ffffff',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>3</div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                                        PRODUCT LIST
                                    </h3>
                                </div>
                                <div style={{
                                    backgroundColor: '#f3f4f6',
                                    color: '#6b7280',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }}>
                                    Total Selected: {products.length} Items
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <input
                                    style={{
                                        width: '100%',
                                        padding: '12px 40px 12px 16px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        backgroundColor: '#f9fafb'
                                    }}
                                    placeholder="Search by Product Name, SKU, or Scan Barcode..."
                                    value={products[0]?.name || ''}
                                    onChange={e => searchProduct(0, e.target.value)}
                                />
                                <Search size={16} style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af'
                                }} />
                            </div>

                            {/* Product Items */}
                            {products.map((p, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    marginBottom: '12px',
                                    backgroundColor: '#ffffff'
                                }}>
                                    {/* Product Image Placeholder */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Package size={20} color="#9ca3af" />
                                    </div>

                                    {/* Product Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {p.name ? (
                                            <>
                                                <div style={{ 
                                                    fontSize: '14px', 
                                                    fontWeight: '500', 
                                                    color: '#0f172a',
                                                    marginBottom: '4px'
                                                }}>
                                                    {p.name.split('|')[0]?.trim() || 'Unknown Product'}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: '#6b7280',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    SKU: {p.name.split('|')[2]?.trim() || 'N/A'}
                                                </div>
                                                {p.name.split('|')[2] && stockData[p.name.split('|')[2]?.trim()] !== undefined && (
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#059669',
                                                        marginTop: '2px'
                                                    }}>
                                                        📦 {stockData[p.name.split('|')[2]?.trim()] || 0} units available
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div style={{ 
                                                fontSize: '14px', 
                                                color: '#9ca3af',
                                                fontStyle: 'italic'
                                            }}>
                                                Search for a product...
                                            </div>
                                        )}

                                        {/* Suggestions Dropdown */}
                                        {p.suggestions.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                                                zIndex: 10,
                                                maxHeight: '200px',
                                                overflowY: 'auto'
                                            }}>
                                                {p.suggestions.map(s => (
                                                    <div
                                                        key={s.barcode}
                                                        style={{
                                                            padding: '12px',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid #f3f4f6',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                                                        onClick={() => selectProduct(i, `${s.product_name} | ${s.product_variant} | ${s.barcode}`)}
                                                    >
                                                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>
                                                            {s.product_name}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                            {s.product_variant} • {s.barcode}
                                                        </div>
                                                        {stockData[s.barcode] !== undefined && (
                                                            <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                                                                📦 {stockData[s.barcode] || 0} units available
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity Controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const u = [...products];
                                                u[i].qty = Math.max(1, (u[i].qty || 1) - 1);
                                                setProducts(u);
                                            }}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                backgroundColor: '#ffffff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        
                                        <input
                                            type="number"
                                            style={{
                                                width: '60px',
                                                padding: '8px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                textAlign: 'center',
                                                fontSize: '14px'
                                            }}
                                            value={p.qty || 1}
                                            min="1"
                                            onChange={e => {
                                                const u = [...products];
                                                u[i].qty = parseInt(e.target.value) || 1;
                                                setProducts(u);
                                            }}
                                        />
                                        
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const u = [...products];
                                                u[i].qty = (u[i].qty || 1) + 1;
                                                setProducts(u);
                                            }}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                backgroundColor: '#ffffff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    {/* Remove Button */}
                                    {products.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeProduct(i)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                border: '1px solid #fecaca',
                                                borderRadius: '6px',
                                                backgroundColor: '#fef2f2',
                                                color: '#dc2626',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Add Another Product Button */}
                            <button
                                type="button"
                                onClick={addProduct}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px dashed #d1d5db',
                                    borderRadius: '8px',
                                    backgroundColor: '#f9fafb',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.backgroundColor = '#eff6ff';
                                    e.target.style.color = '#3b82f6';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.backgroundColor = '#f9fafb';
                                    e.target.style.color = '#6b7280';
                                }}
                            >
                                <Plus size={16} />
                                Add Another Product
                            </button>

                            {/* Summary */}
                            <div style={{
                                marginTop: '24px',
                                padding: '20px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                                            ${(products.reduce((sum, p) => sum + (p.qty || 1) * 50, 0)).toLocaleString()}.00
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                            Est. Value
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                            {products.reduce((sum, p) => sum + (p.qty || 1), 0)} items
                                        </div>
                                    </div>
                                </div>

                                {/* Status Indicators */}
                                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#10b981',
                                            borderRadius: '50%'
                                        }} />
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Inventory Reserved</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#3b82f6',
                                            borderRadius: '50%'
                                        }} />
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Routing Optimized</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#8b5cf6',
                                            borderRadius: '50%'
                                        }} />
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Insurance Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* FOOTER */}
                <div style={{
                    padding: '20px 24px',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                    minHeight: '80px'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Cancel
                    </button>
                    
                    <button
                        type="submit"
                        onClick={submitTransfer}
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: loading ? '#9ca3af' : '#0f172a',
                            color: '#ffffff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#1e293b';
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#0f172a';
                        }}
                    >
                        {loading ? (
                            <>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid transparent',
                                    borderTop: '2px solid #ffffff',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                Creating Transfer...
                            </>
                        ) : (
                            <>
                                <ArrowRight size={16} />
                                Submit Transfer
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Add CSS animation for spinner */}
            <style jsx>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
