'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import styles from './audit-logs.module.css';

const DEFAULT_EVENT_CATALOG = [
    { group: 'Auth & Security', events: ['USER_LOGIN_SUCCESS', 'USER_LOGIN_FAILED', 'USER_LOGOUT', 'PASSWORD_CHANGE', '2FA_ENABLE', '2FA_DISABLE', '2FA_VERIFY_FAILED', 'NEW_DEVICE_LOGIN', 'NEW_IP_LOGIN', 'SESSION_EXPIRED'] },
    { group: 'Users & Permissions', events: ['USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_ROLE_CHANGE', 'ROLE_CREATE', 'ROLE_UPDATE', 'PERMISSION_ADD', 'PERMISSION_REMOVE', 'WAREHOUSE_ACCESS_CHANGE'] },
    { group: 'Products', events: ['PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'PRODUCT_IMAGE_UPLOAD', 'PRODUCT_PRICE_CHANGE', 'PRODUCT_BULK_UPLOAD'] },
    { group: 'Inventory', events: ['STOCK_ADD', 'STOCK_REDUCE', 'STOCK_ADJUST', 'INVENTORY_TRANSFER', 'LOW_STOCK_ALERT', 'STOCK_MISMATCH_DETECTED'] },
    { group: 'Orders & Dispatch', events: ['ORDER_CREATE', 'ORDER_STATUS_CHANGE', 'BILL_GENERATE', 'DISPATCH_CREATE', 'AWB_ADD', 'DELIVERY_COMPLETE', 'DELIVERY_FAILED'] },
    { group: 'Returns & Damage', events: ['RETURN_CREATE', 'RETURN_APPROVE', 'RETURN_REJECT', 'DAMAGE_REPORT_CREATE', 'DAMAGE_ITEM_WRITTEN_OFF'] },
    { group: 'Website & Support', events: ['WEBSITE_CUSTOMER_REGISTER', 'WEBSITE_ORDER_CREATE', 'SUPPORT_CONVERSATION_CREATE', 'TICKET_STATUS_CHANGE'] },
    { group: 'API & System', events: ['API_KEY_CREATE', 'API_KEY_DELETE', 'API_KEY_USED', 'WEBHOOK_FAILED', 'EXPORT_GENERATE', 'BACKUP_CREATE', 'SERVER_HEALTH_FAILED'] }
];

export default function AuditLogsPage() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [eventCatalog, setEventCatalog] = useState(DEFAULT_EVENT_CATALOG);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const itemsPerPage = 8;
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        severity: '',
        status: '',
        dateRange: '7d',
        search: ''
    });
    const [stats, setStats] = useState({
        totalEvents: 0,
        products: 0,
        inventory: 0,
        orders: 0,
        dispatches: 0,
        returns: 0,
        damageReports: 0,
        userActions: 0,
        highRisk: 0,
        failedEvents: 0,
        lastActiveAt: null
    });

    useEffect(() => {
        fetchAuditLogs();
    }, [filters, currentPage]);

    useEffect(() => {
        if (!autoRefresh) return undefined;
        const intervalId = setInterval(fetchAuditLogs, 30000);
        return () => clearInterval(intervalId);
    }, [autoRefresh, filters, currentPage]);

    const trackedEventCount = useMemo(
        () => eventCatalog.reduce((total, group) => total + group.events.length, 0),
        [eventCatalog]
    );

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }));
        setCurrentPage(1);
    };

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            const queryParams = new URLSearchParams();
            queryParams.append('page', currentPage);
            queryParams.append('limit', itemsPerPage);
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE}/api/audit-logs?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch audit logs');

            const data = await response.json();
            if (data.success) {
                setAuditLogs(data.data?.logs || []);
                setEventCatalog(data.data?.eventCatalog || DEFAULT_EVENT_CATALOG);
                if (data.data?.pagination) {
                    setTotalPages(data.data.pagination.pages || 1);
                    setTotalRecords(data.data.pagination.total || 0);
                }
                if (data.data?.stats) {
                    setStats((current) => ({ ...current, ...data.data.stats }));
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const exportCsv = () => {
        const headers = ['User', 'Email', 'Event Type', 'Action', 'Resource', 'Resource ID', 'Severity', 'Status', 'IP', 'Location', 'Timestamp'];
        const rows = auditLogs.map((log) => [
            log.user_name || 'System',
            log.user_email || '',
            log.event_type || '',
            log.action || '',
            log.resource || log.resource_type || '',
            log.resource_id || '',
            log.severity || '',
            log.status || '',
            log.ip_address || '',
            [log.location_city, log.location_country].filter(Boolean).join(', '),
            log.created_at || ''
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getActionBadgeClass = (action) => {
        switch (action) {
            case 'CREATE': return styles.badgeCreate;
            case 'UPDATE': return styles.badgeUpdate;
            case 'DELETE': return styles.badgeDelete;
            case 'LOGIN': return styles.badgeLogin;
            case 'EXPORT': return styles.badgeExport;
            default: return styles.badgeDefault;
        }
    };

    const getSeverityBadgeClass = (severity) => {
        switch (severity) {
            case 'CRITICAL': return styles.severityCritical;
            case 'HIGH': return styles.severityHigh;
            case 'MEDIUM': return styles.severityMedium;
            default: return styles.severityLow;
        }
    };

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'No activity yet';
        const now = new Date();
        const date = new Date(timestamp);
        const diffInMinutes = Math.floor((now - date) / 60000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
        return date.toLocaleDateString();
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const getUserInitials = (name) => {
        if (!name) return 'SY';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const renderJsonPreview = (value) => {
        if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
            return <span className={styles.emptyDetail}>No data captured</span>;
        }

        return (
            <pre className={styles.detailJson}>
                {JSON.stringify(value, null, 2)}
            </pre>
        );
    };

    if (loading && auditLogs.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading audit logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.liveIndicator}>
                        <span className={styles.liveDot}></span>
                        <span className={styles.liveText}>LIVE ACTIVITY</span>
                    </div>
                    <h1 className={styles.title}>System Audit Logs</h1>
                </div>
                <div className={styles.headerRight}>
                    <label className={styles.autoRefreshToggle}>
                        <span>Auto-Refresh</span>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(event) => setAutoRefresh(event.target.checked)}
                        />
                        <span className={styles.toggleSlider}></span>
                    </label>
                    <button className={styles.exportBtn} onClick={exportCsv}>
                        Export CSV
                    </button>
                </div>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.statsGrid}>
                <button className={styles.statCard} onClick={() => updateFilter('resource', '')}>
                    <div className={styles.statLabel}>Tracked Events</div>
                    <div className={styles.statNumber}>{stats.totalEvents}</div>
                    <div className={styles.statSubtext}>{trackedEventCount} event types configured</div>
                </button>
                <button className={styles.statCard} onClick={() => updateFilter('resource', 'INVENTORY')}>
                    <div className={styles.statLabel}>Inventory & Products</div>
                    <div className={styles.statNumber}>{stats.inventory + stats.products}</div>
                    <div className={styles.statSubtext}>Stock, product and batch actions</div>
                </button>
                <button className={styles.statCard} onClick={() => updateFilter('severity', 'HIGH')}>
                    <div className={styles.statLabel}>High Risk</div>
                    <div className={styles.statNumber}>{stats.highRisk}</div>
                    <div className={styles.statSubtext}>Critical deletes, failures and access changes</div>
                </button>
                <button className={styles.statCard} onClick={() => updateFilter('status', 'FAILURE')}>
                    <div className={styles.statLabel}>Failed Events</div>
                    <div className={styles.statNumber}>{stats.failedEvents}</div>
                    <div className={styles.statSubtext}>Last active {formatTimeAgo(stats.lastActiveAt)}</div>
                </button>
            </div>

            <div className={styles.insightGrid}>
                <div className={styles.insightPanel}>
                    <div className={styles.panelHeader}>
                        <span>Module Coverage</span>
                        <strong>{stats.orders + stats.dispatches + stats.returns + stats.damageReports + stats.userActions}</strong>
                    </div>
                    <div className={styles.modulePills}>
                        <button onClick={() => updateFilter('resource', 'ORDER')}>Orders {stats.orders}</button>
                        <button onClick={() => updateFilter('resource', 'DISPATCH')}>Dispatch {stats.dispatches}</button>
                        <button onClick={() => updateFilter('resource', 'RETURN')}>Returns {stats.returns}</button>
                        <button onClick={() => updateFilter('resource', 'DAMAGE')}>Damage {stats.damageReports}</button>
                        <button onClick={() => updateFilter('resource', 'USER')}>Users {stats.userActions}</button>
                    </div>
                </div>
                <div className={styles.insightPanel}>
                    <div className={styles.panelHeader}>
                        <span>Events To Track</span>
                        <strong>{trackedEventCount}</strong>
                    </div>
                    <div className={styles.eventCatalog}>
                        {eventCatalog.map((group) => (
                            <details key={group.group}>
                                <summary>{group.group}</summary>
                                <div>
                                    {group.events.slice(0, 12).map((eventName) => (
                                        <button key={eventName} onClick={() => updateFilter('search', eventName)}>
                                            {eventName}
                                        </button>
                                    ))}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.filtersCard}>
                <div className={styles.filtersRow}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Filter by user, event, IP, resource, metadata..."
                            value={filters.search}
                            onChange={(event) => updateFilter('search', event.target.value)}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Action</label>
                        <select value={filters.action} onChange={(event) => updateFilter('action', event.target.value)}>
                            <option value="">All</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                            <option value="EXPORT">Export</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Resource</label>
                        <select value={filters.resource} onChange={(event) => updateFilter('resource', event.target.value)}>
                            <option value="">All Resources</option>
                            <option value="USER">User</option>
                            <option value="ROLE">Role</option>
                            <option value="PERMISSION">Permission</option>
                            <option value="PRODUCT">Product</option>
                            <option value="INVENTORY">Inventory</option>
                            <option value="ORDER">Order</option>
                            <option value="DISPATCH">Dispatch</option>
                            <option value="RETURN">Return</option>
                            <option value="DAMAGE">Damage</option>
                            <option value="BILLING">Billing</option>
                            <option value="WEBSITE">Website</option>
                            <option value="SUPPORT">Support</option>
                            <option value="API">API</option>
                            <option value="SECURITY">Security</option>
                            <option value="SYSTEM">System</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Risk</label>
                        <select value={filters.severity} onChange={(event) => updateFilter('severity', event.target.value)}>
                            <option value="">All</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Status</label>
                        <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
                            <option value="">All</option>
                            <option value="SUCCESS">Success</option>
                            <option value="FAILURE">Failure</option>
                            <option value="PENDING">Pending</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Date</label>
                        <select value={filters.dateRange} onChange={(event) => updateFilter('dateRange', event.target.value)}>
                            <option value="">All Time</option>
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Event</th>
                            <th>Resource</th>
                            <th>Risk</th>
                            <th>Metadata</th>
                            <th>Timestamp</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className={styles.emptyState}>
                                    <div>
                                        <h3>No audit logs found</h3>
                                        <p>No activities match your current filters.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            auditLogs.map((log) => {
                                const isExpanded = expandedLogId === log.id;
                                return (
                                    <Fragment key={log.id}>
                                        <tr className={styles.tableRow}>
                                            <td>
                                                <div className={styles.userCell}>
                                                    <div className={styles.userInitials}>
                                                        {getUserInitials(log.user_name)}
                                                    </div>
                                                    <div className={styles.userInfo}>
                                                        <div className={styles.userName}>{log.user_name || 'System'}</div>
                                                        <div className={styles.userEmail}>{log.user_email || 'system@company.com'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.eventCell}>
                                                    <span className={`${styles.actionBadge} ${getActionBadgeClass(log.action)}`}>
                                                        {log.action || 'OTHER'}
                                                    </span>
                                                    <span>{log.event_type || `${log.action || 'EVENT'}_${log.resource || log.resource_type || 'RESOURCE'}`}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.resourceCell}>
                                                    <div className={styles.resourceName}>{log.resource || log.resource_type || 'SYSTEM'} {log.resource_id ? `#${log.resource_id}` : ''}</div>
                                                    <div className={styles.resourceDesc}>{log.request_method || 'SYSTEM'} {log.request_url || 'Dashboard event'}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.riskCell}>
                                                    <span className={`${styles.severityBadge} ${getSeverityBadgeClass(log.severity)}`}>
                                                        {log.severity || 'LOW'}
                                                    </span>
                                                    <span className={log.status === 'FAILURE' ? styles.statusFailure : styles.statusSuccess}>
                                                        {log.status || 'SUCCESS'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.metadataCell}>
                                                    <div className={styles.metadataRow}>
                                                        <span className={styles.metadataLabel}>IP:</span>
                                                        <span className={styles.metadataValue}>{log.ip_address || 'N/A'}</span>
                                                    </div>
                                                    <div className={styles.metadataRow}>
                                                        <span className={styles.metadataLabel}>Location:</span>
                                                        <span className={styles.metadataValue}>
                                                            {[log.location_city, log.location_country].filter(Boolean).join(', ') || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.timestampCell}>
                                                    <div className={styles.timeAgo}>{formatTimeAgo(log.created_at)}</div>
                                                    <div className={styles.timeExact}>{formatTimestamp(log.created_at)}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className={`${styles.expandBtn} ${isExpanded ? styles.expandBtnOpen : ''}`}
                                                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                    aria-label="View audit details"
                                                >
                                                    &gt;
                                                </button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className={styles.detailRow}>
                                                <td colSpan="7">
                                                    <div className={styles.detailGrid}>
                                                        <div>
                                                            <h4>Before</h4>
                                                            {renderJsonPreview(log.old_values)}
                                                        </div>
                                                        <div>
                                                            <h4>After</h4>
                                                            {renderJsonPreview(log.new_values)}
                                                        </div>
                                                        <div>
                                                            <h4>Details</h4>
                                                            {renderJsonPreview(log.details)}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            className={styles.paginationBtn}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <div className={styles.paginationInfo}>
                            Page {currentPage} of {totalPages} ({totalRecords} total records)
                        </div>
                        <button
                            className={styles.paginationBtn}
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
