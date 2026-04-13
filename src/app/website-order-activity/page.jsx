"use client";

import React, { useState, useEffect } from 'react';
import styles from './websiteOrderActivity.module.css';
import { usePermissions } from '@/contexts/PermissionsContext';

const WarehouseOrderActivity = () => {
    const { hasPermission, getAccessibleWarehouses } = usePermissions();
    
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
        dateFrom: '',
        dateTo: ''
    });

    // Get accessible warehouses based on user permissions
    const accessibleWarehouses = getAccessibleWarehouses('WEBSITE_ORDER_ACTIVITY_VIEW');
    const availableWarehouseCodes = accessibleWarehouses.map(w => w.code);

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
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = [...activities];

        // Warehouse permission filtering - only show activities from accessible warehouses
        if (availableWarehouseCodes.length > 0) {
            filtered = filtered.filter(activity => 
                availableWarehouseCodes.includes(activity.warehouse)
            );
        }

        // Warehouse filter
        if (filters.warehouse) {
            filtered = filtered.filter(activity => 
                activity.warehouse === filters.warehouse
            );
        }

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
                activity.awb.toLowerCase().includes(filters.awb.toLowerCase())
            );
        }

        // Date range filter
        if (filters.dateFrom) {
            filtered = filtered.filter(activity => {
                const activityDate = new Date(activity.created_at).toDateString();
                const fromDate = new Date(filters.dateFrom).toDateString();
                return new Date(activityDate) >= new Date(fromDate);
            });
        }

        if (filters.dateTo) {
            filtered = filtered.filter(activity => {
                const activityDate = new Date(activity.created_at).toDateString();
                const toDate = new Date(filters.dateTo).toDateString();
                return new Date(activityDate) <= new Date(toDate);
            });
        }

        setFilteredActivities(filtered);
        setCurrentPage(1); // Reset to first page when filtering
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
            dateFrom: '',
            dateTo: ''
        });
    };

    // Download CSV
    const downloadCSV = () => {
        const headers = [
            'ID', 'AWB', 'Order Ref', 'Customer Name', 'Product Name', 
            'Logistics', 'Phone Number', 'Status', 'Remarks', 'Created At'
        ];

        const csvData = filteredActivities.map(activity => [
            activity.id,
            activity.awb,
            activity.order_ref,
            activity.customer_name,
            activity.product_name,
            activity.logistics,
            activity.phone_number,
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
        link.download = `warehouse-order-activities-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
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
            <div className={styles.header}>
                <h1>Warehouse Order Activity</h1>
                <p>Track and manage warehouse order activities from OrderSheet submissions</p>
            </div>

            {/* Filters Section */}
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
                    <button onClick={downloadCSV} className={styles.downloadBtn}>
                        📥 Download CSV
                    </button>
                </div>
            </div>

            {/* Results Summary */}
            <div className={styles.summary}>
                <p>Showing {currentItems.length} of {filteredActivities.length} activities</p>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>AWB</th>
                            <th>Order Ref</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Logistics</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Remarks</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((activity) => (
                                <tr key={activity.id}>
                                    <td>{activity.id}</td>
                                    <td className={styles.awb}>{activity.awb}</td>
                                    <td>{activity.order_ref}</td>
                                    <td className={styles.customer}>{activity.customer_name}</td>
                                    <td className={styles.product}>{activity.product_name}</td>
                                    <td>{activity.logistics}</td>
                                    <td>{activity.phone_number}</td>
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
                                <td colSpan="10" className={styles.noData}>
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