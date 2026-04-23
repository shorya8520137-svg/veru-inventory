'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function SelfTransferModule() {
    const [transferType, setTransferType] = useState('warehouse-to-warehouse');
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [dataLoading, setDataLoading] = useState(false);

    const [formData, setFormData] = useState({
        sourceType: 'warehouse',
        sourceId: '',
        destinationType: 'warehouse',
        destinationId: '',
        items: [{ productId: '', availableQty: 0, transferQty: 0, unit: 'pcs' }],
        requiresShipment: true,
        courierPartner: '',
        trackingId: '',
        estimatedDelivery: '',
        notes: '',
        transferDate: new Date().toISOString().split('T')[0]
    });

    const [sourceOptions, setSourceOptions] = useState([]);
    const [destinationOptions, setDestinationOptions] = useState([]);
    const [products, setProducts] = useState([]);

    // Fetch suggestions when transfer type changes
    useEffect(() => {
        fetchSuggestions();
    }, [transferType]);

    const fetchSuggestions = async () => {
        setDataLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            // Fetch suggestions based on transfer type
            const res = await fetch(`${API_BASE}/api/transfer-suggestions/${transferType}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                setSourceOptions(data.sources || []);
                setDestinationOptions(data.destinations || []);
                
                // Update form data with new types
                setFormData(prev => ({
                    ...prev,
                    sourceType: data.sourceType,
                    destinationType: data.destinationType,
                    sourceId: '',
                    destinationId: ''
                }));
            }

            // Fetch products
            const prRes = await fetch(`${API_BASE}/api/products?limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const prData = await prRes.json();
            if (prData.success) setProducts(prData.data.products || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage('Error loading data');
        } finally {
            setDataLoading(false);
        }
    };

    const handleTransferTypeChange = (type) => {
        setTransferType(type);
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { productId: '', availableQty: 0, transferQty: 0, unit: 'pcs' }]
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            
            // Validate
            if (!formData.sourceId || !formData.destinationId) {
                setMessage('Please select source and destination');
                setLoading(false);
                return;
            }

            if (formData.sourceId === formData.destinationId) {
                setMessage('Source and destination cannot be the same');
                setLoading(false);
                return;
            }

            if (formData.items.some(item => !item.productId || item.transferQty <= 0)) {
                setMessage('Please fill all items with valid quantities');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE}/api/self-transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                setMessage('Transfer initiated successfully!');
                setShowForm(false);
                resetForm();
            } else {
                setMessage(data.message || 'Failed to create transfer');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('Error creating transfer');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            sourceType: 'warehouse',
            sourceId: '',
            destinationType: 'warehouse',
            destinationId: '',
            items: [{ productId: '', availableQty: 0, transferQty: 0, unit: 'pcs' }],
            requiresShipment: true,
            courierPartner: '',
            trackingId: '',
            estimatedDelivery: '',
            notes: '',
            transferDate: new Date().toISOString().split('T')[0]
        });
    };

    const getSourceLabel = () => {
        const map = {
            'warehouse-to-warehouse': 'Source Warehouse',
            'warehouse-to-store': 'Source Warehouse',
            'store-to-warehouse': 'Source Store',
            'store-to-store': 'Source Store'
        };
        return map[transferType];
    };

    const getDestinationLabel = () => {
        const map = {
            'warehouse-to-warehouse': 'Destination Warehouse',
            'warehouse-to-store': 'Destination Store',
            'store-to-warehouse': 'Destination Warehouse',
            'store-to-store': 'Destination Store'
        };
        return map[transferType];
    };

    const getSourceName = (item) => {
        if (formData.sourceType === 'warehouse') {
            return `${item.warehouse_name} (${item.warehouse_code})`;
        }
        return `${item.store_name} (${item.store_code})`;
    };

    const getDestinationName = (item) => {
        if (formData.destinationType === 'warehouse') {
            return `${item.warehouse_name} (${item.warehouse_code})`;
        }
        return `${item.store_name} (${item.store_code})`;
    };

    return (
        <div style={{ height: '100%', background: '#F5F7FA', fontFamily: 'Inter,sans-serif', padding: '0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '20px 24px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>Inventory Transfer</h1>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6B7280' }}>Move stock across warehouses and stores with full traceability</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#3B82F6', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit' }}
                    >
                        <Plus size={16} /> Create Transfer
                    </button>
                </div>

                {/* Transfer Type Selector */}
                <div style={{ display: 'flex', gap: '8px', background: '#F3F4F6', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                    {[
                        { id: 'warehouse-to-warehouse', label: 'Warehouse → Warehouse' },
                        { id: 'warehouse-to-store', label: 'Warehouse → Store' },
                        { id: 'store-to-warehouse', label: 'Store → Warehouse' },
                        { id: 'store-to-store', label: 'Store → Store' }
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => handleTransferTypeChange(type.id)}
                            style={{
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: transferType === type.id ? '#fff' : 'transparent',
                                color: transferType === type.id ? '#111827' : '#6B7280',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: transferType === type.id ? '600' : '500',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s'
                            }}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Message */}
            {message && (
                <div style={{ padding: '12px 24px', background: message.includes('success') ? '#DCFCE7' : '#FEE2E2', color: message.includes('success') ? '#166534' : '#991B1B', fontSize: '13px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
                    {message}
                </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {showForm ? (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>New Transfer</h2>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#9CA3AF' }}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Source & Destination */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>{getSourceLabel()} *</label>
                                    <select
                                        value={formData.sourceId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sourceId: e.target.value }))}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                                        required
                                        disabled={dataLoading}
                                    >
                                        <option value="">Select {getSourceLabel()}</option>
                                        {sourceOptions.map(opt => (
                                            <option key={opt.id} value={opt.id}>{getSourceName(opt)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>{getDestinationLabel()} *</label>
                                    <select
                                        value={formData.destinationId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, destinationId: e.target.value }))}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                                        required
                                        disabled={dataLoading}
                                    >
                                        <option value="">Select {getDestinationLabel()}</option>
                                        {destinationOptions.map(opt => (
                                            <option key={opt.id} value={opt.id}>{getDestinationName(opt)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Items *</label>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit' }}
                                    >
                                        + Add Item
                                    </button>
                                </div>

                                <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead>
                                            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6B7280' }}>Product</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6B7280' }}>Available</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6B7280' }}>Transfer Qty</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6B7280' }}>Unit</th>
                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#6B7280' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.items.map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <select
                                                            value={item.productId}
                                                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                                                            style={{ width: '100%', padding: '6px', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
                                                            required
                                                        >
                                                            <option value="">Select Product</option>
                                                            {products.map(p => (
                                                                <option key={p.p_id} value={p.p_id}>{p.product_name} ({p.barcode})</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '12px', color: '#6B7280' }}>0</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <input
                                                            type="number"
                                                            value={item.transferQty}
                                                            onChange={(e) => handleItemChange(idx, 'transferQty', parseInt(e.target.value) || 0)}
                                                            style={{ width: '80px', padding: '6px', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
                                                            min="1"
                                                            required
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <select
                                                            value={item.unit}
                                                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                                            style={{ width: '70px', padding: '6px', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
                                                        >
                                                            <option value="pcs">pcs</option>
                                                            <option value="box">box</option>
                                                            <option value="kg">kg</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(idx)}
                                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Shipment Section */}
                            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.requiresShipment}
                                        onChange={(e) => setFormData(prev => ({ ...prev, requiresShipment: e.target.checked }))}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#111827', cursor: 'pointer' }}>Requires Shipment</label>
                                </div>

                                {formData.requiresShipment && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>Courier Partner</label>
                                            <select
                                                value={formData.courierPartner}
                                                onChange={(e) => setFormData(prev => ({ ...prev, courierPartner: e.target.value }))}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
                                            >
                                                <option value="">Select Courier</option>
                                                <option value="fedex">FedEx</option>
                                                <option value="dhl">DHL</option>
                                                <option value="ups">UPS</option>
                                                <option value="local">Local Courier</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>Estimated Delivery</label>
                                            <input
                                                type="date"
                                                value={formData.estimatedDelivery}
                                                onChange={(e) => setFormData(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>Notes / Remarks</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Add any notes about this transfer..."
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'none' }}
                                    rows="3"
                                />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    style={{ padding: '10px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#fff', color: '#6B7280', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || dataLoading}
                                    style={{ padding: '10px 16px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', opacity: loading || dataLoading ? 0.5 : 1 }}
                                >
                                    {loading ? 'Creating...' : 'Initiate Transfer'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', paddingTop: '60px', color: '#9CA3AF' }}>
                        <p style={{ fontSize: '14px' }}>No transfers yet. Click "Create Transfer" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
