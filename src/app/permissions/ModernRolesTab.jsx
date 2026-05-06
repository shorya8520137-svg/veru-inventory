'use client';

import { useState } from 'react';
import styles from './modernRoles.module.css';

export default function ModernRolesTab({ roles, permissions, onCreateRole, onEditRole, onDeleteRole, loading }) {
    const [activeFilter, setActiveFilter] = useState('active');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Calculate statistics
    const totalRoles = roles.length;
    const assignedUsers = roles.reduce((sum, role) => sum + (role.user_count || 0), 0);
    const newThisMonth = roles.filter(r => {
        const createdDate = new Date(r.created_at);
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && 
               createdDate.getFullYear() === now.getFullYear();
    }).length;
    const activePercentage = totalRoles > 0 ? Math.round((roles.filter(r => r.user_count > 0).length / totalRoles) * 100) : 0;

    // Filter roles
    const filteredRoles = roles.filter(role => {
        if (activeFilter === 'active') return (role.user_count || 0) > 0;
        if (activeFilter === 'draft') return (role.user_count || 0) === 0;
        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRoles = filteredRoles.slice(startIndex, startIndex + itemsPerPage);

    // Get security level badge
    const getSecurityLevel = (roleName) => {
        const criticalRoles = ['admin', 'super_admin', 'global_administrator'];
        const elevatedRoles = ['manager', 'supervisor'];
        
        if (criticalRoles.some(r => roleName?.toLowerCase().includes(r))) 
            return { label: 'Critical', color: '#EF4444' };
        if (elevatedRoles.some(r => roleName?.toLowerCase().includes(r))) 
            return { label: 'Elevated', color: '#F59E0B' };
        return { label: 'Standard', color: '#10B981' };
    };

    // Get role icon color
    const getRoleIconColor = (index) => {
        const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading roles...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                {/* Total Roles Card */}
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#EEF2FF' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5"></path>
                            <path d="M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statBadge} style={{ background: '#DBEAFE', color: '#1E40AF' }}>
                            +{newThisMonth} New This Month
                        </div>
                        <div className={styles.statLabel}>TOTAL ROLES</div>
                        <div className={styles.statValue}>{totalRoles}</div>
                    </div>
                </div>

                {/* Assigned Users Card */}
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#D1FAE5' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statBadge} style={{ background: '#D1FAE5', color: '#065F46' }}>
                            {activePercentage}% Active
                        </div>
                        <div className={styles.statLabel}>ASSIGNED USERS</div>
                        <div className={styles.statValue}>{assignedUsers}</div>
                    </div>
                </div>

                {/* Security Health Card */}
                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className={styles.securityContent}>
                        <div className={styles.securityIcon}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                <path d="M9 12l2 2 4-4"></path>
                            </svg>
                        </div>
                        <div className={styles.securityLabel}>SECURITY HEALTH</div>
                        <div className={styles.securityGrade}>Enterprise Grade</div>
                        <div className={styles.securityBadges}>
                            <span className={styles.securityBadge}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                2FA Enabled
                            </span>
                            <span className={styles.securityBadge}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                RBAC Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Directory Section */}
            <div className={styles.directorySection}>
                <div className={styles.directoryHeader}>
                    <div className={styles.directoryTitle}>
                        <h2>Role Directory</h2>
                        <div className={styles.filterTabs}>
                            <button 
                                className={`${styles.filterTab} ${activeFilter === 'active' ? styles.active : ''}`}
                                onClick={() => setActiveFilter('active')}
                            >
                                Active ({roles.filter(r => (r.user_count || 0) > 0).length})
                            </button>
                            <button 
                                className={`${styles.filterTab} ${activeFilter === 'draft' ? styles.active : ''}`}
                                onClick={() => setActiveFilter('draft')}
                            >
                                Draft ({roles.filter(r => (r.user_count || 0) === 0).length})
                            </button>
                        </div>
                    </div>
                    <div className={styles.directoryActions}>
                        <button className={styles.iconButton}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="4" y1="6" x2="20" y2="6"></line>
                                <line x1="4" y1="12" x2="20" y2="12"></line>
                                <line x1="4" y1="18" x2="20" y2="18"></line>
                            </svg>
                            Filter
                        </button>
                        <button className={styles.iconButton}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export
                        </button>
                        <button className={styles.createButton} onClick={onCreateRole}>
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create New Role
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ROLE NAME</th>
                                <th>ASSIGNED USERS</th>
                                <th>PERMISSIONS</th>
                                <th>SECURITY LEVEL</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRoles.map((role, index) => {
                                const security = getSecurityLevel(role.name);
                                const iconColor = getRoleIconColor(index);
                                return (
                                    <tr key={role.id}>
                                        <td>
                                            <div className={styles.roleCell}>
                                                <div className={styles.roleIcon} style={{ background: iconColor }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                                        <path d="M2 17l10 5 10-5"></path>
                                                        <path d="M2 12l10 5 10-5"></path>
                                                    </svg>
                                                </div>
                                                <div className={styles.roleInfo}>
                                                    <div className={styles.roleName}>{role.display_name || role.name}</div>
                                                    <div className={styles.roleDesc}>{role.description || 'Full system-wide access'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.usersCell}>
                                                {role.user_count > 0 ? (
                                                    <>
                                                        <div className={styles.userAvatars}>
                                                            <div className={styles.userAvatar}>U</div>
                                                            {role.user_count > 1 && (
                                                                <div className={styles.userCount}>+{role.user_count - 1}</div>
                                                            )}
                                                        </div>
                                                        <span className={styles.userCountText}>{role.user_count} Users</span>
                                                    </>
                                                ) : (
                                                    <span className={styles.noUsers}>No users</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.permissionsCell}>
                                                <span className={styles.permissionBadge}>All Resources</span>
                                                <span className={styles.permissionBadge}>Billing</span>
                                                {(role.permission_count || 0) > 2 && (
                                                    <span className={styles.permissionMore}>+{role.permission_count - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.securityBadgeCell}>
                                                <span 
                                                    className={styles.securityDot} 
                                                    style={{ background: security.color }}
                                                ></span>
                                                <span style={{ color: security.color, fontWeight: 600 }}>
                                                    {security.label}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.actionsCell}>
                                                <button 
                                                    className={styles.actionButton}
                                                    onClick={() => onEditRole(role)}
                                                    title="Edit Role"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button 
                                                    className={styles.actionButton}
                                                    title="More Options"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <circle cx="12" cy="5" r="2"></circle>
                                                        <circle cx="12" cy="12" r="2"></circle>
                                                        <circle cx="12" cy="19" r="2"></circle>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRoles.length)} of {filteredRoles.length} roles
                    </div>
                    <div className={styles.paginationControls}>
                        <button 
                            className={styles.pageButton}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        {[...Array(Math.min(totalPages, 3))].map((_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    className={`${styles.pageNumber} ${currentPage === pageNum ? styles.active : ''}`}
                                    onClick={() => setCurrentPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button 
                            className={styles.pageButton}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
