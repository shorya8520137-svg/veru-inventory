"use client";

import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { productsAPI } from '@/services/api/products';

export default function ProductUpload({ onClose }) {
    const [importProgress, setImportProgress] = useState(null);
    const [currentImportItem, setCurrentImportItem] = useState(null);
    const [notification, setNotification] = useState(null);
    const [categories, setCategories] = useState([]);

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/products/categories/all`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (e) {
            console.error('Error fetching categories:', e);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleBulkImport = async (e) => {
        e.preventDefault();
        const file = e.target.file.files[0];
        if (!file) { 
            showNotification('Please select a file', 'error'); 
            return; 
        }
        
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!['.csv', '.xlsx', '.xls'].includes(ext)) { 
            showNotification('Please select a CSV or Excel file', 'error'); 
            return; 
        }
        
        setImportProgress(null); 
        setCurrentImportItem(null);
        
        try {
            showNotification('Starting import...', 'success');
            const result = await productsAPI.bulkImportWithProgress(file, (p) => {
                if (p.type === 'start') {
                    setImportProgress({ 
                        total: p.total, 
                        current: 0, 
                        percentage: 0, 
                        message: p.message 
                    });
                } else if (p.type === 'progress') { 
                    setImportProgress({ 
                        total: p.total, 
                        current: p.current, 
                        percentage: p.percentage, 
                        message: p.message 
                    }); 
                    setCurrentImportItem({ 
                        product_name: p.product_name, 
                        barcode: p.barcode 
                    }); 
                } else if (p.type === 'complete') { 
                    setImportProgress(null); 
                    setCurrentImportItem(null); 
                }
            });
            
            if (result.success) { 
                showNotification(result.message || `Import complete! ${result.count || 0} products imported.`);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                showNotification(result.message || 'Import failed', 'error');
            }
        } catch (e) { 
            showNotification('Network error during import.', 'error'); 
            setImportProgress(null); 
            setCurrentImportItem(null); 
        }
    };

    const downloadTemplate = async () => {
        try {
            // Fetch categories first
            const token = localStorage.getItem('token');
            let categoriesList = [];
            
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/products/categories/all`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                if (data.success) {
                    categoriesList = data.data;
                }
            } catch (e) {
                console.error('Error fetching categories:', e);
            }

            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();
            
            // Sheet 1: Product Template
            const productTemplate = [{ 
                product_name: 'Sample Product', 
                product_variant: 'Default', 
                barcode: '1234567890123', 
                description: 'Product description', 
                category_name: 'Electronics', 
                price: '99.99', 
                cost_price: '50.00', 
                weight: '1.5', 
                dimensions: '10x10x10' 
            }];
            const ws1 = XLSX.utils.json_to_sheet(productTemplate);
            XLSX.utils.book_append_sheet(wb, ws1, 'Product Template');
            
            // Sheet 2: Available Categories (Reference)
            if (categoriesList.length > 0) {
                const categoriesData = categoriesList.map(cat => ({
                    'Category Name': cat.name,
                    'Display Name': cat.display_name,
                    'Description': cat.description || ''
                }));
                const ws2 = XLSX.utils.json_to_sheet(categoriesData);
                XLSX.utils.book_append_sheet(wb, ws2, 'Available Categories');
            } else {
                // If no categories, add a note
                const ws2 = XLSX.utils.json_to_sheet([{
                    'Note': 'No categories found. Products will be uncategorized.',
                    'Info': 'Go to Products page to create categories first'
                }]);
                XLSX.utils.book_append_sheet(wb, ws2, 'Available Categories');
            }
            
            // Sheet 3: Instructions
            const instructions = [
                { 'Step': '1', 'Instruction': 'Fill in the Product Template sheet with your product data' },
                { 'Step': '2', 'Instruction': 'Use category_name from the Available Categories sheet' },
                { 'Step': '3', 'Instruction': 'Category names are case-insensitive (electronics = Electronics)' },
                { 'Step': '4', 'Instruction': 'All fields are optional except product_name and barcode' },
                { 'Step': '5', 'Instruction': 'If category_name is empty or not found, product will be uncategorized' }
            ];
            const ws3 = XLSX.utils.json_to_sheet(instructions);
            XLSX.utils.book_append_sheet(wb, ws3, 'Instructions');
            
            XLSX.writeFile(wb, 'products_template_with_categories.xlsx');
            showNotification('Template downloaded with category reference!');
        } catch (error) { 
            console.error('Error creating template:', error);
            // Fallback to simple CSV
            const csvContent = 'product_name,product_variant,barcode,description,category_name,price,cost_price,weight,dimensions\nSample Product,Default,1234567890123,Product description,Electronics,99.99,50.00,1.5,10x10x10';
            const a = document.createElement('a'); 
            a.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' })); 
            a.download = 'products_template.csv'; 
            a.click(); 
            showNotification('CSV template downloaded! Note: Check Products page for category names'); 
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Notification */}
                {notification && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: notification.type === 'success' ? '#dcfce7' : '#fef2f2',
                        color: notification.type === 'success' ? '#166534' : '#dc2626',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                        zIndex: 1001,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {notification.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        <span style={{ fontSize: '14px' }}>{notification.message}</span>
                    </div>
                )}

                {/* Header */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '24px',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <FileSpreadsheet size={24} color="#0f172a" />
                        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#0f172a' }}>
                            Product Upload
                        </h2>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                        Import products in bulk using CSV or Excel files
                    </p>
                    {!importProgress && (
                        <button 
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: '#f1f5f9',
                                border: 'none',
                                color: '#64748b',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#e2e8f0';
                                e.target.style.color = '#0f172a';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#f1f5f9';
                                e.target.style.color = '#64748b';
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {importProgress ? (
                        // Progress View
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ 
                                fontSize: '32px', 
                                fontWeight: '700', 
                                color: '#8b5cf6', 
                                marginBottom: '8px' 
                            }}>
                                {importProgress.current}/{importProgress.total}
                            </div>
                            <div style={{ 
                                background: '#f3f4f6', 
                                borderRadius: '8px', 
                                height: '8px', 
                                marginBottom: '12px', 
                                overflow: 'hidden' 
                            }}>
                                <div style={{ 
                                    height: '100%', 
                                    background: '#8b5cf6', 
                                    borderRadius: '8px', 
                                    width: `${importProgress.percentage}%`, 
                                    transition: 'width 0.3s' 
                                }} />
                            </div>
                            {currentImportItem && (
                                <div style={{ 
                                    fontSize: '13px', 
                                    color: '#6b7280',
                                    marginBottom: '8px'
                                }}>
                                    Processing: {currentImportItem.product_name}
                                </div>
                            )}
                            <div style={{ 
                                fontSize: '12px', 
                                color: '#9ca3af' 
                            }}>
                                {importProgress.message}
                            </div>
                        </div>
                    ) : (
                        // Upload Form
                        <form onSubmit={handleBulkImport}>
                            {/* Template Download */}
                            <div style={{ 
                                backgroundColor: '#f8fafc', 
                                padding: '16px', 
                                borderRadius: '12px', 
                                marginBottom: '20px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    marginBottom: categories.length > 0 ? '12px' : '0'
                                }}>
                                    <div>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '600', 
                                            color: '#0f172a',
                                            marginBottom: '4px'
                                        }}>
                                            Need a template?
                                        </div>
                                        <div style={{ 
                                            fontSize: '12px', 
                                            color: '#64748b' 
                                        }}>
                                            Download template with category reference
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={downloadTemplate}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 12px',
                                            backgroundColor: '#0f172a',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1e293b'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#0f172a'}
                                    >
                                        <Download size={14} />
                                        Download
                                    </button>
                                </div>

                                {/* Category Reference - Read Only */}
                                {categories.length > 0 && (
                                    <div style={{
                                        marginTop: '12px',
                                        paddingTop: '12px',
                                        borderTop: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#0f172a',
                                            marginBottom: '8px'
                                        }}>
                                            Available Categories (use these names in your CSV):
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '6px'
                                        }}>
                                            {categories.map(cat => (
                                                <div
                                                    key={cat.id}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 10px',
                                                        backgroundColor: '#f8fafc',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        color: '#0f172a'
                                                    }}
                                                >
                                                    {cat.name}
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: '#9ca3af',
                                            marginTop: '8px'
                                        }}>
                                            💡 Tip: Category names are case-insensitive (electronics = Electronics)
                                        </div>
                                    </div>
                                )}

                                {categories.length === 0 && (
                                    <div style={{
                                        marginTop: '12px',
                                        paddingTop: '12px',
                                        borderTop: '1px solid #e2e8f0',
                                        fontSize: '11px',
                                        color: '#f59e0b',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '6px'
                                    }}>
                                        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                                No categories found
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                                                Products will be uploaded without categories. Create categories from the Products page first.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* File Upload Area */}
                            <div style={{ 
                                border: '2px dashed #e5e7eb', 
                                borderRadius: '12px', 
                                padding: '32px 24px', 
                                textAlign: 'center', 
                                marginBottom: '20px',
                                transition: 'border-color 0.2s'
                            }}>
                                <FileSpreadsheet size={32} color="#9ca3af" style={{ marginBottom: '12px' }} />
                                <div style={{ 
                                    fontSize: '14px', 
                                    color: '#6b7280', 
                                    marginBottom: '12px',
                                    fontWeight: '500'
                                }}>
                                    Upload CSV or Excel file
                                </div>
                                <input 
                                    type="file" 
                                    name="file" 
                                    accept=".csv,.xlsx,.xls" 
                                    style={{ 
                                        fontSize: '13px', 
                                        color: '#374151',
                                        marginBottom: '12px',
                                        width: '100%'
                                    }} 
                                    required 
                                />
                                <div style={{ 
                                    fontSize: '11px', 
                                    color: '#9ca3af' 
                                }}>
                                    Supported formats: CSV, XLSX, XLS
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#0f172a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#1e293b'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#0f172a'}
                            >
                                <Upload size={16} />
                                Start Import
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}