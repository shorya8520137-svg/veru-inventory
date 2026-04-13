"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./productTracker.module.css";
import { apiRequest } from "../../utils/api";
import * as XLSX from 'xlsx';

/* ================= LABEL MAP ================= */
const LABELS = {
    OPENING: "Opening",
    BULK_UPLOAD: "Bulk Upload",
    DISPATCH: "Dispatch",
    SALE: "Dispatch",
    RETURN: "Return",
    DAMAGE: "Damage",
    RECOVER: "Recover",
    RECOVERY: "Recover",
    SELF_TRANSFER: "Transfer",
    ADJUSTMENT_IN: "Adjustment In",
};

export default function ProductTracker({
                                           barcodeOverride,
                                           warehouseFilter,
                                           onClose,
                                       }) {
    const barcode = barcodeOverride;

    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* 🔍 SEARCH */
    const [input, setInput] = useState("");
    const [tokens, setTokens] = useState([]);
    const [debouncedInput, setDebouncedInput] = useState("");

    /* 📅 DATE FILTER */
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    
    /* 🏢 WAREHOUSE FILTER */
    const [selectedWarehouse, setSelectedWarehouse] = useState("ALL");
    const [warehouses, setWarehouses] = useState(["ALL"]);

    const [summary, setSummary] = useState({
        opening: 0,
        bulkUpload: 0,
        dispatch: 0,
        damage: 0,
        returns: 0,
        recovery: 0,
        selfTransferIn: 0,
        selfTransferOut: 0,
        totalIn: 0,
        totalOut: 0,
        finalStock: 0,
    });
    
    /* 🚚 DISPATCH DETAILS MODAL */
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [selectedDispatch, setSelectedDispatch] = useState(null);
    const [dispatchLoading, setDispatchLoading] = useState(false);

    /* 📜 SCROLL TRACKING */
    const [scrollPosition, setScrollPosition] = useState(0);
    const [visibleRowIndex, setVisibleRowIndex] = useState(null);
    const [tableWrapperRef, setTableWrapperRef] = useState(null);
    
    /* 🚚 FETCH DISPATCH DETAILS */
    const fetchDispatchDetails = async (reference) => {
        // First try to find dispatch details from timeline data
        const dispatchEntry = timeline.find(entry => 
            entry.reference === reference && 
            (entry.type === 'DISPATCH' || entry.type === 'SALE') &&
            entry.dispatch_details
        );
        
        if (dispatchEntry && dispatchEntry.dispatch_details) {
            // Use dispatch details from timeline data
            setDispatchLoading(true);
            setShowDispatchModal(true);
            
            setSelectedDispatch({
                ...dispatchEntry.dispatch_details,
                qty: dispatchEntry.quantity,
                quantity: dispatchEntry.quantity,
                barcode: dispatchEntry.barcode,
                product_name: dispatchEntry.product_name,
                warehouse: dispatchEntry.warehouse,
                timestamp: dispatchEntry.timestamp
            });
            
            setDispatchLoading(false);
            return;
        }
        
        // Fallback to API call if dispatch details not found in timeline
        console.log('Dispatch details not found in timeline, falling back to API call');
        
        // Extract dispatch ID from reference like "DISPATCH_36_89345y398"
        const parts = reference.split('_');
        const dispatchId = parts[1]; // Get the ID (36)
        
        if (!dispatchId) {
            console.error('Could not extract dispatch ID from reference:', reference);
            alert('Could not load dispatch details. Invalid reference format.');
            return;
        }
        
        setDispatchLoading(true);
        setShowDispatchModal(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/order-tracking/${dispatchId}/timeline`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Handle 404 - dispatch not found
            if (response.status === 404) {
                console.error('Dispatch ID not found:', dispatchId);
                setSelectedDispatch(null);
                setShowDispatchModal(false);
                alert(`Dispatch order #${dispatchId} not found in the system. It may have been deleted or the ID is invalid.`);
                return;
            }
            
            const data = await response.json();
            
            if (data.success && data.data) {
                // The API returns { dispatch: {...}, timeline: [...], summary: {...} }
                // Flatten dispatch fields to root level for easier access in modal
                setSelectedDispatch({
                    ...data.data.dispatch,  // Spread dispatch fields to root
                    timeline: data.data.timeline || [],
                    summary: data.data.summary || {}
                });
            } else {
                console.error('Failed to fetch dispatch details');
                setSelectedDispatch(null);
                setShowDispatchModal(false);
                alert('Failed to load dispatch details. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching dispatch details:', error);
            setSelectedDispatch(null);
            setShowDispatchModal(false);
            alert('Error loading dispatch details. Please check your connection and try again.');
        } finally {
            setDispatchLoading(false);
        }
    };
    
    const closeDispatchModal = () => {
        setShowDispatchModal(false);
        setSelectedDispatch(null);
    };

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        if (!barcode) {
            setLoading(false);
            return;
        }

        let mounted = true;
        document.body.style.overflow = "hidden";

        const fetchTracker = async () => {
            try {
                setLoading(true);
                setError("");

                // ✅ Updated to use new timeline API
                let url = `/api/timeline/${encodeURIComponent(barcode)}`;
                
                const params = new URLSearchParams();
                
                // Apply warehouse filter
                const activeWarehouse = warehouseFilter || selectedWarehouse;
                if (activeWarehouse && activeWarehouse !== "ALL") {
                    params.append('warehouse', activeWarehouse);
                }
                
                // Apply date filters
                if (fromDate) {
                    params.append('fromDate', fromDate);
                }
                if (toDate) {
                    params.append('toDate', toDate);
                }
                
                if (params.toString()) {
                    url += `?${params.toString()}`;
                }

                const data = await apiRequest(url);
                if (!mounted) return;

                // Handle new timeline API response format from controller
                const timelineData = data.data?.timeline || [];
                const summaryData = data.data?.summary || {};
                const breakdown = summaryData.breakdown || {};

                if (!Array.isArray(timelineData)) {
                    throw new Error("Invalid API response");
                }

                // Timeline already has balance_after calculated by controller
                // Just format for display
                const formattedTimeline = timelineData.map((item, index) => ({
                    ...item,
                    timestamp: item.timestamp,
                    type: item.type,
                    quantity: item.quantity || 0,
                    warehouse: item.warehouse,
                    reference: item.reference,
                    direction: item.direction,
                    balance_after: item.balance_after || 0,
                    description: item.description || ''
                }));

                console.log('📊 Timeline entries:', formattedTimeline.length);
                console.log('📊 Summary from API:', summaryData);
                
                // Extract unique warehouses from timeline
                const uniqueWarehouses = ["ALL", ...new Set(timelineData.map(item => item.warehouse).filter(Boolean))];
                setWarehouses(uniqueWarehouses);

                // Use summary directly from controller (already calculated correctly)
                const calculatedSummary = {
                    opening: breakdown.opening || 0,
                    bulkUpload: breakdown.bulk_upload || 0,
                    dispatch: breakdown.dispatch || 0,
                    damage: breakdown.damage || 0,
                    returns: breakdown.returns || 0,
                    recovery: breakdown.recovery || 0,
                    selfTransferIn: breakdown.self_transfer_in || 0,
                    selfTransferOut: breakdown.self_transfer_out || 0,
                    totalIn: summaryData.total_in || 0,
                    totalOut: summaryData.total_out || 0,
                    finalStock: summaryData.current_stock || 0,
                };

                console.log('📊 Calculated summary:', calculatedSummary);

                setSummary(calculatedSummary);
                setTimeline(formattedTimeline);
                setLoading(false);
            } catch (err) {
                if (mounted) {
                    console.error('Timeline fetch error:', err);
                    setError("Failed to load tracking data");
                    setLoading(false);
                }
            }
        };

        fetchTracker();

        return () => {
            mounted = false;
            document.body.style.overflow = "auto";
        };
    }, [barcode, warehouseFilter, selectedWarehouse, fromDate, toDate]);

    /* ================= DEBOUNCE SEARCH INPUT ================= */
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedInput(input);
        }, 300);

        return () => clearTimeout(timer);
    }, [input]);

    /* ================= SEARCH HANDLERS ================= */
    const addToken = (value) => {
        const v = value.trim().toLowerCase();
        if (!v) return;
        if (!tokens.includes(v)) setTokens([...tokens, v]);
        setInput("");
    };

    const removeToken = (t) => {
        setTokens(tokens.filter((x) => x !== t));
    };

    /* ================= FILTER TIMELINE ================= */
    const filteredTimeline = useMemo(() => {
        return timeline.filter((row) => {
            const text = `
        ${row.type}
        ${row.warehouse}
        ${row.reference}
      `.toLowerCase();

            const tokenMatch = tokens.every((t) => text.includes(t));

            const date = row.timestamp?.split("T")[0];
            const afterFrom = !fromDate || date >= fromDate;
            const beforeTo = !toDate || date <= toDate;

            return tokenMatch && afterFrom && beforeTo;
        });
    }, [timeline, tokens, fromDate, toDate]);

    /* ================= SCROLL TRACKING ================= */
    useEffect(() => {
        if (!tableWrapperRef || loading || filteredTimeline.length === 0) return;

        const handleScroll = () => {
            const container = tableWrapperRef;
            const scrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            
            setScrollPosition(scrollTop);

            // Find the visible row at the top of the viewport
            const tbody = container.querySelector('tbody');
            if (!tbody) return;

            const rows = Array.from(tbody.querySelectorAll('tr'));
            const headerHeight = container.querySelector('thead')?.offsetHeight || 0;
            const threshold = scrollTop + headerHeight + 50; // 50px offset for better UX

            let visibleIndex = null;
            let accumulatedHeight = headerHeight;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowHeight = row.offsetHeight;
                accumulatedHeight += rowHeight;

                if (accumulatedHeight >= threshold) {
                    visibleIndex = i;
                    break;
                }
            }

            // If scrolled to top, show first row
            if (scrollTop < 50) {
                visibleIndex = 0;
            }

            // If scrolled to bottom, show last row
            if (scrollTop + containerHeight >= container.scrollHeight - 10) {
                visibleIndex = rows.length - 1;
            }

            setVisibleRowIndex(visibleIndex);
        };

        // Throttle scroll events for performance
        let ticking = false;
        const throttledScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        tableWrapperRef.addEventListener('scroll', throttledScroll, { passive: true });
        handleScroll(); // Initial call

        return () => {
            tableWrapperRef.removeEventListener('scroll', throttledScroll);
        };
    }, [tableWrapperRef, loading, filteredTimeline]);
    
    /* ================= EXPORT TO EXCEL ================= */
    const exportToExcel = async () => {
        try {
            // Sheet 1: Timeline Data
            const timelineSheet = filteredTimeline.map(row => {
                const [date, time] = row.timestamp.split("T");
                return {
                    'Type': LABELS[row.type] || row.type,
                    'Qty': row.quantity,
                    'Direction': row.direction,
                    'Date': date,
                    'Time': time.slice(0, 8),
                    'Warehouse': row.warehouse,
                    'Reference': row.reference || '—',
                    'Balance': row.balance_after,
                    'Description': row.description || ''
                };
            });
            
            // Sheet 2: Dispatch Details (AWB-wise)
            const dispatchDetails = [];
            const token = localStorage.getItem('token');
            
            // Filter only DISPATCH/SALE events
            const dispatchEvents = filteredTimeline.filter(row => 
                row.type === 'DISPATCH' || row.type === 'SALE'
            );
            
            // Fetch details for each dispatch
            for (const event of dispatchEvents) {
                if (event.reference) {
                    const parts = event.reference.split('_');
                    const dispatchId = parts[1];
                    
                    if (dispatchId) {
                        try {
                            const response = await fetch(
                                `${process.env.NEXT_PUBLIC_API_BASE}/api/order-tracking/${dispatchId}/timeline`,
                                { headers: { 'Authorization': `Bearer ${token}` } }
                            );
                            
                            if (response.ok) {
                                const data = await response.json();
                                if (data.success && data.data && data.data.dispatch) {
                                    const d = data.data.dispatch;
                                    const [date, time] = (d.timestamp || event.timestamp).split("T");
                                    
                                    dispatchDetails.push({
                                        'Dispatch ID': dispatchId,
                                        'AWB': d.awb || 'N/A',
                                        'Customer': d.customer || 'N/A',
                                        'Order Ref': d.order_ref || 'N/A',
                                        'Product': d.product_name || 'N/A',
                                        'Barcode': d.barcode || barcode,
                                        'Qty': d.qty || d.quantity || event.quantity,
                                        'Warehouse': d.warehouse || event.warehouse,
                                        'Status': d.status || 'N/A',
                                        'Logistics': d.logistics || 'N/A',
                                        'Payment': d.payment_mode || 'N/A',
                                        'Invoice': d.invoice_amount || 0,
                                        'Dimensions': `L:${d.length || 0} × W:${d.width || 0} × H:${d.height || 0}`,
                                        'Weight': `${d.actual_weight || 0} kg`,
                                        'Date': `${date} ${time?.slice(0, 8) || ''}`
                                    });
                                }
                            }
                        } catch (err) {
                            console.error(`Failed to fetch dispatch ${dispatchId}:`, err);
                        }
                    }
                }
            }
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            
            // Add Sheet 1: Timeline
            const ws1 = XLSX.utils.json_to_sheet(timelineSheet);
            XLSX.utils.book_append_sheet(wb, ws1, "Timeline Data");
            
            // Add Sheet 2: Dispatch Details (only if there are dispatches)
            if (dispatchDetails.length > 0) {
                const ws2 = XLSX.utils.json_to_sheet(dispatchDetails);
                XLSX.utils.book_append_sheet(wb, ws2, "Dispatch Details");
            }
            
            // Generate filename with barcode and date
            const filename = `Timeline_${barcode}_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Download
            XLSX.writeFile(wb, filename);
            
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <button className={styles.closeTopBtn} onClick={onClose}>
                    ✕
                </button>

                <div className={styles.modalContent}>
                    <h2 className={styles.header}>
                        Product Tracker — <span>{barcode}</span>
                    </h2>

                    {/* ================= SUMMARY ================= */}
                    {loading ? (
                        <div className={styles.skeletonSummary}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={styles.skeletonCard} />
                            ))}
                        </div>
                    ) : (
                        <motion.div 
                            className={styles.breakdownBox}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            key={`summary-${filteredTimeline.length}`}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.05 }}
                            >
                                Opening: <motion.strong
                                    key={summary.opening}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >{summary.opening}</motion.strong>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                            >
                                Bulk Upload: <motion.strong
                                    key={summary.bulkUpload}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >{summary.bulkUpload}</motion.strong>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.15 }}
                            >
                                Dispatch: <motion.span
                                    key={summary.dispatch}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >{summary.dispatch}</motion.span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                Damage: <motion.span
                                    key={summary.damage}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >{summary.damage}</motion.span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.25 }}
                            >
                                Return: <motion.span
                                    key={summary.returns}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >{summary.returns}</motion.span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                            >
                                Recover: <motion.span
                                    key={summary.recovery}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >{summary.recovery}</motion.span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.32 }}
                            >
                                Transfer In: <motion.span
                                    key={summary.selfTransferIn}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >{summary.selfTransferIn}</motion.span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.34 }}
                            >
                                Transfer Out: <motion.span
                                    key={summary.selfTransferOut}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >{summary.selfTransferOut}</motion.span>
                            </motion.div>
                            <motion.div 
                                className={styles.finalStock}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                            >
                                Final Stock: <motion.strong
                                    key={summary.finalStock}
                                    initial={{ scale: 1.3, color: "#2563eb" }}
                                    animate={{ scale: 1, color: "#1d4ed8" }}
                                    transition={{ duration: 0.4 }}
                                >{summary.finalStock}</motion.strong>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ================= FILTER BAR ================= */}
                    <div className={styles.filterBar}>
                        <div className={styles.searchWrapper}>
                            {tokens.map((t, i) => (
                                <span key={i} className={styles.chip}>
                    {t}
                                    <button onClick={() => removeToken(t)}>×</button>
                  </span>
                            ))}

                            <input
                                placeholder="Search type, warehouse, reference…"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addToken(input)}
                                disabled={loading}
                            />
                        </div>
                        
                        <select
                            className={styles.warehouseSelect}
                            value={selectedWarehouse}
                            onChange={(e) => setSelectedWarehouse(e.target.value)}
                            disabled={loading}
                        >
                            {warehouses.map(wh => (
                                <option key={wh} value={wh}>{wh}</option>
                            ))}
                        </select>

                        <input
                            type="date"
                            className={styles.dateInput}
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            disabled={loading}
                            placeholder="From Date"
                        />
                        <input
                            type="date"
                            className={styles.dateInput}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            disabled={loading}
                            placeholder="To Date"
                        />
                        
                        <button
                            className={styles.exportBtn}
                            onClick={exportToExcel}
                            disabled={loading || filteredTimeline.length === 0}
                            title="Export to Excel"
                        >
                            📊 Export
                        </button>
                    </div>

                    {/* ================= TABLE ================= */}
                    <motion.div 
                        className={styles.tableWrapper}
                        ref={setTableWrapperRef}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <motion.table 
                            className={styles.logTable}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                        >
                            <thead>
                            <tr>
                                <th>Type</th>
                                <th>Qty</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Warehouse</th>
                                <th>Reference</th>
                                <th>Balance</th>
                            </tr>
                            </thead>

                            <motion.tbody
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                            >
                            {loading ? (
                                <>
                                    {[...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan="7">
                                                <div className={styles.skeletonRow} />
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" className={styles.status}>
                                        <div className={styles.loadingSpinner}>
                                            <span>⚠️</span>
                                            <span>{error}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTimeline.length === 0 ? (
                                <motion.tr
                                    key="no-results"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <td colSpan="7" className={styles.status}>
                                        No records found
                                    </td>
                                </motion.tr>
                            ) : (
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {filteredTimeline.map((row, i) => {
                                        const [date, time] = row.timestamp.split("T");
                                        const isVisible = visibleRowIndex === i;
                                        const rowKey = `${row.timestamp}-${row.reference || i}-${row.type}`;
                                        
                                        return (
                                            <motion.tr
                                                key={rowKey}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ 
                                                    opacity: 1, 
                                                    x: 0
                                                }}
                                                exit={{ 
                                                    opacity: 0, 
                                                    x: 20
                                                }}
                                                transition={{
                                                    opacity: { duration: 0.2 },
                                                    x: { duration: 0.3, ease: "easeOut" }
                                                }}
                                                className={`${isVisible ? styles.activeRow : ''}`}
                                                data-row-index={i}
                                            >
                                                <td>
                                    <span
                                        className={`${styles.statusTag} ${
                                            styles[row.type]
                                        } ${row.type === 'DISPATCH' || row.type === 'SALE' ? styles.clickable : ''}`}
                                        onClick={() => {
                                            if ((row.type === 'DISPATCH' || row.type === 'SALE') && row.reference) {
                                                fetchDispatchDetails(row.reference);
                                            }
                                        }}
                                        title={row.type === 'DISPATCH' || row.type === 'SALE' ? 'Click to view dispatch details' : ''}
                                    >
                                      {LABELS[row.type] || row.type}
                                    </span>
                                                </td>
                                                <td>{row.quantity}</td>
                                                <td>{date}</td>
                                                <td>{time.slice(0, 8)}</td>
                                                <td>{row.warehouse}</td>
                                                <td>{row.reference || "—"}</td>
                                                <td className={row.balance_after < 0 ? styles.negativeBalance : ''}>{row.balance_after}</td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                            </motion.tbody>
                        </motion.table>
                    </motion.div>
                </div>
            </div>
            
            {/* 🚚 DISPATCH DETAILS MODAL */}
            {showDispatchModal && (
                <>
                    <div className={styles.dispatchOverlay} onClick={closeDispatchModal} />
                    <div className={styles.dispatchModal}>
                        <div className={styles.dispatchHeader}>
                            <h3>Dispatch Details</h3>
                            <button className={styles.closeBtn} onClick={closeDispatchModal}>✕</button>
                        </div>
                        
                        <div className={styles.dispatchContent}>
                            {dispatchLoading ? (
                                <div className={styles.loadingSpinner}>
                                    <span>⏳</span>
                                    <span>Loading dispatch details...</span>
                                </div>
                            ) : selectedDispatch ? (
                                <>
                                    {/* Dispatch Summary */}
                                    <div className={styles.dispatchSummary}>
                                        <div className={styles.summaryGrid}>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>CUSTOMER:</span>
                                                <span className={styles.summaryValue}>{selectedDispatch.customer || 'N/A'}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>PRODUCT:</span>
                                                <span className={styles.summaryValue}>{selectedDispatch.product_name || 'N/A'}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>AWB:</span>
                                                <span className={styles.summaryValue}>{selectedDispatch.awb || 'N/A'}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>ORDER REF:</span>
                                                <span className={styles.summaryValue}>{selectedDispatch.order_ref || 'N/A'}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>QUANTITY:</span>
                                                <span className={styles.summaryValue}>{selectedDispatch.qty || selectedDispatch.quantity || 0}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>WAREHOUSE:</span>
                                                <span className={styles.summaryValue}>{selectedDispatch.warehouse || 'N/A'}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>STATUS:</span>
                                                <span className={styles.statusBadge}>{selectedDispatch.status || 'N/A'}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>LOGISTICS:</span>
                                                <span className={styles.summaryValue}>{selectedDispatch.logistics || 'N/A'}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>PAYMENT MODE:</span>
                                                <span className={styles.summaryValue}>{selectedDispatch.payment_mode || 'N/A'}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>INVOICE AMOUNT:</span>
                                                <span className={styles.summaryValue}>₹{selectedDispatch.invoice_amount || 0}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>DIMENSIONS:</span>
                                                <span className={styles.summaryValue}>
                                                    L: {selectedDispatch.length || 0} × W: {selectedDispatch.width || 0} × H: {selectedDispatch.height || 0}
                                                </span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>WEIGHT:</span>
                                                <span className={styles.summaryValue}>{selectedDispatch.actual_weight || 0} kg</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>BARCODE:</span>
                                                <span className={styles.summaryValue}>{selectedDispatch.barcode || barcode}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.noData}>
                                    <span>⚠️</span>
                                    <span>No dispatch details available</span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
