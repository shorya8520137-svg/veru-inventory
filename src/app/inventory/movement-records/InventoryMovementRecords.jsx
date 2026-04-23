"use client";

import React, { useEffect, useState } from "react";
import { Search, Download, RefreshCw, Share2, Menu, AlertTriangle, Package, RotateCcw, TrendingUp } from "lucide-react";
import DamageRecoveryModal from "../selftransfer/DamageRecoveryModal.jsx";
import { usePermissions, PERMISSIONS } from '@/contexts/PermissionsContext';

const PAGE_SIZE = 10;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const WAREHOUSES = [
    { code: "ALL", name: "All" },
    { code: "GGM_WH", name: "GGM_WH" },
    { code: "BLR_WH", name: "BLR_WH" },
    { code: "MUM_WH", name: "MUM_WH" },
    { code: "AMD_WH", name: "AMD_WH" },
    { code: "HYD_WH", name: "HYD_WH" },
];

export default function InventoryMovementRecords() {
    const { hasPermission } = usePermissions();
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [showDamageRecoveryModal, setShowDamageRecoveryModal] = useState(false);
    const [modalMode, setModalMode] = useState('damage'); // 'damage' or 'recovery'

    // Filter states
    const [movementTypeFilter, setMovementTypeFilter] = useState('all');
    const [warehouseFilter, setWarehouseFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState('last30');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Stats
    const [stats, setStats] = useState({
        totalMovements: 301,
        damageCount: 59,
        damageImpact: 12430,
        recoveryCount: 26,
        recoveryValue: 4200,
        returnCount: 147,
        returnPending: 12
    });

    // Load movement records
    const loadMovementRecords = async () => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: PAGE_SIZE.toString(),
            });

            if (movementTypeFilter !== 'all') {
                params.append('movement_type', movementTypeFilter);
            }
            if (warehouseFilter !== 'ALL') {
                params.append('warehouse', warehouseFilter);
            }
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            const response = await fetch(`${API_BASE}/api/inventory/movement-records?${params}`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setRecords(data.data || []);
                setTotalRecords(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE));
                
                if (data.stats) {
                    setStats(prev => ({ ...prev, ...data.stats }));
                }
            }
        } catch (err) {
            console.error('Error loading movement records:', err);
            setError(err.message || 'Failed to load');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hasPermission(PERMISSIONS.INVENTORY_VIEW)) {
            loadMovementRecords();
        }
    }, [page, movementTypeFilter, warehouseFilter, searchQuery, hasPermission]);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get type badge
    const getTypeBadge = (type) => {
        const badges = {
            damage: { label: 'DAMAGE', bg: '#FEE2E2', color: '#DC2626' },
            recover: { label: 'RECOVER', bg: '#D1FAE5', color: '#059669' },
            recovery: { label: 'RECOVER', bg: '#D1FAE5', color: '#059669' },
            return: { label: 'RETURN', bg: '#DBEAFE', color: '#2563EB' },
        };
        return badges[type?.toLowerCase()] || { label: type?.toUpperCase() || 'N/A', bg: '#F3F4F6', color: '#6B7280' };
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const badges = {
            investigating: { label: 'INVESTIGATING', color: '#DC2626' },
            closed: { label: 'CLOSED', color: '#059669' },
            active: { label: 'ACTIVE', color: '#2563EB' },
        };
        return badges[status?.toLowerCase()] || { label: 'ACTIVE', color: '#6B7280' };
    };

    if (!hasPermission(PERMISSIONS.INVENTORY_VIEW)) {
        return (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#64748B' }}>
                <div style={{ textAlign:'center' }}>
                    <h2>Access Denied</h2>
                    <p>You don't have permission to view inventory movement records.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#F8FAFC', fontFamily:'Inter,sans-serif' }}>
            
            {/* Header */}
            <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'20px 24px', flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div>
                        <h1 style={{ fontSize:24, fontWeight:700, color:'#111827', margin:0, marginBottom:4 }}>Damage & Recovery Intelligence</h1>
                        <p style={{ fontSize:14, color:'#6B7280', margin:0 }}>Monitor losses, recoveries, and operational risks in real time</p>
                    </div>
                    <div style={{ display:'flex', gap:12 }}>
                        <button 
                            onClick={() => { setModalMode('damage'); setShowDamageRecoveryModal(true); }}
                            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:10, border:'none', background:'#DC2626', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
                            <AlertTriangle size={16} />
                            + Report Damage
                        </button>
                        <button 
                            onClick={() => { setModalMode('recovery'); setShowDamageRecoveryModal(true); }}
                            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:10, border:'none', background:'#059669', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
                            <RotateCcw size={16} />
                            + Record Recovery
                        </button>
                        <button style={{ width:40, height:40, borderRadius:10, border:'1px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Share2 size={16} color="#6B7280" />
                        </button>
                        <button style={{ width:40, height:40, borderRadius:10, border:'1px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Menu size={16} color="#6B7280" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
                    <div style={{ background:'#F9FAFB', borderRadius:12, padding:'16px 18px', border:'1px solid #E5E7EB' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <div style={{ width:36, height:36, borderRadius:8, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <RotateCcw size={18} color='#2563EB' />
                            </div>
                            <div style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>Total Movements</div>
                        </div>
                        <div style={{ fontSize:28, fontWeight:700, color:'#111827', marginBottom:4 }}>{stats.totalMovements}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#10B981' }}>
                            <TrendingUp size={12} />
                            <span>+6.2%</span>
                        </div>
                    </div>

                    <div style={{ background:'#FEF2F2', borderRadius:12, padding:'16px 18px', border:'1px solid #FEE2E2' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <div style={{ width:36, height:36, borderRadius:8, background:'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <AlertTriangle size={18} color='#DC2626' />
                            </div>
                            <div style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>Damage Incidents</div>
                        </div>
                        <div style={{ fontSize:28, fontWeight:700, color:'#DC2626', marginBottom:4 }}>{stats.damageCount}</div>
                        <div style={{ fontSize:12, color:'#6B7280' }}>Loss Impact <strong>₹{stats.damageImpact.toLocaleString()}</strong></div>
                    </div>

                    <div style={{ background:'#F0FDF4', borderRadius:12, padding:'16px 18px', border:'1px solid #D1FAE5' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <div style={{ width:36, height:36, borderRadius:8, background:'#D1FAE5', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Package size={18} color='#059669' />
                            </div>
                            <div style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>Recoveries</div>
                        </div>
                        <div style={{ fontSize:28, fontWeight:700, color:'#059669', marginBottom:4 }}>{stats.recoveryCount}</div>
                        <div style={{ fontSize:12, color:'#6B7280' }}>Recovered <strong>₹{stats.recoveryValue.toLocaleString()}</strong></div>
                    </div>

                    <div style={{ background:'#F9FAFB', borderRadius:12, padding:'16px 18px', border:'1px solid #E5E7EB' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <div style={{ width:36, height:36, borderRadius:8, background:'#DBEAFE', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <RotateCcw size={18} color='#2563EB' />
                            </div>
                            <div style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>Returns</div>
                        </div>
                        <div style={{ fontSize:28, fontWeight:700, color:'#111827', marginBottom:4 }}>{stats.returnCount}</div>
                        <div style={{ fontSize:12, color:'#6B7280' }}>Pending <strong>Processing: {stats.returnPending}</strong></div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'16px 24px', flexShrink:0 }}>
                <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                    <div style={{ position:'relative', flex:1, minWidth:280 }}>
                        <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
                        <input 
                            type="text"
                            placeholder="Global search Ref ID, Product, or Barcode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width:'100%', padding:'10px 12px 10px 40px', borderRadius:10, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB' }}
                        />
                    </div>

                    <select value={movementTypeFilter} onChange={(e) => setMovementTypeFilter(e.target.value)}
                        style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB', cursor:'pointer', minWidth:150 }}>
                        <option value="all">Movement Type</option>
                        <option value="damage">Damage</option>
                        <option value="recover">Recovery</option>
                        <option value="return">Return</option>
                    </select>

                    <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}
                        style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB', cursor:'pointer', minWidth:150 }}>
                        {WAREHOUSES.map(wh => <option key={wh.code} value={wh.code}>Warehouse: {wh.name}</option>)}
                    </select>

                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                        style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB', cursor:'pointer', minWidth:150 }}>
                        <option value="last7">Last 7 Days</option>
                        <option value="last30">Last 30 Days</option>
                        <option value="last90">Last 90 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB', cursor:'pointer', minWidth:120 }}>
                        <option value="all">Status</option>
                        <option value="active">Active</option>
                        <option value="investigating">Investigating</option>
                        <option value="closed">Closed</option>
                    </select>

                    <button style={{ padding:'10px 16px', borderRadius:10, border:'1px solid #E5E7EB', background:'#1E40AF', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                        <Package size={14} />
                        AI Insight
                    </button>
                </div>
            </div>



            {/* Table Container - Edge to Edge */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' }}>
                {loading ? (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'#9CA3AF' }}>Loading...</div>
                ) : error ? (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'#DC2626' }}>{error}</div>
                ) : (
                    <>
                        {/* Scrollable Table Body */}
                        <div style={{ flex:1, overflow:'auto', scrollbarWidth:'none', msOverflowStyle:'none' }}>
                            <style jsx>{`
                                div::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                                    <tr style={{ background:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
                                        <th style={{ padding:'12px 24px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>DATE & TIME</th>
                                        <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>TYPE</th>
                                        <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>PRODUCT</th>
                                        <th style={{ padding:'12px 16px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>QTY</th>
                                        <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>WAREHOUSE</th>
                                        <th style={{ padding:'12px 24px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding:48, textAlign:'center', color:'#9CA3AF' }}>
                                                <Package size={48} style={{ margin:'0 auto 12px', opacity:0.3 }} />
                                                <div>No records found</div>
                                            </td>
                                        </tr>
                                    ) : (
                                        records.map((record, idx) => {
                                            const typeBadge = getTypeBadge(record.movement_type);
                                            const statusBadge = getStatusBadge(record.status);
                                            
                                            return (
                                                <tr key={record.id || idx} style={{ borderBottom:'1px solid #F3F4F6' }}
                                                    onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                                                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                                    <td style={{ padding:'14px 24px' }}>
                                                        <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{formatDate(record.event_time || record.timestamp).split(',')[0]}</div>
                                                        <div style={{ fontSize:11, color:'#9CA3AF' }}>Ref: #{record.reference || 'N/A'}</div>
                                                    </td>
                                                    <td style={{ padding:'14px 16px' }}>
                                                        <span style={{ display:'inline-block', padding:'4px 10px', borderRadius:6, background:typeBadge.bg, color:typeBadge.color, fontSize:11, fontWeight:700 }}>
                                                            {typeBadge.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding:'14px 16px' }}>
                                                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                            <div style={{ width:40, height:40, borderRadius:8, background:'#F3F4F6', flexShrink:0 }}></div>
                                                            <div>
                                                                <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{record.product_name || record.product_type}</div>
                                                                <div style={{ fontSize:11, color:'#9CA3AF' }}>SN: {record.barcode}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding:'14px 16px', textAlign:'center' }}>
                                                        <span style={{ fontSize:15, fontWeight:700, color: record.direction === 'OUT' ? '#DC2626' : '#059669' }}>
                                                            {record.direction === 'OUT' ? '-' : '+'}{record.qty || record.quantity || 0}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding:'14px 16px' }}>
                                                        <span style={{ fontSize:13, color:'#6B7280', fontWeight:500 }}>
                                                            {record.warehouse || record.inventory_location || record.location_code}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding:'14px 24px' }}>
                                                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                                            <span style={{ width:6, height:6, borderRadius:'50%', background:statusBadge.color }}></span>
                                                            <span style={{ fontSize:12, color:statusBadge.color, fontWeight:600 }}>{statusBadge.label}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Sticky Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', borderTop:'1px solid #E5E7EB', background:'#fff', flexShrink:0 }}>
                                <div style={{ fontSize:13, color:'#6B7280' }}>
                                    Showing {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} records
                                </div>
                                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                    <button 
                                        onClick={() => setPage(Math.max(1, page - 1))} 
                                        disabled={page === 1}
                                        style={{ 
                                            padding:'8px 16px', 
                                            borderRadius:8, 
                                            border:'1px solid #E5E7EB', 
                                            background:page===1?'#F9FAFB':'#fff', 
                                            cursor:page===1?'not-allowed':'pointer', 
                                            fontSize:13, 
                                            fontWeight:600, 
                                            color:page===1?'#9CA3AF':'#374151',
                                            opacity:page===1?0.5:1
                                        }}>
                                        Previous
                                    </button>
                                    
                                    {(() => {
                                        const pageNumbers = [];
                                        const maxVisible = 5;
                                        let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                                        
                                        if (endPage - startPage < maxVisible - 1) {
                                            startPage = Math.max(1, endPage - maxVisible + 1);
                                        }
                                        
                                        if (startPage > 1) {
                                            pageNumbers.push(
                                                <button key={1} onClick={() => setPage(1)}
                                                    style={{ width:36, height:36, borderRadius:8, border:'1px solid #E5E7EB', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                                                    1
                                                </button>
                                            );
                                            if (startPage > 2) {
                                                pageNumbers.push(<span key="dots1" style={{ padding:'0 8px', color:'#9CA3AF' }}>...</span>);
                                            }
                                        }
                                        
                                        for (let i = startPage; i <= endPage; i++) {
                                            pageNumbers.push(
                                                <button key={i} onClick={() => setPage(i)}
                                                    style={{ 
                                                        width:36, 
                                                        height:36, 
                                                        borderRadius:8, 
                                                        border:page===i?'none':'1px solid #E5E7EB', 
                                                        background:page===i?'#1E40AF':'#fff', 
                                                        color:page===i?'#fff':'#374151', 
                                                        fontSize:13, 
                                                        fontWeight:600, 
                                                        cursor:'pointer' 
                                                    }}>
                                                    {i}
                                                </button>
                                            );
                                        }
                                        
                                        if (endPage < totalPages) {
                                            if (endPage < totalPages - 1) {
                                                pageNumbers.push(<span key="dots2" style={{ padding:'0 8px', color:'#9CA3AF' }}>...</span>);
                                            }
                                            pageNumbers.push(
                                                <button key={totalPages} onClick={() => setPage(totalPages)}
                                                    style={{ width:36, height:36, borderRadius:8, border:'1px solid #E5E7EB', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                                                    {totalPages}
                                                </button>
                                            );
                                        }
                                        
                                        return pageNumbers;
                                    })()}
                                    
                                    <button 
                                        onClick={() => setPage(Math.min(totalPages, page + 1))} 
                                        disabled={page === totalPages}
                                        style={{ 
                                            padding:'8px 16px', 
                                            borderRadius:8, 
                                            border:'1px solid #E5E7EB', 
                                            background:page===totalPages?'#F9FAFB':'#fff', 
                                            cursor:page===totalPages?'not-allowed':'pointer', 
                                            fontSize:13, 
                                            fontWeight:600, 
                                            color:page===totalPages?'#9CA3AF':'#374151',
                                            opacity:page===totalPages?0.5:1
                                        }}>
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Damage/Recovery Modal */}
            {showDamageRecoveryModal && (
                <DamageRecoveryModal 
                    onClose={() => {
                        setShowDamageRecoveryModal(false);
                        loadMovementRecords(); // Refresh data after modal closes
                    }}
                    initialMode={modalMode}
                />
            )}
        </div>
    );
}
