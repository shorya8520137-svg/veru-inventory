"use client";

import React, { useState, useEffect } from "react";
import { Search, Download, Eye, Printer, Calendar, DollarSign, User, Package } from "lucide-react";

const API_BASE = ""; // Use relative URLs for local API routes
const PAGE_SIZE = 15;

export default function BillHistoryTab() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [selectedBill, setSelectedBill] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // Load bills
    const loadBills = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: PAGE_SIZE.toString(),
            });

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await fetch(`${API_BASE}/api/billing/history?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            
            if (data.success) {
                setBills(data.data || []);
                setTotalRecords(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE));
            }
        } catch (err) {
            console.error('Error loading bills:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBills();
    }, [page, searchQuery, statusFilter]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            paid: { label: 'PAID', bg: '#D1FAE5', color: '#059669' },
            partial: { label: 'PARTIAL', bg: '#FEF3C7', color: '#D97706' },
            unpaid: { label: 'UNPAID', bg: '#FEE2E2', color: '#DC2626' },
        };
        return badges[status?.toLowerCase()] || { label: 'PAID', bg: '#D1FAE5', color: '#059669' };
    };

    return (
        <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' }}>
            {/* Filters */}
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{ position:'relative', flex:1 }}>
                        <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
                        <input 
                            type="text"
                            placeholder="Search by invoice number, customer name, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width:'100%', padding:'10px 12px 10px 40px', borderRadius:10, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB' }}
                        />
                    </div>

                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB', cursor:'pointer', minWidth:150 }}>
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="unpaid">Unpaid</option>
                    </select>

                    <button style={{ padding:'10px 16px', borderRadius:10, border:'1px solid #E5E7EB', background:'#1E40AF', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ flex:1, overflow:'auto', scrollbarWidth:'none', msOverflowStyle:'none' }}>
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                        <tr style={{ background:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
                            <th style={{ padding:'12px 24px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>INVOICE #</th>
                            <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>DATE</th>
                            <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>CUSTOMER</th>
                            <th style={{ padding:'12px 16px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>ITEMS</th>
                            <th style={{ padding:'12px 16px', textAlign:'right', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>AMOUNT</th>
                            <th style={{ padding:'12px 16px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>STATUS</th>
                            <th style={{ padding:'12px 24px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ padding:48, textAlign:'center', color:'#9CA3AF' }}>Loading...</td>
                            </tr>
                        ) : bills.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding:48, textAlign:'center', color:'#9CA3AF' }}>
                                    <Package size={48} style={{ margin:'0 auto 12px', opacity:0.3 }} />
                                    <div>No bills found</div>
                                </td>
                            </tr>
                        ) : (
                            bills.map((bill, idx) => {
                                const statusBadge = getStatusBadge(bill.payment_status);
                                
                                return (
                                    <tr key={bill.id || idx} style={{ borderBottom:'1px solid #F3F4F6' }}
                                        onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                        <td style={{ padding:'14px 24px' }}>
                                            <div style={{ fontSize:14, fontWeight:700, color:'#1E40AF' }}>#{bill.invoice_number}</div>
                                        </td>
                                        <td style={{ padding:'14px 16px' }}>
                                            <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{formatDate(bill.created_at).split(',')[0]}</div>
                                            <div style={{ fontSize:11, color:'#9CA3AF' }}>{formatDate(bill.created_at).split(',')[1]}</div>
                                        </td>
                                        <td style={{ padding:'14px 16px' }}>
                                            <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{bill.customer_name}</div>
                                            <div style={{ fontSize:11, color:'#9CA3AF' }}>{bill.customer_phone}</div>
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'center' }}>
                                            <span style={{ fontSize:14, fontWeight:700, color:'#6B7280' }}>{bill.total_items || 0}</span>
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'right' }}>
                                            <div style={{ fontSize:16, fontWeight:700, color:'#111827' }}>₹{parseFloat(bill.grand_total || 0).toFixed(2)}</div>
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'center' }}>
                                            <span style={{ display:'inline-block', padding:'4px 10px', borderRadius:6, background:statusBadge.bg, color:statusBadge.color, fontSize:11, fontWeight:700 }}>
                                                {statusBadge.label}
                                            </span>
                                        </td>
                                        <td style={{ padding:'14px 24px', textAlign:'center' }}>
                                            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                                                <button 
                                                    onClick={() => { setSelectedBill(bill); setShowDetails(true); }}
                                                    style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                                                    <Eye size={14} color="#1E40AF" />
                                                </button>
                                                <button style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                                                    <Printer size={14} color="#059669" />
                                                </button>
                                                <button style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                                                    <Download size={14} color="#6B7280" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', borderTop:'1px solid #E5E7EB', background:'#fff', flexShrink:0 }}>
                    <div style={{ fontSize:13, color:'#6B7280' }}>
                        Showing {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} records
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                        <button 
                            onClick={() => setPage(Math.max(1, page - 1))} 
                            disabled={page === 1}
                            style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #E5E7EB', background:page===1?'#F9FAFB':'#fff', cursor:page===1?'not-allowed':'pointer', fontSize:13, fontWeight:600, color:page===1?'#9CA3AF':'#374151', opacity:page===1?0.5:1 }}>
                            Previous
                        </button>
                        <button 
                            onClick={() => setPage(Math.min(totalPages, page + 1))} 
                            disabled={page === totalPages}
                            style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #E5E7EB', background:page===totalPages?'#F9FAFB':'#fff', cursor:page===totalPages?'not-allowed':'pointer', fontSize:13, fontWeight:600, color:page===totalPages?'#9CA3AF':'#374151', opacity:page===totalPages?0.5:1 }}>
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Bill Details Modal */}
            {showDetails && selectedBill && (
                <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
                    onClick={() => setShowDetails(false)}>
                    <div style={{ background:'#fff', borderRadius:12, padding:32, maxWidth:600, width:'90%', maxHeight:'80vh', overflow:'auto' }}
                        onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', marginBottom:20 }}>Invoice #{selectedBill.invoice_number}</h2>
                        
                        <div style={{ marginBottom:20 }}>
                            <div style={{ fontSize:12, color:'#6B7280', marginBottom:4 }}>Customer</div>
                            <div style={{ fontSize:16, fontWeight:600, color:'#111827' }}>{selectedBill.customer_name}</div>
                            <div style={{ fontSize:14, color:'#6B7280' }}>{selectedBill.customer_phone}</div>
                        </div>

                        <div style={{ marginBottom:20 }}>
                            <div style={{ fontSize:12, color:'#6B7280', marginBottom:4 }}>Date</div>
                            <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{formatDate(selectedBill.created_at)}</div>
                        </div>

                        <div style={{ marginBottom:20 }}>
                            <div style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>Items</div>
                            {selectedBill.items && JSON.parse(selectedBill.items).map((item, idx) => (
                                <div key={idx} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F3F4F6' }}>
                                    <div>
                                        <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{item.product_name}</div>
                                        <div style={{ fontSize:12, color:'#6B7280' }}>Qty: {item.quantity} × ₹{item.price}</div>
                                    </div>
                                    <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>₹{(item.quantity * item.price).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop:'2px solid #E5E7EB', paddingTop:16 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                                <span style={{ fontSize:14, color:'#6B7280' }}>Subtotal</span>
                                <span style={{ fontSize:14, fontWeight:600 }}>₹{parseFloat(selectedBill.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                                <span style={{ fontSize:14, color:'#6B7280' }}>GST</span>
                                <span style={{ fontSize:14, fontWeight:600 }}>₹{parseFloat(selectedBill.gst_amount || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                                <span style={{ fontSize:16, fontWeight:700, color:'#111827' }}>Grand Total</span>
                                <span style={{ fontSize:20, fontWeight:700, color:'#1E40AF' }}>₹{parseFloat(selectedBill.grand_total || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowDetails(false)}
                            style={{ width:'100%', padding:'12px', borderRadius:8, border:'none', background:'#1E40AF', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
