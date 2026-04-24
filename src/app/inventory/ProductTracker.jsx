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

    /* ðŸ” SEARCH */
    const [input, setInput] = useState("");
    const [tokens, setTokens] = useState([]);
    const [debouncedInput, setDebouncedInput] = useState("");

    /* ðŸ“… DATE FILTER */
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    
    /* ðŸ¢ WAREHOUSE FILTER */
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
    
    /* ðŸšš DISPATCH DETAILS MODAL */
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [selectedDispatch, setSelectedDispatch] = useState(null);
    const [dispatchLoading, setDispatchLoading] = useState(false);

    /* 🔄 SELF TRANSFER DETAILS MODAL */
    const [showSelfTransferModal, setShowSelfTransferModal] = useState(false);
    const [selectedSelfTransfer, setSelectedSelfTransfer] = useState(null);
    const [selfTransferLoading, setSelfTransferLoading] = useState(false);

    /* ðŸ“œ SCROLL TRACKING */
    const [scrollPosition, setScrollPosition] = useState(0);
    const [visibleRowIndex, setVisibleRowIndex] = useState(null);
    const [tableWrapperRef, setTableWrapperRef] = useState(null);
    
    /* ðŸšš FETCH DISPATCH DETAILS */
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

    /* 🔄 FETCH SELF TRANSFER DETAILS */
    const fetchSelfTransferDetails = async (reference) => {
        console.log('Fetching self-transfer details for reference:', reference);
        
        setSelfTransferLoading(true);
        setShowSelfTransferModal(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/self-transfer/${reference}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.status === 404) {
                console.error('Self-transfer not found:', reference);
                setSelectedSelfTransfer(null);
                setShowSelfTransferModal(false);
                alert(`Self-transfer ${reference} not found in the system.`);
                return;
            }
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.transfer) {
                setSelectedSelfTransfer(data.data.transfer);
            } else {
                console.error('Failed to fetch self-transfer details');
                setSelectedSelfTransfer(null);
                setShowSelfTransferModal(false);
                alert('Failed to load self-transfer details. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching self-transfer details:', error);
            setSelectedSelfTransfer(null);
            setShowSelfTransferModal(false);
            alert('Error loading self-transfer details. Please check your connection and try again.');
        } finally {
            setSelfTransferLoading(false);
        }
    };
    
    const closeSelfTransferModal = () => {
        setShowSelfTransferModal(false);
        setSelectedSelfTransfer(null);
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

                // âœ… Updated to use new timeline API
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

                console.log('ðŸ“Š Timeline entries:', formattedTimeline.length);
                console.log('ðŸ“Š Summary from API:', summaryData);
                
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

                console.log('ðŸ“Š Calculated summary:', calculatedSummary);

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
                    'Reference': row.reference || 'â€”',
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
                                        'Dimensions': `L:${d.length || 0} Ã— W:${d.width || 0} Ã— H:${d.height || 0}`,
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

    // â”€â”€ type â†’ badge config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const TYPE_BADGE = {
        OPENING:       { label:'OPENING',   bg:'#1e3a5f', color:'#93C5FD' },
        BULK_UPLOAD:   { label:'UPLOAD',    bg:'#1e3a5f', color:'#93C5FD' },
        DISPATCH:      { label:'DISPATCH',  bg:'#7f1d1d', color:'#FCA5A5' },
        SALE:          { label:'DISPATCH',  bg:'#7f1d1d', color:'#FCA5A5' },
        DAMAGE:        { label:'DAMAGE',    bg:'#7f1d1d', color:'#FCA5A5' },
        RETURN:        { label:'RETURN',    bg:'#14532d', color:'#86EFAC' },
        RECOVER:       { label:'RECOVER',   bg:'#14532d', color:'#86EFAC' },
        RECOVERY:      { label:'RECOVER',   bg:'#14532d', color:'#86EFAC' },
        SELF_TRANSFER: { label:'TRANSFER',  bg:'#312e81', color:'#C4B5FD' },
        ADJUSTMENT_IN: { label:'ADJUST',    bg:'#1e3a5f', color:'#93C5FD' },
    };
    const getBadge = (type) => TYPE_BADGE[type] || { label: type, bg:'#1E293B', color:'#94A3B8' };

    // â”€â”€ dot colour by direction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const dotColor = (row) => {
        if (row.direction === 'IN') return '#4ADE80';
        if (row.direction === 'OUT') return '#F87171';
        return '#64748B';
    };

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(2,6,23,0.8)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}>

            {/* â”€â”€ Shell â”€â”€ */}
            <div style={{ display:'flex', flexDirection:'column', width:'92vw', maxWidth:1100, height:'88vh', background:'#0F172A', borderRadius:16, overflow:'hidden', border:'1px solid #1E293B', boxShadow:'0 40px 100px rgba(0,0,0,0.7)' }}>

                {/* â”€â”€ Top bar â”€â”€ */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'#0B1120', borderBottom:'1px solid #1E293B', flexShrink:0 }}>
                    <div>
                        <div style={{ fontSize:10, color:'#475569', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:3 }}>Audit Log / Stock Control</div>
                        <div style={{ fontSize:16, fontWeight:700, color:'#F1F5F9', letterSpacing:'-0.01em' }}>
                            Product Ledger â€” <span style={{ color:'#60A5FA' }}>{barcode}</span>
                        </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <button onClick={exportToExcel} disabled={loading || filteredTimeline.length === 0}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #334155', background:'#1E293B', color:'#94A3B8', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Export CSV
                        </button>
                        <button onClick={onClose} style={{ width:30, height:30, borderRadius:7, border:'1px solid #334155', background:'#1E293B', color:'#64748B', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>Ã—</button>
                    </div>
                </div>

                {/* â”€â”€ Body: sidebar + main â”€â”€ */}
                <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

                    {/* â”€â”€ LEFT SIDEBAR â”€â”€ */}
                    <div style={{ width:220, flexShrink:0, background:'#0B1120', borderRight:'1px solid #1E293B', display:'flex', flexDirection:'column', padding:'16px 14px', gap:16, overflowY:'auto', scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch' }}>
                        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

                        {/* View Filters label */}
                        <div style={{ fontSize:10, fontWeight:700, color:'#334155', letterSpacing:'0.1em', textTransform:'uppercase' }}>View Filters</div>

                        {/* Search reference */}
                        <div>
                            <div style={{ fontSize:10, color:'#475569', marginBottom:5, fontWeight:600 }}>Search Reference</div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:4, padding:'6px 8px', borderRadius:7, border:'1px solid #1E293B', background:'#0F172A', minHeight:32 }}>
                                {tokens.map((t, i) => (
                                    <span key={i} style={{ display:'flex', alignItems:'center', gap:3, background:'#1E293B', color:'#94A3B8', borderRadius:4, padding:'1px 6px', fontSize:10 }}>
                                        {t}
                                        <button onClick={() => removeToken(t)} style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:11, lineHeight:1, padding:0 }}>Ã—</button>
                                    </span>
                                ))}
                                <input value={input} onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addToken(input)}
                                    placeholder={tokens.length ? '' : 'e.g. REF-882'}
                                    style={{ flex:1, minWidth:60, background:'none', border:'none', outline:'none', fontSize:11, color:'#94A3B8', padding:0 }}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Event type / warehouse */}
                        <div>
                            <div style={{ fontSize:10, color:'#475569', marginBottom:5, fontWeight:600 }}>Warehouse</div>
                            <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} disabled={loading}
                                style={{ width:'100%', padding:'6px 8px', borderRadius:7, border:'1px solid #1E293B', background:'#0F172A', color:'#94A3B8', fontSize:11, outline:'none', colorScheme:'dark' }}>
                                {warehouses.map(wh => <option key={wh} value={wh}>{wh === 'ALL' ? 'All Warehouses' : wh}</option>)}
                            </select>
                        </div>

                        {/* Date range */}
                        <div>
                            <div style={{ fontSize:10, color:'#475569', marginBottom:5, fontWeight:600 }}>Date Range</div>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} disabled={loading}
                                style={{ width:'100%', padding:'6px 8px', borderRadius:7, border:'1px solid #1E293B', background:'#0F172A', color:'#94A3B8', fontSize:11, outline:'none', colorScheme:'dark', marginBottom:6, boxSizing:'border-box' }}/>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} disabled={loading}
                                style={{ width:'100%', padding:'6px 8px', borderRadius:7, border:'1px solid #1E293B', background:'#0F172A', color:'#94A3B8', fontSize:11, outline:'none', colorScheme:'dark', boxSizing:'border-box' }}/>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop:'1px solid #1E293B' }}/>

                        {/* Stock Overview */}
                        <div>
                            <div style={{ fontSize:10, fontWeight:700, color:'#334155', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Stock Overview</div>
                            {loading ? (
                                <div style={{ color:'#334155', fontSize:11 }}>Loadingâ€¦</div>
                            ) : (
                                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                    {[
                                        { label:'Opening',      value: summary.opening || 0,        color:'#94A3B8' },
                                        { label:'Bulk Upload',  value: summary.bulkUpload || 0,     color:'#94A3B8' },
                                        { label:'Dispatch',     value: summary.dispatch ? `-${summary.dispatch}` : '0',  color:'#F87171' },
                                        { label:'Damaged',      value: summary.damage ? `-${summary.damage}` : '0',    color:'#F87171' },
                                        { label:'Returns',      value: summary.returns ? `+${summary.returns}` : '0',   color:'#4ADE80' },
                                        { label:'Recovery',     value: summary.recovery ? `+${summary.recovery}` : '0',  color:'#4ADE80' },
                                        { label:'Transfer In',  value: summary.selfTransferIn ? `+${summary.selfTransferIn}` : '0',  color:'#4ADE80' },
                                        { label:'Transfer Out', value: summary.selfTransferOut ? `-${summary.selfTransferOut}` : '0', color:'#F87171' },
                                    ].map(r => (
                                        <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                            <span style={{ fontSize:11, color:'#475569' }}>{r.label}</span>
                                            <span style={{ fontSize:12, fontWeight:600, color:r.color }}>{r.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Current Balance card */}
                        <div style={{ marginTop:'auto', background:'#1E293B', borderRadius:10, padding:'12px 14px', border:'1px solid #334155' }}>
                            <div style={{ fontSize:9, fontWeight:700, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Current Balance</div>
                            <div style={{ fontSize:28, fontWeight:700, color:'#60A5FA', letterSpacing:'-0.02em' }}>{loading ? 'â€”' : summary.finalStock}</div>
                        </div>
                    </div>

                    {/* â”€â”€ RIGHT MAIN PANEL â”€â”€ */}
                    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

                        {/* KPI Cards Row */}
                        <div style={{ display:'flex', gap:12, padding:'16px 20px', flexShrink:0 }}>
                            {[
                                { 
                                    label: 'OPENING', 
                                    value: summary.opening || 0, 
                                    subtitle: 'Initial Stock',
                                    color: '#94A3B8',
                                    bgColor: 'rgba(148, 163, 184, 0.1)'
                                },
                                { 
                                    label: 'RECEIVED', 
                                    value: `+${(summary.bulkUpload || 0) + (summary.returns || 0) + (summary.recovery || 0) + (summary.selfTransferIn || 0)}`, 
                                    subtitle: 'Total Inbound',
                                    color: '#4ADE80',
                                    bgColor: 'rgba(74, 222, 128, 0.1)'
                                },
                                { 
                                    label: 'DISPATCHED', 
                                    value: `-${(summary.dispatch || 0) + (summary.damage || 0) + (summary.selfTransferOut || 0)}`, 
                                    subtitle: 'Total Outbound',
                                    color: '#F87171',
                                    bgColor: 'rgba(248, 113, 113, 0.1)'
                                },
                                { 
                                    label: 'LIVE STOCK', 
                                    value: summary.finalStock || 0, 
                                    subtitle: 'Available Now',
                                    color: '#60A5FA',
                                    bgColor: 'rgba(96, 165, 250, 0.1)'
                                }
                            ].map((kpi, index) => (
                                <div key={index} style={{ 
                                    flex: 1, 
                                    background: kpi.bgColor, 
                                    borderRadius: 12, 
                                    padding: '16px 20px', 
                                    border: `1px solid ${kpi.color}20`,
                                    textAlign: 'center'
                                }}>
                                    <div style={{ 
                                        fontSize: 10, 
                                        fontWeight: 700, 
                                        color: '#64748B', 
                                        letterSpacing: '0.1em', 
                                        textTransform: 'uppercase', 
                                        marginBottom: 8 
                                    }}>
                                        {kpi.label}
                                    </div>
                                    <div style={{ 
                                        fontSize: 28, 
                                        fontWeight: 700, 
                                        color: kpi.color, 
                                        letterSpacing: '-0.02em',
                                        marginBottom: 4
                                    }}>
                                        {loading ? '—' : kpi.value}
                                    </div>
                                    <div style={{ 
                                        fontSize: 9, 
                                        color: '#64748B', 
                                        fontWeight: 500 
                                    }}>
                                        {kpi.subtitle}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Table header row */}
                        <div style={{ display:'grid', gridTemplateColumns:'140px 1fr 1fr 90px 90px', padding:'10px 20px', borderBottom:'1px solid #1E293B', flexShrink:0 }}>
                            {['TIMESTAMP','TRANSACTION DETAIL','','IMPACT','BALANCE'].map((h,i) => (
                                <div key={i} style={{ fontSize:9, fontWeight:700, color:'#334155', letterSpacing:'0.1em', textTransform:'uppercase' }}>{h}</div>
                            ))}
                        </div>

                        {/* Rows */}
                        <div ref={setTableWrapperRef} style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch' }}>
                            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                            {loading ? (
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#334155', fontSize:12 }}>Loadingâ€¦</div>
                            ) : error ? (
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#F87171', fontSize:12 }}>{error}</div>
                            ) : filteredTimeline.length === 0 ? (
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#334155', fontSize:12 }}>No records found</div>
                            ) : (
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {filteredTimeline.map((row, i) => {
                                        const [date, timePart] = row.timestamp.split('T');
                                        const time = (timePart || '').slice(0, 8);
                                        const badge = getBadge(row.type);
                                        const impact = row.direction === 'IN' ? `+${row.quantity}` : row.direction === 'OUT' ? `-${row.quantity}` : `${row.quantity}`;
                                        const impactColor = row.direction === 'IN' ? '#4ADE80' : row.direction === 'OUT' ? '#F87171' : '#94A3B8';
                                        const isDispatch = row.type === 'DISPATCH' || row.type === 'SALE';
                                        const rowKey = `${row.timestamp}-${row.reference || i}-${row.type}`;

                                        return (
                                            <motion.div key={rowKey}
                                                initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                                                transition={{ duration:0.18 }}
                                                style={{ display:'grid', gridTemplateColumns:'140px 1fr 1fr 90px 90px', padding:'12px 20px', borderBottom:'1px solid #0F172A', alignItems:'center' }}
                                                onMouseEnter={e => e.currentTarget.style.background='#0B1120'}
                                                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                                            >
                                                {/* Timestamp */}
                                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                    <span style={{ width:7, height:7, borderRadius:'50%', background:dotColor(row), flexShrink:0, display:'inline-block' }}/>
                                                    <div>
                                                        <div style={{ fontSize:11, color:'#CBD5E1', fontWeight:500 }}>{date}</div>
                                                        <div style={{ fontSize:10, color:'#475569' }}>{time}</div>
                                                    </div>
                                                </div>

                                                {/* Badge + title */}
                                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                    <span onClick={() => {
                                                        if (isDispatch && row.reference) {
                                                            fetchDispatchDetails(row.reference);
                                                        } else if (row.type === 'SELF_TRANSFER' && row.reference) {
                                                            fetchSelfTransferDetails(row.reference);
                                                        }
                                                    }}
                                                        style={{ 
                                                            padding:'2px 7px', 
                                                            borderRadius:4, 
                                                            background:badge.bg, 
                                                            color:badge.color, 
                                                            fontSize:9, 
                                                            fontWeight:700, 
                                                            letterSpacing:'0.06em', 
                                                            cursor: (isDispatch || row.type === 'SELF_TRANSFER') && row.reference ? 'pointer' : 'default', 
                                                            userSelect:'none' 
                                                        }}>
                                                        {badge.label}
                                                    </span>
                                                    <span style={{ fontSize:12, color:'#CBD5E1', fontWeight:500 }}>{LABELS[row.type] || row.type}</span>
                                                </div>

                                                {/* Reference + warehouse */}
                                                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                                                    {row.reference && <span style={{ fontSize:10, color:'#475569', fontFamily:'monospace' }}>{row.reference}</span>}
                                                    <span style={{ fontSize:10, color:'#334155', display:'flex', alignItems:'center', gap:3 }}>
                                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                                                        {row.warehouse}
                                                    </span>
                                                </div>

                                                {/* Impact */}
                                                <div style={{ fontSize:14, fontWeight:700, color:impactColor, textAlign:'right' }}>{impact}</div>

                                                {/* Balance */}
                                                <div style={{ fontSize:13, fontWeight:500, color: row.balance_after < 0 ? '#F87171' : '#94A3B8', textAlign:'right' }}>{row.balance_after?.toFixed ? row.balance_after.toFixed(0) : row.balance_after}</div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer status bar */}
                        <div style={{ padding:'8px 20px', borderTop:'1px solid #1E293B', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                            <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                                <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'#334155' }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', display:'inline-block' }}/>
                                    System Online
                                </span>
                                <span style={{ fontSize:10, color:'#334155' }}>Records: {filteredTimeline.length}</span>
                            </div>
                            <span style={{ fontSize:10, color:'#334155' }}>Showing {filteredTimeline.length} entries</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* â”€â”€ Dispatch detail overlay â”€â”€ */}
            {showDispatchModal && (
                <div style={{ position:'absolute', inset:0, background:'rgba(2,6,23,0.7)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={closeDispatchModal}>
                    <div style={{ background:'#0F172A', borderRadius:14, width:480, border:'1px solid #1E293B', boxShadow:'0 24px 60px rgba(0,0,0,0.6)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom:'1px solid #1E293B', background:'#0B1120' }}>
                            <span style={{ fontSize:13, fontWeight:700, color:'#F1F5F9' }}>Dispatch Details</span>
                            <button onClick={closeDispatchModal} style={{ background:'#1E293B', border:'1px solid #334155', borderRadius:6, width:26, height:26, cursor:'pointer', color:'#64748B', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>Ã—</button>
                        </div>
                        <div style={{ padding:'16px 18px', maxHeight:400, overflowY:'auto' }}>
                            {dispatchLoading ? (
                                <div style={{ color:'#475569', fontSize:12, textAlign:'center', padding:24 }}>Loadingâ€¦</div>
                            ) : selectedDispatch ? (
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px' }}>
                                    {[
                                        ['Customer',      selectedDispatch.customer],
                                        ['AWB',           selectedDispatch.awb],
                                        ['Order Ref',     selectedDispatch.order_ref],
                                        ['Quantity',      selectedDispatch.qty || selectedDispatch.quantity],
                                        ['Warehouse',     selectedDispatch.warehouse],
                                        ['Status',        selectedDispatch.status],
                                        ['Logistics',     selectedDispatch.logistics],
                                        ['Payment',       selectedDispatch.payment_mode],
                                        ['Invoice',       selectedDispatch.invoice_amount ? `â‚¹${selectedDispatch.invoice_amount}` : null],
                                        ['Weight',        selectedDispatch.actual_weight ? `${selectedDispatch.actual_weight} kg` : null],
                                        ['Dimensions',    selectedDispatch.length ? `${selectedDispatch.length}Ã—${selectedDispatch.width}Ã—${selectedDispatch.height}` : null],
                                        ['Barcode',       selectedDispatch.barcode || barcode],
                                    ].map(([label, val]) => (
                                        <div key={label}>
                                            <div style={{ fontSize:9, color:'#334155', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:2 }}>{label}</div>
                                            <div style={{ fontSize:12, color:'#94A3B8', fontWeight:500 }}>{val || 'â€”'}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color:'#475569', fontSize:12, textAlign:'center', padding:24 }}>No details available</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 🔄 Self Transfer detail overlay */}
            {showSelfTransferModal && (
                <div style={{ position:'absolute', inset:0, background:'rgba(2,6,23,0.7)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={closeSelfTransferModal}>
                    <div style={{ background:'#0F172A', borderRadius:14, width:520, border:'1px solid #1E293B', boxShadow:'0 24px 60px rgba(0,0,0,0.6)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom:'1px solid #1E293B', background:'#0B1120' }}>
                            <span style={{ fontSize:13, fontWeight:700, color:'#F1F5F9' }}>Self Transfer Details</span>
                            <button onClick={closeSelfTransferModal} style={{ background:'#1E293B', border:'1px solid #334155', borderRadius:6, width:26, height:26, cursor:'pointer', color:'#64748B', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                        </div>
                        <div style={{ padding:'16px 18px', maxHeight:500, overflowY:'auto' }}>
                            {selfTransferLoading ? (
                                <div style={{ color:'#475569', fontSize:12, textAlign:'center', padding:24 }}>Loading…</div>
                            ) : selectedSelfTransfer ? (
                                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                                    {/* Transfer Overview */}
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px', padding:'12px', background:'#1E293B', borderRadius:8 }}>
                                        {[
                                            ['Transfer ID',     selectedSelfTransfer.transfer_reference],
                                            ['Transfer Type',   selectedSelfTransfer.transfer_type],
                                            ['Status',          selectedSelfTransfer.status],
                                            ['Created',         selectedSelfTransfer.created_at ? new Date(selectedSelfTransfer.created_at).toLocaleString() : '—'],
                                        ].map(([label, val]) => (
                                            <div key={label}>
                                                <div style={{ fontSize:9, color:'#334155', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:2 }}>{label}</div>
                                                <div style={{ fontSize:12, color:'#94A3B8', fontWeight:500 }}>{val || '—'}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Source & Destination */}
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'center' }}>
                                        <div style={{ padding:'12px', background:'#0B1120', borderRadius:8, border:'1px solid #1E293B' }}>
                                            <div style={{ fontSize:9, color:'#334155', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>FROM</div>
                                            <div style={{ fontSize:13, color:'#F87171', fontWeight:600 }}>{selectedSelfTransfer.source_display || selectedSelfTransfer.source_location}</div>
                                        </div>
                                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, background:'#312e81', borderRadius:'50%' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7"/>
                                            </svg>
                                        </div>
                                        <div style={{ padding:'12px', background:'#0B1120', borderRadius:8, border:'1px solid #1E293B' }}>
                                            <div style={{ fontSize:9, color:'#334155', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>TO</div>
                                            <div style={{ fontSize:13, color:'#4ADE80', fontWeight:600 }}>{selectedSelfTransfer.destination_display || selectedSelfTransfer.destination_location}</div>
                                        </div>
                                    </div>

                                    {/* Additional Details */}
                                    {(selectedSelfTransfer.awb_number || selectedSelfTransfer.logistics || selectedSelfTransfer.executive || selectedSelfTransfer.remarks) && (
                                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px' }}>
                                            {[
                                                ['AWB Number',      selectedSelfTransfer.awb_number],
                                                ['Logistics',       selectedSelfTransfer.logistics],
                                                ['Executive',       selectedSelfTransfer.executive],
                                                ['Payment Mode',    selectedSelfTransfer.payment_mode],
                                                ['Invoice Amount',  selectedSelfTransfer.invoice_amount ? `₹${selectedSelfTransfer.invoice_amount}` : null],
                                                ['Order Ref',       selectedSelfTransfer.order_ref],
                                            ].filter(([, val]) => val).map(([label, val]) => (
                                                <div key={label}>
                                                    <div style={{ fontSize:9, color:'#334155', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:2 }}>{label}</div>
                                                    <div style={{ fontSize:12, color:'#94A3B8', fontWeight:500 }}>{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Remarks */}
                                    {selectedSelfTransfer.remarks && (
                                        <div>
                                            <div style={{ fontSize:9, color:'#334155', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>REMARKS</div>
                                            <div style={{ fontSize:12, color:'#94A3B8', fontWeight:500, padding:'8px 12px', background:'#0B1120', borderRadius:6, border:'1px solid #1E293B' }}>
                                                {selectedSelfTransfer.remarks}
                                            </div>
                                        </div>
                                    )}

                                    {/* Items List */}
                                    {selectedSelfTransfer.items && selectedSelfTransfer.items.length > 0 && (
                                        <div>
                                            <div style={{ fontSize:9, color:'#334155', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>TRANSFERRED ITEMS</div>
                                            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                                {selectedSelfTransfer.items.map((item, index) => (
                                                    <div key={index} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#0B1120', borderRadius:6, border:'1px solid #1E293B' }}>
                                                        <div>
                                                            <div style={{ fontSize:12, color:'#CBD5E1', fontWeight:500 }}>{item.product_name}</div>
                                                            <div style={{ fontSize:10, color:'#475569', fontFamily:'monospace' }}>{item.barcode}</div>
                                                        </div>
                                                        <div style={{ fontSize:13, color:'#60A5FA', fontWeight:600 }}>×{item.quantity}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ color:'#475569', fontSize:12, textAlign:'center', padding:24 }}>No details available</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
