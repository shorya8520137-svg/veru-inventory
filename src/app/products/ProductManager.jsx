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
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductDetail, setShowProductDetail] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [deletedProductName, setDeletedProductName] = useState('');

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
                const nextIndex = selectedSuggestionIndex < suggestions.length - 1 ? selectedSuggestionIndex + 1 : selectedSuggestionIndex;
                setSelectedSuggestionIndex(nextIndex);
                // Auto-scroll to selected item
                setTimeout(() => {
                    const dropdown = document.querySelector('.search-suggestions-dropdown');
                    const selectedItem = dropdown?.children[nextIndex];
                    if (selectedItem) {
                        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                }, 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = selectedSuggestionIndex > 0 ? selectedSuggestionIndex - 1 : -1;
                setSelectedSuggestionIndex(prevIndex);
                // Auto-scroll to selected item
                if (prevIndex >= 0) {
                    setTimeout(() => {
                        const dropdown = document.querySelector('.search-suggestions-dropdown');
                        const selectedItem = dropdown?.children[prevIndex];
                        if (selectedItem) {
                            selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        }
                    }, 0);
                }
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

    const handleCategoryKeyDown = (e) => {
        if (!showCategoryDropdown) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowCategoryDropdown(true);
                setSelectedCategoryIndex(-1);
            }
            return;
        }

        const allCategories = [{name: '', display_name: 'All Categories'}, ...categories];

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIdx = selectedCategoryIndex < allCategories.length - 1 ? selectedCategoryIndex + 1 : selectedCategoryIndex;
                setSelectedCategoryIndex(nextIdx);
                // Auto-scroll to selected item
                setTimeout(() => {
                    const dropdown = document.querySelector('.category-dropdown');
                    const selectedItem = dropdown?.children[nextIdx];
                    if (selectedItem) {
                        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                }, 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIdx = selectedCategoryIndex > 0 ? selectedCategoryIndex - 1 : 0;
                setSelectedCategoryIndex(prevIdx);
                // Auto-scroll to selected item
                setTimeout(() => {
                    const dropdown = document.querySelector('.category-dropdown');
                    const selectedItem = dropdown?.children[prevIdx];
                    if (selectedItem) {
                        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                }, 0);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (selectedCategoryIndex >= 0 && selectedCategoryIndex < allCategories.length) {
                    setSelectedCategory(allCategories[selectedCategoryIndex].name);
                    setShowCategoryDropdown(false);
                    setSelectedCategoryIndex(-1);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowCategoryDropdown(false);
                setSelectedCategoryIndex(-1);
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
            const params = new URLSearchParams({ page: currentPage, limit: 6, search: searchTerm, category: selectedCategory });
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
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) { 
                await fetchProducts(); 
                setDeletedProductName(productToDelete?.product_name || 'Product');
                setShowDeleteSuccess(true);
                setTimeout(() => setShowDeleteSuccess(false), 3000);
            }
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
                select {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                }
                
                select option {
                    background: #ffffff !important;
                    color: #374151 !important;
                    padding: 12px 16px !important;
                    font-weight: 400 !important;
                    font-size: 13px !important;
                    border-bottom: 1px solid #F3F4F6 !important;
                }
                
                select option:first-child {
                    font-weight: 600 !important;
                    color: #111827 !important;
                    background: #F9FAFB !important;
                }
                
                select option:hover {
                    background: #F3F4F6 !important;
                    color: #111827 !important;
                    font-weight: 500 !important;
                }
                
                select option:checked {
                    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
                    color: #ffffff !important;
                    font-weight: 600 !important;
                }
                
                /* Hide scrollbar for suggestions dropdown */
                .suggestions-dropdown::-webkit-scrollbar {
                    display: none;
                }
                .suggestions-dropdown {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
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
                <div style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
                    <Filter size={13} style={{position:"absolute",left:12,color:"#6B7280",pointerEvents:"none",zIndex:1}}/>
                    <div 
                        onClick={()=>{setShowCategoryDropdown(!showCategoryDropdown);setSelectedCategoryIndex(-1);}}
                        onKeyDown={handleCategoryKeyDown}
                        onBlur={()=>setTimeout(()=>{setShowCategoryDropdown(false);setSelectedCategoryIndex(-1);},200)}
                        tabIndex={0}
                        style={{
                            appearance:"none",
                            background:"#fff",
                            border:"1.5px solid #E5E7EB",
                            borderRadius:24,
                            padding:"7px 32px 7px 30px",
                            fontSize:13,
                            fontWeight:500,
                            color:"#374151",
                            cursor:"pointer",
                            fontFamily:"inherit",
                            outline:"none",
                            boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                            minWidth:"160px",
                            userSelect:"none"
                        }}
                    >
                        {selectedCategory ? categories.find(c=>c.name===selectedCategory)?.display_name : "Category: All"}
                    </div>
                    <svg style={{position:"absolute",right:10,pointerEvents:"none",color:"#9CA3AF"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    
                    {showCategoryDropdown && (
                        <div 
                            className="category-dropdown suggestions-dropdown"
                            style={{
                            position:"absolute",
                            top:"calc(100% + 4px)",
                            left:0,
                            background:"#fff",
                            borderRadius:16,
                            boxShadow:"0 12px 32px rgba(0,0,0,0.15)",
                            zIndex:100,
                            overflow:"hidden",
                            maxHeight:"360px",
                            overflowY:"auto",
                            border:"1px solid #E5E7EB",
                            minWidth:"100%"
                        }}
                        >
                            <div 
                                onClick={()=>{setSelectedCategory('');setShowCategoryDropdown(false);setSelectedCategoryIndex(-1);}}
                                onMouseEnter={()=>setSelectedCategoryIndex(0)}
                                style={{
                                    padding:"14px 18px",
                                    cursor:"pointer",
                                    borderBottom:"1px solid #F3F4F6",
                                    background:(selectedCategory==='' || selectedCategoryIndex===0)?"linear-gradient(135deg, #F3F4F6 0%, #F9FAFB 100%)":"#fff",
                                    transition:"all 0.2s",
                                    fontWeight:(selectedCategory==='' || selectedCategoryIndex===0)?600:500,
                                    color:(selectedCategory==='' || selectedCategoryIndex===0)?"#111827":"#374151"
                                }}
                            >
                                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                                    <div style={{
                                        width:"36px",
                                        height:"36px",
                                        borderRadius:"8px",
                                        background:(selectedCategory==='' || selectedCategoryIndex===0)?"linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)":"#F3F4F6",
                                        display:"flex",
                                        alignItems:"center",
                                        justifyContent:"center",
                                        flexShrink:0,
                                        transition:"all 0.2s"
                                    }}>
                                        <LayoutGrid size={16} color={(selectedCategory==='' || selectedCategoryIndex===0)?"#fff":"#6B7280"}/>
                                    </div>
                                    <div style={{flex:1}}>
                                        <div style={{fontSize:"13px"}}>All Categories</div>
                                        <div style={{fontSize:"10px",color:"#9CA3AF",marginTop:"2px"}}>Show all products</div>
                                    </div>
                                    {selectedCategoryIndex===0&&(
                                        <div style={{
                                            fontSize:"10px",
                                            color:"#3B82F6",
                                            fontWeight:600,
                                            background:"#EFF6FF",
                                            padding:"4px 8px",
                                            borderRadius:"6px",
                                            display:"flex",
                                            alignItems:"center",
                                            gap:"4px"
                                        }}>
                                            <span>↵</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {categories.map((cat,idx)=>(
                                <div 
                                    key={cat.id}
                                    onClick={()=>{setSelectedCategory(cat.name);setShowCategoryDropdown(false);setSelectedCategoryIndex(-1);}}
                                    onMouseEnter={()=>setSelectedCategoryIndex(idx+1)}
                                    style={{
                                        padding:"14px 18px",
                                        cursor:"pointer",
                                        borderBottom:idx<categories.length-1?"1px solid #F3F4F6":"none",
                                        background:(selectedCategory===cat.name || selectedCategoryIndex===idx+1)?"linear-gradient(135deg, #F3F4F6 0%, #F9FAFB 100%)":"#fff",
                                        transition:"all 0.2s",
                                        fontWeight:(selectedCategory===cat.name || selectedCategoryIndex===idx+1)?600:500,
                                        color:(selectedCategory===cat.name || selectedCategoryIndex===idx+1)?"#111827":"#374151"
                                    }}
                                >
                                    <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                                        <div style={{
                                            width:"36px",
                                            height:"36px",
                                            borderRadius:"8px",
                                            background:(selectedCategory===cat.name || selectedCategoryIndex===idx+1)?"linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)":"#F3F4F6",
                                            display:"flex",
                                            alignItems:"center",
                                            justifyContent:"center",
                                            flexShrink:0,
                                            transition:"all 0.2s"
                                        }}>
                                            <Filter size={16} color={(selectedCategory===cat.name || selectedCategoryIndex===idx+1)?"#fff":"#6B7280"}/>
                                        </div>
                                        <div style={{flex:1,minWidth:0}}>
                                            <div style={{fontSize:"13px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cat.display_name}</div>
                                            {cat.description && <div style={{fontSize:"10px",color:"#9CA3AF",marginTop:"2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cat.description}</div>}
                                        </div>
                                        {selectedCategoryIndex===idx+1&&(
                                            <div style={{
                                                fontSize:"10px",
                                                color:"#3B82F6",
                                                fontWeight:600,
                                                background:"#EFF6FF",
                                                padding:"4px 8px",
                                                borderRadius:"6px",
                                                display:"flex",
                                                alignItems:"center",
                                                gap:"4px",
                                                flexShrink:0
                                            }}>
                                                <span>↵</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                    {showSuggestions&&suggestions.length>0&&(
                        <div className="search-suggestions-dropdown suggestions-dropdown" style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:"#fff",borderRadius:16,boxShadow:"0 12px 32px rgba(0,0,0,0.15)",zIndex:100,overflow:"hidden",maxHeight:"360px",overflowY:"auto",border:"1px solid #E5E7EB",minWidth:"100%"}}>
                            {suggestions.map((p,i)=>(
                                <div 
                                    key={p.p_id||i} 
                                    onClick={()=>selectSuggestion(p)} 
                                    onMouseEnter={()=>setSelectedSuggestionIndex(i)} 
                                    style={{
                                        padding:"14px 18px",
                                        cursor:"pointer",
                                        borderBottom:i<suggestions.length-1?"1px solid #F3F4F6":"none",
                                        background:selectedSuggestionIndex===i?"linear-gradient(135deg, #F3F4F6 0%, #F9FAFB 100%)":"#fff",
                                        transition:"all 0.2s",
                                        position:"relative"
                                    }}
                                >
                                    <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                                        <div style={{
                                            width:"36px",
                                            height:"36px",
                                            borderRadius:"8px",
                                            background:selectedSuggestionIndex===i?"linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)":"#F3F4F6",
                                            display:"flex",
                                            alignItems:"center",
                                            justifyContent:"center",
                                            flexShrink:0,
                                            transition:"all 0.2s"
                                        }}>
                                            <Package size={16} color={selectedSuggestionIndex===i?"#fff":"#6B7280"}/>
                                        </div>
                                        <div style={{flex:1,minWidth:0}}>
                                            <div style={{
                                                fontWeight:selectedSuggestionIndex===i?600:500,
                                                color:selectedSuggestionIndex===i?"#111827":"#374151",
                                                marginBottom:"4px",
                                                fontSize:"13px",
                                                whiteSpace:"nowrap",
                                                overflow:"hidden",
                                                textOverflow:"ellipsis"
                                            }}>
                                                {p.product_name}
                                            </div>
                                            <div style={{
                                                fontSize:"11px",
                                                color:"#9CA3AF",
                                                fontFamily:"monospace",
                                                display:"flex",
                                                alignItems:"center",
                                                gap:"4px"
                                            }}>
                                                <FileSpreadsheet size={10}/>
                                                {p.barcode}
                                            </div>
                                        </div>
                                        {selectedSuggestionIndex===i&&(
                                            <div style={{
                                                fontSize:"10px",
                                                color:"#3B82F6",
                                                fontWeight:600,
                                                background:"#EFF6FF",
                                                padding:"4px 8px",
                                                borderRadius:"6px",
                                                display:"flex",
                                                alignItems:"center",
                                                gap:"4px"
                                            }}>
                                                <span>↵</span>
                                                <span>Enter</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
            <div className="scrollbar-hide" style={{overflowY:"auto",height:"calc(6 * 80px)",minHeight:100,display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
                {loading?(
                    <div style={{background:"#fff",borderRadius:16,padding:"48px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
                        <div style={{color:"#9CA3AF",fontSize:14}}>Loading products...</div>
                    </div>
                ):products.length===0?(
                    <div style={{background:"#fff",borderRadius:16,padding:"48px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",color:"#9CA3AF",fontSize:14}}>No products found.</div>
                ):products.map(product=>(
                    <div key={product.p_id} onClick={()=>{setSelectedProduct(product);setShowProductDetail(true);}} style={{background:"#fff",borderRadius:16,padding:"16px 20px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",display:"grid",gridTemplateColumns:"2fr 1.2fr 1fr 1fr 1fr 80px",gap:16,alignItems:"center",transition:"box-shadow 0.2s,transform 0.2s",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.1)";e.currentTarget.style.transform="translateY(-1px)"}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)";e.currentTarget.style.transform="translateY(0)"}}>
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
                            {hasPermission(PERMISSIONS.PRODUCTS_EDIT)&&(<button onClick={(e)=>{e.stopPropagation();handleEdit(product);}} title="Edit" style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,color:"#9CA3AF",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#3B82F6"} onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}><Edit size={15}/></button>)}
                            {hasPermission(PERMISSIONS.PRODUCTS_DELETE)&&(<button onClick={(e)=>{e.stopPropagation();setProductToDelete(product);setShowDeleteConfirm(true);}} title="Delete" style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,color:"#9CA3AF",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#EF4444"} onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}><Trash2 size={15}/></button>)}
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

            {/* PRODUCT DETAIL MODAL */}
            {showProductDetail&&selectedProduct&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowProductDetail(false)}>
                    <div style={{background:"#fff",borderRadius:24,width:"100%",maxWidth:800,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 25px 50px rgba(0,0,0,0.25)"}} onClick={(e)=>e.stopPropagation()} className="suggestions-dropdown">
                        {/* Header */}
                        <div style={{padding:"32px",borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,background:"#fff",zIndex:1,borderRadius:"24px 24px 0 0"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                                <div style={{flex:1}}>
                                    <h2 style={{margin:0,fontSize:24,fontWeight:700,color:"#111827",marginBottom:8}}>{selectedProduct.product_name}</h2>
                                    {selectedProduct.product_variant&&<div style={{fontSize:14,color:"#6B7280",marginBottom:12}}>{selectedProduct.product_variant}</div>}
                                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                        <span style={{background:"#F3F4F6",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:600,color:"#374151",fontFamily:"monospace"}}>{selectedProduct.barcode}</span>
                                        {selectedProduct.category_display_name&&<span style={{background:"linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:600,color:"#fff"}}>{selectedProduct.category_display_name}</span>}
                                    </div>
                                </div>
                                <button onClick={()=>setShowProductDetail(false)} style={{background:"#F3F4F6",border:"none",borderRadius:"50%",width:40,height:40,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.2s"}} onMouseEnter={(e)=>e.target.style.background="#E5E7EB"} onMouseLeave={(e)=>e.target.style.background="#F3F4F6"}><X size={20} color="#6B7280"/></button>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{padding:"32px"}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32}}>
                                {/* Left Column - Image */}
                                <div>
                                    <div style={{background:"#F9FAFB",borderRadius:16,aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",border:"2px dashed #E5E7EB"}}>
                                        <div style={{textAlign:"center",color:"#9CA3AF"}}>
                                            <Package size={64} style={{marginBottom:12}}/>
                                            <div style={{fontSize:14}}>No image available</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Details */}
                                <div>
                                    <h3 style={{fontSize:16,fontWeight:700,color:"#111827",marginBottom:16,marginTop:0}}>Product Details</h3>
                                    
                                    {/* Pricing */}
                                    <div style={{marginBottom:24}}>
                                        <div style={{display:"flex",gap:16,marginBottom:12}}>
                                            {selectedProduct.price&&(
                                                <div style={{flex:1,background:"#F0F9FF",padding:16,borderRadius:12,border:"1px solid #BFDBFE"}}>
                                                    <div style={{fontSize:11,fontWeight:600,color:"#1E40AF",marginBottom:4,letterSpacing:"0.05em"}}>SELLING PRICE</div>
                                                    <div style={{fontSize:24,fontWeight:700,color:"#1E40AF"}}>₹{parseFloat(selectedProduct.price).toFixed(2)}</div>
                                                </div>
                                            )}
                                            {selectedProduct.cost_price&&(
                                                <div style={{flex:1,background:"#FEF3C7",padding:16,borderRadius:12,border:"1px solid #FDE68A"}}>
                                                    <div style={{fontSize:11,fontWeight:600,color:"#92400E",marginBottom:4,letterSpacing:"0.05em"}}>COST PRICE</div>
                                                    <div style={{fontSize:24,fontWeight:700,color:"#92400E"}}>₹{parseFloat(selectedProduct.cost_price).toFixed(2)}</div>
                                                </div>
                                            )}
                                        </div>
                                        {selectedProduct.price&&selectedProduct.cost_price&&(
                                            <div style={{fontSize:12,color:"#6B7280",textAlign:"center"}}>
                                                Margin: ₹{(parseFloat(selectedProduct.price)-parseFloat(selectedProduct.cost_price)).toFixed(2)} ({(((parseFloat(selectedProduct.price)-parseFloat(selectedProduct.cost_price))/parseFloat(selectedProduct.price))*100).toFixed(1)}%)
                                            </div>
                                        )}
                                    </div>

                                    {/* Stock */}
                                    <div style={{marginBottom:24}}>
                                        <div style={{fontSize:12,fontWeight:600,color:"#6B7280",marginBottom:8}}>STOCK STATUS</div>
                                        {(selectedProduct.total_stock||0)===0?(
                                            <div style={{background:"#FEE2E2",color:"#991B1B",borderRadius:12,padding:"12px 16px",fontSize:14,fontWeight:600,display:"inline-flex",alignItems:"center",gap:8}}>
                                                <AlertCircle size={16}/>
                                                OUT OF STOCK
                                            </div>
                                        ):(
                                            <div style={{background:"#DCFCE7",color:"#166534",borderRadius:12,padding:"12px 16px",fontSize:14,fontWeight:600,display:"inline-flex",alignItems:"center",gap:8}}>
                                                <CheckCircle size={16}/>
                                                {selectedProduct.total_stock} IN STOCK
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {selectedProduct.description&&(
                                        <div style={{marginBottom:24}}>
                                            <div style={{fontSize:12,fontWeight:600,color:"#6B7280",marginBottom:8}}>DESCRIPTION</div>
                                            <div style={{fontSize:14,color:"#374151",lineHeight:1.6,background:"#F9FAFB",padding:16,borderRadius:12}}>{selectedProduct.description}</div>
                                        </div>
                                    )}

                                    {/* Additional Info */}
                                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                                        {selectedProduct.weight&&(
                                            <div style={{background:"#F9FAFB",padding:12,borderRadius:10}}>
                                                <div style={{fontSize:11,fontWeight:600,color:"#6B7280",marginBottom:4}}>WEIGHT</div>
                                                <div style={{fontSize:14,fontWeight:600,color:"#111827"}}>{selectedProduct.weight}</div>
                                            </div>
                                        )}
                                        {selectedProduct.dimensions&&(
                                            <div style={{background:"#F9FAFB",padding:12,borderRadius:10}}>
                                                <div style={{fontSize:11,fontWeight:600,color:"#6B7280",marginBottom:4}}>DIMENSIONS</div>
                                                <div style={{fontSize:14,fontWeight:600,color:"#111827"}}>{selectedProduct.dimensions}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{padding:"24px 32px",borderTop:"1px solid #E5E7EB",display:"flex",gap:12,justifyContent:"flex-end",background:"#F9FAFB",borderRadius:"0 0 24px 24px"}}>
                            {hasPermission(PERMISSIONS.PRODUCTS_EDIT)&&(
                                <button onClick={()=>{handleEdit(selectedProduct);setShowProductDetail(false);}} style={{padding:"10px 20px",borderRadius:12,border:"1.5px solid #E5E7EB",background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8}}>
                                    <Edit size={16}/>
                                    Edit Product
                                </button>
                            )}
                            {hasPermission(PERMISSIONS.PRODUCTS_DELETE)&&(
                                <button onClick={()=>{setProductToDelete(selectedProduct);setShowDeleteConfirm(true);}} style={{padding:"10px 20px",borderRadius:12,border:"none",background:"#EF4444",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8}}>
                                    <Trash2 size={16}/>
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteConfirm&&productToDelete&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>{setShowDeleteConfirm(false);setProductToDelete(null);}}>
                    <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:440,boxShadow:"0 25px 50px rgba(0,0,0,0.3)",overflow:"hidden"}} onClick={(e)=>e.stopPropagation()}>
                        {/* Header */}
                        <div style={{padding:"32px 32px 24px 32px",textAlign:"center"}}>
                            <div style={{width:64,height:64,borderRadius:"50%",background:"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
                                <AlertCircle size={32} color="#EF4444"/>
                            </div>
                            <h3 style={{margin:0,fontSize:20,fontWeight:700,color:"#111827",marginBottom:12}}>Delete Product?</h3>
                            <p style={{margin:0,fontSize:14,color:"#6B7280",lineHeight:1.6}}>
                                Are you sure you want to delete <strong style={{color:"#111827"}}>{productToDelete.product_name}</strong>? This action cannot be undone.
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{padding:"0 32px 32px 32px",display:"flex",gap:12}}>
                            <button 
                                onClick={()=>{setShowDeleteConfirm(false);setProductToDelete(null);}} 
                                style={{
                                    flex:1,
                                    padding:"12px 24px",
                                    borderRadius:12,
                                    border:"1.5px solid #E5E7EB",
                                    background:"#fff",
                                    fontSize:14,
                                    fontWeight:600,
                                    cursor:"pointer",
                                    fontFamily:"inherit",
                                    color:"#374151",
                                    transition:"all 0.2s"
                                }}
                                onMouseEnter={(e)=>{e.target.style.background="#F9FAFB";e.target.style.borderColor="#D1D5DB";}}
                                onMouseLeave={(e)=>{e.target.style.background="#fff";e.target.style.borderColor="#E5E7EB";}}
                            >
                                No, Cancel
                            </button>
                            <button 
                                onClick={()=>{
                                    handleDelete(productToDelete.p_id);
                                    setShowDeleteConfirm(false);
                                    setProductToDelete(null);
                                    setShowProductDetail(false);
                                }} 
                                style={{
                                    flex:1,
                                    padding:"12px 24px",
                                    borderRadius:12,
                                    border:"none",
                                    background:"#111827",
                                    fontSize:14,
                                    fontWeight:600,
                                    cursor:"pointer",
                                    fontFamily:"inherit",
                                    color:"#fff",
                                    transition:"all 0.2s"
                                }}
                                onMouseEnter={(e)=>e.target.style.background="#000"}
                                onMouseLeave={(e)=>e.target.style.background="#111827"}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE SUCCESS MODAL */}
            {showDeleteSuccess&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1002,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
                    <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:400,boxShadow:"0 25px 50px rgba(0,0,0,0.3)",overflow:"hidden",animation:"slideIn 0.3s ease-out"}}>
                        <div style={{padding:"48px 32px",textAlign:"center"}}>
                            <div style={{width:80,height:80,borderRadius:"50%",background:"#DCFCE7",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",animation:"scaleIn 0.4s ease-out"}}>
                                <CheckCircle size={40} color="#16A34A" strokeWidth={2.5}/>
                            </div>
                            <h3 style={{margin:0,fontSize:22,fontWeight:700,color:"#111827",marginBottom:12}}>Product Deleted Successfully</h3>
                            <p style={{margin:0,fontSize:14,color:"#6B7280",lineHeight:1.6}}>
                                <strong style={{color:"#111827"}}>{deletedProductName}</strong> has been removed from your inventory.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes scaleIn {
                    from {
                        transform: scale(0);
                    }
                    to {
                        transform: scale(1);
                    }
                }
            `}</style>

        </div>
    );
};

export default ProductManager;
