'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function SelfTransferModule() {
    const [transferType, setTransferType] = useState('warehouse-to-warehouse');
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        sourceId: '',
        destinationId: '',
        items: [{ productId: '', availableQty: 0, transferQty: 0, unit: 'pcs' }],
        requiresShipment: true,
        courierPartner: '',
        estimatedDelivery: '',
        notes: '',
        transferDate: new Date().toISOString().split('T')[0]
    });

    const [sourceOptions, setSourceOptions] = useState([]);
    const [destinationOptions, setDestinationOptions] = useState([]);
    const [products, setProducts] = useState([]);

    // Fetch data when transfer type changes
    useEffect(() => {
        fetchData();
    }, [transferType]);

    const fetchData = async () => {
        setDataLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setMessage('No authentication token found');
                setDataLoading(false);
                return;
            }

            console.log('Fetching suggestions for:', transferType);
            
            // Fetch suggestions based on transfer type
            const res = await fetch(`${API_BASE}/api/transfer-suggestions/${transferType}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('Response status:', res.status);
            const data = await res.json();
            console.log('Suggestions data:', data);
            
            if (data.success) {
                setSourceOptions(data.sources || []);
                setDestinationOptions(data.destinations || []);
                console.log('Sources:', data.sources?.length, 'Destinations:', data.destinations?.length);
            } else {
                console.error('API error:', data.message);
                setMessage('Error loading suggestions: ' + data.message);
            }

            // Fetch products
            const prRes = await fetch(`${API_BASE}/api/products?limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const prData = await prRes.json();
            if (prData.success) {
                setProducts(prData.data?.products || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage('Error loading data: ' + error.message);
        } finally {
            setDataLoading(false);
        }
    };

    const handleTransferTypeChange = (type) => {
        setTransferType(type);
        setFormData(prev => ({
            ...prev,
            sourceId: '',
            destinationId: ''
        }));
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

            const submitData = {
                sourceType: transferType.split('-')[0],
                sourceId: parseInt(formData.sourceId),
                destinationType: transferType.split('-')[2],
                destinationId: parseInt(formData.destinationId),
                items: formData.items,
                requiresShipment: formData.requiresShipment,
                courierPartner: formData.courierPartner,
                estimatedDelivery: formData.estimatedDelivery,
                notes: formData.notes,
                transferDate: formData.transferDate
            };

            const response = await fetch(`${API_BASE}/api/self-transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();
            if (data.success) {
                setMessage('✅ Transfer initiated successfully!');
                setShowForm(false);
                resetForm();
            } else {
                setMessage('❌ ' + (data.message || 'Failed to create transfer'));
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('❌ Error creating transfer: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            sourceId: '',
            destinationId: '',
            items: [{ productId: '', availableQty: 0, transferQty: 0, unit: 'pcs' }],
            requiresShipment: true,
            courierPartner: '',
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
        if (item.warehouse_code) {
            return `${item.warehouse_name} (${item.warehouse_code})`;
        }
        return `${item.store_name} (${item.store_code})`;
    };

    const getDestinationName = (item) => {
        if (item.warehouse_code) {
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
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6B7280' }}>Move stock across warehouses and stores</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#3B82F6', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit' }}
                    >
                        <Plus size={16} /> Create Transfer
                    </button>
                </div>

                {/* Transfer Type Selector */}
                <div style={{ display: 'flex', gap: '8px', background: '#F3F4F6', padding: '4px', borderRadius: '8px', width: 'fit-content', flexWrap: 'wrap' }}>
                    {[
                        { id: 'warehouse-to-warehouse', label: 'W→W' },
                        { id: 'warehouse-to-store', label: 'W→S' },
                        { id: 'store-to-warehouse', label: 'S→W' },
                        { id: 'store-to-store', label: 'S→S' }
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
                <div style={{ padding: '12px 24px', background: message.includes('✅') ? '#DCFCE7' : '#FEE2E2', color: message.includes('✅') ? '#166534' : '#991B1B', fontSize: '13px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
                    {message}
                </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {showForm ? (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>New Transfer - {transferType}</h2>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#9CA3AF' }}>×</button>
                        </div>

                        {dataLoading && (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
                                Loading options...
                            </div>
                        )}

                        {!dataLoading && (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Source & Destination */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'flex-end' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>{getSourceLabel()} *</label>
                                        <select
                                            value={formData.sourceId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, sourceId: e.target.value }))}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                                            required
                                        >
                                            <option value="">Select {getSourceLabel()}</option>
                                            {sourceOptions.length > 0 ? (
                                                sourceOptions.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{getSourceName(opt)}</option>
                                                ))
                                            ) : (
                                                <option disabled>No options available</option>
                                            )}
                                        </select>
                                    </div>

                                    {/* Swap Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                sourceId: prev.destinationId,
                                                destinationId: prev.sourceId
                                            }));
                                        }}
                                        style={{
                                            padding: '10px 12px',
                                            background: '#F3F4F6',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#6B7280',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: '44px',
                                            height: '40px'
                                        }}
                                        title="Swap source and destination"
                                    >
                                        ⇄
                                    </button>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>{getDestinationLabel()} *</label>
                                        <select
                                            value={formData.destinationId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, destinationId: e.target.value }))}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                                            required
                                        >
                                            <option value="">Select {getDestinationLabel()}</option>
                                            {destinationOptions.length > 0 ? (
                                                destinationOptions.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{getDestinationName(opt)}</option>
                                                ))
                                            ) : (
                                                <option disabled>No options available</option>
                                            )}
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
                                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6B7280' }}>Qty</th>
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
                                                                    <option key={p.p_id} value={p.p_id}>{p.product_name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
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
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>Courier</label>
                                                <select
                                                    value={formData.courierPartner}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, courierPartner: e.target.value }))}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
                                                >
                                                    <option value="">Select Courier</option>
                                                    <option value="fedex">FedEx</option>
                                                    <option value="dhl">DHL</option>
                                                    <option value="ups">UPS</option>
                                                    <option value="local">Local</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>Delivery Date</label>
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
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Add notes..."
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
                                        disabled={loading}
                                        style={{ padding: '10px 16px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', opacity: loading ? 0.5 : 1 }}
                                    >
                                        {loading ? 'Creating...' : 'Initiate Transfer'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', paddingTop: '60px', color: '#9CA3AF' }}>
                        <p style={{ fontSize: '14px' }}>Click "Create Transfer" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
