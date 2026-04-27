"use client";

import React, { useState, useEffect } from "react";
import { Search, Package, AlertTriangle, TrendingDown, RefreshCw, Clock, BarChart3, Activity, TrendingUp } from "lucide-react";
import ProductLedger from "../inventory/ProductLedger";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";
const PAGE_SIZE = 20;

export default function StoreInventoryTab() {
    const [inventory, setInventory] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [stockFilter, setStockFilter] = useState("all");
    const [storeFilter, setStoreFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    
    // Modal states for individual product actions
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductLedger, setShowProductLedger] = useState(false);
    const [showProductGraph, setShowProductGraph] = useState(false);

    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0
    });

    // Load stores
    const loadStores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/products/stores`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setStores(data.data || []);
            }
        } catch (err) {
            console.error('Error loading stores:', err);
        }
    };

    // Load inventory
    const loadInventory = async () => {
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
            if (stockFilter !== 'all') {
                params.append('stock_filter', stockFilter);
            }
            if (storeFilter !== 'all') {
                params.append('store_filter', storeFilter);
            }

            const response = await fetch(`${API_BASE}/api/billing/store-inventory?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            
            if (data.success) {
                setInventory(data.data || []);
                setTotalRecords(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE));
                
                if (data.stats) {
                    setStats(data.stats);
                }
            }
        } catch (err) {
            console.error('Error loading inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStores();
        loadInventory();
    }, [page, searchQuery, stockFilter, storeFilter]);
    
    const getStockStatus = (stock) => {
        if (stock === 0) return { label: 'OUT OF STOCK', color: '#DC2626', bg: '#FEE2E2' };
        if (stock <= 10) return { label: 'LOW STOCK', color: '#D97706', bg: '#FEF3C7' };
        return { label: 'IN STOCK', color: '#059669', bg: '#D1FAE5' };
    };
    
    // Handle action button clicks
    const handleTimelineClick = (product) => {
        setSelectedProduct(product);
        setShowProductLedger(true);
    };
    
    const handleGraphClick = (product) => {
        setSelectedProduct(product);
        setShowProductGraph(true);
    };

    return (
        <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#F8FAFC', overflow:'hidden' }}>
            {/* Stats Cards */}
            <div style={{ padding:'20px 24px', background:'#fff', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
                    <div style={{ background:'#F9FAFB', borderRadius:12, padding:'16px 18px', border:'1px solid #E5E7EB' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <div style={{ width:36, height:36, borderRadius:8, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Package size={18} color='#2563EB' />
                            </div>
                            <div style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>Total Products</div>
                        </div>
                        <div style={{ fontSize:28, fontWeight:700, color:'#111827' }}>{stats.totalProducts}</div>
                    </div>

                    <div style={{ background:'#FEF3C7', borderRadius:12, padding:'16px 18px', border:'1px solid #FDE68A' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <div style={{ width:36, height:36, borderRadius:8, background:'#FDE68A', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <AlertTriangle size={18} color='#D97706' />
                            </div>
                            <div style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>Low Stock</div>
                        </div>
                        <div style={{ fontSize:28, fontWeight:700, color:'#D97706' }}>{stats.lowStock}</div>
                    </div>

                    <div style={{ background:'#FEE2E2', borderRadius:12, padding:'16px 18px', border:'1px solid #FECACA' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <div style={{ width:36, height:36, borderRadius:8, background:'#FECACA', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <TrendingDown size={18} color='#DC2626' />
                            </div>
                            <div style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>Out of Stock</div>
                        </div>
                        <div style={{ fontSize:28, fontWeight:700, color:'#DC2626' }}>{stats.outOfStock}</div>
                    </div>

                    <div style={{ background:'#F0FDF4', borderRadius:12, padding:'16px 18px', border:'1px solid #D1FAE5' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <div style={{ width:36, height:36, borderRadius:8, background:'#D1FAE5', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Package size={18} color='#059669' />
                            </div>
                            <div style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>Total Value</div>
                        </div>
                        <div style={{ fontSize:28, fontWeight:700, color:'#059669' }}>₹{stats.totalValue.toLocaleString()}</div>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{ position:'relative', flex:1 }}>
                        <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
                        <input 
                            type="text"
                            placeholder="Search products by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width:'100%', padding:'10px 12px 10px 40px', borderRadius:10, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB' }}
                        />
                    </div>

                    <select 
                        value={stockFilter} 
                        onChange={(e) => setStockFilter(e.target.value)}
                        style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB', cursor:'pointer', minWidth:150 }}>
                        <option value="all">All Stock</option>
                        <option value="in_stock">In Stock</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>

                    <select 
                        value={storeFilter} 
                        onChange={(e) => setStoreFilter(e.target.value)}
                        style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB', cursor:'pointer', minWidth:150 }}>
                        <option value="all">All Stores</option>
                        {stores.map(store => (
                            <option key={store.store_code} value={store.store_code}>
                                {store.store_name} - {store.city}
                            </option>
                        ))}
                    </select>

                    <button 
                        onClick={loadInventory}
                        style={{ padding:'10px 16px', borderRadius:10, border:'1px solid #E5E7EB', background:'#1E40AF', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <>
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                        <tr style={{ background:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
                            <th style={{ padding:'12px 24px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>PRODUCT</th>
                            <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>SKU</th>
                            <th style={{ padding:'12px 16px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>STOCK</th>
                            <th style={{ padding:'12px 16px', textAlign:'right', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>PRICE</th>
                            <th style={{ padding:'12px 16px', textAlign:'right', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>VALUE</th>
                            <th style={{ padding:'12px 24px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>STATUS</th>
                            <th style={{ padding:'12px 24px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ padding:48, textAlign:'center', color:'#9CA3AF' }}>Loading...</td>
                            </tr>
                        ) : inventory.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding:48, textAlign:'center', color:'#9CA3AF' }}>
                                    <Package size={48} style={{ margin:'0 auto 12px', opacity:0.3 }} />
                                    <div>No products found</div>
                                </td>
                            </tr>
                        ) : (
                            inventory.map((item, idx) => {
                                const status = getStockStatus(item.stock);
                                
                                return (
                                    <tr key={item.id || idx} style={{ borderBottom:'1px solid #F3F4F6' }}
                                        onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                        <td style={{ padding:'14px 24px' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                                <div style={{ width:48, height:48, borderRadius:8, background:'#F3F4F6', flexShrink:0 }}></div>
                                                <div>
                                                    <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{item.product_name}</div>
                                                    <div style={{ fontSize:12, color:'#9CA3AF' }}>{item.category || 'Uncategorized'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding:'14px 16px' }}>
                                            <div style={{ fontSize:13, fontWeight:600, color:'#6B7280', fontFamily:'monospace' }}>{item.barcode}</div>
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'center' }}>
                                            <span style={{ 
                                                fontSize:16, 
                                                fontWeight:700, 
                                                color: item.stock === 0 ? '#DC2626' : item.stock <= 10 ? '#D97706' : '#059669'
                                            }}>
                                                {item.stock}
                                            </span>
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'right' }}>
                                            <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>₹{parseFloat(item.price || 0).toFixed(2)}</div>
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'right' }}>
                                            <div style={{ fontSize:15, fontWeight:700, color:'#1E40AF' }}>₹{(item.stock * (item.price || 0)).toFixed(2)}</div>
                                        </td>
                                        <td style={{ padding:'14px 24px', textAlign:'center' }}>
                                            <span style={{ display:'inline-block', padding:'4px 10px', borderRadius:6, background:status.bg, color:status.color, fontSize:11, fontWeight:700 }}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td style={{ padding:'14px 24px', textAlign:'center' }}>
                                            <div style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'center' }}>
                                                <button
                                                    onClick={() => handleTimelineClick(item)}
                                                    title="View Timeline"
                                                    style={{
                                                        width:32,
                                                        height:32,
                                                        borderRadius:8,
                                                        border:'1px solid #E5E7EB',
                                                        background:'#fff',
                                                        cursor:'pointer',
                                                        display:'flex',
                                                        alignItems:'center',
                                                        justifyContent:'center',
                                                        transition:'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background='#EFF6FF';
                                                        e.currentTarget.style.borderColor='#3B82F6';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background='#fff';
                                                        e.currentTarget.style.borderColor='#E5E7EB';
                                                    }}>
                                                    <Clock size={16} color='#3B82F6' />
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleGraphClick(item)}
                                                    title="View Graph"
                                                    style={{
                                                        width:32,
                                                        height:32,
                                                        borderRadius:8,
                                                        border:'1px solid #E5E7EB',
                                                        background:'#fff',
                                                        cursor:'pointer',
                                                        display:'flex',
                                                        alignItems:'center',
                                                        justifyContent:'center',
                                                        transition:'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background='#F0FDF4';
                                                        e.currentTarget.style.borderColor='#22C55E';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background='#fff';
                                                        e.currentTarget.style.borderColor='#E5E7EB';
                                                    }}>
                                                    <TrendingUp size={16} color='#22C55E' />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', borderTop:'1px solid #E5E7EB', background:'#fff', flexShrink:0 }}>
                    <div style={{ fontSize:13, color:'#6B7280' }}>
                        Showing {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} products
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
            
            {/* Product Ledger Full Screen */}
            {showProductLedger && selectedProduct && (
                <ProductLedger 
                    productBarcode={selectedProduct.barcode}
                    productName={selectedProduct.product_name}
                    storeCode={selectedProduct.store_code || storeFilter}
                    onClose={() => setShowProductLedger(false)}
                />
            )}
            
            {/* Product Graph Modal */}
            {showProductGraph && selectedProduct && (
                <div 
                    style={{ 
                        position:'fixed', 
                        inset:0, 
                        background:'rgba(0,0,0,0.5)', 
                        zIndex:9999, 
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center',
                        backdropFilter:'blur(4px)'
                    }}
                    onClick={() => setShowProductGraph(false)}>
                    <div 
                        style={{ 
                            background:'#fff', 
                            borderRadius:16, 
                            width:'90%', 
                            maxWidth:800, 
                            padding:32,
                            boxShadow:'0 20px 60px rgba(0,0,0,0.3)'
                        }}
                        onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                            <div>
                                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                                    <TrendingUp size={20} color='#22C55E' />
                                    <h3 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:0 }}>Stock Trend Graph</h3>
                                </div>
                                <div style={{ fontSize:14, color:'#6B7280' }}>
                                    {selectedProduct.product_name}
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowProductGraph(false)}
                                style={{ 
                                    width:32, 
                                    height:32, 
                                    borderRadius:8, 
                                    border:'1px solid #E5E7EB', 
                                    background:'#fff', 
                                    cursor:'pointer',
                                    fontSize:20,
                                    color:'#6B7280'
                                }}>
                                ×
                            </button>
                        </div>
                        
                        <div style={{ textAlign:'center', padding:60, color:'#9CA3AF' }}>
                            <BarChart3 size={64} style={{ margin:'0 auto 16px', opacity:0.3 }} />
                            <div style={{ fontSize:16, fontWeight:600, color:'#6B7280', marginBottom:8 }}>
                                Graph Visualization
                            </div>
                            <div style={{ fontSize:14 }}>
                                Stock trend chart for {selectedProduct.product_name} coming soon
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
