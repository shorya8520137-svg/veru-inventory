'use client';

import React, { useState, useEffect } from 'react';
import { Download, Upload, Plus, Search, Filter, Edit, Trash2, Package, FileSpreadsheet, AlertCircle, CheckCircle, X, ArrowRightLeft, Clock, RefreshCw, Bell, Settings, HelpCircle, LayoutGrid } from 'lucide-react';
import TransferForm from './TransferForm';
import { productsAPI } from '@/services/api/products';
import { usePermissions, PERMISSIONS } from '@/contexts/PermissionsContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// Mini sparkline SVG
const SparkLine = () => (
  <svg width="120" height="48" viewBox="0 0 120 48" fill="none">
    <path d="M0 38 C20 38, 25 20, 40 22 C55 24, 60 10, 80 8 C95 6, 105 18, 120 14"
      stroke="#93C5FD" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProductManager = () => {
    const { hasPermission } = usePermissions();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [notification, setNotification] = useState(null);
    const [showBarcodeDetails, setShowBarcodeDetails] = useState(false);
    const [barcodeInventory, setBarcodeInventory] = useState(null);
    const [showBarcodeDisplay, setShowBarcodeDisplay] = useState(false);
    const [selectedBarcode, setSelectedBarcode] = useState(null);
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [importProgress, setImportProgress] = useState(null);
    const [currentImportItem, setCurrentImportItem] = useState(null);

    const [formData, setFormData] = useState({
        product_name: '', product_variant: '', barcode: '', description: '',
        category_id: '', price: '', cost_price: '', weight: '', dimensions: '',
        warehouse: '', stock_quantity: ''
    });

    const [categoryForm, setCategoryForm] = useState({ name: '', display_name: '', description: '', parent_id: '' });
    const [showCategoryForm, setShowCategoryForm] = useState(false);

    useEffect(() => { fetchProducts(); fetchCategories(); fetchWarehouses(); }, [currentPage, selectedCategory]);

    useEffect(() => {
        const t = setTimeout(() => { if (searchTerm !== undefined) fetchProducts(); }, 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const handleSearchChange = async (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        setSelectedSuggestionIndex(-1); // Reset selection on new search
        if (!query.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
        if (query.length >= 2) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/products?search=${encodeURIComponent(query)}&limit=10`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = data.success && data.data?.products ? data.data.products : Array.isArray(data.data) ? data.data : [];
                    setSuggestions(list); setShowSuggestions(true);
                }
            } catch (e) { console.error(e); }
        } else { setSuggestions([]); setShowSuggestions(false); }
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
                    selectSuggestion(suggestions[selectedSuggestionIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    const selectSuggestion = (p) => { setSearchTerm(p.product_name); setSuggestions([]); setShowSuggestions(false); setSelectedSuggestionIndex(-1); };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ page: currentPage, limit: 10, search: searchTerm, category: selectedCategory });
            const res = await fetch(`${API_BASE}/api/products?${params}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.data.products);
                setTotalPages(data.data.pagination.pages);
                setTotalProducts(data.data.pagination.total);
            } else showNotification(data.message || 'Failed to fetch products', 'error');
        } catch (e) {
            console.error(e);
            showNotification('Failed to load products.', 'error');
            setProducts([]); setTotalPages(1);
        } finally { setLoading(false); }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/products/categories/all`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch (e) { console.error(e); }
    };

    const fetchWarehouses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/products/warehouses`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) setWarehouses(data.data);
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.product_name.trim() || !formData.barcode.trim()) {
            showNotification('Product name and barcode are required', 'error'); return;
        }
        try {
            const token = localStorage.getItem('token');
            const url = editingProduct ? `${API_BASE}/api/products/${editingProduct.p_id}` : `${API_BASE}/api/products`;
            const productData = { ...formData };
            if (editingProduct) { delete productData.warehouse; delete productData.stock_quantity; }
            const res = await fetch(url, {
                method: editingProduct ? 'PUT' : 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            const data = await res.json();
            if (data.success) {
                setShowAddForm(false); setEditingProduct(null);
                setFormData({ product_name: '', product_variant: '', barcode: '', description: '', category_id: '', price: '', cost_price: '', weight: '', dimensions: '', warehouse: '', stock_quantity: '' });
                await fetchProducts();
                showNotification(data.message || (editingProduct ? 'Product updated!' : 'Product created!'));
            } else showNotification(data.message || 'Failed to save product', 'error');
        } catch (e) { showNotification('Network error.', 'error'); }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({ product_name: product.product_name || '', product_variant: product.product_variant || '', barcode: product.barcode || '', description: product.description || '', category_id: product.category_id || '', price: product.price || '', cost_price: product.cost_price || '', weight: product.weight || '', dimensions: product.dimensions || '', warehouse: '', stock_quantity: '' });
        setShowAddForm(true);
    };

    const handleDelete = async (productId) => {
        if (!confirm('Delete this product? This cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) { await fetchProducts(); showNotification(data.message || 'Product deleted!'); }
            else showNotification(data.message || 'Failed to delete', 'error');
        } catch (e) { showNotification('Network error.', 'error'); }
    };

    const handleBulkImport = async (e) => {
        e.preventDefault();
        const file = e.target.file.files[0];
        if (!file) { showNotification('Please select a file', 'error'); return; }
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!['.csv', '.xlsx', '.xls'].includes(ext)) { showNotification('Please select a CSV or Excel file', 'error'); return; }
        setImportProgress(null); setCurrentImportItem(null);
        try {
            showNotification('Starting import...', 'success');
            const result = await productsAPI.bulkImportWithProgress(file, (p) => {
                if (p.type === 'start') setImportProgress({ total: p.total, current: 0, percentage: 0, message: p.message });
                else if (p.type === 'progress') { setImportProgress({ total: p.total, current: p.current, percentage: p.percentage, message: p.message }); setCurrentImportItem({ product_name: p.product_name, barcode: p.barcode }); }
                else if (p.type === 'complete') { setImportProgress(null); setCurrentImportItem(null); }
            });
            if (result.success) { setShowBulkImport(false); await fetchProducts(); showNotification(result.message || `Import complete! ${result.count || 0} products imported.`); }
            else showNotification(result.message || 'Import failed', 'error');
        } catch (e) { showNotification('Network error during import.', 'error'); setImportProgress(null); setCurrentImportItem(null); }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!categoryForm.name.trim() || !categoryForm.display_name.trim()) { showNotification('Name and display name required', 'error'); return; }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/products/categories`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryForm)
            });
            const data = await res.json();
            if (data.success) { setShowCategoryForm(false); setCategoryForm({ name: '', display_name: '', description: '', parent_id: '' }); await fetchCategories(); showNotification(data.message || 'Category created!'); }
            else showNotification(data.message || 'Failed to create category', 'error');
        } catch (e) { showNotification('Network error.', 'error'); }
    };

    const handleBarcodeClick = (product) => { setSelectedBarcode(product); setShowBarcodeDisplay(true); };

    const handleExportProducts = async () => {
        try {
            showNotification('Preparing export...', 'success');
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/products?limit=10000`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            const all = data.success && data.data?.products ? data.data.products : Array.isArray(data.data) ? data.data : [];
            if (!all.length) { showNotification('No products to export', 'error'); return; }
            const exportData = all.map(p => ({ 'Product Name': p.product_name || '', 'Variant': p.product_variant || '', 'Barcode': p.barcode || '', 'Category': p.category_display_name || 'Uncategorized', 'Price': p.price || '', 'Cost Price': p.cost_price || '', 'Total Stock': p.total_stock || 0 }));
            try {
                const XLSX = await import('xlsx');
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(exportData);
                XLSX.utils.book_append_sheet(wb, ws, 'Products');
                XLSX.writeFile(wb, `products_export_${new Date().toISOString().split('T')[0]}.xlsx`);
                showNotification(`Exported ${all.length} products!`);
            } catch { /* csv fallback */
                const headers = Object.keys(exportData[0]);
                const csv = [headers.join(','), ...exportData.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`; a.click();
                showNotification(`Exported ${all.length} products as CSV!`);
            }
        } catch (e) { showNotification('Export failed.', 'error'); }
    };

    const downloadTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet([{ product_name: '', product_variant: '', barcode: '', description: '', category_id: '', price: '', cost_price: '', weight: '', dimensions: '' }]);
            XLSX.utils.book_append_sheet(wb, ws, 'Products Template');
            XLSX.writeFile(wb, 'products_template.xlsx');
            showNotification('Template downloaded!');
        } catch { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['product_name,product_variant,barcode,description,category_id,price,cost_price,weight,dimensions'], { type: 'text/csv' })); a.download = 'products_template.csv'; a.click(); showNotification('CSV template downloaded!'); }
    };
    return (
        <div style={{height:"100%",background:"#F5F7FA",fontFamily:"Inter,sans-serif",padding:"24px 24px 0 24px",display:"flex",flexDirection:"column",minHeight:0}}>
            
            {/* Custom CSS for dropdown options */}
            <style jsx>{`
                select option {
                    background: #ffffff !important;
                    color: #374151 !important;
                    padding: 8px 12px !important;
                    font-weight: 400 !important;
                }
                select option:checked,
                select option:hover {
                    background: #F3F4F6 !important;
                    color: #111827 !important;
                    font-weight: 500 !important;
                }
                select:focus option:checked {
                    background: linear-gradient(0deg, #E5E7EB 0%, #E5E7EB 100%) !important;
                }
            `}</style>

            {/* Notification */}
            {notification&&(<div style={{position:"fixed",top:20,right:20,zIndex:9999,display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderRadius:12,background:notification.type==="success"?"#DCFCE7":"#FEE2E2",color:notification.type==="success"?"#166534":"#991B1B",boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}>{notification.type==="success"?<CheckCircle size={18}/>:<AlertCircle size={18}/>}<span style={{fontSize:14}}>{notification.message}</span><button onClick={()=>setNotification(null)} style={{background:"none",border:"none",cursor:"pointer",marginLeft:8}}><X size={14}/></button></div>)}

            {/* TOP STATS */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 220px",gap:16,marginBottom:16,flexShrink:0}}>
                <div style={{background:"#fff",borderRadius:20,padding:"28px 32px",boxShadow:"0 2px 16px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                        <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",color:"#9CA3AF",marginBottom:8}}>PORTFOLIO VALUE</div>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
                            <span style={{fontSize:42,fontWeight:700,color:"#111827",lineHeight:1}}>{totalProducts.toLocaleString()}</span>
                            <span style={{fontSize:13,color:"#22C55E",fontWeight:500,display:"flex",alignItems:"center",gap:4}}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                +12% this month
                            </span>
                        </div>
                        <div style={{fontSize:13,color:"#9CA3AF"}}>Active SKUs currently tracked in your inventory.</div>
                    </div>
                    <div style={{opacity:0.7}}><SparkLine/></div>
                </div>
                <div style={{background:"#fff",borderRadius:20,padding:"28px 24px",boxShadow:"0 2px 16px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{width:44,height:44,borderRadius:12,background:"#F0F9FF",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
                        <LayoutGrid size={22} color="#3B82F6"/>
                    </div>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",color:"#9CA3AF"}}>CATEGORIES</div>
                    <div style={{fontSize:38,fontWeight:700,color:"#111827",lineHeight:1}}>{categories.length}</div>
                    <div style={{fontSize:12,color:"#9CA3AF"}}>{categories.length===0?"No custom taxonomies defined.":categories.length+" taxonomies defined."}</div>
                </div>
            </div>

            {/* SECTION HEADER */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap",flexShrink:0}}>
                <h2 style={{fontSize:20,fontWeight:700,color:"#111827",margin:0,marginRight:4}}>Product Inventory</h2>
                <div style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
                    <Filter size={13} style={{position:"absolute",left:12,color:"#6B7280",pointerEvents:"none",zIndex:1}}/>
                    <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} style={{appearance:"none",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:24,padding:"7px 32px 7px 30px",fontSize:13,fontWeight:500,color:"#374151",cursor:"pointer",fontFamily:"inherit",outline:"none",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                        <option value="">Category: All</option>
                        {categories.map(c=><option key={c.id} value={c.name}>{c.display_name}</option>)}
                    </select>
                    <svg style={{position:"absolute",right:10,pointerEvents:"none",color:"#9CA3AF"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
                    <svg style={{position:"absolute",left:12,pointerEvents:"none",color:"#6B7280"}} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                    <select value={sortOrder} onChange={e=>setSortOrder(e.target.value)} style={{appearance:"none",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:24,padding:"7px 32px 7px 30px",fontSize:13,fontWeight:500,color:"#374151",cursor:"pointer",fontFamily:"inherit",outline:"none",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                        <option value="newest">Sort: Newest</option>
                        <option value="oldest">Sort: Oldest</option>
                        <option value="name">Sort: Name</option>
                    </select>
                    <svg style={{position:"absolute",right:10,pointerEvents:"none",color:"#9CA3AF"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div style={{flex:1}}/>
                <div style={{position:"relative"}}>
                    <Search size={15} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#9CA3AF"}}/>
                    <input type="text" placeholder="Search products..." value={searchTerm} onChange={handleSearchChange} onKeyDown={handleKeyDown} onFocus={()=>suggestions.length>0&&setShowSuggestions(true)} onBlur={()=>setTimeout(()=>setShowSuggestions(false),200)} style={{paddingLeft:38,paddingRight:16,paddingTop:8,paddingBottom:8,borderRadius:20,border:"1.5px solid #E5E7EB",background:"#fff",fontSize:13,color:"#374151",outline:"none",width:220,fontFamily:"inherit"}}/>
                    {showSuggestions&&suggestions.length>0&&(<div style={{position:"absolute",top:"110%",left:0,right:0,background:"#fff",borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:100,overflow:"hidden",maxHeight:"300px",overflowY:"auto"}}>{suggestions.map((p,i)=>(<div key={p.p_id||i} onClick={()=>selectSuggestion(p)} onMouseEnter={()=>setSelectedSuggestionIndex(i)} style={{padding:"10px 16px",cursor:"pointer",fontSize:13,color:"#374151",borderBottom:i<suggestions.length-1?"1px solid #F3F4F6":"none",background:selectedSuggestionIndex===i?"#F3F4F6":"#fff",transition:"background 0.15s"}}><div style={{fontWeight:500}}>{p.product_name}</div><div style={{fontSize:11,color:"#9CA3AF"}}>Barcode: {p.barcode}</div></div>))}</div>)}
                </div>
                {hasPermission(PERMISSIONS.PRODUCTS_BULK_IMPORT)&&(<button onClick={()=>setShowBulkImport(true)} style={{background:"none",border:"none",fontSize:13,color:"#6B7280",cursor:"pointer",padding:"6px 12px",borderRadius:8,fontFamily:"inherit"}}>Bulk Import</button>)}
                <button onClick={()=>setShowCategoryForm(true)} style={{background:"none",border:"none",fontSize:13,color:"#6B7280",cursor:"pointer",padding:"6px 12px",borderRadius:8,fontFamily:"inherit"}}>+ Add Category</button>
                {hasPermission(PERMISSIONS.PRODUCTS_CREATE)&&(<button onClick={()=>setShowAddForm(true)} style={{background:"linear-gradient(135deg,#3B82F6,#2563EB)",color:"#fff",border:"none",borderRadius:24,padding:"8px 20px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontFamily:"inherit",boxShadow:"0 4px 12px rgba(59,130,246,0.35)"}}><Plus size={15}/> Add Product</button>)}
                {hasPermission(PERMISSIONS.PRODUCTS_EXPORT)&&(<button onClick={handleExportProducts} title="Export" style={{background:"#F3F4F6",border:"none",borderRadius:10,padding:"8px 10px",cursor:"pointer",display:"flex",alignItems:"center"}}><Download size={16} color="#6B7280"/></button>)}
                <button onClick={fetchProducts} title="Refresh" style={{background:"#F3F4F6",border:"none",borderRadius:10,padding:"8px 10px",cursor:"pointer",display:"flex",alignItems:"center"}}><RefreshCw size={16} color="#6B7280"/></button>
            </div>

            {/* COLUMN HEADERS */}
            <div style={{display:"grid",gridTemplateColumns:"2fr 1.2fr 1fr 1fr 1fr 80px",gap:16,padding:"0 20px",marginBottom:8,flexShrink:0}}>
                {["PRODUCT DETAILS","BARCODE","CATEGORY","STOCK","PRICING","ACTIONS"].map(h=>(<div key={h} style={{fontSize:11,fontWeight:600,letterSpacing:"0.07em",color:"#9CA3AF"}}>{h}</div>))}
            </div>

            {/* PRODUCT LIST - scrollable */}
            <div className="scrollbar-hide" style={{overflowY:"auto",maxHeight:"calc(100vh - 320px)",minHeight:100,display:"flex",flexDirection:"column",gap:8}}>
                {loading?(
                    <div style={{background:"#fff",borderRadius:16,padding:"48px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
                        <div style={{color:"#9CA3AF",fontSize:14}}>Loading products...</div>
                    </div>
                ):products.length===0?(
                    <div style={{background:"#fff",borderRadius:16,padding:"48px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",color:"#9CA3AF",fontSize:14}}>No products found.</div>
                ):products.map(product=>(
                    <div key={product.p_id} style={{background:"#fff",borderRadius:16,padding:"16px 20px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",display:"grid",gridTemplateColumns:"2fr 1.2fr 1fr 1fr 1fr 80px",gap:16,alignItems:"center",transition:"box-shadow 0.2s,transform 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.1)";e.currentTarget.style.transform="translateY(-1px)"}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)";e.currentTarget.style.transform="translateY(0)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{width:44,height:44,borderRadius:10,background:"#1E293B",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Package size={18} color="#94A3B8"/></div>
                            <div>
                                <div style={{fontSize:14,fontWeight:600,color:"#111827"}}>{product.product_name}</div>
                                <div style={{fontSize:12,color:"#9CA3AF",marginTop:2}}>SKU: {product.barcode}</div>
                            </div>
                        </div>
                        <div onClick={()=>handleBarcodeClick(product)} style={{fontFamily:"monospace",fontSize:13,color:"#374151",cursor:"pointer",letterSpacing:"0.05em"}}>{product.barcode}</div>
                        <div><span style={{background:"#F3F4F6",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:600,letterSpacing:"0.06em",color:"#6B7280"}}>{(product.category_display_name||"UNCATEGORIZED").toUpperCase()}</span></div>
                        <div>{(product.total_stock||0)===0?(<span style={{background:"#EF4444",color:"#fff",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:700,textAlign:"center",display:"inline-block",lineHeight:1.4}}>NO STOCK</span>):(<span style={{background:"#22C55E",color:"#fff",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:700,textAlign:"center",display:"inline-block",lineHeight:1.4}}>{product.total_stock} IN STOCK</span>)}</div>
                        <div>
                            {product.price&&<div style={{fontSize:15,fontWeight:700,color:"#3B82F6"}}>₹{parseFloat(product.price).toFixed(2)}</div>}
                            {product.cost_price&&<div style={{fontSize:12,color:"#9CA3AF",marginTop:2}}>Cost: ₹{parseFloat(product.cost_price).toFixed(2)}</div>}
                        </div>
                        <div style={{display:"flex",gap:8}}>
                            {hasPermission(PERMISSIONS.PRODUCTS_EDIT)&&(<button onClick={()=>handleEdit(product)} title="Edit" style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,color:"#9CA3AF",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#3B82F6"} onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}><Edit size={15}/></button>)}
                            {hasPermission(PERMISSIONS.PRODUCTS_DELETE)&&(<button onClick={()=>handleDelete(product.p_id)} title="Delete" style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,color:"#9CA3AF",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#EF4444"} onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}><Trash2 size={15}/></button>)}
                        </div>
                    </div>
                ))}
            </div>

            {/* PAGINATION */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 4px",flexShrink:0,marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:600,letterSpacing:"0.06em",color:"#6B7280"}}>SHOWING {products.length} OF {totalProducts.toLocaleString()} PRODUCTS</span>
                <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setCurrentPage(Math.max(1,currentPage-1))} disabled={currentPage<=1} style={{width:32,height:32,borderRadius:8,border:"1.5px solid #E5E7EB",background:"#fff",cursor:currentPage<=1?"not-allowed":"pointer",opacity:currentPage<=1?0.4:1,fontSize:14}}>&#8249;</button>
                    {Array.from({length:Math.min(5,totalPages)},(_,i)=>{const p=Math.max(1,Math.min(currentPage-2,totalPages-4))+i;if(p<1||p>totalPages)return null;return(<button key={p} onClick={()=>setCurrentPage(p)} style={{width:32,height:32,borderRadius:8,border:currentPage===p?"none":"1.5px solid #E5E7EB",background:currentPage===p?"#3B82F6":"#fff",color:currentPage===p?"#fff":"#374151",fontSize:13,fontWeight:600,cursor:"pointer"}}>{p}</button>);})}
                    <button onClick={()=>setCurrentPage(Math.min(totalPages,currentPage+1))} disabled={currentPage>=totalPages} style={{width:32,height:32,borderRadius:8,border:"1.5px solid #E5E7EB",background:"#fff",cursor:currentPage>=totalPages?"not-allowed":"pointer",opacity:currentPage>=totalPages?0.4:1,fontSize:14}}>&#8250;</button>
                </div>
            </div>

            {/* ADD/EDIT MODAL */}
            {showAddForm&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"#fff",borderRadius:20,padding:32,width:"100%",maxWidth:600,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#111827"}}>{editingProduct?"Edit Product":"Add New Product"}</h2><button onClick={()=>{setShowAddForm(false);setEditingProduct(null);}} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF"}}><X size={20}/></button></div>
                <form onSubmit={handleSubmit}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                        {[["Product Name *","product_name","text","Enter product name"],["Product Variant","product_variant","text","e.g. Red, Size L"],["Barcode *","barcode","text","Unique barcode"],["Selling Price","price","number","0.00"],["Cost Price","cost_price","number","0.00"],["Weight (kg)","weight","number","0.000"],["Dimensions","dimensions","text","L x W x H"]].map(([label,key,type,ph])=>(<div key={key}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>{label}</label><input type={type} placeholder={ph} value={formData[key]} onChange={e=>setFormData({...formData,[key]:e.target.value})} step={type==="number"?"0.01":undefined} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,color:"#374151",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>))}
                        <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Category</label><select value={formData.category_id} onChange={e=>setFormData({...formData,category_id:e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,color:"#374151",fontFamily:"inherit",outline:"none"}}><option value="">Select Category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select></div>
                    </div>
                    <div style={{marginBottom:16}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Description</label><textarea rows={3} value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} placeholder="Product description..." style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,color:"#374151",fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}/></div>
                    {!editingProduct&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16,padding:16,background:"#F9FAFB",borderRadius:12}}><div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Warehouse</label><select value={formData.warehouse} onChange={e=>setFormData({...formData,warehouse:e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,color:"#374151",fontFamily:"inherit",outline:"none"}}><option value="">Select Warehouse</option>{warehouses.map(w=><option key={w.w_id} value={w.warehouse_code}>{w.Warehouse_name} ({w.warehouse_code})</option>)}</select></div><div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Stock Quantity</label><input type="number" min="0" value={formData.stock_quantity} onChange={e=>setFormData({...formData,stock_quantity:e.target.value})} disabled={!formData.warehouse} placeholder="0" style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,color:"#374151",fontFamily:"inherit",outline:"none",boxSizing:"border-box",opacity:formData.warehouse?1:0.5}}/></div></div>)}
                    <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}><button type="button" onClick={()=>{setShowAddForm(false);setEditingProduct(null);}} style={{padding:"10px 24px",borderRadius:12,border:"1.5px solid #E5E7EB",background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",color:"#374151",fontFamily:"inherit"}}>Cancel</button><button type="submit" style={{padding:"10px 24px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#3B82F6,#2563EB)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{editingProduct?"Update Product":"Create Product"}</button></div>
                </form>
            </div></div>)}

            {/* BULK IMPORT MODAL */}
            {showBulkImport&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"#fff",borderRadius:20,padding:32,width:"100%",maxWidth:480,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#111827"}}>Bulk Import Products</h2>{!importProgress&&<button onClick={()=>setShowBulkImport(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF"}}><X size={20}/></button>}</div>
                {importProgress?(<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,fontWeight:700,color:"#3B82F6",marginBottom:8}}>{importProgress.current}/{importProgress.total}</div><div style={{background:"#F3F4F6",borderRadius:8,height:8,marginBottom:12,overflow:"hidden"}}><div style={{height:"100%",background:"#3B82F6",borderRadius:8,width:(importProgress.percentage)+"%",transition:"width 0.3s"}}/></div>{currentImportItem&&<div style={{fontSize:13,color:"#6B7280"}}>Processing: {currentImportItem.product_name}</div>}</div>):(
                <form onSubmit={handleBulkImport}><div style={{border:"2px dashed #E5E7EB",borderRadius:12,padding:24,textAlign:"center",marginBottom:20}}><FileSpreadsheet size={32} color="#9CA3AF" style={{marginBottom:8}}/><div style={{fontSize:13,color:"#6B7280",marginBottom:12}}>Upload CSV or Excel file</div><input type="file" name="file" accept=".csv,.xlsx,.xls" style={{fontSize:13,color:"#374151"}}/></div><div style={{display:"flex",gap:12,justifyContent:"space-between",alignItems:"center"}}><button type="button" onClick={downloadTemplate} style={{background:"none",border:"none",fontSize:13,color:"#3B82F6",cursor:"pointer",fontFamily:"inherit"}}>Download Template</button><div style={{display:"flex",gap:12}}><button type="button" onClick={()=>setShowBulkImport(false)} style={{padding:"10px 20px",borderRadius:12,border:"1.5px solid #E5E7EB",background:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button><button type="submit" style={{padding:"10px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#3B82F6,#2563EB)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Import</button></div></div></form>)}
            </div></div>)}

            {/* ADD CATEGORY MODAL */}
            {showCategoryForm&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"#fff",borderRadius:20,padding:32,width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#111827"}}>Add Category</h2><button onClick={()=>setShowCategoryForm(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF"}}><X size={20}/></button></div>
                <form onSubmit={handleCategorySubmit}>
                    {[["Name *","name","Category slug"],["Display Name *","display_name","Display label"],["Description","description","Optional description"]].map(([label,key,ph])=>(<div key={key} style={{marginBottom:16}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>{label}</label><input type="text" placeholder={ph} value={categoryForm[key]} onChange={e=>setCategoryForm({...categoryForm,[key]:e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,color:"#374151",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>))}
                    <div style={{display:"flex",gap:12,justifyContent:"flex-end",marginTop:8}}><button type="button" onClick={()=>setShowCategoryForm(false)} style={{padding:"10px 20px",borderRadius:12,border:"1.5px solid #E5E7EB",background:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button><button type="submit" style={{padding:"10px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#3B82F6,#2563EB)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Create</button></div>
                </form>
            </div></div>)}

            {/* TRANSFER FORM */}
            {showTransferForm&&<TransferForm onClose={()=>setShowTransferForm(false)} onSuccess={()=>{setShowTransferForm(false);fetchProducts();showNotification("Transfer completed!");}} warehouses={warehouses}/>}

        </div>
    );
};

export default ProductManager;
