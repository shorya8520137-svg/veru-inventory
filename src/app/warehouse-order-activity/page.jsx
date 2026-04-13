"use client";

import React, { useState, useEffect } from 'react';
import styles from './warehouseOrderActivity.module.css';

// Dynamic imports for PDF generation (client-side only)
const generatePDF = async (activities) => {
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Fetch warehouse addresses for the activities
    const warehouseAddresses = await fetchWarehouseAddresses(activities);
    
    // Generate a single consolidated shipping manifest
    await drawShippingManifest(pdf, activities, warehouseAddresses, 10, 10, pageWidth - 20, pageHeight - 20);
    
    return pdf;
};

// Fetch warehouse addresses from database
const fetchWarehouseAddresses = async (activities) => {
    try {
        const token = localStorage.getItem('token');
        const uniqueWarehouses = [...new Set(activities.map(a => a.warehouse).filter(Boolean))];
        
        if (uniqueWarehouses.length === 0) return {};
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/warehouse-addresses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ warehouses: uniqueWarehouses })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.addresses || {};
        }
    } catch (error) {
        console.error('Error fetching warehouse addresses:', error);
    }
    return {};
};

const drawShippingManifest = async (pdf, activities, warehouseAddresses, x, y, width, height) => {
    // Main border
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    // Company header - compact layout with no gaps
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    
    // HUNY in blue - no gap
    pdf.setTextColor(0, 100, 200);
    pdf.text('HUNY', x + 10, y + 15);
    
    // HUNY in pink - right after first HUNY with minimal gap
    pdf.setTextColor(200, 50, 150);
    pdf.text('HUNY', x + 42, y + 15);
    
    // OVERSEAS PVT LTD in black - right after second HUNY
    pdf.setTextColor(0, 0, 0);
    pdf.text('OVERSEAS PVT LTD', x + 74, y + 15);
    
    // DELHIVERY - right aligned
    pdf.setFontSize(14);
    pdf.text('DELHIVERY', x + width - 50, y + 15);
    
    // Document title and details - compact
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DELIVERY MANIFEST', x + 10, y + 28);
    pdf.text(`Total Orders: ${activities.length}`, x + width - 70, y + 28);
    
    // Date and time - same line
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, x + 10, y + 38);
    pdf.text(`Time: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, x + 80, y + 38);
    
    // Get warehouse address for header
    const primaryWarehouse = activities.length > 0 ? activities[0].warehouse : null;
    let warehouseAddress = '';
    if (primaryWarehouse && warehouseAddresses[primaryWarehouse]) {
        warehouseAddress = warehouseAddresses[primaryWarehouse].address;
    }
    
    // Address in header if available - compact
    if (warehouseAddress) {
        pdf.setFontSize(8);
        const shortAddress = warehouseAddress.length > 80 ? warehouseAddress.substring(0, 80) + '...' : warehouseAddress;
        pdf.text(`Address: ${shortAddress}`, x + 10, y + 46);
    }
    
    // Table setup - optimized column widths to fit Status properly
    const tableStartY = y + 52;
    const rowHeight = 11;
    const colWidths = [12, 30, 35, 70, 12, 18]; // Total: 177mm - Status column fits
    
    // Draw table header
    pdf.setFillColor(220, 220, 220);
    pdf.rect(x + 5, tableStartY, width - 10, rowHeight, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    const headers = ['S.No', 'AWB Number', 'Customer Name', 'Product Name & Barcode', 'WH', 'Status'];
    let currentX = x + 5;
    
    headers.forEach((header, index) => {
        pdf.text(header, currentX + 2, tableStartY + 7);
        currentX += colWidths[index];
    });
    
    // Draw table rows - compact
    let currentY = tableStartY + rowHeight;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    
    activities.forEach((activity, index) => {
        // Alternate row colors
        if (index % 2 === 1) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(x + 5, currentY, width - 10, rowHeight, 'F');
        }
        
        currentX = x + 5;
        
        // S.No
        pdf.setTextColor(0, 0, 0);
        pdf.text((index + 1).toString(), currentX + 2, currentY + 7);
        currentX += colWidths[0];
        
        // AWB Number
        const awbText = activity.awb || 'N/A';
        pdf.text(awbText, currentX + 2, currentY + 7);
        currentX += colWidths[1];
        
        // Customer Name
        const customerText = activity.customer_name || 'N/A';
        const customerLines = pdf.splitTextToSize(customerText, colWidths[2] - 4);
        pdf.text(customerLines[0], currentX + 2, currentY + 7);
        currentX += colWidths[2];
        
        // Product Name & Barcode - compact format
        const productText = activity.product_name || 'N/A';
        
        // Product name
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        const productLines = pdf.splitTextToSize(productText, colWidths[3] - 4);
        pdf.text(productLines[0], currentX + 2, currentY + 3);
        
        // Barcode
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.text('||||| |||| |||||', currentX + 2, currentY + 7);
        
        // Product code
        const productCode = productText.split(' ')[0] || 'N/A';
        pdf.text(productCode, currentX + 2, currentY + 10);
        
        currentX += colWidths[3];
        
        // Warehouse
        pdf.setFontSize(7);
        const warehouseText = activity.warehouse ? activity.warehouse.replace('_WH', '') : 'N/A';
        pdf.text(warehouseText, currentX + 2, currentY + 7);
        currentX += colWidths[4];
        
        // Status - fits in column now
        pdf.text(activity.status || 'N/A', currentX + 2, currentY + 7);
        
        currentY += rowHeight;
        
        // Check if we need a new page
        if (currentY > y + height - 70) {
            pdf.addPage();
            currentY = 20;
            // Redraw header on new page
            pdf.setFillColor(220, 220, 220);
            pdf.rect(x + 5, currentY, width - 10, rowHeight, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            currentX = x + 5;
            headers.forEach((header, index) => {
                pdf.text(header, currentX + 2, currentY + 7);
                currentX += colWidths[index];
            });
            currentY += rowHeight;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
        }
    });
    
    // Draw table borders
    const actualTableHeight = currentY - tableStartY;
    pdf.setLineWidth(0.5);
    
    // Outer table border
    pdf.rect(x + 5, tableStartY, width - 10, actualTableHeight);
    
    // Vertical lines
    currentX = x + 5;
    colWidths.forEach((colWidth, index) => {
        if (index < colWidths.length - 1) {
            currentX += colWidth;
            pdf.line(currentX, tableStartY, currentX, tableStartY + actualTableHeight);
        }
    });
    
    // Header separator line
    pdf.line(x + 5, tableStartY + rowHeight, x + width - 5, tableStartY + rowHeight);
    
    // Summary and signature section - compact layout
    const summaryY = currentY + 10;
    
    // Left side - Summary
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DELIVERY SUMMARY:', x + 10, summaryY);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Items: ${activities.length}`, x + 10, summaryY + 8);
    pdf.text(`Dispatch Date: ${new Date().toLocaleDateString('en-IN')}`, x + 10, summaryY + 15);
    pdf.text(`Prepared By: ${activities[0]?.processed_by || 'System'}`, x + 10, summaryY + 22);
    
    // Right side - Signature - compact
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DELIVERY PERSON HANDOVER:', x + width - 100, summaryY);
    
    // Signature box - smaller
    pdf.setLineWidth(0.5);
    pdf.rect(x + width - 100, summaryY + 5, 90, 25);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Signature: ___________________', x + width - 95, summaryY + 12);
    pdf.text('Date: ________________________', x + width - 95, summaryY + 18);
    pdf.text('Name: _______________________', x + width - 95, summaryY + 24);
    
    // Company footer - compact with real warehouse address
    const footerY = y + height - 20;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('HUNYHUNY OVERSEAS PVT LTD', x + 10, footerY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text('Phone: 9263006000 | GST: 06AAECH7204C1Z3', x + 10, footerY + 5);
    
    // Use real warehouse address in footer
    if (warehouseAddress) {
        pdf.setFontSize(7);
        const addressLines = pdf.splitTextToSize(warehouseAddress, width - 20);
        addressLines.forEach((line, index) => {
            if (index < 2) { // Limit to 2 lines to fit in footer
                pdf.text(line, x + 10, footerY + 10 + (index * 3));
            }
        });
    }
};

const WarehouseOrderActivity = () => {
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter states
    const [filters, setFilters] = useState({
        status: '',
        customer: '',
        awb: '',
        warehouse: '',
        processed_by: '',
        logistics: '',
        dateFrom: '',
        dateTo: ''
    });

    // Warehouse staff data for filters
    const [warehouseStaff, setWarehouseStaff] = useState({});
    const [warehouses, setWarehouses] = useState([]);
    const [availableStaff, setAvailableStaff] = useState([]);
    const [logistics, setLogistics] = useState([]);

    // Selection states for checkbox functionality
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Fetch activities from warehouse_order_activity table (populated by OrderSheet form submissions)
    const fetchActivities = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/warehouse-order-activity`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch warehouse activities');
            }

            const data = await response.json();
            console.log('Fetched warehouse activities:', data); // Debug log
            setActivities(data.data || []);
            setFilteredActivities(data.data || []);
        } catch (err) {
            console.error('Error fetching warehouse activities:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
        fetchWarehouseStaff();
        fetchLogistics();
    }, []);

    // Fetch warehouse staff data for filters
    const fetchWarehouseStaff = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/warehouse-order-activity/warehouse-staff`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setWarehouseStaff(data.data || {});
                setWarehouses(data.warehouses || []);
            }
        } catch (error) {
            console.error('Error fetching warehouse staff:', error);
            // Set fallback data
            const fallbackData = {
                'MUM_WH': ['Abhishek', 'Aniket', 'Rashid'],
                'BLR_WH': ['Mandhata', 'Rajbhar'],
                'GGM_WH': ['Pankaj Rajput', 'Pankaj Rawat', 'Nagdeo Pandey'],
                'AMD_WH': ['Rushant', 'Vikas'],
                'HYD_WH': ['Divya', 'Robin']
            };
            setWarehouseStaff(fallbackData);
            setWarehouses(Object.keys(fallbackData));
        }
    };

    // Fetch logistics data for filters
    const fetchLogistics = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/warehouse-order-activity/logistics`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setLogistics(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching logistics:', error);
            // Set fallback data
            const fallbackLogistics = [
                { id: 1, name: 'Delhivery' },
                { id: 2, name: 'Blue Dart' },
                { id: 3, name: 'Ecom Express' },
                { id: 4, name: 'DTDC' }
            ];
            setLogistics(fallbackLogistics);
        }
    };

    // Update available staff when warehouse filter changes
    useEffect(() => {
        if (filters.warehouse && warehouseStaff[filters.warehouse]) {
            setAvailableStaff(warehouseStaff[filters.warehouse]);
            // Reset processed_by filter when warehouse changes
            if (filters.processed_by && !warehouseStaff[filters.warehouse].includes(filters.processed_by)) {
                setFilters(prev => ({ ...prev, processed_by: '' }));
            }
        } else {
            setAvailableStaff([]);
            setFilters(prev => ({ ...prev, processed_by: '' }));
        }
    }, [filters.warehouse, warehouseStaff]);

    // Apply filters
    useEffect(() => {
        let filtered = [...activities];

        // Status filter
        if (filters.status) {
            filtered = filtered.filter(activity => 
                activity.status.toLowerCase() === filters.status.toLowerCase()
            );
        }

        // Customer filter
        if (filters.customer) {
            filtered = filtered.filter(activity => 
                activity.customer_name.toLowerCase().includes(filters.customer.toLowerCase())
            );
        }

        // AWB filter
        if (filters.awb) {
            filtered = filtered.filter(activity => 
                activity.awb && activity.awb.toLowerCase().includes(filters.awb.toLowerCase())
            );
        }

        // Warehouse filter
        if (filters.warehouse) {
            filtered = filtered.filter(activity => 
                activity.warehouse === filters.warehouse
            );
        }

        // Processed by filter
        if (filters.processed_by) {
            filtered = filtered.filter(activity => 
                activity.processed_by === filters.processed_by
            );
        }

        // Logistics filter
        if (filters.logistics) {
            filtered = filtered.filter(activity => 
                activity.logistics === filters.logistics
            );
        }

        // Logistics filter
        if (filters.logistics) {
            filtered = filtered.filter(activity => 
                activity.logistics.toLowerCase().includes(filters.logistics.toLowerCase())
            );
        }

        // Date range filter - Fixed to work properly
        if (filters.dateFrom) {
            filtered = filtered.filter(activity => {
                const activityDate = new Date(activity.created_at);
                const fromDate = new Date(filters.dateFrom);
                // Compare only dates, not time
                activityDate.setHours(0, 0, 0, 0);
                fromDate.setHours(0, 0, 0, 0);
                return activityDate >= fromDate;
            });
        }

        if (filters.dateTo) {
            filtered = filtered.filter(activity => {
                const activityDate = new Date(activity.created_at);
                const toDate = new Date(filters.dateTo);
                // Compare only dates, not time
                activityDate.setHours(0, 0, 0, 0);
                toDate.setHours(0, 0, 0, 0);
                return activityDate <= toDate;
            });
        }

        setFilteredActivities(filtered);
        setCurrentPage(1); // Reset to first page when filtering
        
        // Clear selections when filters change
        setSelectedItems(new Set());
        setSelectAll(false);
    }, [filters, activities]);

    // Handle filter changes
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            status: '',
            customer: '',
            awb: '',
            warehouse: '',
            processed_by: '',
            logistics: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    // Handle checkbox selection
    const handleSelectItem = (itemId) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
        setSelectAll(newSelected.size === currentItems.length);
    };

    // Handle select all checkbox
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems(new Set());
            setSelectAll(false);
        } else {
            const allIds = new Set(currentItems.map(item => item.id));
            setSelectedItems(allIds);
            setSelectAll(true);
        }
    };

    // Download CSV - only selected items or all if none selected
    const downloadCSV = () => {
        const dataToDownload = selectedItems.size > 0 
            ? filteredActivities.filter(activity => selectedItems.has(activity.id))
            : filteredActivities;

        if (dataToDownload.length === 0) {
            alert('No data to download. Please select items or clear filters.');
            return;
        }

        const headers = [
            'ID', 'AWB', 'Order Ref', 'Customer Name', 'Product Name', 
            'Logistics', 'Warehouse', 'Processed By', 'Status', 'Remarks', 'Created At'
        ];

        const csvData = dataToDownload.map(activity => [
            activity.id,
            activity.awb,
            activity.order_ref,
            activity.customer_name,
            activity.product_name,
            activity.logistics,
            activity.warehouse,
            activity.processed_by,
            activity.status,
            activity.remarks,
            new Date(activity.created_at).toLocaleString()
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `warehouse-order-activities-${selectedItems.size > 0 ? 'selected-' : ''}${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    // Download Excel format
    const downloadExcel = async () => {
        const dataToDownload = selectedItems.size > 0 
            ? filteredActivities.filter(activity => selectedItems.has(activity.id))
            : filteredActivities;

        if (dataToDownload.length === 0) {
            alert('No data to download. Please select items or clear filters.');
            return;
        }

        try {
            // Dynamic import for xlsx
            const XLSX = await import('xlsx');
            
            const headers = [
                'ID', 'AWB', 'Order Ref', 'Customer Name', 'Product Name', 
                'Logistics', 'Warehouse', 'Processed By', 'Status', 'Remarks', 'Created At'
            ];

            const excelData = dataToDownload.map(activity => ({
                'ID': activity.id,
                'AWB': activity.awb,
                'Order Ref': activity.order_ref,
                'Customer Name': activity.customer_name,
                'Product Name': activity.product_name,
                'Logistics': activity.logistics,
                'Warehouse': activity.warehouse,
                'Processed By': activity.processed_by,
                'Status': activity.status,
                'Remarks': activity.remarks,
                'Created At': new Date(activity.created_at).toLocaleString()
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Warehouse Activities');

            // Auto-size columns
            const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
            worksheet['!cols'] = colWidths;

            XLSX.writeFile(workbook, `warehouse-order-activities-${selectedItems.size > 0 ? 'selected-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Excel download error:', error);
            alert('Error generating Excel file. Please try again.');
        }
    };

    // Download PDF shipping labels
    const downloadPDF = async () => {
        const dataToDownload = selectedItems.size > 0 
            ? filteredActivities.filter(activity => selectedItems.has(activity.id))
            : filteredActivities;

        if (dataToDownload.length === 0) {
            alert('No data to download. Please select items or clear filters.');
            return;
        }

        try {
            const pdf = await generatePDF(dataToDownload);
            pdf.save(`shipping-manifest-${selectedItems.size > 0 ? 'selected-' : ''}${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading warehouse order activities...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>Error Loading Data</h2>
                    <p>{error}</p>
                    <button onClick={fetchActivities} className={styles.retryBtn}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Filters Section - No background card */}
            <div className={styles.filtersSection}>
                <div className={styles.filtersGrid}>
                    <div className={styles.filterGroup}>
                        <label>Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">All Status</option>
                            <option value="Dispatch">Dispatch</option>
                            <option value="Cancel">Cancel</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Warehouse</label>
                        <select
                            value={filters.warehouse}
                            onChange={(e) => handleFilterChange('warehouse', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">All Warehouses</option>
                            {warehouses.map(warehouse => (
                                <option key={warehouse} value={warehouse}>
                                    {warehouse.replace('_WH', ' Warehouse')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Processed By</label>
                        <select
                            value={filters.processed_by}
                            onChange={(e) => handleFilterChange('processed_by', e.target.value)}
                            className={styles.filterSelect}
                            disabled={!filters.warehouse}
                        >
                            <option value="">
                                {!filters.warehouse ? 'Select warehouse first' : 'All Staff'}
                            </option>
                            {availableStaff.map(staff => (
                                <option key={staff} value={staff}>
                                    {staff}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Customer Name</label>
                        <input
                            type="text"
                            placeholder="Search customer..."
                            value={filters.customer}
                            onChange={(e) => handleFilterChange('customer', e.target.value)}
                            className={styles.filterInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>AWB Number</label>
                        <input
                            type="text"
                            placeholder="Search AWB..."
                            value={filters.awb}
                            onChange={(e) => handleFilterChange('awb', e.target.value)}
                            className={styles.filterInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Logistics</label>
                        <select
                            value={filters.logistics}
                            onChange={(e) => handleFilterChange('logistics', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">All Logistics</option>
                            {logistics.map(logistic => (
                                <option key={logistic.id} value={logistic.name}>
                                    {logistic.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>From Date</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className={styles.filterInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>To Date</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className={styles.filterInput}
                        />
                    </div>
                </div>

                <div className={styles.filterActions}>
                    <button onClick={clearFilters} className={styles.clearBtn}>
                        Clear Filters
                    </button>
                    <div className={styles.downloadDropdown}>
                        <button className={styles.downloadBtn}>
                            📥 Download {selectedItems.size > 0 ? `Selected (${selectedItems.size})` : 'All'} ▼
                        </button>
                        <div className={styles.downloadMenu}>
                            <button onClick={downloadExcel} className={styles.downloadOption}>
                                📊 Excel Format
                            </button>
                            <button onClick={downloadPDF} className={styles.downloadOption}>
                                📄 PDF Shipping Manifest
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            <div className={styles.summary}>
                <p>Showing {currentItems.length} of {filteredActivities.length} activities 
                   {selectedItems.size > 0 && ` • ${selectedItems.size} selected`}</p>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    className={styles.checkbox}
                                />
                            </th>
                            <th>ID</th>
                            <th>AWB</th>
                            <th>Order Ref</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Logistics</th>
                            <th>Warehouse</th>
                            <th>Processed By</th>
                            <th>Status</th>
                            <th>Remarks</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((activity) => (
                                <tr key={activity.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(activity.id)}
                                            onChange={() => handleSelectItem(activity.id)}
                                            className={styles.checkbox}
                                        />
                                    </td>
                                    <td>{activity.id}</td>
                                    <td className={styles.awb}>{activity.awb}</td>
                                    <td>{activity.order_ref}</td>
                                    <td className={styles.customer}>{activity.customer_name}</td>
                                    <td className={styles.product}>{activity.product_name}</td>
                                    <td>{activity.logistics}</td>
                                    <td className={styles.warehouse}>{activity.warehouse?.replace('_WH', ' WH') || '-'}</td>
                                    <td className={styles.processedBy}>{activity.processed_by || '-'}</td>
                                    <td>
                                        <span className={`${styles.status} ${styles[activity.status?.toLowerCase()]}`}>
                                            {activity.status}
                                        </span>
                                    </td>
                                    <td className={styles.remarks}>{activity.remarks || '-'}</td>
                                    <td className={styles.date}>
                                        {activity.created_at ? new Date(activity.created_at).toLocaleDateString('en-IN') : '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="12" className={styles.noData}>
                                    {loading ? 'Loading...' : 'No order activities found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={styles.pageBtn}
                    >
                        Previous
                    </button>

                    {[...Array(totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => paginate(index + 1)}
                            className={`${styles.pageBtn} ${currentPage === index + 1 ? styles.active : ''}`}
                        >
                            {index + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={styles.pageBtn}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default WarehouseOrderActivity;