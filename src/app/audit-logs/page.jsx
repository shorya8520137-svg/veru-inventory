'use client';

import { useState, useEffect } from 'react';
import styles from './audit-logs.module.css';

export default function AuditLogsPage() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        dateRange: '',
        search: ''
    });

    // Stats
    const [stats, setStats] = useState({
        properties: 10,
        returns: 0,
        damageReports: 0,
        userActions: 4
    });

    useEffect(() => {
        fetchAuditLogs();
    }, [filters]);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const queryParams = new URLSearchParams();
            if (filters.action) queryParams.append('action', filters.action);
            if (filters.resource) queryParams.append('resource', filters.resource);
            if (filters.search) queryParams.append('search', filters.search);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE}/api/audit-logs?${queryParams}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch audit logs');

            const data = await response.json();
            if (data.success) {
                setAuditLogs(data.data?.logs || []);
                if (data.data?.stats) {
                    setStats(data.data.stats);
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadgeClass = (action) => {
        switch (action) {
            case 'CREATE': return styles.badgeCreate;
            case 'UPDATE': return styles.badgeUpdate;
            case 'DELETE': return styles.badgeDelete;
            case 'LOGIN': return styles.badgeLogin;
            default: return styles.badgeDefault;
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const date = new Date(timestamp);
        const diffInMinutes = Math.floor((now - date) / 60000);
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }) + ' GMT';
    };

    const getUserInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
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
            {/* Header */}
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
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        <span className={styles.toggleSlider}></span>
                    </label>
                    <button className={styles.exportBtn}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Properties</div>
                    <div className={styles.statNumber}>{stats.properties}</div>
                    <div className={styles.statChange}>
                        <span className={styles.statChangePositive}>↗ 24% vs last month</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Returns</div>
                    <div className={styles.statNumber}>{stats.returns}</div>
                    <div className={styles.statSubtext}>No activity recorded</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Damage Reports</div>
                    <div className={styles.statNumber}>{stats.damageReports}</div>
                    <div className={styles.statSubtext}>Healthy state</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>User Actions</div>
                    <div className={styles.statNumber}>{stats.userActions}</div>
                    <div className={styles.statChange}>
                        <span className={styles.statChangeInfo}>🕐 Last active 2m ago</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filtersCard}>
                <div className={styles.filtersRow}>
                    <div className={styles.searchBox}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Filter logs by any keyword..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>ACTION</label>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        >
                            <option value="">All</option>
                            <option value="CREATE">CREATE</option>
                            <option value="UPDATE">UPDATE</option>
                            <option value="DELETE">DELETE</option>
                            <option value="LOGIN">LOGIN</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>RESOURCE</label>
                        <select
                            value={filters.resource}
                            onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
                        >
                            <option value="">All Resources</option>
                            <option value="USER">User</option>
                            <option value="PRODUCT">Product</option>
                            <option value="ORDER">Order</option>
                            <option value="INVENTORY">Inventory</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>DATE</label>
                        <div className={styles.dateRange}>
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>Oct 24 - Oct 25</span>
                        </div>
                    </div>

                    <button className={styles.filterToggle}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Audit Table */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>USER</th>
                            <th>ACTION</th>
                            <th>RESOURCE</th>
                            <th>METADATA</th>
                            <th>TIMESTAMP</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className={styles.emptyState}>
                                    <div>
                                        <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                        </svg>
                                        <h3>No audit logs found</h3>
                                        <p>No activities match your current filters.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            auditLogs.map((log) => (
                                <tr key={log.id} className={styles.tableRow}>
                                    <td>
                                        <div className={styles.userCell}>
                                            {log.user_avatar ? (
                                                <img src={log.user_avatar} alt={log.user_name} className={styles.userAvatar} />
                                            ) : (
                                                <div className={styles.userInitials}>
                                                    {getUserInitials(log.user_name)}
                                                </div>
                                            )}
                                            <div className={styles.userInfo}>
                                                <div className={styles.userName}>{log.user_name || 'System'}</div>
                                                <div className={styles.userEmail}>{log.user_email || 'system@company.com'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.actionBadge} ${getActionBadgeClass(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.resourceCell}>
                                            <div className={styles.resourceName}>{log.resource} #{log.resource_id}</div>
                                            <div className={styles.resourceDesc}>
                                                {log.resource === 'PRODUCT' && 'Inventory Update'}
                                                {log.resource === 'ORDER' && 'Status: Shipped'}
                                                {log.resource === 'USER' && 'Account'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.metadataCell}>
                                            <div className={styles.metadataRow}>
                                                <span className={styles.metadataLabel}>IP:</span>
                                                <span className={styles.metadataValue}>{log.ip_address || '192.168.1.1'}</span>
                                            </div>
                                            <div className={styles.metadataRow}>
                                                <span className={styles.metadataLabel}>Location:</span>
                                                <span className={styles.metadataValue}>
                                                    {log.location_city || 'London'}, {log.location_country || 'UK'}
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
                                        <button className={styles.expandBtn}>
                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
