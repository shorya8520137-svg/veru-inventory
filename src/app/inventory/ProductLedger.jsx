"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

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

export default function ProductLedger({ productBarcode, productName, storeCode, onClose }) {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const [searchRef, setSearchRef] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedEntry, setExpandedEntry] = useState(null);

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

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        if (!productBarcode || !storeCode) {
            setLoading(false);
            return;
        }

        let mounted = true;
        document.body.style.overflow = "hidden";

        const fetchTimeline = async () => {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem('token');
                
                // Detect if storeCode is a warehouse (ends with _WH) or a store
                const isWarehouse = storeCode.endsWith('_WH');
                const apiEndpoint = isWarehouse 
                    ? `${API_BASE}/api/timeline/${productBarcode}?warehouse=${storeCode}&limit=100`
                    : `${API_BASE}/api/store-timeline/${storeCode}?productBarcode=${productBarcode}&limit=100`;
                
                console.log('Fetching timeline from:', apiEndpoint);
                
                const response = await fetch(
                    apiEndpoint,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                const data = await response.json();
                if (!mounted) return;

                if (data.success && data.data && data.data.timeline) {
                    const timelineData = data.data.timeline;
                    console.log('Timeline data loaded:', timelineData.length, 'entries');
                    console.log('First entry:', timelineData[0]);
                    
                    setTimeline(timelineData);
                    calculateSummary(timelineData);
                } else {
                    setTimeline([]);
                }
                
                setLoading(false);
            } catch (err) {
                if (mounted) {
                    console.error('Timeline fetch error:', err);
                    setError("Failed to load tracking data");
                    setLoading(false);
                }
            }
        };

        fetchTimeline();

        return () => {
            mounted = false;
            document.body.style.overflow = "auto";
        };
    }, [productBarcode, storeCode, dateFrom, dateTo]);

    /* ================= CALCULATE SUMMARY ================= */
    const calculateSummary = (timelineData) => {
        if (timelineData.length === 0) {
            setSummary({
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
            return;
        }

        const opening = timelineData[timelineData.length - 1]?.balance_after || 0;
        let overview = {
            opening: opening,
            bulkUpload: 0,
            dispatch: 0,
            damage: 0,
            returns: 0,
            recovery: 0,
            selfTransferIn: 0,
            selfTransferOut: 0,
            totalIn: 0,
            totalOut: 0,
        };

        timelineData.forEach((entry, index) => {
            if (index === timelineData.length - 1) return;

            if (entry.direction === 'IN') {
                overview.totalIn += entry.quantity;
                if (entry.type === 'SELF_TRANSFER' || entry.type === 'TRANSFER') {
                    overview.selfTransferIn += entry.quantity;
                } else if (entry.type === 'RETURN') {
                    overview.returns += entry.quantity;
                } else if (entry.type === 'RECOVERY' || entry.type === 'RECOVER') {
                    overview.recovery += entry.quantity;
                } else if (entry.type === 'BULK_UPLOAD') {
                    overview.bulkUpload += entry.quantity;
                }
            } else if (entry.direction === 'OUT') {
                overview.totalOut += entry.quantity;
                if (entry.type === 'SELF_TRANSFER' || entry.type === 'TRANSFER') {
                    overview.selfTransferOut += entry.quantity;
                } else if (entry.type === 'DISPATCH') {
                    overview.dispatch += entry.quantity;
                } else if (entry.type === 'DAMAGED' || entry.type === 'DAMAGE') {
                    overview.damage += entry.quantity;
                }
            }
        });

        const finalStock = timelineData[0]?.balance_after || 0;
        setSummary({ ...overview, finalStock });
    };

    // ── type → badge config ──────────────────────────────────────────────────────────────────────
    const TYPE_BADGE = {
        OPENING:       { label:'OPENING',   bg:'#1e3a5f', color:'#93C5FD' },
        BULK_UPLOAD:   { label:'UPLOAD',    bg:'#1e3a5f', color:'#93C5FD' },
        DISPATCH:      { label:'DISPATCH',  bg:'#7f1d1d', color:'#FCA5A5' },
        SALE:          { label:'DISPATCH',  bg:'#7f1d1d', color:'#FCA5A5' },
        DAMAGE:        { label:'DAMAGE',    bg:'#7f1d1d', color:'#FCA5A5' },
        DAMAGED:       { label:'DAMAGE',    bg:'#7f1d1d', color:'#FCA5A5' },
        RETURN:        { label:'RETURN',    bg:'#14532d', color:'#86EFAC' },
        RECOVER:       { label:'RECOVER',   bg:'#14532d', color:'#86EFAC' },
        RECOVERY:      { label:'RECOVER',   bg:'#14532d', color:'#86EFAC' },
        SELF_TRANSFER: { label:'TRANSFER',  bg:'#312e81', color:'#C4B5FD' },
        ADJUSTMENT_IN: { label:'ADJUST',    bg:'#1e3a5f', color:'#93C5FD' },
    };
    const getBadge = (type) => TYPE_BADGE[type] || { label: type, bg:'#1E293B', color:'#94A3B8' };

    // ── dot colour by direction ──────────────────────────────────────────────────────────────────
    const dotColor = (row) => {
        if (row.direction === 'IN') return '#059669';
        if (row.direction === 'OUT') return '#DC2626';
        return '#6B7280';
    };

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>

            {/* ── Shell ── */}
            <div style={{ display:'flex', flexDirection:'column', width:'92vw', maxWidth:1100, height:'88vh', background:'#FFFFFF', borderRadius:16, overflow:'hidden', border:'1px solid #E5E7EB', boxShadow:'0 40px 100px rgba(0,0,0,0.3)' }}>

                {/* ── Top bar ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'#F9FAFB', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
                    <div>
                        <div style={{ fontSize:10, color:'#6B7280', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:3 }}>Audit Log / Stock Control</div>
                        <div style={{ fontSize:16, fontWeight:700, color:'#111827', letterSpacing:'-0.01em' }}>
                            Product Ledger — <span style={{ color:'#2563EB' }}>{productBarcode}</span>
                        </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <button 
                            onClick={() => setShowDamageModal(true)}
                            style={{ 
                                display:'flex', 
                                alignItems:'center', 
                                gap:6, 
                                padding:'7px 14px', 
                                borderRadius:8, 
                                border:'1px solid #FCA5A5', 
                                background:'#FEE2E2', 
                                color:'#DC2626', 
                                fontSize:12, 
                                fontWeight:600, 
                                cursor:'pointer',
                                transition:'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background='#FCA5A5';
                                e.currentTarget.style.color='#7f1d1d';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background='#FEE2E2';
                                e.currentTarget.style.color='#DC2626';
                            }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            Damage
                        </button>
                        <button 
                            onClick={() => setShowReturnModal(true)}
                            style={{ 
                                display:'flex', 
                                alignItems:'center', 
                                gap:6, 
                                padding:'7px 14px', 
                                borderRadius:8, 
                                border:'1px solid #86EFAC', 
                                background:'#D1FAE5', 
                                color:'#059669', 
                                fontSize:12, 
                                fontWeight:600, 
                                cursor:'pointer',
                                transition:'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background='#86EFAC';
                                e.currentTarget.style.color='#14532d';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background='#D1FAE5';
                                e.currentTarget.style.color='#059669';
                            }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 14 4 9 9 4"/>
                                <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                            </svg>
                            Return
                        </button>
                        <button onClick={onClose} style={{ width:30, height:30, borderRadius:7, border:'1px solid #E5E7EB', background:'#FFFFFF', color:'#6B7280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>×</button>
                    </div>
                </div>

                {/* ── Body: sidebar + main ── */}
                <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

                    {/* ── LEFT SIDEBAR ── */}
                    <div style={{ width:220, flexShrink:0, background:'#F9FAFB', borderRight:'1px solid #E5E7EB', display:'flex', flexDirection:'column', padding:'16px 14px', gap:16, overflowY:'auto', scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch' }}>
                        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

                        {/* View Filters label */}
                        <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>View Filters</div>

                        {/* Search reference */}
                        <div>
                            <div style={{ fontSize:10, color:'#6B7280', marginBottom:5, fontWeight:600 }}>Search Reference</div>
                            <input value={searchRef} onChange={(e) => setSearchRef(e.target.value)}
                                placeholder='e.g. REF-882'
                                style={{ width:'100%', padding:'6px 8px', borderRadius:7, border:'1px solid #E5E7EB', background:'#FFFFFF', color:'#374151', fontSize:11, outline:'none' }}
                                disabled={loading}
                            />
                        </div>

                        {/* Date range */}
                        <div>
                            <div style={{ fontSize:10, color:'#6B7280', marginBottom:5, fontWeight:600 }}>Date Range</div>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} disabled={loading}
                                style={{ width:'100%', padding:'6px 8px', borderRadius:7, border:'1px solid #E5E7EB', background:'#FFFFFF', color:'#374151', fontSize:11, outline:'none', colorScheme:'light', marginBottom:6, boxSizing:'border-box' }}/>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} disabled={loading}
                                style={{ width:'100%', padding:'6px 8px', borderRadius:7, border:'1px solid #E5E7EB', background:'#FFFFFF', color:'#374151', fontSize:11, outline:'none', colorScheme:'light', boxSizing:'border-box' }}/>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop:'1px solid #E5E7EB' }}/>

                        {/* Stock Overview */}
                        <div>
                            <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Stock Overview</div>
                            {loading ? (
                                <div style={{ color:'#9CA3AF', fontSize:11 }}>Loading…</div>
                            ) : (
                                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                    {[
                                        { label:'Opening',      value: summary.opening || 0,        color:'#374151' },
                                        { label:'Bulk Upload',  value: summary.bulkUpload || 0,     color:'#374151' },
                                        { label:'Dispatch',     value: summary.dispatch ? `-${summary.dispatch}` : '0',  color:'#DC2626' },
                                        { label:'Damaged',      value: summary.damage ? `-${summary.damage}` : '0',    color:'#DC2626' },
                                        { label:'Returns',      value: summary.returns ? `+${summary.returns}` : '0',   color:'#059669' },
                                        { label:'Recovery',     value: summary.recovery ? `+${summary.recovery}` : '0',  color:'#059669' },
                                        { label:'Transfer In',  value: summary.selfTransferIn ? `+${summary.selfTransferIn}` : '0',  color:'#059669' },
                                        { label:'Transfer Out', value: summary.selfTransferOut ? `-${summary.selfTransferOut}` : '0', color:'#DC2626' },
                                    ].map(r => (
                                        <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                            <span style={{ fontSize:11, color:'#6B7280' }}>{r.label}</span>
                                            <span style={{ fontSize:12, fontWeight:600, color:r.color }}>{r.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Current Balance card */}
                        <div style={{ marginTop:'auto', background:'#EFF6FF', borderRadius:10, padding:'12px 14px', border:'1px solid #DBEAFE' }}>
                            <div style={{ fontSize:9, fontWeight:700, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Current Balance</div>
                            <div style={{ fontSize:28, fontWeight:700, color:'#2563EB', letterSpacing:'-0.02em' }}>{loading ? '—' : summary.finalStock}</div>
                        </div>
                    </div>

                    {/* ── RIGHT MAIN PANEL ── */}
                    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

                        {/* KPI Cards Row */}
                        <div style={{ display:'flex', gap:12, padding:'16px 20px', flexShrink:0 }}>
                            {[
                                { 
                                    label: 'OPENING', 
                                    value: summary.opening || 0, 
                                    subtitle: 'Initial Stock',
                                    color: '#374151',
                                    bgColor: '#F3F4F6'
                                },
                                { 
                                    label: 'RECEIVED', 
                                    value: `+${summary.totalIn || 0}`, 
                                    subtitle: 'Total Inbound',
                                    color: '#059669',
                                    bgColor: '#D1FAE5'
                                },
                                { 
                                    label: 'DISPATCHED', 
                                    value: `-${summary.totalOut || 0}`, 
                                    subtitle: 'Total Outbound',
                                    color: '#DC2626',
                                    bgColor: '#FEE2E2'
                                },
                                { 
                                    label: 'LIVE STOCK', 
                                    value: summary.finalStock || 0, 
                                    subtitle: 'Available Now',
                                    color: '#2563EB',
                                    bgColor: '#DBEAFE'
                                }
                            ].map((kpi, index) => (
                                <div key={index} style={{ 
                                    flex: 1, 
                                    background: kpi.bgColor, 
                                    borderRadius: 12, 
                                    padding: '16px 20px', 
                                    border: `1px solid ${kpi.bgColor}`,
                                    textAlign: 'center'
                                }}>
                                    <div style={{ 
                                        fontSize: 10, 
                                        fontWeight: 700, 
                                        color: '#6B7280', 
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
                                        color: '#6B7280', 
                                        fontWeight: 500 
                                    }}>
                                        {kpi.subtitle}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Table header row */}
                        <div style={{ display:'grid', gridTemplateColumns:'140px 1fr 1fr 90px 90px', padding:'10px 20px', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
                            {['TIMESTAMP','TRANSACTION DETAIL','','IMPACT','BALANCE'].map((h,i) => (
                                <div key={i} style={{ fontSize:9, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>{h}</div>
                            ))}
                        </div>

                        {/* Rows */}
                        <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch' }}>
                            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                            {loading ? (
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#9CA3AF', fontSize:12 }}>Loading…</div>
                            ) : error ? (
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#DC2626', fontSize:12 }}>{error}</div>
                            ) : timeline.length === 0 ? (
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#9CA3AF', fontSize:12 }}>No records found</div>
                            ) : (
                                timeline.map((row, i) => {
                                    const [date, timePart] = (row.timestamp || row.created_at).split('T');
                                    const time = (timePart || '').slice(0, 8);
                                    const badge = getBadge(row.type);
                                    const impact = row.direction === 'IN' ? `+${row.quantity}` : row.direction === 'OUT' ? `-${row.quantity}` : `${row.quantity}`;
                                    const impactColor = row.direction === 'IN' ? '#059669' : row.direction === 'OUT' ? '#DC2626' : '#374151';
                                    const rowKey = `${(row.timestamp || row.created_at)}-${row.reference || i}-${row.type}`;

                                    return (
                                        <div key={rowKey} style={{ display:'flex', flexDirection:'column' }}>
                                            {/* Main Timeline Row */}
                                            <div style={{ display:'grid', gridTemplateColumns:'140px 1fr 1fr 90px 90px', padding:'12px 20px', borderBottom:'1px solid #F3F4F6', alignItems:'center' }}
                                                onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                                                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                                            >
                                                {/* Timestamp */}
                                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                    <span style={{ width:7, height:7, borderRadius:'50%', background:dotColor(row), flexShrink:0, display:'inline-block' }}/>
                                                    <div>
                                                        <div style={{ fontSize:11, color:'#111827', fontWeight:500 }}>{date}</div>
                                                        <div style={{ fontSize:10, color:'#6B7280' }}>{time}</div>
                                                    </div>
                                                </div>

                                                {/* Badge + title */}
                                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                    <span 
                                                        onClick={() => {
                                                            const typeValue = row.type;
                                                            const refValue = row.reference;
                                                            const typeCheck = ['SELF_TRANSFER', 'RETURN', 'DAMAGE', 'DAMAGED', 'RECOVER', 'RECOVERY'].includes(typeValue);
                                                            
                                                            console.log('=== BADGE CLICK DEBUG ===');
                                                            console.log('row.type:', JSON.stringify(typeValue));
                                                            console.log('row.type length:', typeValue?.length);
                                                            console.log('row.type charCodes:', typeValue?.split('').map(c => c.charCodeAt(0)));
                                                            console.log('row.reference:', refValue);
                                                            console.log('hasReference:', !!refValue);
                                                            console.log('typeCheck result:', typeCheck);
                                                            console.log('Expected types:', ['SELF_TRANSFER', 'RETURN', 'DAMAGE', 'DAMAGED', 'RECOVER', 'RECOVERY']);
                                                            console.log('========================');
                                                            
                                                            if (typeCheck && refValue) {
                                                                console.log('✅ Expanding entry:', refValue);
                                                                setExpandedEntry(expandedEntry === refValue ? null : refValue);
                                                            } else {
                                                                console.log('❌ Conditions not met');
                                                                console.log('   - typeCheck:', typeCheck);
                                                                console.log('   - hasReference:', !!refValue);
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
                                                            cursor: (['SELF_TRANSFER', 'RETURN', 'DAMAGE', 'DAMAGED', 'RECOVER', 'RECOVERY'].includes(row.type) && row.reference) ? 'pointer' : 'default',
                                                            userSelect:'none'
                                                        }}>
                                                        {badge.label}
                                                    </span>
                                                    <span style={{ fontSize:12, color:'#111827', fontWeight:500 }}>{LABELS[row.type] || row.type}</span>
                                                </div>

                                                {/* Reference + warehouse */}
                                                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                                                    {row.reference && <span style={{ fontSize:10, color:'#6B7280', fontFamily:'monospace' }}>{row.reference}</span>}
                                                    <span style={{ fontSize:10, color:'#9CA3AF', display:'flex', alignItems:'center', gap:3 }}>
                                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                                                        {storeCode}
                                                    </span>
                                                </div>

                                                {/* Impact */}
                                                <div style={{ fontSize:14, fontWeight:700, color:impactColor, textAlign:'right' }}>{impact}</div>

                                                {/* Balance */}
                                                <div style={{ fontSize:13, fontWeight:500, color: row.balance_after < 0 ? '#DC2626' : '#374151', textAlign:'right' }}>{row.balance_after?.toFixed ? row.balance_after.toFixed(0) : row.balance_after}</div>
                                            </div>
                                            
                                            {/* Expansion for SELF_TRANSFER */}
                                            {expandedEntry === row.reference && row.type === 'SELF_TRANSFER' && (
                                                <div style={{ 
                                                    background: '#F9FAFB', 
                                                    borderBottom: '1px solid #F3F4F6',
                                                    padding: '16px 20px'
                                                }}>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr auto 1fr',
                                                        gap: 12,
                                                        alignItems: 'center'
                                                    }}>
                                                        {/* Source (OUT) */}
                                                        <div style={{
                                                            background: '#FFFFFF',
                                                            border: '2px solid #DC2626',
                                                            borderRadius: 8,
                                                            padding: '12px 16px'
                                                        }}>
                                                            <div style={{ 
                                                                fontSize: 9, 
                                                                color: '#DC2626', 
                                                                fontWeight: 700, 
                                                                letterSpacing: '0.1em', 
                                                                textTransform: 'uppercase', 
                                                                marginBottom: 4 
                                                            }}>
                                                                📤 OUT (SOURCE)
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, marginBottom: 8 }}>
                                                                {row.source_location || 'Unknown Source'}
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280' }}>
                                                                <span>Stock Before: <strong style={{ color: '#111827' }}>{row.source_stock_before || 'N/A'}</strong></span>
                                                                <span>Impact: <strong style={{ color: '#DC2626' }}>-{row.quantity}</strong></span>
                                                                <span>Stock After: <strong style={{ color: '#111827' }}>{row.source_stock_after || 'N/A'}</strong></span>
                                                            </div>
                                                        </div>

                                                        {/* Arrow */}
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: 40,
                                                            height: 40,
                                                            background: '#6366F1',
                                                            borderRadius: '50%'
                                                        }}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                                                                <path d="M5 12h14M12 5l7 7-7 7"/>
                                                            </svg>
                                                        </div>

                                                        {/* Destination (IN) */}
                                                        <div style={{
                                                            background: '#FFFFFF',
                                                            border: '2px solid #059669',
                                                            borderRadius: 8,
                                                            padding: '12px 16px'
                                                        }}>
                                                            <div style={{ 
                                                                fontSize: 9, 
                                                                color: '#059669', 
                                                                fontWeight: 700, 
                                                                letterSpacing: '0.1em', 
                                                                textTransform: 'uppercase', 
                                                                marginBottom: 4 
                                                            }}>
                                                                📥 IN (DESTINATION)
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginBottom: 8 }}>
                                                                {row.destination_location || storeCode}
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280' }}>
                                                                <span>Stock Before: <strong style={{ color: '#111827' }}>{row.balance_after - row.quantity}</strong></span>
                                                                <span>Impact: <strong style={{ color: '#059669' }}>+{row.quantity}</strong></span>
                                                                <span>Stock After: <strong style={{ color: '#111827' }}>{row.balance_after}</strong></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Product Details */}
                                                    <div style={{
                                                        background: '#FFFFFF',
                                                        border: '1px solid #E5E7EB',
                                                        borderRadius: 8,
                                                        padding: '12px 16px',
                                                        marginTop: 12
                                                    }}>
                                                        <div style={{ 
                                                            fontSize: 9, 
                                                            color: '#6B7280', 
                                                            marginBottom: 8,
                                                            fontWeight: 600,
                                                            letterSpacing: '0.1em',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            PRODUCT DETAILS
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Product</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.product_name || productBarcode}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Quantity</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.quantity}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Transfer ID</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600, fontFamily: 'monospace' }}>
                                                                    {row.reference || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Created By</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.created_by || 'system'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {row.notes && (
                                                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Notes</div>
                                                                <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
                                                                    {row.notes}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expansion for RETURN */}
                                            {expandedEntry === row.reference && row.type === 'RETURN' && (
                                                <div style={{ 
                                                    background: '#F0FDF4', 
                                                    borderBottom: '1px solid #D1FAE5',
                                                    padding: '16px 20px'
                                                }}>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 1fr 1fr',
                                                        gap: 12
                                                    }}>
                                                        {/* Return Details */}
                                                        <div style={{
                                                            background: '#FFFFFF',
                                                            border: '2px solid #059669',
                                                            borderRadius: 8,
                                                            padding: '12px 16px'
                                                        }}>
                                                            <div style={{ 
                                                                fontSize: 9, 
                                                                color: '#059669', 
                                                                fontWeight: 700, 
                                                                letterSpacing: '0.1em', 
                                                                textTransform: 'uppercase', 
                                                                marginBottom: 4 
                                                            }}>
                                                                📦 RETURN DETAILS
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 8 }}>
                                                                <div style={{ marginBottom: 4 }}><strong>Product:</strong> {row.product_name}</div>
                                                                <div style={{ marginBottom: 4 }}><strong>Barcode:</strong> {row.barcode}</div>
                                                                <div style={{ marginBottom: 4 }}><strong>Quantity:</strong> {row.quantity}</div>
                                                                <div><strong>Condition:</strong> <span style={{ 
                                                                    padding: '2px 6px', 
                                                                    borderRadius: 4, 
                                                                    background: row.return_details?.condition === 'good' ? '#D1FAE5' : '#FEE2E2',
                                                                    color: row.return_details?.condition === 'good' ? '#059669' : '#DC2626',
                                                                    fontSize: 9,
                                                                    fontWeight: 600
                                                                }}>{row.return_details?.condition || 'good'}</span></div>
                                                            </div>
                                                        </div>

                                                        {/* Location Info */}
                                                        <div style={{
                                                            background: '#FFFFFF',
                                                            border: '2px solid #6366F1',
                                                            borderRadius: 8,
                                                            padding: '12px 16px'
                                                        }}>
                                                            <div style={{ 
                                                                fontSize: 9, 
                                                                color: '#6366F1', 
                                                                fontWeight: 700, 
                                                                letterSpacing: '0.1em', 
                                                                textTransform: 'uppercase', 
                                                                marginBottom: 4 
                                                            }}>
                                                                📍 LOCATION
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 8 }}>
                                                                <div style={{ marginBottom: 4 }}><strong>Source:</strong> {row.return_details?.source_location || storeCode}</div>
                                                                <div style={{ marginBottom: 4 }}><strong>Destination:</strong> {row.return_details?.destination_location || storeCode}</div>
                                                                <div><strong>Type:</strong> {row.return_details?.return_type || 'WAREHOUSE'}</div>
                                                            </div>
                                                        </div>

                                                        {/* Processed By */}
                                                        <div style={{
                                                            background: '#FFFFFF',
                                                            border: '2px solid #F59E0B',
                                                            borderRadius: 8,
                                                            padding: '12px 16px'
                                                        }}>
                                                            <div style={{ 
                                                                fontSize: 9, 
                                                                color: '#F59E0B', 
                                                                fontWeight: 700, 
                                                                letterSpacing: '0.1em', 
                                                                textTransform: 'uppercase', 
                                                                marginBottom: 4 
                                                            }}>
                                                                👤 PROCESSED BY
                                                            </div>
                                                            <div style={{ fontSize: 11, marginTop: 8, marginBottom: 8, fontWeight: 600 }}>
                                                                {row.return_details?.processed_by || 'N/A'}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#6B7280' }}>
                                                                {row.return_details?.return_reason && (
                                                                    <div style={{ marginBottom: 4 }}><strong>Reason:</strong> {row.return_details.return_reason}</div>
                                                                )}
                                                                {row.return_details?.notes && (
                                                                    <div><strong>Notes:</strong> {row.return_details.notes}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expansion for DAMAGE */}
                                            {expandedEntry === row.reference && (row.type === 'DAMAGE' || row.type === 'DAMAGED') && (
                                                <div style={{ 
                                                    background: '#FEF2F2', 
                                                    borderBottom: '1px solid #FECACA',
                                                    padding: '16px 20px'
                                                }}>
                                                    {/* Stock Impact Section */}
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr',
                                                        gap: 12,
                                                        marginBottom: 12
                                                    }}>
                                                        <div style={{
                                                            background: '#FFFFFF',
                                                            border: '2px solid #DC2626',
                                                            borderRadius: 8,
                                                            padding: '12px 16px'
                                                        }}>
                                                            <div style={{ 
                                                                fontSize: 9, 
                                                                color: '#DC2626', 
                                                                fontWeight: 700, 
                                                                letterSpacing: '0.1em', 
                                                                textTransform: 'uppercase', 
                                                                marginBottom: 8 
                                                            }}>
                                                                ⚠️ DAMAGE REPORTED - STOCK DEDUCTED
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: 11, 
                                                                color: '#DC2626', 
                                                                fontWeight: 600, 
                                                                marginBottom: 8 
                                                            }}>
                                                                {row.warehouse || storeCode}
                                                            </div>
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                justifyContent: 'space-between', 
                                                                fontSize: 10, 
                                                                color: '#6B7280' 
                                                            }}>
                                                                <span>Stock Before: <strong style={{ color: '#111827' }}>{row.balance_after + row.quantity}</strong></span>
                                                                <span>Impact: <strong style={{ color: '#DC2626' }}>-{row.quantity}</strong></span>
                                                                <span>Stock After: <strong style={{ color: '#111827' }}>{row.balance_after}</strong></span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Product Details */}
                                                    <div style={{
                                                        background: '#FFFFFF',
                                                        border: '1px solid #E5E7EB',
                                                        borderRadius: 8,
                                                        padding: '12px 16px'
                                                    }}>
                                                        <div style={{ 
                                                            fontSize: 9, 
                                                            color: '#6B7280', 
                                                            marginBottom: 8,
                                                            fontWeight: 600,
                                                            letterSpacing: '0.1em',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            DAMAGE DETAILS
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Product</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.product_name || productBarcode}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Barcode</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600, fontFamily: 'monospace' }}>
                                                                    {row.barcode}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Quantity Damaged</div>
                                                                <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 700 }}>
                                                                    {row.quantity} units
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Location</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.warehouse || storeCode}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Damage ID</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600, fontFamily: 'monospace' }}>
                                                                    {row.reference || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Processed By</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.damage_details?.processed_by || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Action Type</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.damage_details?.action_type || 'damage'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {row.notes && (
                                                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Notes</div>
                                                                <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
                                                                    {row.notes}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expansion for RECOVER */}
                                            {expandedEntry === row.reference && (row.type === 'RECOVER' || row.type === 'RECOVERY') && (
                                                <div style={{ 
                                                    background: '#F0FDF4', 
                                                    borderBottom: '1px solid #D1FAE5',
                                                    padding: '16px 20px'
                                                }}>
                                                    {/* Stock Impact Section */}
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr',
                                                        gap: 12,
                                                        marginBottom: 12
                                                    }}>
                                                        <div style={{
                                                            background: '#FFFFFF',
                                                            border: '2px solid #059669',
                                                            borderRadius: 8,
                                                            padding: '12px 16px'
                                                        }}>
                                                            <div style={{ 
                                                                fontSize: 9, 
                                                                color: '#059669', 
                                                                fontWeight: 700, 
                                                                letterSpacing: '0.1em', 
                                                                textTransform: 'uppercase', 
                                                                marginBottom: 8 
                                                            }}>
                                                                ✅ STOCK RECOVERED - ADDED BACK
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: 11, 
                                                                color: '#059669', 
                                                                fontWeight: 600, 
                                                                marginBottom: 8 
                                                            }}>
                                                                {row.warehouse || storeCode}
                                                            </div>
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                justifyContent: 'space-between', 
                                                                fontSize: 10, 
                                                                color: '#6B7280' 
                                                            }}>
                                                                <span>Stock Before: <strong style={{ color: '#111827' }}>{row.balance_after - row.quantity}</strong></span>
                                                                <span>Impact: <strong style={{ color: '#059669' }}>+{row.quantity}</strong></span>
                                                                <span>Stock After: <strong style={{ color: '#111827' }}>{row.balance_after}</strong></span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Product Details */}
                                                    <div style={{
                                                        background: '#FFFFFF',
                                                        border: '1px solid #E5E7EB',
                                                        borderRadius: 8,
                                                        padding: '12px 16px'
                                                    }}>
                                                        <div style={{ 
                                                            fontSize: 9, 
                                                            color: '#6B7280', 
                                                            marginBottom: 8,
                                                            fontWeight: 600,
                                                            letterSpacing: '0.1em',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            RECOVERY DETAILS
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Product</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.product_name || productBarcode}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Barcode</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600, fontFamily: 'monospace' }}>
                                                                    {row.barcode}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Quantity Recovered</div>
                                                                <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                                                                    {row.quantity} units
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Location</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.warehouse || storeCode}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Recovery ID</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600, fontFamily: 'monospace' }}>
                                                                    {row.reference || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Processed By</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.damage_details?.processed_by || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Action Type</div>
                                                                <div style={{ fontSize: 11, color: '#111827', fontWeight: 600 }}>
                                                                    {row.damage_details?.action_type || 'recovery'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {row.notes && (
                                                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                                                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Notes</div>
                                                                <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
                                                                    {row.notes}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
