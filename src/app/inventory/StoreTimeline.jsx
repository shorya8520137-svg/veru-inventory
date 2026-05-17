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

    // Download invoice function for self transfers using pdfMake
    const downloadInvoice = async (event) => {
        try {
            const selectedStoreData = stores.find(s => s.id === parseInt(selectedStore));
            const referenceMatch = event.notes?.match(/Reference: (.+)/);
            const transferReference = referenceMatch ? referenceMatch[1] : `TRF_${Date.now()}`;
            
            // Generate professional PDF invoice
            await generateProfessionalInvoice(event, selectedStoreData, transferReference);
        } catch (error) {
            console.error('Error generating invoice:', error);
            alert('Failed to generate invoice. Please try again.');
        }
    };

    // Generate professional invoice using pdfMake with dynamic import
    const generateProfessionalInvoice = async (event, storeData, transferReference) => {
        try {
            // Dynamic import to avoid SSR issues
            const pdfMakeModule = await import('pdfmake/build/pdfmake');
            const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
            
            const pdfMake = pdfMakeModule.default || pdfMakeModule;
            const pdfFonts = pdfFontsModule.default || pdfFontsModule;
            
            // Initialize fonts
            if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
                pdfMake.vfs = pdfFonts.pdfMake.vfs;
            }
            
            const invoiceDate = new Date(event.timestamp);
            const invoiceId = `INS-TRF-${invoiceDate.getFullYear()}-${transferReference.split('_')[1] || '001'}`;
            
            // Determine source and destination
            const isOutgoing = event.direction === 'OUT';
            
            // Use source_location and destination_location from timeline data
            const fromLocation = isOutgoing 
                ? (storeData?.store_name || event.source_location || 'Store') 
                : (event.source_location || 'Warehouse');
            
            const toLocation = isOutgoing 
                ? (event.destination_location || 'Warehouse') 
                : (storeData?.store_name || event.destination_location || 'Store');
            
            // Extract city/state from location codes (e.g., "GGM_WH" -> "Gurugram, Haryana")
            const getLocationDetails = (locationCode) => {
                if (!locationCode) return 'N/A';
                
                // Map of warehouse/store codes to locations
                const locationMap = {
                    'GGM_WH': 'Gurugram, Haryana',
                    'GGM_NH48': 'Gurugram, Haryana',
                    'DEL_MOTI_NAGAR': 'Delhi',
                    'BLR_WH': 'Bangalore, Karnataka',
                    'MUM_WH': 'Mumbai, Maharashtra',
                    'AMD_WH': 'Ahmedabad, Gujarat',
                    'HYD_WH': 'Hyderabad, Telangana',
                    'Bhiwandi_Lonad_GW': 'Bhiwandi, Maharashtra'
                };
                
                return locationMap[locationCode] || locationCode;
            };
            
            const fromCity = isOutgoing 
                ? (storeData?.city ? `${storeData.city}, ${storeData.state || ''}` : getLocationDetails(event.source_location))
                : getLocationDetails(event.source_location);
            
            const toCity = isOutgoing 
                ? getLocationDetails(event.destination_location)
                : (storeData?.city ? `${storeData.city}, ${storeData.state || ''}` : getLocationDetails(event.destination_location));
            
            // Calculate totals (using dummy price for now - should come from API)
            const quantity = Math.abs(event.quantity);
            const unitPrice = 500; // This should come from product data
            const totalPrice = quantity * unitPrice;
            
            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
                content: [
                    // ðŸ”¥ HEADER WITH LOGO
                    {
                        columns: [
                            {
                                stack: [
                                    {
                                        columns: [
                                            {
                                                stack: [
                                                    { text: '.in', fontSize: 32, bold: true, color: '#000000', margin: [0, 0, 5, 0] },
                                                    { text: 'INVENTORY', fontSize: 7, color: '#808080', margin: [0, 5, 0, 0] },
                                                    { text: 'INSIGHTS', fontSize: 7, color: '#808080' },
                                                    { text: 'IMPACT', fontSize: 7, color: '#808080' }
                                                ],
                                                width: 'auto'
                                            },
                                            {
                                                canvas: [
                                                    {
                                                        type: 'line',
                                                        x1: 0,
                                                        y1: 0,
                                                        x2: 0,
                                                        y2: 50,
                                                        lineWidth: 2,
                                                        lineColor: '#CCCCCC'
                                                    }
                                                ],
                                                width: 20,
                                                margin: [5, 0, 5, 0]
                                            },
                                            {
                                                stack: [
                                                    { text: 'Insora', fontSize: 32, bold: true, color: '#000000', margin: [0, 0, 0, 5] },
                                                    { text: 'EST.2024', fontSize: 8, bold: true, color: '#000000', margin: [0, 5, 0, 0] },
                                                    { text: 'LOCATED IN', fontSize: 7, color: '#808080' },
                                                    { text: 'DELHI', fontSize: 7, color: '#808080' }
                                                ],
                                                width: 'auto'
                                            }
                                        ]
                                    }
                                ],
                                width: 250
                            },
                            {
                                alignment: 'right',
                                stack: [
                                    { text: 'INTERNAL TRANSFER INVOICE', fontSize: 16, bold: true, color: '#000000' },
                                    { text: '\n' },
                                    { text: `Invoice ID    : ${invoiceId}`, fontSize: 10 },
                                    { text: `Date          : ${invoiceDate.toLocaleDateString('en-GB')}`, fontSize: 10 },
                                    { text: `Document Type : Self Transfer (Dispatch)`, fontSize: 10 }
                                ]
                            }
                        ],
                        margin: [0, 0, 0, 20]
                    },
                    
                    // Horizontal line
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#CCCCCC' }], margin: [0, 10, 0, 20] },
                    
                    // ðŸ”¹ FROM â†’ TO
                    {
                        columns: [
                            {
                                stack: [
                                    { text: 'FROM (STORE)', fontSize: 12, bold: true, color: '#000000', margin: [0, 0, 0, 10] },
                                    { text: `Store Name : ${fromLocation}`, fontSize: 10 },
                                    { text: `Location   : ${fromCity}`, fontSize: 10 }
                                ],
                                width: '48%'
                            },
                            {
                                alignment: 'right',
                                stack: [
                                    { text: 'TO (WAREHOUSE)', fontSize: 12, bold: true, color: '#000000', margin: [0, 0, 0, 10] },
                                    { text: `Warehouse Name : ${toLocation}`, fontSize: 10 },
                                    { text: `Location       : ${toCity}`, fontSize: 10 }
                                ],
                                width: '48%'
                            }
                        ],
                        margin: [0, 0, 0, 30]
                    },
                    
                    // ðŸ”¥ TABLE
                    {
                        table: {
                            headerRows: 1,
                            widths: [30, '*', 100, 80, 80, 100],
                            body: [
                                [
                                    { text: '#', style: 'tableHeader', alignment: 'center' },
                                    { text: 'Product', style: 'tableHeader' },
                                    { text: 'SKU', style: 'tableHeader' },
                                    { text: 'Quantity\n(Units)', style: 'tableHeader', alignment: 'center' },
                                    { text: 'Unit Price\n(INR)', style: 'tableHeader', alignment: 'right' },
                                    { text: 'Total Price\n(INR)', style: 'tableHeader', alignment: 'right' }
                                ],
                                [
                                    { text: '1', alignment: 'center' },
                                    { text: event.productName || 'Product', fontSize: 10 },
                                    { text: event.productBarcode || 'N/A', fontSize: 10 },
                                    { text: quantity.toString(), alignment: 'center', fontSize: 10 },
                                    { text: `â‚¹${unitPrice.toLocaleString('en-IN')}`, alignment: 'right', fontSize: 10 },
                                    { text: `â‚¹${totalPrice.toLocaleString('en-IN')}`, alignment: 'right', fontSize: 10, bold: true }
                                ]
                            ]
                        },
                        layout: {
                            fillColor: function (rowIndex) {
                                return rowIndex === 0 ? '#F3F4F6' : null;
                            },
                            hLineWidth: function (i, node) {
                                return 1;
                            },
                            vLineWidth: function (i) {
                                return 1;
                            },
                            hLineColor: function () {
                                return '#E5E7EB';
                            },
                            vLineColor: function () {
                                return '#E5E7EB';
                            }
                        },
                        margin: [0, 0, 0, 10]
                    },
                    
                    // Total Summary
                    {
                        columns: [
                            { text: '', width: '*' },
                            {
                                stack: [
                                    {
                                        table: {
                                            widths: [120, 100],
                                            body: [
                                                [
                                                    { text: 'TOTAL QUANTITY', bold: true, fontSize: 10, border: [false, false, false, false] },
                                                    { text: `${quantity} Units`, alignment: 'right', fontSize: 10, border: [false, false, false, false] }
                                                ],
                                                [
                                                    { text: 'TOTAL AMOUNT', bold: true, fontSize: 12, border: [false, true, false, false], borderColor: ['', '#000000', '', ''] },
                                                    { text: `â‚¹${totalPrice.toLocaleString('en-IN')}`, alignment: 'right', fontSize: 12, bold: true, border: [false, true, false, false], borderColor: ['', '#000000', '', ''] }
                                                ]
                                            ]
                                        },
                                        layout: 'noBorders'
                                    }
                                ],
                                width: 220
                            }
                        ],
                        margin: [0, 0, 0, 30]
                    },
                    
                    // EVENT DETAILS & AI INSIGHT
                    {
                        columns: [
                            {
                                stack: [
                                    { text: 'EVENT DETAILS', fontSize: 11, bold: true, margin: [0, 0, 0, 10] },
                                    { text: `Event Type        : Self Transfer (Store â†’ Warehouse)`, fontSize: 9 },
                                    { text: `Transaction Type  : Dispatch`, fontSize: 9 },
                                    { text: `Reference ID      : ${transferReference}`, fontSize: 9 },
                                    { text: `Created By        : Insora Inventory System`, fontSize: 9 },
                                    { text: `Remarks           : ${quantity} Units dispatched from ${fromLocation} to ${toLocation}`, fontSize: 9 }
                                ],
                                width: '48%'
                            },
                            {
                                stack: [
                                    { text: 'AI INSIGHT', fontSize: 11, bold: true, margin: [0, 0, 0, 10] },
                                    { text: `High dispatch observed from ${fromLocation}.`, fontSize: 9 },
                                    { text: `Recommendation: Monitor stock balance at the source location to avoid future shortages.`, fontSize: 9 },
                                    { text: '\n' },
                                    { text: 'Generated by Insora AI.', fontSize: 8, italics: true, color: '#666666' }
                                ],
                                width: '48%'
                            }
                        ],
                        margin: [0, 0, 0, 30]
                    },
                    
                    // AUTHORIZED BY & NOTE
                    {
                        columns: [
                            {
                                stack: [
                                    { text: 'AUTHORIZED BY', fontSize: 10, bold: true, margin: [0, 0, 0, 10] },
                                    { text: '_____________________', margin: [0, 20, 0, 5] },
                                    { text: 'System Generated', fontSize: 9 },
                                    { text: 'Insora Inventory System', fontSize: 9 }
                                ],
                                width: '48%'
                            },
                            {
                                stack: [
                                    { text: 'NOTE', fontSize: 10, bold: true, margin: [0, 0, 0, 10] },
                                    { text: 'This is a system-generated internal transfer document.', fontSize: 9 },
                                    { text: 'No physical signature is required.', fontSize: 9 },
                                    { text: 'For any queries, contact support@insora.in', fontSize: 9 }
                                ],
                                width: '48%'
                            }
                        ],
                        margin: [0, 0, 0, 40]
                    },
                    
                    // Footer
                    {
                        text: 'Thank you for using Insora Inventory Intelligence Platform.',
                        alignment: 'center',
                        fontSize: 10,
                        margin: [0, 20, 0, 10]
                    },
                    {
                        columns: [
                            { text: 'www.insora.in', fontSize: 8, color: '#666666', alignment: 'center' },
                            { text: 'support@insora.in', fontSize: 8, color: '#666666', alignment: 'center' },
                            { text: 'Delhi, India', fontSize: 8, color: '#666666', alignment: 'center' }
                        ]
                    }
                ],
                styles: {
                    tableHeader: {
                        bold: true,
                        fontSize: 10,
                        color: '#000000',
                        fillColor: '#F3F4F6'
                    }
                }
            };
            
            // Generate and download PDF
            pdfMake.createPdf(docDefinition).download(`Transfer-Invoice-${invoiceId}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF invoice. Error: ' + error.message);
        }
    };

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
            
            // Get the store code for the selected store
            const selectedStoreData = stores.find(s => s.id === parseInt(selectedStore));
            const storeCode = selectedStoreData?.store_code || selectedStoreData?.id;
            
            // Use NEW store timeline API
            const response = await fetch(`${API_BASE}/api/store-timeline/${storeCode}?limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Store Timeline API response:', data);
            
            if (data.success && data.data && data.data.timeline) {
                // Transform the timeline data to match our component format
                const transformedTimeline = data.data.timeline.map(item => {
                    // Map movement_type to eventType
                    const eventTypeMap = {
                        'SELF_TRANSFER': item.direction === 'IN' ? 'TRANSFER_IN' : 'TRANSFER_OUT',
                        'OPENING': 'INITIAL_STOCK',
                        'DISPATCH': 'TRANSFER_OUT',
                        'RETURN': 'TRANSFER_IN',
                        'DAMAGE': 'DAMAGED',
                        'RECOVER': 'TRANSFER_IN',
                        'MANUAL': item.direction === 'IN' ? 'TRANSFER_IN' : 'TRANSFER_OUT'
                    };
                    
                    const eventType = eventTypeMap[item.movement_type] || 'UNKNOWN';
                    
                    // Calculate stock before
                    const stockBefore = item.direction === 'IN' 
                        ? item.balance_after - item.quantity 
                        : item.balance_after + item.quantity;
                    
                    return {
                        eventType: eventType,
                        timestamp: item.created_at,
                        quantity: item.direction === 'IN' ? item.quantity : -item.quantity,
                        stockBefore: stockBefore,
                        stockAfter: item.balance_after,
                        source: item.source_location || (item.direction === 'OUT' ? storeCode : 'External'),
                        destination: item.destination_location || (item.direction === 'IN' ? storeCode : 'External'),
                        source_location: item.source_location,
                        destination_location: item.destination_location,
                        notes: item.reference ? `Reference: ${item.reference}` : '',
                        status: 'COMPLETED',
                        unit: 'units',
                        productName: item.product_name,
                        productBarcode: item.product_barcode,
                        movementType: item.movement_type,
                        direction: item.direction,
                        userId: item.user_id,
                        reference: item.reference
                    };
                });
                
                setTimeline(transformedTimeline);
            } else {
                console.error('Timeline API error:', data.message);
                setTimeline([]);
            }
        } catch (error) {
            console.error('Error fetching timeline:', error);
            
            // Check if it's an authentication error
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                console.log('Authentication error - redirecting to login');
                // Don't redirect automatically, just show error
                setTimeline([]);
            } else {
                setTimeline([]);
            }
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
            background: '#ffffff', 
            fontFamily: 'Inter,sans-serif', 
            padding: '0', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '20px 0', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', padding: '0 24px' }}>
                    <div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6B7280' }}>Track all inventory movements and events</p>
                    </div>
                    <button
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F3F4F6', color: '#6B7280', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit' }}
                    >
                        <Download size={16} /> Export
                    </button>
                </div>

                {/* Store Selector */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '0 24px' }}>
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
                <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 0', flexShrink: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '0 24px' }}>
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', paddingTop: '40px', color: '#9CA3AF' }}>Loading timeline...</div>
                ) : timeline.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        paddingTop: '40px', 
                        color: '#9CA3AF',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <Package size={48} color="#D1D5DB" />
                        <div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                                No timeline events found
                            </div>
                            <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
                                {selectedStoreData ? `No inventory movements for ${selectedStoreData.store_name}` : 'Select a store to view timeline'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        {/* Timeline Events - No gaps, edge to edge */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {timeline.map((event, idx) => (
                                <div key={idx} style={{ display: 'flex', position: 'relative', padding: '0' }}>
                                    {/* Timeline Dot - Removed */}

                                    {/* Event Card - Full width, no gaps */}
                                    <div style={{
                                        width: '100%',
                                        background: '#fff',
                                        borderRadius: '0',
                                        padding: '20px 24px',
                                        border: 'none',
                                        borderBottom: '1px solid #E5E7EB',
                                        boxShadow: 'none'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                                                    {getEventLabel(event.eventType)}
                                                </h3>
                                                {event.productName && (
                                                    <p style={{ margin: '4px 0', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                                                        {event.productName}
                                                    </p>
                                                )}
                                                {event.productBarcode && (
                                                    <p style={{ margin: '2px 0', fontSize: '11px', color: '#9CA3AF' }}>
                                                        SKU: {event.productBarcode}
                                                    </p>
                                                )}
                                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                                                    {event.movementType} - {event.direction}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: event.quantity > 0 ? '#22C55E' : '#EF4444' }}>
                                                    {event.quantity > 0 ? '+' : ''}{event.quantity} {event.unit || 'units'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                                                    {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString()}
                                                </div>
                                                {event.userId && (
                                                    <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>
                                                        By: {event.userId}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stock Before/After */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>Stock Before</div>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>{event.stockBefore} units</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>Stock After</div>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{event.stockAfter} units</div>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {event.notes && (
                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                                                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>"{event.notes}"</p>
                                            </div>
                                        )}

                                        {/* Status Badge and Download Invoice */}
                                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
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
                                                {event.movementType === 'OPENING' && (
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        background: '#DBEAFE',
                                                        color: '#1E40AF'
                                                    }}>
                                                        Initial Stock
                                                    </span>
                                                )}
                                                {event.movementType === 'SELF_TRANSFER' && (
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        background: '#F3E8FF',
                                                        color: '#6B21A8'
                                                    }}>
                                                        Store Transfer
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Download Invoice Button for Self Transfer */}
                                            {event.movementType === 'SELF_TRANSFER' && (
                                                <button
                                                    onClick={() => downloadInvoice(event)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        background: '#3B82F6',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        fontFamily: 'inherit',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#2563EB'}
                                                    onMouseLeave={(e) => e.target.style.background = '#3B82F6'}
                                                >
                                                    <Download size={12} />
                                                    Invoice
                                                </button>
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
