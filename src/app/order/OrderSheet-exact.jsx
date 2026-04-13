"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./order.module.css";
import { usePermissions, PERMISSIONS } from '@/contexts/PermissionsContext';

const PAGE_SIZE = 12;

export default function OrderSheet() {
    const { hasPermission } = usePermissions();
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [input, setInput] = useState("");
    const [page, setPage] = useState(1);
    const [successMsg, setSuccessMsg] = useState("");

    // Bulk delete functionality
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    // Fetch orders from API
    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');
            
            if (typeof window === 'undefined') {
                setError('Loading...');
                return;
            }
            
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found');
                return;
            }
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/order-tracking`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                const mappedOrders = data.data.map(dispatch => ({
                    id: dispatch.id,
                    dispatch_id: dispatch.dispatch_id,
                    item_id: dispatch.item_id,
                    customer: dispatch.customer,
                    product_name: dispatch.product_name,
                    quantity: dispatch.qty,
                    awb: dispatch.awb,
                    order_ref: dispatch.order_ref,
                    warehouse: dispatch.warehouse,
                    status: dispatch.status,
                    payment_mode: dispatch.payment_mode,
                    invoice_amount: dispatch.invoice_amount,
                    timestamp: dispatch.timestamp,
                    remark: dispatch.remarks || "",
                    barcode: dispatch.barcode,
                    variant: dispatch.variant,
                    logistics: dispatch.logistics,
                    length: dispatch.length || 9.00,
                    width: dispatch.width || 9.00,
                    height: dispatch.height || 9.00,
                    weight: dispatch.weight || 999.000
                }));
                setOrders(mappedOrders);
            } else {
                setError('Failed to load dispatches');
            }
        } catch (err) {
            console.error('Error fetching dispatches:', err);
            setError('Failed to load dispatches');
        } finally {
            setLoading(false);
        }
    };

    // Search functionality
    const filteredOrders = useMemo(() => {
        if (!input.trim()) return orders;
        
        return orders.filter(order => {
            const searchText = `${order.customer} ${order.product_name} ${order.awb} ${order.order_ref} ${order.warehouse} ${order.status}`.toLowerCase();
            return searchText.includes(input.toLowerCase());
        });
    }, [orders, input]);

    const paginatedOrders = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredOrders.slice(start, start + PAGE_SIZE);
    }, [filteredOrders, page]);

    const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);

    // Bulk delete functionality
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedOrders([]);
            setSelectAll(false);
        } else {
            setSelectedOrders(paginatedOrders.map(order => order.id));
            setSelectAll(true);
        }
    };

    const handleSelectOrder = (orderId) => {
        setSelectedOrders(prev => {
            const newSelected = prev.includes(orderId) 
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId];
            
            setSelectAll(newSelected.length === paginatedOrders.length);
            return newSelected;
        });
    };

    const handleBulkDelete = async () => {
        if (selectedOrders.length === 0) return;
        
        if (!confirm(`Are you sure you want to delete ${selectedOrders.length} selected orders?`)) {
            return;
        }

        setBulkDeleting(true);
        let successCount = 0;

        try {
            const token = localStorage.getItem('token');
            
            for (const orderId of selectedOrders) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/order-tracking/${orderId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        successCount++;
                    }
                } catch (error) {
                    console.error('Delete error:', error);
                }
            }

            setOrders(prev => prev.filter(order => !selectedOrders.includes(order.id)));
            setSelectedOrders([]);
            setSelectAll(false);

            if (successCount > 0) {
                setSuccessMsg(`✅ Successfully deleted ${successCount} orders`);
            }
            
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (error) {
            console.error('Bulk delete error:', error);
            setSuccessMsg(`❌ Bulk delete failed: ${error.message}`);
            setTimeout(() => setSuccessMsg(""), 3000);
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleDownload = () => {
        // Download functionality
        console.log('Download clicked');
    };

    return (
        <div className={styles.container}>
            {successMsg && (
                <div className={styles.successToast}>
                    {successMsg}
                </div>
            )}

            <div className={styles.stickyHeader}>
                <div className={styles.filterBar}>
                    <div className={styles.smartSearchWrapper}>
                        <span className={styles.searchIcon}>🔍</span>
                        <div className={styles.searchInputContainer}>
                            <input
                                className={styles.smartSearchInput}
                                placeholder="Search by customer, product, AWB, order..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>
                        <span className={styles.calendarIcon}>📅</span>
                    </div>
                    
                    <div className={styles.headerActions}>
                        <button
                            className={styles.refreshBtn}
                            onClick={fetchOrders}
                            disabled={loading}
                        >
                            🔄 Refresh
                        </button>
                        <button
                            className={styles.downloadBtn}
                            onClick={handleDownload}
                        >
                            ⬇️ Download
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.scrollableContent}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Loading dispatches...</p>
                    </div>
                ) : error ? (
                    <div className={styles.errorState}>
                        <p>❌ {error}</p>
                        <button onClick={fetchOrders}>Retry</button>
                    </div>
                ) : (
                    <div>
                        {hasPermission(PERMISSIONS.ORDERS_EDIT) && selectedOrders.length > 0 && (
                            <div className={styles.bulkActions}>
                                <div className={styles.selectAllContainer}>
                                    <input
                                        type="checkbox"
                                        className={styles.selectAllCheckbox}
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        id="selectAll"
                                    />
                                    <label htmlFor="selectAll" className={styles.selectAllLabel}>
                                        Select All
                                    </label>
                                </div>
                                
                                <div>
                                    <span className={styles.selectedCount}>
                                        {selectedOrders.length} selected
                                    </span>
                                    <button
                                        className={styles.bulkDeleteBtn}
                                        onClick={handleBulkDelete}
                                        disabled={bulkDeleting}
                                    >
                                        {bulkDeleting ? "⏳ Deleting..." : "🗑️ Delete Selected"}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className={styles.tableCard}>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            {hasPermission(PERMISSIONS.ORDERS_EDIT) && (
                                                <th className={styles.th}>DELETE</th>
                                            )}
                                            <th className={styles.th}>CUSTOMER</th>
                                            <th className={styles.th}>PRODUCT</th>
                                            <th className={styles.th}>QTY</th>
                                            <th className={styles.th}>LENGTH</th>
                                            <th className={styles.th}>WIDTH</th>
                                            <th className={styles.th}>HEIGHT</th>
                                            <th className={styles.th}>WEIGHT</th>
                                            <th className={styles.th}>AWB</th>
                                            <th className={styles.th}>⋮</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedOrders.map((order) => (
                                            <tr key={order.id} className={styles.tr}>
                                                {hasPermission(PERMISSIONS.ORDERS_EDIT) && (
                                                    <td className={styles.td}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedOrders.includes(order.id)}
                                                            onChange={() => handleSelectOrder(order.id)}
                                                        />
                                                        <button className={styles.deleteBtn}>
                                                            DELETE
                                                        </button>
                                                    </td>
                                                )}
                                                <td className={styles.td}>{order.customer}</td>
                                                <td className={styles.td}>{order.product_name}</td>
                                                <td className={styles.td}>
                                                    <span style={{
                                                        background: '#e0e7ff',
                                                        color: '#3730a3',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}>
                                                        {order.quantity}
                                                    </span>
                                                </td>
                                                <td className={styles.td}>{order.length}</td>
                                                <td className={styles.td}>{order.width}</td>
                                                <td className={styles.td}>{order.height}</td>
                                                <td className={styles.td}>
                                                    <span style={{
                                                        background: '#d1fae5',
                                                        color: '#065f46',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}>
                                                        {order.weight} kg
                                                    </span>
                                                </td>
                                                <td className={styles.td}>{order.awb}</td>
                                                <td className={styles.td}>⋮</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className={styles.pagination}>
                            <button
                                className={`${styles.pageBtn} ${page === 1 ? styles.disabled : ''}`}
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page === 1}
                            >
                                Prev
                            </button>
                            <span className={styles.pageInfo}>{page} / {totalPages}</span>
                            <button
                                className={`${styles.pageBtn} ${page === totalPages ? styles.disabled : ''}`}
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}