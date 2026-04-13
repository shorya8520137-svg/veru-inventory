"use client";

import React, { useEffect, useState } from "react";
import { Search, Filter, Download, RefreshCw, Calendar, Eye, Package, AlertTriangle, RotateCcw } from "lucide-react";
import styles from "./movementRecords.module.css";
import { usePermissions, PERMISSIONS } from '@/contexts/PermissionsContext';

const PAGE_SIZE = 50;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const MOVEMENT_TYPES = [
    { value: 'all', label: 'All Movements', icon: Package, color: '#6b7280' },
    { value: 'damage', label: 'Damage', icon: AlertTriangle, color: '#ef4444' },
    { value: 'recover', label: 'Recovery', icon: Package, color: '#10b981' },
    { value: 'return', label: 'Returns', icon: RotateCcw, color: '#3b82f6' },
];

const WAREHOUSES = [
    { code: "ALL", name: "All Warehouses" },
    { code: "GGM_WH", name: "Gurgaon Warehouse" },
    { code: "BLR_WH", name: "Bangalore Warehouse" },
    { code: "MUM_WH", name: "Mumbai Warehouse" },
    { code: "AMD_WH", name: "Ahmedabad Warehouse" },
    { code: "HYD_WH", name: "Hyderabad Warehouse" },
];

export default function InventoryMovementRecords() {
    const { hasPermission } = usePermissions();
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [movementTypeFilter, setMovementTypeFilter] = useState('all');
    const [warehouseFilter, setWarehouseFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Stats
    const [stats, setStats] = useState({
        totalMovements: 0,
        damageCount: 0,
        recoveryCount: 0,
        returnCount: 0
    });

    // Load movement records
    const loadMovementRecords = async () => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: PAGE_SIZE.toString(),
            });

            if (movementTypeFilter !== 'all') {
                params.append('movement_type', movementTypeFilter);
            }
            if (warehouseFilter !== 'ALL') {
                params.append('warehouse', warehouseFilter);
            }
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }
            if (dateFrom) {
                params.append('dateFrom', dateFrom);
            }
            if (dateTo) {
                params.append('dateTo', dateTo);
            }

            console.log('🔗 API URL:', `${API_BASE}/api/inventory/movement-records?${params}`);

            const response = await fetch(`${API_BASE}/api/inventory/movement-records?${params}`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setRecords(data.data || []);
                setTotalRecords(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE));
                
                // Update stats
                if (data.stats) {
                    setStats(data.stats);
                }
            } else {
                throw new Error(data.message || 'Failed to load movement records');
            }
        } catch (err) {
            console.error('Error loading movement records:', err);
            setError(err.message || 'Failed to load movement records');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount and filter changes
    useEffect(() => {
        if (hasPermission(PERMISSIONS.INVENTORY_VIEW)) {
            loadMovementRecords();
        }
    }, [page, movementTypeFilter, warehouseFilter, searchQuery, dateFrom, dateTo, hasPermission]);

    // Reset page when filters change
    useEffect(() => {
        if (page !== 1) {
            setPage(1);
        }
    }, [movementTypeFilter, warehouseFilter, searchQuery, dateFrom, dateTo]);

    // Export records
    const exportRecords = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                export: 'true',
                limit: '10000', // Export all records
            });

            if (movementTypeFilter !== 'all') {
                params.append('movement_type', movementTypeFilter);
            }
            if (warehouseFilter !== 'ALL') {
                params.append('warehouse', warehouseFilter);
            }
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }
            if (dateFrom) {
                params.append('dateFrom', dateFrom);
            }
            if (dateTo) {
                params.append('dateTo', dateTo);
            }

            const response = await fetch(`${API_BASE}/api/inventory/movement-records?${params}`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `inventory-movement-records-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error('Export failed');
            }
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export records. Please try again.');
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get movement type display info
    const getMovementTypeInfo = (type) => {
        const typeInfo = MOVEMENT_TYPES.find(t => t.value === type) || MOVEMENT_TYPES[0];
        return typeInfo;
    };

    // Permission check
    if (!hasPermission(PERMISSIONS.INVENTORY_VIEW)) {
        return (
            <div className={styles.container}>
                <div className={styles.noPermission}>
                    <h2>Access Denied</h2>
                    <p>You don't have permission to view inventory movement records.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Inventory Movement Records</h1>
                    <p className={styles.subtitle}>Track all inventory movements including returns, damage, and recovery operations</p>
                </div>
                
                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ backgroundColor: '#f3f4f6' }}>
                            <Package size={20} color="#6b7280" />
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statValue}>{stats.totalMovements}</div>
                            <div className={styles.statLabel}>Total Movements</div>
                        </div>
                    </div>
                    
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ backgroundColor: '#fef2f2' }}>
                            <AlertTriangle size={20} color="#ef4444" />
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statValue}>{stats.damageCount}</div>
                            <div className={styles.statLabel}>Damage Reports</div>
                        </div>
                    </div>
                    
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ backgroundColor: '#f0fdf4' }}>
                            <Package size={20} color="#10b981" />
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statValue}>{stats.recoveryCount}</div>
                            <div className={styles.statLabel}>Recoveries</div>
                        </div>
                    </div>
                    
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ backgroundColor: '#eff6ff' }}>
                            <RotateCcw size={20} color="#3b82f6" />
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statValue}>{stats.returnCount}</div>
                            <div className={styles.statLabel}>Returns</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filtersSection}>
                <div className={styles.filtersGrid}>
                    {/* Search */}
                    <div className={styles.filterGroup}>
                        <div className={styles.searchBox}>
                            <Search size={16} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search by product, barcode, order ref..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    {/* Movement Type Filter */}
                    <div className={styles.filterGroup}>
                        <select
                            value={movementTypeFilter}
                            onChange={(e) => setMovementTypeFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {MOVEMENT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Warehouse Filter */}
                    <div className={styles.filterGroup}>
                        <select
                            value={warehouseFilter}
                            onChange={(e) => setWarehouseFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {WAREHOUSES.map(warehouse => (
                                <option key={warehouse.code} value={warehouse.code}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date From */}
                    <div className={styles.filterGroup}>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className={styles.dateInput}
                            placeholder="From Date"
                        />
                    </div>

                    {/* Date To */}
                    <div className={styles.filterGroup}>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className={styles.dateInput}
                            placeholder="To Date"
                        />
                    </div>

                    {/* Actions */}
                    <div className={styles.filterGroup}>
                        <div className={styles.actionButtons}>
                            <button
                                onClick={loadMovementRecords}
                                className={styles.refreshBtn}
                                title="Refresh"
                                disabled={loading}
                            >
                                <RefreshCw size={16} className={loading ? styles.spinning : ''} />
                            </button>
                            
                            <button
                                onClick={exportRecords}
                                className={styles.exportBtn}
                                title="Export to CSV"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.errorMessage}>
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading movement records...</p>
                </div>
            )}

            {/* Records Table */}
            {!loading && !error && (
                <div className={styles.tableContainer}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Type</th>
                                    <th>Product</th>
                                    <th>Barcode</th>
                                    <th>Warehouse</th>
                                    <th>Quantity</th>
                                    <th>Reference</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className={styles.noData}>
                                            <Package size={48} />
                                            <p>No movement records found</p>
                                            <small>Try adjusting your filters or date range</small>
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record, index) => {
                                        const typeInfo = getMovementTypeInfo(record.movement_type);
                                        const TypeIcon = typeInfo.icon;
                                        
                                        return (
                                            <tr key={record.id || index} className={styles.tableRow}>
                                                <td className={styles.dateCell}>
                                                    {formatDate(record.event_time || record.timestamp)}
                                                </td>
                                                <td className={styles.typeCell}>
                                                    <div className={styles.typeTag} style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}>
                                                        <TypeIcon size={14} />
                                                        <span>{typeInfo.label}</span>
                                                    </div>
                                                </td>
                                                <td className={styles.productCell}>
                                                    <div className={styles.productInfo}>
                                                        <span className={styles.productName}>{record.product_name || record.product_type}</span>
                                                        {record.variant && (
                                                            <small className={styles.productVariant}>{record.variant}</small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={styles.barcodeCell}>
                                                    <code className={styles.barcode}>{record.barcode}</code>
                                                </td>
                                                <td className={styles.warehouseCell}>
                                                    {record.warehouse || record.inventory_location || record.location_code}
                                                </td>
                                                <td className={styles.quantityCell}>
                                                    <span className={`${styles.quantity} ${record.direction === 'OUT' ? styles.quantityOut : styles.quantityIn}`}>
                                                        {record.direction === 'OUT' ? '-' : '+'}{record.qty || record.quantity}
                                                    </span>
                                                </td>
                                                <td className={styles.referenceCell}>
                                                    <span className={styles.reference}>
                                                        {record.reference || record.order_ref || record.awb || '-'}
                                                    </span>
                                                </td>
                                                <td className={styles.statusCell}>
                                                    <span className={`${styles.status} ${styles.statusActive}`}>
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <div className={styles.paginationInfo}>
                                Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} records
                            </div>
                            
                            <div className={styles.paginationControls}>
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className={styles.paginationBtn}
                                >
                                    Previous
                                </button>
                                
                                <span className={styles.pageInfo}>
                                    Page {page} of {totalPages}
                                </span>
                                
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className={styles.paginationBtn}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}