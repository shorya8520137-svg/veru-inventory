// HTTPS FIX - 20260218141500 - SECURE API DOMAIN
// Updated to https://api.giftgala.in - MIXED CONTENT FIX
// This deployment MUST use HTTPS for security compliance

"use client";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./websiteorder.module.css";
import { Download, X } from "lucide-react";
import * as XLSX from "xlsx";

// FORCE HTTPS API URL - SECURITY FIX
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';
const API = `${API_BASE}/api/website/orders`;
const ROWS_PER_PAGE = 6;

// HTTPS DEPLOYMENT ALERT - 20260218141500
console.log('🔒 HTTPS DEPLOYMENT - SECURE API DOMAIN - 20260218141500');
console.log('🔒 API Base URL:', API_BASE);
console.log('🔒 Full API URL:', API);
console.log('🔒 Environment NEXT_PUBLIC_API_BASE:', process.env.NEXT_PUBLIC_API_BASE);

// Force git to detect changes - v5 - HTTPS SECURITY FIX
export default function WebsiteOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addressModal, setAddressModal] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState({});

    const [search, setSearch] = useState("");
    const [chips, setChips] = useState([]);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [page, setPage] = useState(1);

    /* ---------------- FETCH ---------------- */
    useEffect(() => {
        // HTTPS SECURITY FIX - 20260218141500
        console.log('🔒 USEEFFECT RUNNING - HTTPS SECURITY FIX 20260218141500');
        console.log('🔒 Using SECURE API URL:', API);
        console.log('🔒 API Base from env:', API_BASE);
        
        const token = localStorage.getItem('token');
        const apiUrl = `${API}?page=1&limit=100&cachebust=${Date.now()}`;
        
        // DEBUG: Log what we're calling - HTTPS VERSION
        console.log('🔍 HTTPS FRONTEND DEBUG - 20260218141500:');
        console.log('- API constant:', API);
        console.log('- API_BASE constant:', API_BASE);
        console.log('- Full URL:', apiUrl);
        console.log('- Protocol:', apiUrl.startsWith('https://') ? 'HTTPS ✅' : 'HTTP ❌');
        console.log('- Token exists:', !!token);
        console.log('- Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        console.log('- Current timestamp:', new Date().toISOString());
        
        fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => {
                console.log('📡 HTTPS DEBUG - Response status:', r.status);
                console.log('📡 HTTPS DEBUG - Response URL:', r.url);
                console.log('📡 HTTPS DEBUG - Protocol:', r.url.startsWith('https://') ? 'HTTPS ✅' : 'HTTP ❌');
                return r.json();
            })
            .then(res => {
                console.log('📦 HTTPS DEBUG - FULL API RESPONSE:', res);
                console.log('📦 HTTPS DEBUG - Response type:', typeof res);
                console.log('📦 HTTPS DEBUG - Response keys:', Object.keys(res));
                
                // Handle both old and new API response formats
                const ordersData = res.data?.orders || res.orders || [];
                console.log('📋 HTTPS DEBUG - Orders data:', ordersData);
                console.log('📋 HTTPS DEBUG - Orders length:', ordersData.length);
                
                if (ordersData.length > 0) {
                    console.log('📋 HTTPS DEBUG - First order:', ordersData[0]);
                    console.log('📋 HTTPS DEBUG - First order products:', ordersData[0]?.products);
                    if (ordersData[0]?.products && ordersData[0].products.length > 0) {
                        console.log('📋 HTTPS DEBUG - First product name:', ordersData[0].products[0]?.product_name);
                    }
                    
                    // Debug each order's products - HTTPS VERSION
                    ordersData.forEach((order, index) => {
                        console.log(`📋 HTTPS DEBUG - Order ${index + 1} (${order.order_number}):`);
                        console.log(`   - Item count: ${order.item_count}`);
                        console.log(`   - Products exists: ${!!order.products}`);
                        console.log(`   - Products is array: ${Array.isArray(order.products)}`);
                        console.log(`   - Products length: ${order.products?.length || 0}`);
                        if (order.products && order.products.length > 0) {
                            order.products.forEach((product, pIndex) => {
                                console.log(`   - HTTPS DEBUG - Product ${pIndex + 1}: ${product.product_name}`);
                            });
                        } else {
                            console.log(`   - HTTPS DEBUG - NO PRODUCTS FOUND!`);
                        }
                    });
                }
                
                setOrders(ordersData);
            })
            .catch(err => {
                console.error('❌ HTTPS DEBUG - FRONTEND ERROR:', err);
                console.error('❌ HTTPS DEBUG - Error details:', err.message);
                console.error('❌ HTTPS DEBUG - Mixed content issue?', err.message.includes('Mixed Content'));
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    /* ---------------- CHIPS ---------------- */
    const addChip = value => {
        const v = value.trim();
        if (!v || chips.includes(v)) return;
        setChips([...chips, v]);
        setSearch("");
    };

    const onKeyDown = e => {
        if (e.key === "Enter") {
            e.preventDefault();
            addChip(search);
        }
        if (e.key === "Backspace" && !search && chips.length) {
            setChips(chips.slice(0, -1));
        }
    };

    /* ---------------- SUGGESTIONS ---------------- */
    const suggestions = useMemo(() => {
        if (!search) return [];
        const q = search.toLowerCase();
        const pool = new Set();

        orders.forEach(o => {
            if (o.customer_name) pool.add(o.customer_name);
            if (o.customer_email) pool.add(o.customer_email);
            if (o.customer_phone) pool.add(o.customer_phone);
            if (o.status) pool.add(o.status);
            if (o.order_number) pool.add(o.order_number);
            if (o.tracking_number) pool.add(o.tracking_number);
        });

        return [...pool].filter(
            v => v.toLowerCase().includes(q) && !chips.includes(v)
        ).slice(0, 6);
    }, [search, orders, chips]);

    /* ---------------- FILTER ---------------- */
    const filtered = useMemo(() => {
        return orders.filter(o => {
            const text = `${o.customer_name} ${o.customer_email} ${o.customer_phone} ${o.status} ${o.order_number} ${o.tracking_number}`.toLowerCase();
            const chipMatch = chips.every(c => text.includes(c.toLowerCase()));

            const d = o.order_date || o.created_at ? new Date(o.order_date || o.created_at) : null;
            const after = fromDate ? d >= new Date(fromDate) : true;
            const before = toDate ? d <= new Date(toDate) : true;

            return chipMatch && after && before;
        });
    }, [orders, chips, fromDate, toDate]);

    /* ---------------- PAGINATION ---------------- */
    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    const pagedData = filtered.slice(
        (page - 1) * ROWS_PER_PAGE,
        page * ROWS_PER_PAGE
    );

    /* ---------------- EXPORT ---------------- */
    const exportExcel = () => {
        const data = filtered.map(o => ({
            OrderNumber: o.order_number || o.id,
            CustomerName: o.customer_name,
            CustomerEmail: o.customer_email,
            CustomerPhone: o.customer_phone,
            ShippingAddress: o.shipping_address_text,
            Items: o.item_count,
            TotalAmount: o.total_amount,
            Currency: o.currency,
            PaymentMethod: o.payment_method,
            PaymentStatus: o.payment_status,
            TrackingNumber: o.tracking_number,
            Status: o.status,
            OrderDate: o.order_date || o.created_at,
            EstimatedDelivery: o.estimated_delivery,
            ActualDelivery: o.actual_delivery,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Website Orders");
        XLSX.writeFile(wb, "website_orders.xlsx");
    };

    /* ---------------- STATUS UPDATE ---------------- */
    const updateOrderStatus = async (orderId, newStatus) => {
        setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/website/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update status');

            // Update local state
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update order status');
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const STATUS_OPTIONS = [
        'pending',
        'confirmed',
        'payment_verification',
        'processing',
        'shipped',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded'
    ];

    return (
        <div className={styles.page}>
            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                        <div className="text-red-600 font-medium">Error loading orders:</div>
                        <div className="ml-2 text-red-500">{error}</div>
                    </div>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* TOP BAR */}
            <div className={styles.topBar}>
                <div className={styles.searchBox}>
                    {chips.map(c => (
                        <span key={c} className={styles.chip}>
              {c}
                            <button onClick={() => setChips(chips.filter(x => x !== c))}>×</button>
            </span>
                    ))}

                    <input
                        value={search}
                        placeholder="Search customer, email, phone, warehouse, status..."
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={onKeyDown}
                    />

                    {suggestions.length > 0 && (
                        <div className={styles.suggestions}>
                            {suggestions.map(s => (
                                <div key={s} onClick={() => addChip(s)}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.filters}>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <span>→</span>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />

                    <button className={styles.iconBtn} onClick={exportExcel}>
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className={styles.card}>
                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th># Order Number</th>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Shipping Address</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Tracking Number</th>
                            <th>Payment Status</th>
                            <th>Warehouse</th>
                            <th>Order Date</th>
                            <th>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading && (
                            <tr><td colSpan="13" className={styles.empty}>Loading...</td></tr>
                        )}

                        {!loading && pagedData.length === 0 && (
                            <tr><td colSpan="13" className={styles.empty}>No orders found</td></tr>
                        )}

                        {pagedData.map(o => (
                            <tr key={o.id}>
                                <td>{o.order_number || o.id}</td>
                                <td>{o.customer_name || "-"}</td>
                                <td>{o.customer_email || "-"}</td>
                                <td>{o.customer_phone || "-"}</td>
                                <td 
                                    style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}
                                    onClick={() => setAddressModal(o)}
                                    title="Click to view full address"
                                >
                                    {o.shipping_address_text 
                                        ? (o.shipping_address_text.length > 30 ? o.shipping_address_text.substring(0, 30) + '...' : o.shipping_address_text)
                                        : "-"
                                    }
                                </td>
                                <td>
                                    {o.products && o.products.length > 0 ? (
                                        <div style={{ maxWidth: '300px' }}>
                                            {o.products.map((p, idx) => (
                                                <div key={idx} style={{ marginBottom: '8px', fontSize: '12px' }}>
                                                    <div style={{ fontWeight: '500' }}>{p.product_name}</div>
                                                    <div style={{ color: '#666' }}>Qty: {p.quantity} × ₹{p.unit_price}</div>
                                                    {p.customization && (
                                                        <div style={{ marginTop: '4px', padding: '4px', background: '#f0f9ff', borderRadius: '4px' }}>
                                                            {p.customization.engravingText && (
                                                                <div style={{ color: '#0066cc' }}>
                                                                    🖊️ Engraving: {p.customization.engravingText}
                                                                </div>
                                                            )}
                                                            {p.customization.customizationText && (
                                                                <div style={{ color: '#0066cc' }}>
                                                                    ✏️ Custom: {p.customization.customizationText}
                                                                </div>
                                                            )}
                                                            {p.customization.comboField1 && (
                                                                <div style={{ color: '#9333ea' }}>
                                                                    📝 Field 1: {p.customization.comboField1}
                                                                </div>
                                                            )}
                                                            {p.customization.comboField2 && (
                                                                <div style={{ color: '#9333ea' }}>
                                                                    📝 Field 2: {p.customization.comboField2}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        `${o.item_count || 0} item(s)`
                                    )}
                                </td>
                                <td>₹{o.total_amount || 0}</td>
                                <td>{o.payment_method || "-"}</td>
                                <td>{o.tracking_number || "-"}</td>
                                <td>{o.payment_status || "-"}</td>
                                <td>-</td>
                                <td>{o.order_date || o.created_at ? new Date(o.order_date || o.created_at).toLocaleString() : "-"}</td>
                                <td>
                                    <select 
                                        value={o.status || 'pending'}
                                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                        disabled={updatingStatus[o.id]}
                                        className={styles.statusDropdown}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd',
                                            background: '#fff',
                                            cursor: updatingStatus[o.id] ? 'wait' : 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {STATUS_OPTIONS.map(status => (
                                            <option key={status} value={status}>
                                                {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAGINATION */}
            <div className={styles.pagination}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <span>{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>

            {/* ADDRESS MODAL */}
            {addressModal && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setAddressModal(null)}
                >
                    <div 
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Shipping Address</h3>
                            <button 
                                onClick={() => setAddressModal(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Order Number</div>
                            <div style={{ fontSize: '16px', fontWeight: '500' }}>{addressModal.order_number}</div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Customer Name</div>
                            <div style={{ fontSize: '16px', fontWeight: '500' }}>{addressModal.customer_name}</div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Email</div>
                            <div style={{ fontSize: '16px' }}>{addressModal.customer_email}</div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Phone</div>
                            <div style={{ fontSize: '16px' }}>{addressModal.customer_phone}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Full Address</div>
                            <div style={{ 
                                fontSize: '15px', 
                                lineHeight: '1.6',
                                padding: '12px',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef'
                            }}>
                                {addressModal.shipping_address_text || 'No address provided'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
