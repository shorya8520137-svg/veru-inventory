'use client';

import React, { useState, useEffect } from 'react';
import ProductDetailModal from '@/components/ProductDetailModal';

const WebsiteProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [filters, setFilters] = useState({ search: '', category: '', minPrice: '', maxPrice: '', featured: '', page: 1, limit: 10 });
    const [pagination, setPagination] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [bulkFile, setBulkFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [formData, setFormData] = useState({ product_name:'',description:'',short_description:'',key_features:[],price:'',offer_price:'',image_url:'',additional_images:[],category_id:'',sku:'',stock_quantity:0,min_stock_level:0,weight:'',dimensions:'',is_active:true,is_featured:false,meta_title:'',meta_description:'' });
    const [categoryFormData, setCategoryFormData] = useState({ name:'',description:'',slug:'',parent_id:'',sort_order:0,image_url:'' });
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

    const fetchProducts = async () => {
        try {
            setLoading(true); setError('');
            if (typeof window === 'undefined') return;
            const queryParams = new URLSearchParams();
            Object.keys(filters).forEach(key => { if (filters[key] !== '' && filters[key] !== null) queryParams.append(key, filters[key]); });
            const response = await fetch(`${API_BASE}/api/website/products?${queryParams}`, { headers: { 'Content-Type': 'application/json' } });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success) { setProducts(data.data || []); setPagination(data.pagination || {}); }
            else throw new Error(data.message || 'Failed to fetch products');
        } catch (err) { console.error(err); setError('Failed to fetch products: ' + err.message); setProducts([]); }
        finally { setLoading(false); }
    };

    const fetchCategories = async () => {
        try {
            if (typeof window === 'undefined') return;
            const response = await fetch(`${API_BASE}/api/website/categories`);
            if (!response.ok) return;
            const data = await response.json();
            if (data.success) setCategories(data.data || []);
        } catch (err) { console.error(err); setCategories([]); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (typeof window === 'undefined') return;
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = editingProduct ? `${API_BASE}/api/website/products/${editingProduct.id}` : `${API_BASE}/api/website/products`;
            const response = await fetch(url, { method: editingProduct ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formData) });
            const data = await response.json();
            if (data.success) { setSuccess(editingProduct ? 'Product updated!' : 'Product created!'); setShowAddModal(false); setEditingProduct(null); resetForm(); fetchProducts(); }
            else throw new Error(data.message);
        } catch (err) { setError('Failed to save product: ' + err.message); }
    };

    const handleBulkUpload = async (e) => {
        e.preventDefault();
        if (!bulkFile) { setError('Please select a CSV file'); return; }
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const fd = new FormData(); fd.append('csvFile', bulkFile);
            const response = await fetch(`${API_BASE}/api/website/products/bulk-upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
            const data = await response.json();
            if (data.success) { setSuccess('Bulk upload started!'); setShowBulkUploadModal(false); setBulkFile(null); pollUploadStatus(data.uploadId); }
            else throw new Error(data.message);
        } catch (err) { setError('Failed to upload: ' + err.message); }
    };

    const pollUploadStatus = async (uploadId) => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const poll = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/website/bulk-upload/${uploadId}/status`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await response.json();
                if (data.success) {
                    const upload = data.data; setUploadProgress(upload);
                    if (upload.status === 'completed') { setSuccess(`Upload complete! ${upload.success_rows} products added.`); fetchProducts(); setUploadProgress(null); }
                    else if (upload.status === 'failed') { setError('Upload failed.'); setUploadProgress(null); }
                    else setTimeout(poll, 2000);
                }
            } catch (err) { setUploadProgress(null); }
        };
        poll();
    };

    const handleDelete = async (productId) => {
        if (!confirm('Delete this product?')) return;
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/website/products/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (data.success) { setSuccess('Product deleted!'); fetchProducts(); }
            else throw new Error(data.message);
        } catch (err) { setError('Failed to delete: ' + err.message); }
    };

    const handleDeleteCategory = async (categoryId, categoryName) => {
        if (!confirm(`Delete category "${categoryName}"?`)) return;
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/website/categories/${categoryId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (data.success) { setSuccess('Category deleted!'); fetchCategories(); fetchProducts(); }
            else throw new Error(data.message);
        } catch (err) { setError('Failed to delete category: ' + err.message); }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryFormData({ name: category.name, description: category.description, slug: category.slug, parent_id: category.parent_id || '', sort_order: category.sort_order || 0, image_url: category.image_url || '' });
        setShowCategoryModal(false); setShowEditCategoryModal(true);
    };

    const resetForm = () => setFormData({ product_name:'',description:'',short_description:'',key_features:[],price:'',offer_price:'',image_url:'',additional_images:[],category_id:'',sku:'',stock_quantity:0,min_stock_level:0,weight:'',dimensions:'',is_active:true,is_featured:false,meta_title:'',meta_description:'' });

    const handleEdit = (product) => {
        setEditingProduct(product);
        let parsedAdditionalImages = [];
        try { if (product.additional_images) { if (typeof product.additional_images === 'string') { parsedAdditionalImages = product.additional_images.startsWith('http') ? [product.additional_images] : JSON.parse(product.additional_images); } else if (Array.isArray(product.additional_images)) parsedAdditionalImages = product.additional_images; } } catch(e) {}
        let parsedKeyFeatures = [];
        try { if (product.key_features) { parsedKeyFeatures = typeof product.key_features === 'string' ? JSON.parse(product.key_features) : Array.isArray(product.key_features) ? product.key_features : []; } } catch(e) {}
        setFormData({ product_name:product.product_name, description:product.description||'', short_description:product.short_description||'', key_features:parsedKeyFeatures, price:product.price, offer_price:product.offer_price||'', image_url:product.image_url||'', additional_images:parsedAdditionalImages, category_id:product.category_id, sku:product.sku, stock_quantity:product.stock_quantity, min_stock_level:product.min_stock_level, weight:product.weight||'', dimensions:product.dimensions||'', is_active:product.is_active, is_featured:product.is_featured, meta_title:product.meta_title||'', meta_description:product.meta_description||'' });
        setShowAddModal(true);
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (typeof window === 'undefined') return;
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const isEditing = editingCategory !== null;
            const url = isEditing ? `${API_BASE}/api/website/categories/${editingCategory.id}` : `${API_BASE}/api/website/categories`;
            const response = await fetch(url, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(categoryFormData) });
            const data = await response.json();
            if (data.success) { setSuccess(isEditing ? 'Category updated!' : 'Category created!'); setShowAddCategoryModal(false); setShowEditCategoryModal(false); setEditingCategory(null); resetCategoryForm(); fetchCategories(); }
            else throw new Error(data.message);
        } catch (err) { setError('Failed to save category: ' + err.message); }
    };

    const resetCategoryForm = () => { setCategoryFormData({ name:'',description:'',slug:'',parent_id:'',sort_order:0,image_url:'' }); setEditingCategory(null); };
    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));

    useEffect(() => { if (typeof window !== 'undefined') fetchCategories(); }, []);
    useEffect(() => { if (typeof window !== 'undefined') { const t = setTimeout(() => fetchProducts(), 300); return () => clearTimeout(t); } }, [filters]);
    useEffect(() => { if (error || success) { const t = setTimeout(() => { setError(''); setSuccess(''); }, 5000); return () => clearTimeout(t); } }, [error, success]);

    const getFilteredProducts = () => {
        if (activeTab === 'instock') return products.filter(p => p.stock_quantity > (p.min_stock_level || 0));
        if (activeTab === 'low') return products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.min_stock_level || 5));
        if (activeTab === 'discontinued') return products.filter(p => !p.is_active);
        return products;
    };

    const getStockBadge = (product) => {
        const qty = product.stock_quantity || 0;
        const min = product.min_stock_level || 5;
        if (qty === 0) return { label: 'OUT OF STOCK', color: '#EF4444', bg: '#FEF2F2', dot: '#EF4444' };
        if (qty <= min) return { label: `LOW STOCK (${qty})`, color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' };
        return { label: `IN STOCK (${qty})`, color: '#16A34A', bg: '#F0FDF4', dot: '#22C55E' };
    };

    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price || 0) * (p.stock_quantity || 0)), 0);
    const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.min_stock_level || 5)).length;
    const outOfStockCount = products.filter(p => (p.stock_quantity || 0) === 0).length;
    const inStockCount = products.filter(p => (p.stock_quantity || 0) > 0).length;
    const fulfillmentRate = products.length > 0 ? ((inStockCount / products.length) * 100).toFixed(1) : '0.0';

    const filteredProducts = getFilteredProducts();
    const totalPages = pagination.pages || 1;

    const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:13, color:'#374151', fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' };
    const labelStyle = { fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 };

    return (
        <div onClick={()=>setOpenMenuId(null)} style={{background:'#F6F8FB',fontFamily:'Inter,sans-serif',display:'flex',flexDirection:'column'}}>
            {error&&<div style={{position:'fixed',top:20,right:20,zIndex:9999,background:'#FEF2F2',color:'#991B1B',padding:'12px 20px',borderRadius:12,fontSize:13,boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>{error}</div>}
            {success&&<div style={{position:'fixed',top:20,right:20,zIndex:9999,background:'#F0FDF4',color:'#166534',padding:'12px 20px',borderRadius:12,fontSize:13,boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>{success}</div>}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:16,flexShrink:0,padding:'28px 32px 0 32px'}}>
                <div style={{background:'#fff',borderRadius:16,padding:'20px 24px',border:'1px solid #E5E7EB',boxShadow:'0 1px 8px rgba(0,0,0,0.05)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><div style={{width:40,height:40,borderRadius:10,background:'#EFF6FF',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#2563EB' strokeWidth='2'><rect x='2' y='3' width='20' height='14' rx='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg></div><span style={{fontSize:12,fontWeight:600,color:'#16A34A',background:'#F0FDF4',padding:'3px 10px',borderRadius:20}}>+12.4%</span></div>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.07em',color:'#9CA3AF',marginBottom:6}}>TOTAL VALUE</div>
                    <div style={{fontSize:28,fontWeight:700,color:'#111827'}}>₹{(totalValue/100000).toFixed(2)}L</div>
                </div>
                <div style={{background:'#fff',borderRadius:16,padding:'20px 24px',border:'1px solid #E5E7EB',boxShadow:'0 1px 8px rgba(0,0,0,0.05)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><div style={{width:40,height:40,borderRadius:10,background:'#F5F3FF',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#7C3AED' strokeWidth='2'><polyline points='17 1 21 5 17 9'/><path d='M3 11V9a4 4 0 0 1 4-4h14'/><polyline points='7 23 3 19 7 15'/><path d='M21 13v2a4 4 0 0 1-4 4H3'/></svg></div><span style={{fontSize:12,color:'#6B7280'}}>Target: 4.5</span></div>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.07em',color:'#9CA3AF',marginBottom:6}}>STOCK TURNOVER</div>
                    <div style={{fontSize:28,fontWeight:700,color:'#111827'}}>4.12x</div>
                </div>
                <div style={{background:'#FFFAFA',borderRadius:16,padding:'20px 24px',border:'1.5px solid #FEE2E2',boxShadow:'0 1px 8px rgba(239,68,68,0.08)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><div style={{width:40,height:40,borderRadius:10,background:'#FEF2F2',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#EF4444' strokeWidth='2'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg></div><span style={{fontSize:12,fontWeight:600,color:'#EF4444',background:'#FEF2F2',padding:'3px 10px',borderRadius:20}}>Urgent</span></div>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.07em',color:'#9CA3AF',marginBottom:6}}>LOW STOCK ALERTS</div>
                    <div style={{fontSize:28,fontWeight:700,color:'#111827'}}>{lowStockCount}</div>
                </div>
                <div style={{background:'#fff',borderRadius:16,padding:'20px 24px',border:'1px solid #E5E7EB',boxShadow:'0 1px 8px rgba(0,0,0,0.05)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><div style={{width:40,height:40,borderRadius:10,background:'#FFF7ED',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#F59E0B' strokeWidth='2'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/></svg></div><span style={{fontSize:12,fontWeight:600,color:'#16A34A',background:'#F0FDF4',padding:'3px 10px',borderRadius:20}}>Excellent</span></div>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.07em',color:'#9CA3AF',marginBottom:6}}>FULFILLMENT RATE</div>
                    <div style={{fontSize:28,fontWeight:700,color:'#111827'}}>{fulfillmentRate}%</div>
                </div>
            </div>
            <div style={{flexShrink:0,background:'#F6F8FB',padding:'12px 32px',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #E5E7EB'}}>
                <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>setShowCategoryModal(true)} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 18px',borderRadius:10,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:13,fontWeight:500,color:'#374151',cursor:'pointer'}}>Manage Categories</button>
                    <button onClick={()=>setShowBulkUploadModal(true)} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 18px',borderRadius:10,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:13,fontWeight:500,color:'#374151',cursor:'pointer'}}>Bulk Upload</button>
                </div>
                <button onClick={()=>{resetForm();setEditingProduct(null);setShowAddModal(true);}} style={{padding:'10px 22px',borderRadius:10,border:'none',background:'#2563EB',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:'0 4px 12px rgba(37,99,235,0.3)'}}>+ Add Product</button>
            </div>
            <div style={{background:'#fff',borderRadius:16,border:'1px solid #E5E7EB',boxShadow:'0 1px 8px rgba(0,0,0,0.05)',overflow:'hidden'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 24px',borderBottom:'1px solid #F1F5F9',flexShrink:0}}>
                    <div style={{display:'flex'}}>
                        {[['all','All Products'],['instock','In Stock'],['low','Low Inventory'],['discontinued','Discontinued']].map(([key,label])=>(
                            <button key={key} onClick={()=>setActiveTab(key)} style={{padding:'14px 16px',border:'none',background:'none',fontSize:13,fontWeight:activeTab===key?600:400,color:activeTab===key?'#2563EB':'#6B7280',cursor:'pointer',borderBottom:activeTab===key?'2px solid #2563EB':'2px solid transparent',marginBottom:'-1px'}}>{label}</button>
                        ))}
                    </div>
                    <div style={{display:'flex',gap:8}}>
                        <button style={{padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:'pointer'}}>&#9776;</button>
                        <button style={{padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:'pointer'}}>&#8595;</button>
                    </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'2.5fr 1fr 1.2fr 1fr 1fr 60px',padding:'10px 24px',borderBottom:'1px solid #F1F5F9',flexShrink:0}}>
                    {['PRODUCT DETAILS','SKU / ID','AVAILABILITY','UNIT PRICE','TOTAL VALUE','ACTIONS'].map(h=><div key={h} style={{fontSize:11,fontWeight:600,letterSpacing:'0.07em',color:'#9CA3AF'}}>{h}</div>)}
                </div>
                <div className="scrollbar-hide" style={{overflowY:'auto',maxHeight:'calc(100vh - 520px)',minHeight:100}}>{loading?<div style={{padding:'48px',textAlign:'center',color:'#9CA3AF'}}>Loading products...</div>:filteredProducts.length===0?<div style={{padding:'48px',textAlign:'center',color:'#9CA3AF'}}>No products found.</div>:filteredProducts.map((product,idx)=>{
                    const badge=getStockBadge(product);
                    const tv=parseFloat(product.price||0)*(product.stock_quantity||0);
                    return(<div key={product.id} style={{display:'grid',gridTemplateColumns:'2.5fr 1fr 1.2fr 1fr 1fr 60px',padding:'16px 24px',borderBottom:idx<filteredProducts.length-1?'1px solid #F1F5F9':'none',alignItems:'center',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                            {product.image_url?<img src={product.image_url} alt={product.product_name} style={{width:44,height:44,borderRadius:8,objectFit:'cover',border:'1px solid #F1F5F9',cursor:'pointer'}} onClick={()=>{setSelectedProduct(product);setShowDetailModal(true);}}/>:<div style={{width:44,height:44,borderRadius:8,background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#9CA3AF'}}>&#128247;</div>}
                            <div><div style={{fontSize:14,fontWeight:600,color:'#111827',cursor:'pointer'}} onClick={()=>{setSelectedProduct(product);setShowDetailModal(true);}}>{product.product_name}{product.is_featured&&<span style={{marginLeft:6,fontSize:10,background:'#FEF9C3',color:'#854D0E',padding:'2px 6px',borderRadius:4}}>FEATURED</span>}</div><div style={{fontSize:12,color:'#9CA3AF',marginTop:2}}>{product.category_name||'Uncategorized'}</div></div>
                        </div>
                        <div><span style={{background:'#F3F4F6',borderRadius:6,padding:'4px 10px',fontSize:12,fontFamily:'monospace',color:'#374151',fontWeight:500}}>{product.sku}</span></div>
                        <div><span style={{display:'inline-flex',alignItems:'center',gap:6,background:badge.bg,borderRadius:20,padding:'5px 12px',fontSize:12,fontWeight:600,color:badge.color}}><span style={{width:6,height:6,borderRadius:'50%',background:badge.dot,display:'inline-block'}}/>{badge.label}</span></div>
                        <div style={{fontSize:14,color:'#374151'}}>{product.price?`₹${parseFloat(product.price).toFixed(2)}`:'-'}</div>
                        <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>₹{tv.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                        <div style={{position:'relative'}}>
                            <button onClick={e=>{e.stopPropagation();setOpenMenuId(openMenuId===product.id?null:product.id);}} style={{background:'none',border:'none',cursor:'pointer',padding:'6px',borderRadius:6,color:'#9CA3AF',fontSize:18}}>&#8942;</button>
                            {openMenuId===product.id&&<div style={{position:'absolute',right:0,top:'100%',background:'#fff',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',border:'1px solid #E5E7EB',zIndex:100,minWidth:140}}>
                                <button onClick={()=>{handleEdit(product);setOpenMenuId(null);}} style={{width:'100%',padding:'10px 16px',border:'none',background:'none',textAlign:'left',fontSize:13,color:'#374151',cursor:'pointer',display:'block'}}>Edit</button>
                                <button onClick={()=>{setSelectedProduct(product);setShowDetailModal(true);setOpenMenuId(null);}} style={{width:'100%',padding:'10px 16px',border:'none',background:'none',textAlign:'left',fontSize:13,color:'#374151',cursor:'pointer',display:'block'}}>View Details</button>
                                <button onClick={()=>{handleDelete(product.id);setOpenMenuId(null);}} style={{width:'100%',padding:'10px 16px',border:'none',background:'none',textAlign:'left',fontSize:13,color:'#EF4444',cursor:'pointer',display:'block'}}>Delete</button>
                            </div>}
                        </div>
                    </div>);
                })}
                </div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 24px',borderTop:'1px solid #F1F5F9',flexShrink:0}}>
                    <span style={{fontSize:12,fontWeight:600,letterSpacing:'0.06em',color:'#6B7280'}}>SHOWING {filteredProducts.length} OF {(pagination.total||products.length).toLocaleString()} PRODUCTS</span>
                    <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>handlePageChange(Math.max(1,filters.page-1))} disabled={filters.page<=1} style={{width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:filters.page<=1?'not-allowed':'pointer',opacity:filters.page<=1?0.4:1,fontSize:14}}>&#8249;</button>
                        {totalPages<=5
                            ? Array.from({length:totalPages},(_,i)=>i+1).map(p=><button key={p} onClick={()=>handlePageChange(p)} style={{width:32,height:32,borderRadius:8,border:filters.page===p?'none':'1.5px solid #E5E7EB',background:filters.page===p?'#2563EB':'#fff',color:filters.page===p?'#fff':'#374151',fontSize:13,fontWeight:600,cursor:'pointer'}}>{p}</button>)
                            : [
                                filters.page>2&&<button key='1' onClick={()=>handlePageChange(1)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',color:'#374151',fontSize:13,fontWeight:600,cursor:'pointer'}}>1</button>,
                                filters.page>3&&<span key='e1' style={{width:32,height:32,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#9CA3AF'}}>...</span>,
                                ...[filters.page-1,filters.page,filters.page+1].filter(p=>p>=1&&p<=totalPages).map(p=><button key={p} onClick={()=>handlePageChange(p)} style={{width:32,height:32,borderRadius:8,border:filters.page===p?'none':'1.5px solid #E5E7EB',background:filters.page===p?'#2563EB':'#fff',color:filters.page===p?'#fff':'#374151',fontSize:13,fontWeight:600,cursor:'pointer'}}>{p}</button>),
                                filters.page<totalPages-2&&<span key='e2' style={{width:32,height:32,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#9CA3AF'}}>...</span>,
                                filters.page<totalPages-1&&<button key={totalPages} onClick={()=>handlePageChange(totalPages)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',color:'#374151',fontSize:13,fontWeight:600,cursor:'pointer'}}>{totalPages}</button>
                              ]
                        }
                        <button onClick={()=>handlePageChange(Math.min(totalPages,filters.page+1))} disabled={filters.page>=totalPages} style={{width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:filters.page>=totalPages?'not-allowed':'pointer',opacity:filters.page>=totalPages?0.4:1,fontSize:14}}>&#8250;</button>
                    </div>
                </div>
            </div>
            {showDetailModal&&selectedProduct&&<ProductDetailModal product={selectedProduct} onClose={()=>{setShowDetailModal(false);setSelectedProduct(null);}}/>}
            {showAddModal&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{background:'#fff',borderRadius:16,padding:32,width:'100%',maxWidth:640,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:'#111827'}}>{editingProduct?'Edit Product':'Add New Product'}</h2><button onClick={()=>{setShowAddModal(false);setEditingProduct(null);}} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',fontSize:20}}>x</button></div>
                <form onSubmit={handleSubmit}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                        {[['Product Name *','product_name','text'],['SKU','sku','text'],['Price','price','number'],['Offer Price','offer_price','number'],['Stock Quantity','stock_quantity','number'],['Min Stock Level','min_stock_level','number'],['Weight','weight','text'],['Dimensions','dimensions','text']].map(([label,key,type])=>(
                            <div key={key}><label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>{label}</label><input type={type} value={formData[key]} onChange={e=>setFormData({...formData,[key]:e.target.value})} style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:13,color:'#374151',outline:'none',boxSizing:'border-box'}}/></div>
                        ))}
                        <div><label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Category</label><select value={formData.category_id} onChange={e=>setFormData({...formData,category_id:e.target.value})} style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:13,color:'#374151',outline:'none'}}><option value=''>Select Category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Image URL</label><input type='text' value={formData.image_url} onChange={e=>setFormData({...formData,image_url:e.target.value})} style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:13,color:'#374151',outline:'none',boxSizing:'border-box'}}/></div>
                    </div>
                    <div style={{marginBottom:16}}><label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Description</label><textarea rows={3} value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:13,color:'#374151',outline:'none',resize:'vertical',boxSizing:'border-box'}}/></div>
                    <div style={{display:'flex',gap:16,marginBottom:16}}>
                        <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#374151',cursor:'pointer'}}><input type='checkbox' checked={formData.is_active} onChange={e=>setFormData({...formData,is_active:e.target.checked})}/>Active</label>
                        <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#374151',cursor:'pointer'}}><input type='checkbox' checked={formData.is_featured} onChange={e=>setFormData({...formData,is_featured:e.target.checked})}/>Featured</label>
                    </div>
                    <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}><button type='button' onClick={()=>{setShowAddModal(false);setEditingProduct(null);}} style={{padding:'10px 24px',borderRadius:10,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',color:'#374151'}}>Cancel</button><button type='submit' style={{padding:'10px 24px',borderRadius:10,border:'none',background:'#2563EB',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>{editingProduct?'Update':'Create Product'}</button></div>
                </form>
            </div></div>}
            {showBulkUploadModal&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{background:'#fff',borderRadius:16,padding:32,width:'100%',maxWidth:480,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:'#111827'}}>Bulk Upload</h2><button onClick={()=>setShowBulkUploadModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',fontSize:20}}>x</button></div>
                {uploadProgress?<div style={{textAlign:'center',padding:'20px 0'}}><div style={{fontSize:28,fontWeight:700,color:'#2563EB',marginBottom:8}}>{uploadProgress.processed_rows}/{uploadProgress.total_rows}</div><div style={{background:'#F3F4F6',borderRadius:8,height:8,overflow:'hidden'}}><div style={{height:'100%',background:'#2563EB',width:`${(uploadProgress.processed_rows/uploadProgress.total_rows)*100}%`}}/></div></div>:
                <form onSubmit={handleBulkUpload}><div style={{border:'2px dashed #E5E7EB',borderRadius:12,padding:24,textAlign:'center',marginBottom:20}}><div style={{fontSize:13,color:'#6B7280',marginBottom:12}}>Upload CSV file</div><input type='file' accept='.csv' onChange={e=>setBulkFile(e.target.files[0])} style={{fontSize:13}}/></div><div style={{display:'flex',gap:12,justifyContent:'flex-end'}}><button type='button' onClick={()=>setShowBulkUploadModal(false)} style={{padding:'10px 20px',borderRadius:10,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button><button type='submit' style={{padding:'10px 20px',borderRadius:10,border:'none',background:'#2563EB',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>Upload</button></div></form>}
            </div></div>}
            {showCategoryModal&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{background:'#fff',borderRadius:16,padding:32,width:'100%',maxWidth:560,maxHeight:'80vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:'#111827'}}>Manage Categories</h2><button onClick={()=>setShowCategoryModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',fontSize:20}}>x</button></div>
                <button onClick={()=>{resetCategoryForm();setShowCategoryModal(false);setShowAddCategoryModal(true);}} style={{marginBottom:16,padding:'9px 18px',borderRadius:10,border:'none',background:'#2563EB',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Add Category</button>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {categories.map(cat=><div key={cat.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderRadius:10,border:'1px solid #E5E7EB',background:'#F9FAFB'}}>
                        <div><div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{cat.name}</div><div style={{fontSize:12,color:'#9CA3AF'}}>{cat.description}</div></div>
                        <div style={{display:'flex',gap:8}}>
                            <button onClick={()=>handleEditCategory(cat)} style={{padding:'6px 12px',borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:12,cursor:'pointer',color:'#374151'}}>Edit</button>
                            <button onClick={()=>handleDeleteCategory(cat.id,cat.name)} style={{padding:'6px 12px',borderRadius:8,border:'none',background:'#FEF2F2',fontSize:12,cursor:'pointer',color:'#EF4444'}}>Delete</button>
                        </div>
                    </div>)}
                </div>
            </div></div>}
            {(showAddCategoryModal||showEditCategoryModal)&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{background:'#fff',borderRadius:16,padding:32,width:'100%',maxWidth:440,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:'#111827'}}>{showEditCategoryModal?'Edit Category':'Add Category'}</h2><button onClick={()=>{setShowAddCategoryModal(false);setShowEditCategoryModal(false);resetCategoryForm();}} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',fontSize:20}}>x</button></div>
                <form onSubmit={handleCategorySubmit}>
                    {[['Name *','name'],['Slug','slug'],['Description','description'],['Image URL','image_url']].map(([label,key])=>(
                        <div key={key} style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>{label}</label><input type='text' value={categoryFormData[key]} onChange={e=>setCategoryFormData({...categoryFormData,[key]:e.target.value})} style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:13,color:'#374151',outline:'none',boxSizing:'border-box'}}/></div>
                    ))}
                    <div style={{display:'flex',gap:12,justifyContent:'flex-end',marginTop:8}}><button type='button' onClick={()=>{setShowAddCategoryModal(false);setShowEditCategoryModal(false);resetCategoryForm();}} style={{padding:'10px 20px',borderRadius:10,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button><button type='submit' style={{padding:'10px 20px',borderRadius:10,border:'none',background:'#2563EB',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>{showEditCategoryModal?'Update':'Create'}</button></div>
                </form>
            </div></div>}
        </div>
    );
};

export default WebsiteProductsPage;
