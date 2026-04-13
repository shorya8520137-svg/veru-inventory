"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import styles from "./permissions.module.css";

export default function PermissionsPage() {
    const { user, hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState("users");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Users state
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    
    // Roles state
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    
    // Permissions state
    const [permissions, setPermissions] = useState([]);
    const [rolePermissions, setRolePermissions] = useState({});
    
    // Audit logs state
    const [auditLogs, setAuditLogs] = useState([]);
    
    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        type: null, // 'user' or 'role'
        item: null,
        isLoading: false
    });

    // Check permissions
    const canManageUsers = hasPermission('SYSTEM_USER_MANAGEMENT');
    const canManageRoles = hasPermission('SYSTEM_ROLE_MANAGEMENT');
    const canViewAudit = hasPermission('SYSTEM_AUDIT_LOG');

    useEffect(() => {
        if (!canManageUsers && !canManageRoles && !canViewAudit) {
            setError("You don't have permission to access this page");
            return;
        }
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes, permissionsRes] = await Promise.all([
                canManageUsers ? api.getUsers() : Promise.resolve({ data: [] }),
                api.getRoles(),
                api.getPermissions()
            ]);
            
            setUsers(usersRes.data || []);
            setRoles(rolesRes.data || []);
            setPermissions(permissionsRes.data?.permissions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadAuditLogs = async () => {
        if (!canViewAudit) return;
        try {
            const response = await api.getAuditLogs({ limit: 50 });
            setAuditLogs(response.data?.logs || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCreateUser = async (userData) => {
        try {
            await api.createUser(userData);
            await loadInitialData();
            setShowUserModal(false);
            setSelectedUser(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateUser = async (userData) => {
        try {
            await api.updateUser(selectedUser.id, userData);
            await loadInitialData();
            setShowUserModal(false);
            setSelectedUser(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        setDeleteModal({
            isOpen: true,
            type: 'user',
            item: user,
            isLoading: false
        });
    };

    const handleDeleteRole = async (roleId) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;
        
        setDeleteModal({
            isOpen: true,
            type: 'role',
            item: role,
            isLoading: false
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.item) return;
        
        setDeleteModal(prev => ({ ...prev, isLoading: true }));
        
        try {
            if (deleteModal.type === 'user') {
                await api.deleteUser(deleteModal.item.id);
            } else if (deleteModal.type === 'role') {
                await api.deleteRole(deleteModal.item.id);
            }
            
            await loadInitialData();
            setDeleteModal({ isOpen: false, type: null, item: null, isLoading: false });
        } catch (err) {
            setError(err.message);
            setDeleteModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ isOpen: false, type: null, item: null, isLoading: false });
    };

    const handleCreateRole = async (roleData) => {
        try {
            await api.createRole(roleData);
            await loadInitialData();
            setShowRoleModal(false);
            setSelectedRole(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateRole = async (roleData) => {
        try {
            await api.updateRole(selectedRole.id, roleData);
            await loadInitialData();
            setShowRoleModal(false);
            setSelectedRole(null);
        } catch (err) {
            setError(err.message);
        }
    };

    if (error && !canManageUsers && !canManageRoles && !canViewAudit) {
        return (
            <div className={styles.container}>
                <div className={styles.errorCard}>
                    <div className={styles.errorIcon}>🔒</div>
                    <h2>Access Denied</h2>
                    <p>You don't have permission to access the permissions management page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Mobile Overlay */}
            <div 
                className={`${styles.mobileOverlay} ${sidebarOpen ? styles.open : ''}`}
                onClick={() => setSidebarOpen(false)}
            />
            
            <div className={styles.layout}>
                {/* Mobile Menu Button */}
                <button 
                    className={styles.mobileMenuButton}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M3 6a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM3 18a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Sidebar */}
                <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.sidebarLogo}>
                            <div className={styles.logoIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                </svg>
                            </div>
                            <span>Permissions</span>
                        </div>
                    </div>

                    <nav className={styles.sidebarNav}>
                        {canManageUsers && (
                            <button
                                className={`${styles.navItem} ${activeTab === "users" ? styles.active : ""}`}
                                onClick={() => setActiveTab("users")}
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                                <span>Users</span>
                            </button>
                        )}
                        {canManageRoles && (
                            <button
                                className={`${styles.navItem} ${activeTab === "roles" ? styles.active : ""}`}
                                onClick={() => setActiveTab("roles")}
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>Roles</span>
                            </button>
                        )}
                        <button
                            className={`${styles.navItem} ${activeTab === "permissions" ? styles.active : ""}`}
                            onClick={() => setActiveTab("permissions")}
                        >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Permissions</span>
                        </button>
                        {canViewAudit && (
                            <button
                                className={`${styles.navItem} ${activeTab === "audit" ? styles.active : ""}`}
                                onClick={() => {
                                    setActiveTab("audit");
                                    loadAuditLogs();
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span>Audit Logs</span>
                            </button>
                        )}
                    </nav>

                    {/* User Profile Section */}
                    <div className={styles.userProfile}>
                        <div className={styles.profileCard} onClick={() => setShowProfileModal(true)}>
                            <div className={styles.profileAvatar}>
                                {user?.profile_image ? (
                                    <img 
                                        src={`${process.env.NEXT_PUBLIC_API_BASE}${user.profile_image}`} 
                                        alt={user.name}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={styles.profileInitials} style={{display: user?.profile_image ? 'none' : 'flex'}}>
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                            </div>
                            <div className={styles.profileInfo}>
                                <div className={styles.profileName}>{user?.name}</div>
                                <div className={styles.profileRole}>{user?.role_display_name || user?.role_name}</div>
                            </div>
                            <svg className={styles.profileEdit} width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className={styles.mainContent}>


                    {error && (
                        <div className={styles.errorMessage}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                            <button onClick={() => setError("")} className={styles.errorClose}>×</button>
                        </div>
                    )}

                    <div className={styles.content}>
                        {activeTab === "users" && canManageUsers && (
                            <UsersTab
                                users={users}
                                roles={roles}
                                onCreateUser={() => {
                                    setSelectedUser(null);
                                    setShowUserModal(true);
                                }}
                                onEditUser={(user) => {
                                    setSelectedUser(user);
                                    setShowUserModal(true);
                                }}
                                onDeleteUser={handleDeleteUser}
                                loading={loading}
                            />
                        )}

                        {activeTab === "roles" && canManageRoles && (
                            <RolesTab
                                roles={roles}
                                permissions={permissions}
                                onCreateRole={() => {
                                    setSelectedRole(null);
                                    setShowRoleModal(true);
                                }}
                                onEditRole={(role) => {
                                    setSelectedRole(role);
                                    setShowRoleModal(true);
                                }}
                                onDeleteRole={handleDeleteRole}
                                loading={loading}
                            />
                        )}

                        {activeTab === "permissions" && (
                            <PermissionsTab permissions={permissions} loading={loading} />
                        )}

                        {activeTab === "audit" && canViewAudit && (
                            <AuditTab auditLogs={auditLogs} loading={loading} />
                        )}
                    </div>
                </div>
            </div>

            {/* User Modal */}
            {showUserModal && (
                <UserModal
                    user={selectedUser}
                    roles={roles}
                    onSave={selectedUser ? handleUpdateUser : handleCreateUser}
                    onClose={() => {
                        setShowUserModal(false);
                        setSelectedUser(null);
                    }}
                />
            )}

            {/* Role Modal */}
            {showRoleModal && (
                <RoleModal
                    role={selectedRole}
                    permissions={permissions}
                    onSave={selectedRole ? handleUpdateRole : handleCreateRole}
                    onClose={() => {
                        setShowRoleModal(false);
                        setSelectedRole(null);
                    }}
                />
            )}

            {/* Profile Modal */}
            {showProfileModal && (
                <ProfileModal
                    user={user}
                    onClose={() => setShowProfileModal(false)}
                    onUpdate={loadInitialData}
                />
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title={deleteModal.type === 'user' ? 'Delete User' : 'Delete Role'}
                message={
                    deleteModal.type === 'user' 
                        ? 'Are you sure you want to delete this user account?' 
                        : 'Are you sure you want to delete this role?'
                }
                itemName={deleteModal.item?.name || deleteModal.item?.display_name || ''}
                itemType={deleteModal.type || 'item'}
                details={
                    deleteModal.type === 'user' && deleteModal.item ? {
                        'Email': deleteModal.item.email,
                        'Role': deleteModal.item.role_display_name || deleteModal.item.role_name,
                        'Status': deleteModal.item.status === 'active' ? 'Active' : 'Inactive',
                        'Last Login': deleteModal.item.last_login ? new Date(deleteModal.item.last_login).toLocaleDateString() : 'Never'
                    } : deleteModal.type === 'role' && deleteModal.item ? {
                        'Display Name': deleteModal.item.display_name,
                        'Description': deleteModal.item.description || 'No description',
                        'Users': `${deleteModal.item.user_count || 0} users assigned`
                    } : null
                }
                isLoading={deleteModal.isLoading}
                destructive={true}
            />
        </div>
    );
}

// Users Tab Component
function UsersTab({ users, roles, onCreateUser, onEditUser, onDeleteUser, loading }) {
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading users...</p>
            </div>
        );
    }

    return (
        <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
                <div className={styles.headerInfo}>
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>{users.length}</span>
                            <span className={styles.statLabel}>Total</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>{users.filter(u => u.is_active).length}</span>
                            <span className={styles.statLabel}>Active</span>
                        </div>
                    </div>
                </div>
                <button className={styles.profileIconButton} onClick={onCreateUser} title="Add User">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td data-label="User">
                                    <div className={styles.userInfo}>
                                        <div className={styles.userAvatar}>
                                            {user.profile_image ? (
                                                <img 
                                                    src={`${process.env.NEXT_PUBLIC_API_BASE}${user.profile_image}`} 
                                                    alt={user.name}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className={styles.userInitials} style={{display: user.profile_image ? 'none' : 'flex'}}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        <div className={styles.userDetails}>
                                            <span className={styles.userName}>{user.name}</span>
                                            <span className={styles.userMeta}>ID: {user.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Email">
                                    <span className={styles.userEmail}>{user.email}</span>
                                </td>
                                <td data-label="Role">
                                    <span className={`${styles.roleBadge} ${styles[user.role_name]}`}>
                                        {user.role_display_name || user.role_name}
                                    </span>
                                </td>
                                <td data-label="Status">
                                    <div className={`${styles.statusDot} ${user.is_active ? styles.active : styles.inactive}`}></div>
                                </td>
                                <td data-label="Last Login">
                                    <span className={styles.lastLogin}>
                                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                    </span>
                                </td>
                                <td data-label="Actions">
                                    <div className={styles.actions}>
                                        <button
                                            className={styles.editButton}
                                            onClick={() => onEditUser(user)}
                                            title="Edit User"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            className={styles.deleteButton}
                                            onClick={() => onDeleteUser(user.id)}
                                            title="Delete User"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Roles Tab Component
function RolesTab({ roles, permissions, onCreateRole, onEditRole, onDeleteRole, loading }) {
    if (loading) {
        return <div className={styles.loading}>Loading roles...</div>;
    }

    return (
        <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
                <div className={styles.headerInfo}>
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>{roles.length}</span>
                            <span className={styles.statLabel}>Total</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>{roles.filter(r => r.user_count > 0).length}</span>
                            <span className={styles.statLabel}>Active</span>
                        </div>
                    </div>
                </div>
                <button className={styles.profileIconButton} onClick={onCreateRole} title="Add Role">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Role</th>
                            <th>Description</th>
                            <th>Users</th>
                            <th>Permissions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role) => (
                            <tr key={role.id}>
                                <td data-label="Role">
                                    <div className={styles.roleInfo}>
                                        <div 
                                            className={styles.roleIcon} 
                                            style={{ backgroundColor: role.color || '#6366f1' }}
                                        >
                                            {role.display_name?.charAt(0) || role.name?.charAt(0)}
                                        </div>
                                        <div className={styles.roleDetails}>
                                            <span className={styles.roleName}>{role.display_name || role.name}</span>
                                            <span className={styles.roleMeta}>ID: {role.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Description">
                                    <span className={styles.roleDescription}>
                                        {role.description || 'No description'}
                                    </span>
                                </td>
                                <td data-label="Users">
                                    <span className={styles.statNumber}>{role.user_count || 0}</span>
                                </td>
                                <td data-label="Permissions">
                                    <span className={styles.statNumber}>{role.permission_count || 0}</span>
                                </td>
                                <td data-label="Actions">
                                    <div className={styles.actions}>
                                        <button
                                            className={styles.editButton}
                                            onClick={() => onEditRole(role)}
                                            title="Edit Role"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            className={styles.deleteButton}
                                            onClick={() => onDeleteRole(role.id)}
                                            title="Delete Role"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Permissions Tab Component
function PermissionsTab({ permissions, loading }) {
    if (loading) {
        return <div className={styles.loading}>Loading permissions...</div>;
    }

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, permission) => {
        const category = permission.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
    }, {});

    return (
        <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
                <h2>System Permissions</h2>
                <div className={styles.permissionStats}>
                    <span>{permissions.length} total permissions</span>
                    <span>{Object.keys(groupedPermissions).length} categories</span>
                </div>
            </div>

            <div className={styles.permissionsContainer}>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className={styles.permissionCategory}>
                        <h3 className={styles.categoryTitle}>{category}</h3>
                        <div className={styles.permissionsList}>
                            {perms.map((permission) => (
                                <div key={permission.id} className={styles.permissionItem}>
                                    <div className={styles.permissionInfo}>
                                        <span className={styles.permissionName}>{permission.display_name}</span>
                                        <span className={styles.permissionCode}>{permission.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Audit Tab Component
function AuditTab({ auditLogs, loading }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('');
    
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading audit logs...</p>
            </div>
        );
    }

    // Filter logs based on search and action filter
    const filteredLogs = auditLogs.filter(log => {
        const matchesSearch = !searchTerm || 
            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesAction = !filterAction || log.action === filterAction;
        
        return matchesSearch && matchesAction;
    });

    // Get unique actions for filter dropdown
    const uniqueActions = [...new Set(auditLogs.map(log => log.action))].filter(Boolean);

    // Helper function to create user-friendly description
    const getDescription = (log) => {
        const details = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : (log.details || {});
        
        switch (log.action) {
            case 'CREATE':
                if (log.resource === 'USER') {
                    return `Created user "${details.name}" with email ${details.email}`;
                }
                return `Created ${log.resource.toLowerCase()} ${log.resource_id}`;
            
            case 'UPDATE':
                if (log.resource === 'USER') {
                    return `Updated user ${details.name || log.resource_id}`;
                }
                return `Updated ${log.resource.toLowerCase()} ${log.resource_id}`;
            
            case 'DELETE':
                if (log.resource === 'ROLE') {
                    return `Deleted role ${log.resource_id}`;
                }
                return `Deleted ${log.resource.toLowerCase()} ${log.resource_id}`;
            
            case 'LOGIN':
                return `User logged into the system`;
            
            case 'DISPATCH':
                return `Dispatched ${details.quantity || 'items'} to ${details.warehouse || 'warehouse'}`;
            
            case 'RETURN':
                return `Processed return of ${details.quantity || 'items'} (${details.reason || 'No reason'})`;
            
            case 'DAMAGE':
                return `Reported damage for ${details.quantity || 'items'} at ${details.location || 'warehouse'}`;
            
            case 'BULK_UPLOAD':
                return `Uploaded bulk file "${details.filename}" with ${details.total_items || 'multiple'} items`;
            
            default:
                return `Performed ${log.action.toLowerCase()} on ${log.resource.toLowerCase()}`;
        }
    };

    // Helper function to get time ago
    const getTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return date.toLocaleDateString();
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
                <div className={styles.headerInfo}>
                    <h2>Audit Logs</h2>
                    <div className={styles.auditStats}>
                        <span>{filteredLogs.length} activities</span>
                    </div>
                </div>
                
                <div className={styles.auditFilters}>
                    <input
                        type="text"
                        placeholder="Search activities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">All Actions</option>
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.auditContainer}>
                {filteredLogs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <h3>No audit logs found</h3>
                        <p>No activities match your current filters.</p>
                    </div>
                ) : (
                    filteredLogs.map((log, index) => (
                        <div key={log.id || index} className={styles.auditItem}>
                            <div className={styles.auditIcon}>
                                {getAuditIcon(log.action)}
                            </div>
                            <div className={styles.auditContent}>
                                <div className={styles.auditHeader}>
                                    <span className={styles.auditDescription}>
                                        {getDescription(log)}
                                    </span>
                                    <span className={styles.auditTime}>
                                        {getTimeAgo(log.created_at)}
                                    </span>
                                </div>
                                <div className={styles.auditMeta}>
                                    <span className={styles.auditAction}>{log.action}</span>
                                    <span className={styles.auditResource}>{log.resource}</span>
                                    {log.ip_address && (
                                        <span className={styles.auditIp}>IP: {log.ip_address}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// User Modal Component
function UserModal({ user, roles, onSave, onClose }) {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role_id: user?.role_id || '',
        is_active: user?.is_active ?? true
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{user ? 'Edit User' : 'Create User'}</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label>Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Password {user && '(leave blank to keep current)'}</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!user}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Role</label>
                        <select
                            value={formData.role_id}
                            onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                            required
                        >
                            <option value="">Select a role</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.display_name || role.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            Active
                        </label>
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryButton} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.primaryButton}>
                            {user ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Role Modal Component
function RoleModal({ role, permissions, onSave, onClose }) {
    const [formData, setFormData] = useState({
        name: role?.name || '',
        display_name: role?.display_name || '',
        description: role?.description || '',
        color: role?.color || '#6366f1',
        permissionIds: role?.permissions?.map(p => p.id) || []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const togglePermission = (permissionId) => {
        const newPermissionIds = formData.permissionIds.includes(permissionId)
            ? formData.permissionIds.filter(id => id !== permissionId)
            : [...formData.permissionIds, permissionId];
        
        setFormData({ ...formData, permissionIds: newPermissionIds });
    };

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, permission) => {
        const category = permission.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
    }, {});

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{role ? 'Edit Role' : 'Create Role'}</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Display Name</label>
                            <input
                                type="text"
                                value={formData.display_name}
                                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Color</label>
                        <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Permissions</label>
                        <div className={styles.permissionsSelector}>
                            {Object.entries(groupedPermissions).map(([category, perms]) => (
                                <div key={category} className={styles.permissionCategory}>
                                    <h4>{category}</h4>
                                    <div className={styles.permissionCheckboxes}>
                                        {perms.map((permission) => (
                                            <label key={permission.id} className={styles.permissionCheckbox}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissionIds.includes(permission.id)}
                                                    onChange={() => togglePermission(permission.id)}
                                                />
                                                <span>{permission.display_name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryButton} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.primaryButton}>
                            {role ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Helper function for audit icons
function getAuditIcon(action) {
    switch (action) {
        case 'LOGIN':
            return (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            );
        case 'LOGOUT':
            return (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
            );
        case 'CREATE':
            return (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            );
        case 'UPDATE':
            return (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
            );
        case 'DELETE':
            return (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            );
        default:
            return (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            );
    }
}

// Profile Modal Component
function ProfileModal({ user, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        profile_image: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState(
        user?.profile_image ? `${process.env.NEXT_PUBLIC_API_BASE}${user.profile_image}` : null
    );

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size must be less than 5MB');
                return;
            }
            
            setFormData({ ...formData, profile_image: file });
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone || '');
            formDataToSend.append('address', formData.address || '');
            
            if (formData.profile_image) {
                formDataToSend.append('profile_image', formData.profile_image);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (data.success) {
                // Update user in localStorage
                const updatedUser = { ...user, ...data.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                onUpdate && onUpdate();
                onClose();
            } else {
                setError(data.message || 'Failed to update profile');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Edit Profile</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>
                
                {error && (
                    <div className={styles.errorMessage}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    {/* Profile Image Section */}
                    <div className={styles.profileImageSection}>
                        <div className={styles.imageUploadContainer}>
                            <div className={styles.imagePreview}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile" />
                                ) : (
                                    <div className={styles.imagePlaceholder}>
                                        <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                                <div className={styles.imageOverlay}>
                                    <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className={styles.imageInput}
                                id="profile-image"
                            />
                            <label htmlFor="profile-image" className={styles.imageUploadButton}>
                                Change Photo
                            </label>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Role</label>
                            <input
                                type="text"
                                value={user?.role_display_name || user?.role_name}
                                disabled
                                className={styles.disabledInput}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Address</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={3}
                            placeholder="Enter your address"
                        />
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryButton} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.primaryButton} disabled={loading}>
                            {loading ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    Updating...
                                </>
                            ) : (
                                'Update Profile'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}