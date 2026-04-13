import { useState, useEffect } from 'react';
import styles from './permissions.module.css';

export function EnhancedAuditTab({ auditLogs, loading, onRefresh }) {
    const [filters, setFilters] = useState({
        action: 'all',
        resource: 'all',
        dateFrom: '',
        dateTo: '',
        search: ''
    });

    const [filteredLogs, setFilteredLogs] = useState(auditLogs);

    useEffect(() => {
        applyFilters();
    }, [auditLogs, filters]);

    const applyFilters = () => {
        let filtered = [...auditLogs];

        // Filter by action
        if (filters.action !== 'all') {
            filtered = filtered.filter(log => log.action === filters.action);
        }

        // Filter by resource
        if (filters.resource !== 'all') {
            filtered = filtered.filter(log => log.resource === filters.resource);
        }

        // Filter by date range
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filtered = filtered.filter(log => new Date(log.created_at) >= fromDate);
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(log => new Date(log.created_at) <= toDate);
        }

        // Filter by search (user email or name)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(log => 
                (log.user_email && log.user_email.toLowerCase().includes(searchLower)) ||
                (log.user_name && log.user_name.toLowerCase().includes(searchLower))
            );
        }

        setFilteredLogs(filtered);
    };

    const clearFilters = () => {
        setFilters({
            action: 'all',
            resource: 'all',
            dateFrom: '',
            dateTo: '',
            search: ''
        });
    };

    const formatAuditMessage = (log) => {
        let details = {};
        try {
            if (typeof log.details === 'string') {
                details = JSON.parse(log.details);
            } else if (typeof log.details === 'object') {
                details = log.details;
            }
        } catch (e) {
            details = {};
        }

        const user = log.user_email || log.user_name || 'System';
        const action = log.action;
        const resource = log.resource;
        const resourceId = log.resource_id;

        // Format message based on action and resource
        if (action === 'CREATE' && resource === 'USER') {
            const userName = details.name || details.email || 'User';
            const userEmail = details.email || '';
            return `User "${userName}" (${userEmail}) created by ${user}`;
        } else if (action === 'DELETE' && resource === 'USER') {
            return `User (ID: ${resourceId}) deleted by ${user}`;
        } else if (action === 'UPDATE' && resource === 'USER') {
            const userName = details.name || 'User';
            const userEmail = details.email || '';
            return `User "${userName}" (${userEmail}) updated by ${user}`;
        } else if (action === 'LOGIN') {
            return `${user} logged in`;
        } else if (action === 'LOGOUT') {
            return `${user} logged out`;
        } else if (action === 'CREATE' && resource === 'ROLE') {
            const roleName = details.displayName || details.name || 'Role';
            return `Role "${roleName}" created by ${user}`;
        } else if (action === 'UPDATE' && resource === 'ROLE') {
            const roleName = details.displayName || details.name || 'Role';
            return `Role "${roleName}" updated by ${user}`;
        } else if (action === 'DELETE' && resource === 'ROLE') {
            return `Role (ID: ${resourceId}) deleted by ${user}`;
        } else {
            return `[${action}] ${user} - ${resource} ${resourceId}`;
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'LOGIN': return '#10b981';
            case 'LOGOUT': return '#6b7280';
            case 'CREATE': return '#3b82f6';
            case 'UPDATE': return '#f59e0b';
            case 'DELETE': return '#ef4444';
            default: return '#8b5cf6';
        }
    };

    const getAuditIcon = (action) => {
        switch (action) {
            case 'LOGIN': return '🔑';
            case 'LOGOUT': return '🚪';
            case 'CREATE': return '➕';
            case 'UPDATE': return '✏️';
            case 'DELETE': return '🗑️';
            default: return '📝';
        }
    };

    // Get unique actions and resources for filter dropdowns
    const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
    const uniqueResources = [...new Set(auditLogs.map(log => log.resource))];

    if (loading) {
        return <div className={styles.loading}>Loading audit logs...</div>;
    }

    return (
        <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
                <h2>Audit Logs</h2>
                <div className={styles.auditStats}>
                    <span>{filteredLogs.length} of {auditLogs.length} activities</span>
                    <button className={styles.refreshButton} onClick={onRefresh}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filtersContainer}>
                <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                        <label>Action</label>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Actions</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Resource</label>
                        <select
                            value={filters.resource}
                            onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Resources</option>
                            {uniqueResources.map(resource => (
                                <option key={resource} value={resource}>{resource}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>From Date</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className={styles.filterInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>To Date</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            className={styles.filterInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Search User</label>
                        <input
                            type="text"
                            placeholder="Search by email or name..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className={styles.filterInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>&nbsp;</label>
                        <button onClick={clearFilters} className={styles.clearButton}>
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Logs List */}
            <div className={styles.auditContainer}>
                {filteredLogs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <h3>No audit logs found</h3>
                        <p>Try adjusting your filters or refresh the page</p>
                    </div>
                ) : (
                    filteredLogs.map((log, index) => (
                        <div key={index} className={styles.auditItem}>
                            <div 
                                className={styles.auditIcon}
                                style={{ backgroundColor: getActionColor(log.action) + '20', color: getActionColor(log.action) }}
                            >
                                {getAuditIcon(log.action)}
                            </div>
                            <div className={styles.auditContent}>
                                <div className={styles.auditMessage}>
                                    {formatAuditMessage(log)}
                                </div>
                                <div className={styles.auditMeta}>
                                    <span className={styles.auditAction} style={{ color: getActionColor(log.action) }}>
                                        {log.action}
                                    </span>
                                    <span className={styles.auditResource}>
                                        {log.resource}
                                    </span>
                                    <span className={styles.auditTime}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
