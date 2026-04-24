'use client';

import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Package, Truck, AlertCircle, CheckCircle, Clock, Filter, Download } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function StoreTimeline() {
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState('');
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        if (selectedStore) {
            fetchTimeline();
        }
    }, [selectedStore, filterType]);

    const fetchStores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/warehouse-management/stores`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setStores(data.stores);
                if (data.stores.length > 0) {
                    setSelectedStore(data.stores[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
        }
    };

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/timeline?entityType=store&entityId=${selectedStore}&type=${filterType}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setTimeline(data.timeline);
            }
        } catch (error) {
            console.error('Error fetching timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEventIcon = (eventType) => {
        const iconMap = {
            'TRANSFER_IN': <ArrowDown size={16} color="#22C55E" />,
            'TRANSFER_OUT': <ArrowUp size={16} color="#EF4444" />,
            'INITIAL_STOCK': <Package size={16} color="#3B82F6" />,
            'IN_TRANSIT': <Truck size={16} color="#F59E0B" />,
            'RECEIVED': <CheckCircle size={16} color="#22C55E" />,
            'DAMAGED': <AlertCircle size={16} color="#EF4444" />
        };
        return iconMap[eventType] || <Clock size={16} color="#6B7280" />;
    };

    const getEventColor = (eventType) => {
        const colorMap = {
            'TRANSFER_IN': '#DCFCE7',
            'TRANSFER_OUT': '#FEE2E2',
            'INITIAL_STOCK': '#DBEAFE',
            'IN_TRANSIT': '#FEF3C7',
            'RECEIVED': '#DCFCE7',
            'DAMAGED': '#FEE2E2'
        };
        return colorMap[eventType] || '#F3F4F6';
    };

    const getEventLabel = (eventType) => {
        const labelMap = {
            'TRANSFER_IN': 'Stock Received',
            'TRANSFER_OUT': 'Stock Transferred',
            'INITIAL_STOCK': 'Initial Stock',
            'IN_TRANSIT': 'In Transit',
            'RECEIVED': 'Received',
            'DAMAGED': 'Damaged'
        };
        return labelMap[eventType] || eventType;
    };

    const selectedStoreData = stores.find(s => s.id === parseInt(selectedStore));

    return (
        <div style={{ 
            height: '100vh', 
            maxHeight: '800px',
            background: '#F5F7FA', 
            fontFamily: 'Inter,sans-serif', 
            padding: '0', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '20px 24px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>Store Timeline</h1>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6B7280' }}>Track all inventory movements and events</p>
                    </div>
                    <button
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F3F4F6', color: '#6B7280', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit' }}
                    >
                        <Download size={16} /> Export
                    </button>
                </div>

                {/* Store Selector */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>Select Store:</label>
                    <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', minWidth: '200px' }}
                    >
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.store_name} ({store.store_code})</option>
                        ))}
                    </select>

                    {/* Filter */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                    >
                        <option value="all">All Events</option>
                        <option value="TRANSFER_IN">Incoming</option>
                        <option value="TRANSFER_OUT">Outgoing</option>
                        <option value="INITIAL_STOCK">Initial Stock</option>
                    </select>
                </div>
            </div>

            {/* Store Info Card */}
            {selectedStoreData && (
                <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', flexShrink: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', marginBottom: '4px' }}>STORE NAME</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{selectedStoreData.store_name}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', marginBottom: '4px' }}>LOCATION</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{selectedStoreData.city}, {selectedStoreData.state}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', marginBottom: '4px' }}>MANAGER</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{selectedStoreData.manager_name || 'N/A'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', marginBottom: '4px' }}>TYPE</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>{selectedStoreData.store_type}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', paddingTop: '40px', color: '#9CA3AF' }}>Loading timeline...</div>
                ) : timeline.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: '40px', color: '#9CA3AF' }}>No events found</div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        {/* Timeline Line */}
                        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: '#E5E7EB' }} />

                        {/* Timeline Events */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {timeline.map((event, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                    {/* Timeline Dot */}
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        background: getEventColor(event.eventType),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        border: '2px solid #fff',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        {getEventIcon(event.eventType)}
                                    </div>

                                    {/* Event Card */}
                                    <div style={{
                                        flex: 1,
                                        background: '#fff',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        border: '1px solid #E5E7EB',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                                                    {getEventLabel(event.eventType)}
                                                </h3>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                                                    {event.source && `From: ${event.source}`}
                                                    {event.destination && ` → To: ${event.destination}`}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                                                    {event.quantity > 0 ? '+' : ''}{event.quantity} {event.unit || 'pcs'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                                                    {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stock Before/After */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>Before</div>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>{event.stockBefore} units</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>After</div>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{event.stockAfter} units</div>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {event.notes && (
                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                                                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>"{event.notes}"</p>
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                background: event.status === 'COMPLETED' ? '#DCFCE7' : '#FEF3C7',
                                                color: event.status === 'COMPLETED' ? '#166534' : '#92400E'
                                            }}>
                                                {event.status || 'COMPLETED'}
                                            </span>
                                            {event.isInitialTransfer && (
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    background: '#DBEAFE',
                                                    color: '#1E40AF'
                                                }}>
                                                    Initial Stock Received
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
