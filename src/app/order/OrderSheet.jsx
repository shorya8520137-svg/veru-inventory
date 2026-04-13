"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./order.module.css";
import { usePermissions, PERMISSIONS } from '@/contexts/PermissionsContext';
import OrderActivityForm from '@/components/OrderActivityForm';

const PAGE_SIZE = 12;

export default function OrderSheet() {
    const { hasPermission, userRole, getAccessibleWarehouses } = usePermissions();
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Professional filter states
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [processedByFilter, setProcessedByFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [awbFilter, setAwbFilter] = useState('');
    const [orderRefFilter, setOrderRefFilter] = useState('');
    const [paymentModeFilter, setPaymentModeFilter] = useState('');
    const [amountSort, setAmountSort] = useState(''); // "asc" or "desc"
    const [groupByOrder, setGroupByOrder] = useState(false);

    // Product search states
    const [productSearch, setProductSearch] = useState('');
    const [productSuggestions, setProductSuggestions] = useState([]);
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

    // Dynamic dropdown data
    const [processedByOptions, setProcessedByOptions] = useState([]);
    const [warehouseOptions, setWarehouseOptions] = useState([]);
    const [logisticsOptions, setLogisticsOptions] = useState([]);

    // Get accessible warehouses based on user permissions
    const accessibleWarehouses = getAccessibleWarehouses('ORDERS_VIEW');
    const availableWarehouseCodes = accessibleWarehouses.map(w => w.code);

    // Additional states
    const [page, setPage] = useState(1);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    
    // Remarks editing state
    const [editingRemark, setEditingRemark] = useState(null);
    const [remarkValues, setRemarkValues] = useState({});
    const [savingRemark, setSavingRemark] = useState(null);

    // Export functionality state
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [exporting, setExporting] = useState(false);

    // Status update state
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
    
    // Product name modal state
    const [showProductModal, setShowProductModal] = useState(null);
    
    // Customer detail modal state
    const [showCustomerModal, setShowCustomerModal] = useState(null);

    // Order Activity Form state
    const [showOrderActivityForm, setShowOrderActivityForm] = useState(false);
    const [selectedOrderForActivity, setSelectedOrderForActivity] = useState(null);

    const statusOptions = [
        { value: 'Pending', label: 'Pending', color: '#374151', bg: '#f9fafb' },
        { value: 'Processing', label: 'Processing', color: '#4b5563', bg: '#f3f4f6' },
        { value: 'Confirmed', label: 'Confirmed', color: '#1f2937', bg: '#f9fafb' },
        { value: 'Packed', label: 'Packed', color: '#374151', bg: '#f3f4f6' },
        { value: 'Dispatched', label: 'Dispatched', color: '#4b5563', bg: '#f9fafb' },
        { value: 'In Transit', label: 'In Transit', color: '#1f2937', bg: '#f3f4f6' },
        { value: 'Out for Delivery', label: 'Out for Delivery', color: '#374151', bg: '#f9fafb' },
        { value: 'Delivered', label: 'Delivered', color: '#4b5563', bg: '#f3f4f6' },
        { value: 'Cancelled', label: 'Cancelled', color: '#6b7280', bg: '#f9fafb' },
        { value: 'Returned', label: 'Returned', color: '#374151', bg: '#f3f4f6' }
    ];

    const searchRef = useRef(null);

    // Fetch orders from API
    useEffect(() => {
        fetchOrders();
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE}/api/dispatch`;
            
            // Fetch processed persons
            const processedResponse = await fetch(`${API_BASE}/processed-persons`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (processedResponse.ok) {
                const processedData = await processedResponse.json();
                setProcessedByOptions(Array.isArray(processedData) ? processedData : []);
            }

            // Fetch warehouses
            const warehouseResponse = await fetch(`${API_BASE}/warehouses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (warehouseResponse.ok) {
                const warehouseData = await warehouseResponse.json();
                const allWarehouses = Array.isArray(warehouseData) ? warehouseData : [];
                // Filter warehouses based on user permissions
                const filteredWarehouses = availableWarehouseCodes.length > 0 
                    ? allWarehouses.filter(wh => availableWarehouseCodes.includes(wh))
                    : allWarehouses;
                setWarehouseOptions(filteredWarehouses);
            }

            // Fetch logistics
            const logisticsResponse = await fetch(`${API_BASE}/logistics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (logisticsResponse.ok) {
                const logisticsData = await logisticsResponse.json();
                setLogisticsOptions(Array.isArray(logisticsData) ? logisticsData : []);
            }
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    };

    // Product search functionality
    const searchProducts = async (value) => {
        setProductSearch(value);
        
        if (value.length > 2) {
            try {
                const token = localStorage.getItem('token');
                const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE}/api/dispatch`;
                const response = await fetch(`${API_BASE}/search-products?query=${encodeURIComponent(value)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setProductSuggestions(Array.isArray(data) ? data : (data.data || []));
                    setShowProductSuggestions(true);
                } else {
                    console.error('Product search failed:', response.status);
                    setProductSuggestions([]);
                    setShowProductSuggestions(false);
                }
            } catch (error) {
                console.error('Product search error:', error);
                setProductSuggestions([]);
                setShowProductSuggestions(false);
            }
        } else {
            setProductSuggestions([]);
            setShowProductSuggestions(false);
        }
    };

    const selectProduct = (product) => {
        const productString = `${product.product_name} | ${product.product_variant || ''} | ${product.barcode}`;
        setProductSearch(productString);
        setProductSuggestions([]);
        setShowProductSuggestions(false);
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Use the updated dispatch tracking API
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/order-tracking`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                // Map real dispatch data to frontend format
                const mappedOrders = data.data.map((dispatch, index) => ({
                    id: dispatch.id,
                    unique_id: `${dispatch.id}_${dispatch.barcode || index}_${dispatch.item_id || index}`, // Unique identifier
                    dispatch_id: dispatch.dispatch_id,
                    item_id: dispatch.item_id,
                    customer: dispatch.customer,
                    product_name: dispatch.product_name,
                    quantity: dispatch.qty,
                    length: dispatch.length || 0,
                    width: dispatch.width || 0,
                    height: dispatch.height || 0,
                    dimensions: `${dispatch.length || 0}x${dispatch.width || 0}x${dispatch.height || 0}`,
                    weight: dispatch.actual_weight || 0,
                    awb: dispatch.awb,
                    order_ref: dispatch.order_ref,
                    warehouse: dispatch.warehouse,
                    status: dispatch.status,
                    payment_mode: dispatch.payment_mode,
                    invoice_amount: dispatch.invoice_amount,
                    timestamp: dispatch.timestamp,
                    remark: dispatch.remarks || "",
                    damage_count: dispatch.damage_count || 0,
                    return_count: 0, // Not tracked in warehouse_dispatch
                    recovery_count: dispatch.recovery_count || 0,
                    // Additional dispatch-specific fields
                    barcode: dispatch.barcode,
                    variant: dispatch.variant,
                    logistics: dispatch.logistics,
                    parcel_type: dispatch.parcel_type,
                    actual_weight: dispatch.actual_weight,
                    processed_by: dispatch.processed_by,
                    current_stock: dispatch.current_stock || 0,
                    total_stock: dispatch.current_stock || 0, // Same as current for now
                    cost: dispatch.selling_price || dispatch.invoice_amount || 0
                }));
                setOrders(mappedOrders);
                
                // Initialize warehouse selection
                const uniqueWarehouses = [...new Set(mappedOrders.map(order => order.warehouse).filter(Boolean))];
                if (uniqueWarehouses.length > 0 && selectedWarehouses.length === 0) {
                    setSelectedWarehouses(uniqueWarehouses);
                }
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

    // Auto-initialize selected warehouses when orders load
    useEffect(() => {
        if (orders.length > 0 && selectedWarehouses.length === 0) {
            const uniqueWarehouses = getUniqueWarehouses();
            if (uniqueWarehouses.length > 0) {
                setSelectedWarehouses(uniqueWarehouses);
            }
        }
    }, [orders, selectedWarehouses.length]);

    // Professional filtering logic
    const filteredOrders = useMemo(() => {
        let filtered = orders.filter(order => {
            // Warehouse permission filtering - only show orders from accessible warehouses
            if (availableWarehouseCodes.length > 0 && !availableWarehouseCodes.includes(order.warehouse)) {
                return false;
            }
            
            // Warehouse filter
            if (warehouseFilter && order.warehouse !== warehouseFilter) {
                return false;
            }

            // Processed By filter
            if (processedByFilter && order.processed_by !== processedByFilter) {
                return false;
            }

            // Status filter
            if (statusFilter && order.status !== statusFilter) {
                return false;
            }

            // AWB filter
            if (awbFilter && !order.awb?.toLowerCase().includes(awbFilter.toLowerCase())) {
                return false;
            }

            // Order Reference filter
            if (orderRefFilter && !order.order_ref?.toLowerCase().includes(orderRefFilter.toLowerCase())) {
                return false;
            }

            // Payment Mode filter
            if (paymentModeFilter && order.payment_mode !== paymentModeFilter) {
                return false;
            }

            // Product search filter
            if (productSearch && !order.product_name?.toLowerCase().includes(productSearch.toLowerCase())) {
                return false;
            }

            return true;
        });

        // Date filtering
        if (fromDate || toDate) {
            filtered = filtered.filter(order => {
                if (!order.timestamp) return false;
                
                const orderDate = new Date(order.timestamp);
                const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
                
                if (fromDate) {
                    const fromDateOnly = new Date(fromDate);
                    if (orderDateOnly < fromDateOnly) return false;
                }
                
                if (toDate) {
                    const toDateOnly = new Date(toDate);
                    if (orderDateOnly > toDateOnly) return false;
                }
                
                return true;
            });
        }

        // Group by order if enabled
        if (groupByOrder) {
            const grouped = {};
            filtered.forEach(order => {
                const key = order.order_ref || `${order.customer}_${order.awb}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        ...order,
                        products: [],
                        total_quantity: 0,
                        isGrouped: true
                    };
                }
                grouped[key].products.push({
                    name: order.product_name,
                    quantity: order.quantity || order.qty || 1,
                    barcode: order.barcode,
                    variant: order.variant
                });
                grouped[key].total_quantity += (order.quantity || order.qty || 1);
                
                // Use the first product name as main, but show count
                if (grouped[key].products.length > 1) {
                    grouped[key].product_name = `${grouped[key].products[0].name} (+${grouped[key].products.length - 1} more)`;
                }
            });
            filtered = Object.values(grouped);
        }

        // Amount sorting
        if (amountSort === "asc") {
            filtered = filtered.sort((a, b) => (a.invoice_amount || 0) - (b.invoice_amount || 0));
        } else if (amountSort === "desc") {
            filtered = filtered.sort((a, b) => (b.invoice_amount || 0) - (a.invoice_amount || 0));
        }

        return filtered;
    }, [orders, warehouseFilter, processedByFilter, statusFilter, awbFilter, orderRefFilter, paymentModeFilter, productSearch, fromDate, toDate, amountSort, groupByOrder]);

    const paginatedOrders = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredOrders.slice(start, start + PAGE_SIZE);
    }, [filteredOrders, page]);

    const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);

    // Get unique warehouses for export
    const getUniqueWarehouses = () => {
        return [...new Set(orders.map(order => order.warehouse).filter(Boolean))];
    };

    // Remarks handling functions
    const handleRemarkEdit = (orderId, currentRemark) => {
        setEditingRemark(orderId);
        setRemarkValues(prev => ({
            ...prev,
            [orderId]: currentRemark || ""
        }));
    };

    const handleRemarkChange = (orderId, value) => {
        setRemarkValues(prev => ({
            ...prev,
            [orderId]: value
        }));
    };

    const saveRemark = async (orderId) => {
        const remarkText = remarkValues[orderId] || "";
        setSavingRemark(orderId);
        
        try {
            // Update local state immediately for better UX
            setOrders(prev => prev.map(order => 
                order.id === orderId 
                    ? { ...order, remark: remarkText }
                    : order
            ));
            
            setSuccessMsg("Remark updated successfully");
            setTimeout(() => setSuccessMsg(""), 2000);
        } catch (error) {
            console.error("Failed to save remark:", error);
            setSuccessMsg("Failed to update remark");
            setTimeout(() => setSuccessMsg(""), 2000);
        } finally {
            setSavingRemark(null);
            setEditingRemark(null);
        }
    };

    const cancelRemarkEdit = () => {
        setEditingRemark(null);
        setRemarkValues({});
    };

    // Status update function
    const updateOrderStatus = async (orderId, newStatus) => {
        setUpdatingStatus(orderId);
        setOpenStatusDropdown(null);
        
        // Find the order to get its barcode and dispatch_id
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            setSuccessMsg("Order not found");
            setTimeout(() => setSuccessMsg(""), 2000);
            setUpdatingStatus(null);
            return;
        }
        
        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');
            
            // Send status update to backend with barcode for specific product update
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/order-tracking/${order.dispatch_id || orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    status: newStatus,
                    barcode: order.barcode  // Send barcode to update specific product
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update status');
            }
            
            // Update local state only after successful backend update
            setOrders(prev => prev.map(order => 
                order.id === orderId 
                    ? { ...order, status: newStatus }
                    : order
            ));
            
            setSuccessMsg(`Status updated to ${newStatus}`);
            setTimeout(() => setSuccessMsg(""), 2000);
        } catch (error) {
            console.error("Failed to update status:", error);
            setSuccessMsg("Failed to update status");
            setTimeout(() => setSuccessMsg(""), 2000);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const getStatusConfig = (status) => {
        return statusOptions.find(option => option.value === status) || statusOptions[0];
    };

    // Export functionality
    const handleWarehouseToggle = (warehouse) => {
        setSelectedWarehouses(prev => {
            if (prev.includes(warehouse)) {
                return prev.filter(w => w !== warehouse);
            } else {
                return [...prev, warehouse];
            }
        });
    };

    const selectAllWarehouses = () => {
        setSelectedWarehouses(getUniqueWarehouses());
    };

    const deselectAllWarehouses = () => {
        setSelectedWarehouses([]);
    };

    const exportToCSV = async () => {
        if (selectedWarehouses.length === 0) {
            alert("Please select at least one warehouse to export");
            return;
        }

        setExporting(true);
        try {
            // Use the new backend API for export
            const queryParams = new URLSearchParams();
            
            // FIXED: Handle multiple warehouses correctly
            // If all warehouses are selected, don't add warehouse filter (export ALL)
            const allWarehouses = getUniqueWarehouses();
            const isAllWarehousesSelected = selectedWarehouses.length === allWarehouses.length;
            
            if (!isAllWarehousesSelected && selectedWarehouses.length === 1) {
                // Only add warehouse filter if single warehouse is selected
                queryParams.append('warehouse', selectedWarehouses[0]);
            }
            // If multiple warehouses selected but not all, we'll export all data
            // (backend doesn't support multiple warehouse filtering in single query)
            
            // Add date filters if available (fix: use fromDate/toDate instead of dateFrom/dateTo)
            if (fromDate) queryParams.append('dateFrom', fromDate);
            if (toDate) queryParams.append('dateTo', toDate);
            
            const exportUrl = `${process.env.NEXT_PUBLIC_API_BASE}/api/order-tracking/export?${queryParams.toString()}`;
            
            // Get JWT token from localStorage or auth context
            const token = localStorage.getItem('token');
            
            const response = await fetch(exportUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 403) {
                    alert("Permission denied. You need ORDERS_EXPORT permission to export data.");
                    return;
                } else if (response.status === 401) {
                    alert("Authentication required. Please login again.");
                    return;
                } else {
                    throw new Error(`Export failed: ${response.status}`);
                }
            }
            
            // Get the CSV data
            const csvData = await response.text();
            
            // Create download link
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            const warehouseNames = selectedWarehouses.join('_');
            const fileName = selectedWarehouses.length === getUniqueWarehouses().length 
                ? `dispatches_all_warehouses_${new Date().toISOString().split('T')[0]}.csv`
                : `dispatches_${warehouseNames}_${new Date().toISOString().split('T')[0]}.csv`;
                
            link.href = url;
            link.setAttribute("download", fileName);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            setShowExportDropdown(false);
            
            // Show appropriate success message
            const exportScope = isAllWarehousesSelected || selectedWarehouses.length > 1 
                ? "all warehouses" 
                : `warehouse ${selectedWarehouses[0]}`;
            setSuccessMsg(`Exported dispatch data for ${exportScope} successfully`);
            setTimeout(() => setSuccessMsg(""), 3000);
            
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    // Delete dispatch function with stock restoration (WORKING LOGIC)
    const deleteDispatch = async (dispatchId) => {
        setDeletingId(dispatchId);
        setDeleting(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/order-tracking/${dispatchId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Remove from local state
                setOrders(prev => prev.filter(order => order.id !== dispatchId));
                setSuccessMsg(`✅ Dispatch deleted successfully! Stock restored: ${data.restored_quantity || 0} units of ${data.restored_product || 'product'} to ${data.warehouse || 'warehouse'}`);
                setTimeout(() => setSuccessMsg(""), 4000);
            } else {
                throw new Error(data.message || 'Failed to delete dispatch');
            }
        } catch (error) {
            console.error('Delete error:', error);
            setSuccessMsg(`❌ Failed to delete dispatch: ${error.message}`);
            setTimeout(() => setSuccessMsg(""), 3000);
        } finally {
            setDeleting(false);
            setDeletingId(null);
            setShowDeleteConfirm(null);
        }
    };

    const confirmDelete = (dispatch) => {
        setShowDeleteConfirm(dispatch);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(null);
    };

    // Order Activity functions
    const openOrderActivityForm = (order) => {
        setSelectedOrderForActivity(order);
        setShowOrderActivityForm(true);
    };

    const closeOrderActivityForm = () => {
        setShowOrderActivityForm(false);
        setSelectedOrderForActivity(null);
    };

    const handleOrderActivitySubmit = async (formData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/warehouse-order-activity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData) // JSON data (no file upload)
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMsg("✅ Order activity submitted successfully!");
                setTimeout(() => setSuccessMsg(""), 3000);
                
                // Optionally refresh the orders to show updated data
                // fetchOrders();
            } else {
                throw new Error(data.message || 'Failed to submit order activity');
            }
        } catch (error) {
            console.error('Error submitting order activity:', error);
            setSuccessMsg(`❌ Failed to submit order activity: ${error.message}`);
            setTimeout(() => setSuccessMsg(""), 3000);
            throw error; // Re-throw to let the form handle it
        }
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openStatusDropdown && !event.target.closest(`.${styles.statusDropdownContainer}`)) {
                setOpenStatusDropdown(null);
            }
            if (showExportDropdown && !event.target.closest(`.${styles.exportPanel}`)) {
                setShowExportDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openStatusDropdown, showExportDropdown]);

    return (
        <div className={styles.container}>
            {deleting && (
                <div className={styles.centerLoader}>
                    <div className={styles.spinner} />
                </div>
            )}

            {successMsg && (
                <motion.div
                    className={styles.successToast}
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                >
                    {successMsg}
                </motion.div>
            )}

            {/* Sticky Header */}
            <div className={styles.stickyHeader}>
                {/* Professional Filter Grid */}
                <div className={styles.filterContainer}>
                    <div className={styles.filterGrid}>
                        {/* Product Search */}
                        <div className={styles.filterItem}>
                            <div className={styles.productSearchContainer}>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={(e) => searchProducts(e.target.value)}
                                    className={styles.filterInput}
                                    onFocus={() => productSuggestions.length > 0 && setShowProductSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                                />
                                {showProductSuggestions && productSuggestions.length > 0 && (
                                    <div className={styles.productSuggestions}>
                                        {productSuggestions.map((product, index) => (
                                            <div
                                                key={product.p_id || product.barcode || index}
                                                className={styles.suggestionItem}
                                                onClick={() => selectProduct(product)}
                                            >
                                                <div className={styles.suggestionContent}>
                                                    <div className={styles.suggestionName}>
                                                        {product.product_name}
                                                    </div>
                                                    {product.product_variant && (
                                                        <div className={styles.suggestionVariant}>
                                                            {product.product_variant}
                                                        </div>
                                                    )}
                                                    <div className={styles.suggestionBarcode}>
                                                        {product.barcode}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Warehouse Filter */}
                        <div className={styles.filterItem}>
                            <select
                                value={warehouseFilter}
                                onChange={(e) => setWarehouseFilter(e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="">All Warehouses</option>
                                {warehouseOptions.map(warehouse => (
                                    <option key={warehouse} value={warehouse}>{warehouse}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className={styles.filterItem}>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Packed">Packed</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="In Transit">In Transit</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Returned">Returned</option>
                            </select>
                        </div>

                        {/* Processed By Filter */}
                        <div className={styles.filterItem}>
                            <select
                                value={processedByFilter}
                                onChange={(e) => setProcessedByFilter(e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="">Processed By</option>
                                {processedByOptions.map(person => (
                                    <option key={person} value={person}>{person}</option>
                                ))}
                            </select>
                        </div>

                        {/* AWB Filter */}
                        <div className={styles.filterItem}>
                            <input
                                type="text"
                                placeholder="AWB Number"
                                value={awbFilter}
                                onChange={(e) => setAwbFilter(e.target.value)}
                                className={styles.filterInput}
                            />
                        </div>

                        {/* Order Reference Filter */}
                        <div className={styles.filterItem}>
                            <input
                                type="text"
                                placeholder="Order Reference"
                                value={orderRefFilter}
                                onChange={(e) => setOrderRefFilter(e.target.value)}
                                className={styles.filterInput}
                            />
                        </div>

                        {/* Payment Mode Filter */}
                        <div className={styles.filterItem}>
                            <select
                                value={paymentModeFilter}
                                onChange={(e) => setPaymentModeFilter(e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="">All Payment</option>
                                <option value="COD">COD</option>
                                <option value="Prepaid">Prepaid</option>
                                <option value="UPI">UPI</option>
                                <option value="Credit Card">Credit Card</option>
                            </select>
                        </div>

                        {/* From Date */}
                        <div className={styles.filterItem}>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className={styles.filterInput}
                            />
                        </div>

                        {/* To Date */}
                        <div className={styles.filterItem}>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className={styles.filterInput}
                            />
                        </div>

                        {/* Action Icons - Combined in single grid cell */}
                        <div className={styles.filterItem}>
                            <div className={styles.actionIcons}>
                                {/* Refresh Icon */}
                                <button
                                    className={styles.iconBtn}
                                    onClick={fetchOrders}
                                    disabled={loading}
                                    title="Refresh Orders"
                                >
                                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                                        <path d="M13.65 2.35C12.2 0.9 10.2 0 8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C11.73 16 14.84 13.45 15.73 10H13.65C12.83 12.33 10.61 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C9.66 2 11.14 2.69 12.22 3.78L9 7H16V0L13.65 2.35Z" fill="currentColor"/>
                                    </svg>
                                </button>

                                {/* Download Icon */}
                                <button
                                    className={styles.iconBtn}
                                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                                    disabled={exporting}
                                    title="Download Orders"
                                >
                                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 10L12 6H9V0H7V6H4L8 10ZM16 12V14C16 15.1 15.1 16 14 16H2C0.9 16 0 15.1 0 14V12C0 10.9 0.9 10 2 10H5.5L6.5 11H9.5L10.5 10H14C15.1 10 16 10.9 16 12Z" fill="currentColor"/>
                                    </svg>
                                </button>

                                {/* Group By Toggle */}
                                <label className={styles.toggleLabel}>
                                    <input
                                        type="checkbox"
                                        checked={groupByOrder}
                                        onChange={(e) => setGroupByOrder(e.target.checked)}
                                        className={styles.toggleInput}
                                    />
                                    <span className={styles.toggleSlider}></span>
                                    <span className={styles.toggleText}>Group</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Export Dropdown */}
                    {showExportDropdown && (
                        <div className={styles.exportPanel}>
                            <div className={styles.exportHeader}>
                                <h4>Download Order Data</h4>
                                <button
                                    className={styles.closeExport}
                                    onClick={() => setShowExportDropdown(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className={styles.warehouseSelection}>
                                <div className={styles.selectionActions}>
                                    <button
                                        className={styles.selectAllBtn}
                                        onClick={selectAllWarehouses}
                                    >
                                        Select All
                                    </button>
                                    <button
                                        className={styles.deselectAllBtn}
                                        onClick={deselectAllWarehouses}
                                    >
                                        Deselect All
                                    </button>
                                </div>
                                
                                <div className={styles.warehouseList}>
                                    {getUniqueWarehouses().map((warehouse) => {
                                        const warehouseCount = filteredOrders.filter(order => order.warehouse === warehouse).length;
                                        return (
                                            <label
                                                key={warehouse}
                                                className={styles.warehouseCheckbox}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedWarehouses.includes(warehouse)}
                                                    onChange={() => handleWarehouseToggle(warehouse)}
                                                />
                                                <span className={styles.checkboxLabel}>
                                                    {warehouse}
                                                    <span className={styles.warehouseCount}>({warehouseCount})</span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className={styles.exportActions}>
                                <div className={styles.exportInfo}>
                                    {selectedWarehouses.length} warehouse(s) selected
                                </div>
                                <button
                                    className={styles.confirmDownloadBtn}
                                    onClick={exportToCSV}
                                    disabled={selectedWarehouses.length === 0 || exporting}
                                >
                                    {exporting ? "Preparing..." : "Download CSV"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className={styles.scrollableContent}>
                <motion.div 
                    className={styles.tableContainer}
                    key={`${fromDate}-${toDate}-${warehouseFilter}-${awbFilter}-${orderRefFilter}-${paymentModeFilter}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
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
                        <div className={styles.tableCard}>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                    <tr>
                                        {hasPermission(PERMISSIONS.ORDERS_EDIT) && (
                                            <th className={`${styles.th} ${styles.delCol}`}>
                                                Delete
                                            </th>
                                        )}
                                        <th className={`${styles.th} ${styles.customerCol}`}>
                                            Customer
                                        </th>
                                        <th className={styles.th}>
                                            Product
                                        </th>
                                        <th className={styles.th}>
                                            Qty
                                        </th>
                                        <th className={styles.th}>
                                            Length
                                        </th>
                                        <th className={styles.th}>
                                            Width
                                        </th>
                                        <th className={styles.th}>
                                            Height
                                        </th>
                                        <th className={styles.th}>
                                            Weight
                                        </th>
                                        <th className={styles.th}>
                                            AWB
                                        </th>
                                        <th className={styles.th}>
                                            Order Ref
                                        </th>
                                        <th className={styles.th}>
                                            Warehouse
                                        </th>
                                        <th className={styles.th}>
                                            Status
                                        </th>
                                        <th className={styles.th}>
                                            Payment
                                        </th>
                                        <th className={styles.th}>
                                            Amount
                                        </th>
                                        <th className={styles.th}>
                                            Remarks
                                        </th>
                                        <th className={styles.th}>
                                            Date
                                        </th>
                                        <th className={styles.th}>
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <AnimatePresence mode="popLayout">
                                    {paginatedOrders.map((o, i) => (
                                        <motion.tr 
                                            key={o.unique_id || `${o.id}_${i}`} 
                                            className={styles.tr}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{
                                                duration: 0.3,
                                                delay: i * 0.05
                                            }}
                                        >
                                            {hasPermission(PERMISSIONS.ORDERS_EDIT) && (
                                                <td className={`${styles.td} ${styles.delCol}`}>
                                                    {hasPermission(PERMISSIONS.ORDERS_EDIT) ? (
                                                        <button 
                                                            className={`${styles.deleteBtn} ${deletingId === o.id ? styles.deleting : ''}`}
                                                            onClick={() => confirmDelete(o)}
                                                            disabled={deletingId === o.id}
                                                            title={`Delete dispatch for ${o.customer}`}
                                                        >
                                                            {deletingId === o.id ? (
                                                                <svg className={styles.loadingSpinner} width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                                                                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                                                                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                                                                    </circle>
                                                                </svg>
                                                            ) : (
                                                                <svg className={styles.deleteIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="3,6 5,6 21,6"></polyline>
                                                                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                                </svg>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className={styles.noPermissionCell} title="No delete permission">
                                                            <span className={styles.lockedIcon}>🔒</span>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                            <td className={`${styles.td} ${styles.customerCol}`}>
                                                <div 
                                                    className={`${styles.cellContent} ${styles.clickableCell}`}
                                                    onClick={() => setShowCustomerModal(o)}
                                                    title="Click to view customer details"
                                                >
                                                    {o.customer}
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div 
                                                    className={`${styles.cellContent} ${styles.productName} ${styles.clickableCell}`}
                                                    onClick={() => setShowProductModal(o)}
                                                    title="Click to view product details"
                                                >
                                                    {o.product_name}
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.qtyBadge}>
                                                    {o.isGrouped ? o.total_quantity : (o.quantity || o.qty || 1)}
                                                    {o.isGrouped && (
                                                        <span className={styles.groupedIndicator} title={`${o.products.length} products`}>
                                                            ({o.products.length})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.dimensionValue}>{o.length || 0}</div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.dimensionValue}>{o.width || 0}</div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.dimensionValue}>{o.height || 0}</div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.weightBadge}>{o.weight || o.actual_weight || 0} kg</div>
                                            </td>
                                            <td className={styles.td}><div className={styles.cellContent}>{o.awb}</div></td>
                                            <td className={styles.td}><div className={styles.cellContent}>{o.order_ref}</div></td>
                                            <td className={styles.td}>
                                                <span className={styles.warehouseTag}>{o.warehouse}</span>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.statusDropdownContainer}>
                                                    {hasPermission(PERMISSIONS.ORDERS_EDIT) ? (
                                                        <>
                                                            <button
                                                                className={styles.statusButton}
                                                                style={{
                                                                    color: getStatusConfig(o.status).color,
                                                                    backgroundColor: getStatusConfig(o.status).bg,
                                                                    borderColor: getStatusConfig(o.status).color
                                                                }}
                                                                onClick={() => setOpenStatusDropdown(openStatusDropdown === o.id ? null : o.id)}
                                                                disabled={updatingStatus === o.id}
                                                                aria-expanded={openStatusDropdown === o.id}
                                                            >
                                                                <div className={styles.statusDot} style={{ backgroundColor: getStatusConfig(o.status).color }}></div>
                                                                {updatingStatus === o.id ? (
                                                                    <span className={styles.statusLoader}>⏳</span>
                                                                ) : (
                                                                    o.status
                                                                )}
                                                                <span className={styles.dropdownArrow}>▼</span>
                                                            </button>
                                                            
                                                            {openStatusDropdown === o.id && (
                                                                <div className={styles.statusDropdown}>
                                                                    {statusOptions.map(option => (
                                                                        <button
                                                                            key={option.value}
                                                                            className={`${styles.statusOption} ${o.status === option.value ? styles.statusOptionActive : ''}`}
                                                                            onClick={() => updateOrderStatus(o.id, option.value)}
                                                                        >
                                                                            <div>
                                                                                <div className={styles.statusDot} style={{ backgroundColor: option.color }}></div>
                                                                                {option.label}
                                                                            </div>
                                                                            {o.status === option.value && (
                                                                                <span className={styles.checkIcon}>✓</span>
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div 
                                                            className={styles.statusReadOnly}
                                                            style={{
                                                                color: getStatusConfig(o.status).color,
                                                                backgroundColor: getStatusConfig(o.status).bg,
                                                                borderColor: getStatusConfig(o.status).color
                                                            }}
                                                            title="No status update permission"
                                                        >
                                                            <div className={styles.statusDot} style={{ backgroundColor: getStatusConfig(o.status).color }}></div>
                                                            {o.status}
                                                            <span className={styles.lockedIcon}>🔒</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={styles.td}><div className={styles.cellContent}>{o.payment_mode}</div></td>
                                            <td className={styles.td}>
                                                <div className={styles.amount}>₹{o.invoice_amount}</div>
                                            </td>
                                            <td className={`${styles.td} ${styles.remarkCell}`}>
                                                {editingRemark === o.id ? (
                                                    <div className={styles.remarkEditor}>
                                                        <textarea
                                                            className={styles.remarkInput}
                                                            value={remarkValues[o.id] || ''}
                                                            onChange={(e) => handleRemarkChange(o.id, e.target.value)}
                                                            placeholder="Add follow-up notes..."
                                                            rows={2}
                                                        />
                                                        <div className={styles.remarkActions}>
                                                            <button
                                                                className={styles.saveBtn}
                                                                onClick={() => saveRemark(o.id)}
                                                                disabled={savingRemark === o.id}
                                                            >
                                                                {savingRemark === o.id ? '⏳' : 'Save'}
                                                            </button>
                                                            <button
                                                                className={styles.cancelBtn}
                                                                onClick={cancelRemarkEdit}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div 
                                                        className={styles.remarkDisplay}
                                                        onClick={() => handleRemarkEdit(o.id, o.remark)}
                                                    >
                                                        {o.remark ? (
                                                            <span className={styles.remarkText}>{o.remark}</span>
                                                        ) : (
                                                            <span className={styles.remarkPlaceholder}>Click to add notes...</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.date}>
                                                    {o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: '2-digit'
                                                    }) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.actionButtons}>
                                                    {/* Order Activity Button */}
                                                    <button
                                                        className={styles.orderActivityBtn}
                                                        onClick={() => openOrderActivityForm(o)}
                                                        title="Create Order Activity"
                                                    >
                                                        📝 Activity
                                                    </button>
                                                    
                                                    {(o.damage_count > 0 || o.return_count > 0 || o.recovery_count > 0) && (
                                                        <div className={styles.trackingBadges}>
                                                            {o.damage_count > 0 && <span className={styles.damageBadge}>{o.damage_count}D</span>}
                                                            {o.return_count > 0 && <span className={styles.returnBadge}>{o.return_count}R</span>}
                                                            {o.recovery_count > 0 && <span className={styles.recoveryBadge}>{o.recovery_count}Rec</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </motion.div>

                <motion.div 
                    className={styles.pagination}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.button
                        className={`${styles.pageBtn} ${page === 1 ? styles.disabled : ''}`}
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page === 1}
                        whileHover={{ scale: page !== 1 ? 1.05 : 1 }}
                        whileTap={{ scale: page !== 1 ? 0.95 : 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        Prev
                    </motion.button>
                    <span className={styles.pageInfo}>{page} / {totalPages}</span>
                    <motion.button
                        className={`${styles.pageBtn} ${page === totalPages ? styles.disabled : ''}`}
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page === totalPages}
                        whileHover={{ scale: page !== totalPages ? 1.05 : 1 }}
                        whileTap={{ scale: page !== totalPages ? 0.95 : 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        Next
                    </motion.button>
                </motion.div>
            </div>



            {/* Simple Delete Confirmation */}
            {showDeleteConfirm && (
                <>
                    <div className={styles.modalOverlay} onClick={cancelDelete} />
                    <div className={styles.simpleDeleteModal}>
                        <p>Are you sure you want to delete?</p>
                        <div className={styles.simpleActions}>
                            <button 
                                className={styles.cancelBtn}
                                onClick={cancelDelete}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.okBtn}
                                onClick={() => deleteDispatch(showDeleteConfirm.id)}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'OK'}
                            </button>
                        </div>
                    </div>
                </>
            )}
            
            {/* Product Name Modal */}
            {showProductModal && (
                <>
                    <div className={styles.detailCardOverlay} onClick={() => setShowProductModal(null)}>
                        <div className={styles.detailCard} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.detailCardHeader}>
                                <h3 className={styles.detailCardTitle}>Product Details</h3>
                                <button className={styles.detailCardClose} onClick={() => setShowProductModal(null)}>✕</button>
                            </div>
                            <div className={styles.detailCardContent}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Product Name</span>
                                    <span className={styles.detailValue}>{showProductModal.product_name}</span>
                                </div>
                                {showProductModal.barcode && (
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Barcode</span>
                                        <span className={styles.detailValue}>{showProductModal.barcode}</span>
                                    </div>
                                )}
                                {showProductModal.variant && (
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Variant</span>
                                        <span className={styles.detailValue}>{showProductModal.variant}</span>
                                    </div>
                                )}
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Quantity</span>
                                    <span className={styles.detailValue}>{showProductModal.quantity}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Customer Detail Modal - 2026 Nested Card Style */}
            {showCustomerModal && (
                <>
                    <div className={styles.detailCardOverlay} onClick={() => setShowCustomerModal(null)}>
                        <div className={styles.detailCard} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.detailCardHeader}>
                                <h3 className={styles.detailCardTitle}>Customer Details</h3>
                                <button className={styles.detailCardClose} onClick={() => setShowCustomerModal(null)}>✕</button>
                            </div>
                            <div className={styles.detailCardContent}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Customer Name</span>
                                    <span className={styles.detailValue}>{showCustomerModal.customer}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Order Reference</span>
                                    <span className={styles.detailValue}>{showCustomerModal.order_ref}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>AWB Number</span>
                                    <span className={styles.detailValue}>{showCustomerModal.awb}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Payment Mode</span>
                                    <span className={styles.detailValue}>{showCustomerModal.payment_mode}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Amount</span>
                                    <span className={styles.detailValue}>₹{showCustomerModal.invoice_amount}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Status</span>
                                    <span className={styles.detailValue}>{showCustomerModal.status}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Warehouse</span>
                                    <span className={styles.detailValue}>{showCustomerModal.warehouse}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
            
            {/* Order Activity Form */}
            <OrderActivityForm
                isOpen={showOrderActivityForm}
                onClose={closeOrderActivityForm}
                autoFillData={selectedOrderForActivity ? {
                    awb: selectedOrderForActivity.awb,
                    order_ref: selectedOrderForActivity.order_ref,
                    customer_name: selectedOrderForActivity.customer,
                    product_name: selectedOrderForActivity.product_name,
                    logistics: selectedOrderForActivity.logistics
                } : {}}
                onSubmit={handleOrderActivitySubmit}
            />
        </div>
    );
}
