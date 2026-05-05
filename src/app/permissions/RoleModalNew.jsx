"use client";

import { useState, useEffect } from "react";
import styles from "./permissions.module.css";
import { apiRequest } from "@/utils/api";

/**
 * PROFESSIONAL ROLE MODAL WITH TABS AND WAREHOUSE DROPDOWN
 * - Tab-based permission organization
 * - Multi-select warehouse dropdown
 * - Dynamic loading from backend
 * - Production-ready UI
 */
export default function RoleModalNew({ role, permissions, onSave, onClose }) {
    const [activeTab, setActiveTab] = useState("system");
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [warehousePermissions, setWarehousePermissions] = useState({});
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        name: role?.name || '',
        display_name: role?.display_name || '',
        description: role?.description || '',
        color: role?.color || '#6366f1',
        permissionIds: role?.permissions?.map(p => p.id) || []
    });

    // Load warehouses on mount
    useEffect(() => {
        loadWarehouses();
    }, []);

    const loadWarehouses = async () => {
        try {
            setLoading(true);
            const response = await apiRequest('/api/warehouse-management/warehouses');
            setWarehouses(response.warehouses || []);
        } catch (error) {
            console.error('Failed to load warehouses:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group permissions by feature section
    const groupedPermissions = permissions.reduce((acc, permission) => {
        const section = permission.feature_section || 'OTHER';
        if (!acc[section]) {
            acc[section] = [];
        }
        // Exclude warehouse-specific permissions (handled separately)
        if (!permission.name.startsWith('WAREHOUSE_') || 
            permission.name === 'WAREHOUSE_MANAGEMENT' || 
            permission.name === 'STORE_MANAGEMENT') {
            acc[section].push(permission);
        }
        return acc;
    }, {});

    // Tab configuration
    const tabs = [
        { id: 'system', label: 'System', icon: '⚙️', section: 'SYSTEM' },
        { id: 'inventory', label: 'Inventory', icon: '📦', section: 'INVENTORY' },
        { id: 'products', label: 'Products', icon: '🏷️', section: 'PRODUCTS' },
        { id: 'orders', label: 'Orders', icon: '🛒', section: 'ORDERS' },
        { id: 'operations', label: 'Operations', icon: '🔄', section: 'OPERATIONS' },
        { id: 'warehouse', label: 'Warehouse Access', icon: '🏭', section: 'WAREHOUSE' },
        { id: 'website', label: 'Website', icon: '🌐', section: 'WEBSITE' },
        { id: 'support', label: 'Support', icon: '💬', section: 'CUSTOMER_SUPPORT' },
        { id: 'tickets', label: 'Tickets', icon: '🎫', section: 'TICKETS' },
        { id: 'billing', label: 'Billing', icon: '💰', section: 'BILLING' },
        { id: 'notifications', label: 'Notifications', icon: '🔔', section: 'NOTIFICATIONS' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Collect all permission IDs including warehouse permissions
        const allPermissionIds = [...formData.permissionIds];
        
        // Add warehouse permissions based on selections
        Object.entries(warehousePermissions).forEach(([warehouseCode, perms]) => {
            Object.entries(perms).forEach(([permType, isSelected]) => {
                if (isSelected) {
                    const permName = `WAREHOUSE_${warehouseCode}_${permType}`;
                    const perm = permissions.find(p => p.name === permName);
                    if (perm && !allPermissionIds.includes(perm.id)) {
                        allPermissionIds.push(perm.id);
                    }
                }
            });
        });
        
        onSave({ ...formData, permissionIds: allPermissionIds });
    };

    const togglePermission = (permissionId) => {
        const newPermissionIds = formData.permissionIds.includes(permissionId)
            ? formData.permissionIds.filter(id => id !== permissionId)
            : [...formData.permissionIds, permissionId];
        
        setFormData({ ...formData, permissionIds: newPermissionIds });
    };

    const toggleWarehouse = (warehouseCode) => {
        if (selectedWarehouses.includes(warehouseCode)) {
            setSelectedWarehouses(selectedWarehouses.filter(w => w !== warehouseCode));
            // Remove warehouse permissions
            const newWarehousePerms = { ...warehousePermissions };
            delete newWarehousePerms[warehouseCode];
            setWarehousePermissions(newWarehousePerms);
        } else {
            setSelectedWarehouses([...selectedWarehouses, warehouseCode]);
            // Initialize warehouse permissions
            setWarehousePermissions({
                ...warehousePermissions,
                [warehouseCode]: {
                    VIEW: false,
                    EDIT: false,
                    ORDERS_VIEW: false,
                    ORDERS_EDIT: false,
                    MANAGE: false,
                    REPORTS: false
                }
            });
        }
    };

    const toggleWarehousePermission = (warehouseCode, permType) => {
        setWarehousePermissions({
            ...warehousePermissions,
            [warehouseCode]: {
                ...warehousePermissions[warehouseCode],
                [permType]: !warehousePermissions[warehouseCode]?.[permType]
            }
        });
    };

    const selectAllInTab = () => {
        const currentTab = tabs.find(t => t.id === activeTab);
        if (!currentTab) return;
        
        const sectionPerms = groupedPermissions[currentTab.section] || [];
        const sectionPermIds = sectionPerms.map(p => p.id);
        
        // Check if all are selected
        const allSelected = sectionPermIds.every(id => formData.permissionIds.includes(id));
        
        if (allSelected) {
            // Deselect all
            setFormData({
                ...formData,
                permissionIds: formData.permissionIds.filter(id => !sectionPermIds.includes(id))
            });
        } else {
            // Select all
            const newPermissionIds = [...new Set([...formData.permissionIds, ...sectionPermIds])];
            setFormData({ ...formData, permissionIds: newPermissionIds });
        }
    };

    const renderTabContent = () => {
        const currentTab = tabs.find(t => t.id === activeTab);
        if (!currentTab) return null;

        // Special handling for warehouse tab
        if (currentTab.id === 'warehouse') {
            return (
                <div className={styles.warehouseAccessTab}>
                    {/* Warehouse Management Permissions */}
                    <div className={styles.permissionSection}>
                        <h4>Warehouse & Store Management</h4>
                        <div className={styles.permissionGrid}>
                            {(groupedPermissions['WAREHOUSE'] || [])
                                .filter(p => p.name === 'WAREHOUSE_MANAGEMENT' || p.name === 'STORE_MANAGEMENT')
                                .map((permission) => (
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

                    {/* Warehouse-Specific Access */}
                    <div className={styles.permissionSection}>
                        <h4>Warehouse-Specific Access</h4>
                        <p className={styles.sectionDescription}>
                            Select warehouses and assign specific permissions for each
                        </p>
                        
                        {/* Warehouse Selection Dropdown */}
                        <div className={styles.warehouseDropdown}>
                            <label>Select Warehouses:</label>
                            <div className={styles.dropdownContainer}>
                                <div 
                                    className={`${styles.dropdownHeader} ${dropdownOpen ? styles.open : ''}`}
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    {selectedWarehouses.length === 0 ? (
                                        <span className={styles.dropdownPlaceholder}>Choose warehouses...</span>
                                    ) : (
                                        <span className={styles.dropdownSelectedCount}>
                                            {selectedWarehouses.length} warehouse(s) selected
                                        </span>
                                    )}
                                    <svg 
                                        className={`${styles.dropdownArrow} ${dropdownOpen ? styles.open : ''}`}
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 20 20" 
                                        fill="currentColor"
                                    >
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                {dropdownOpen && (
                                    <div className={styles.dropdownList}>
                                        {warehouses.length === 0 ? (
                                            <div className={styles.emptyWarehouseState}>
                                                <p>No warehouses available</p>
                                            </div>
                                        ) : (
                                            warehouses.map((warehouse) => (
                                                <div key={warehouse.id} className={styles.dropdownItem}>
                                                    <input
                                                        type="checkbox"
                                                        id={`warehouse-${warehouse.warehouse_code}`}
                                                        checked={selectedWarehouses.includes(warehouse.warehouse_code)}
                                                        onChange={() => toggleWarehouse(warehouse.warehouse_code)}
                                                    />
                                                    <label htmlFor={`warehouse-${warehouse.warehouse_code}`}>
                                                        {warehouse.warehouse_name} ({warehouse.warehouse_code})
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Warehouses Permissions */}
                        {selectedWarehouses.length > 0 && (
                            <div className={styles.selectedWarehouses}>
                                {selectedWarehouses.map((warehouseCode) => {
                                    const warehouse = warehouses.find(w => w.warehouse_code === warehouseCode);
                                    if (!warehouse) return null;

                                    return (
                                        <div key={warehouseCode} className={styles.warehousePermissionCard}>
                                            <h5>{warehouse.warehouse_name}</h5>
                                            <div className={styles.warehousePermissionGrid}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={warehousePermissions[warehouseCode]?.VIEW || false}
                                                        onChange={() => toggleWarehousePermission(warehouseCode, 'VIEW')}
                                                    />
                                                    <span>View Inventory</span>
                                                </label>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={warehousePermissions[warehouseCode]?.EDIT || false}
                                                        onChange={() => toggleWarehousePermission(warehouseCode, 'EDIT')}
                                                    />
                                                    <span>Edit Inventory</span>
                                                </label>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={warehousePermissions[warehouseCode]?.ORDERS_VIEW || false}
                                                        onChange={() => toggleWarehousePermission(warehouseCode, 'ORDERS_VIEW')}
                                                    />
                                                    <span>View Orders</span>
                                                </label>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={warehousePermissions[warehouseCode]?.ORDERS_EDIT || false}
                                                        onChange={() => toggleWarehousePermission(warehouseCode, 'ORDERS_EDIT')}
                                                    />
                                                    <span>Edit Orders</span>
                                                </label>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={warehousePermissions[warehouseCode]?.MANAGE || false}
                                                        onChange={() => toggleWarehousePermission(warehouseCode, 'MANAGE')}
                                                    />
                                                    <span>Manage Settings</span>
                                                </label>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={warehousePermissions[warehouseCode]?.REPORTS || false}
                                                        onChange={() => toggleWarehousePermission(warehouseCode, 'REPORTS')}
                                                    />
                                                    <span>Generate Reports</span>
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Regular permission tabs
        const sectionPerms = groupedPermissions[currentTab.section] || [];
        
        if (sectionPerms.length === 0) {
            return (
                <div className={styles.emptyTab}>
                    <p>No permissions available in this category</p>
                </div>
            );
        }

        return (
            <div className={styles.permissionSection}>
                <div className={styles.sectionHeader}>
                    <h4>{currentTab.label} Permissions</h4>
                    <button 
                        type="button" 
                        className={styles.selectAllButton}
                        onClick={selectAllInTab}
                    >
                        {sectionPerms.every(p => formData.permissionIds.includes(p.id)) 
                            ? 'Deselect All' 
                            : 'Select All'}
                    </button>
                </div>
                <div className={styles.permissionGrid}>
                    {sectionPerms.map((permission) => (
                        <label key={permission.id} className={styles.permissionCheckbox}>
                            <input
                                type="checkbox"
                                checked={formData.permissionIds.includes(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                            />
                            <span className={permission.is_dangerous ? styles.dangerousPermission : ''}>
                                {permission.display_name}
                                {permission.is_dangerous && <span className={styles.dangerBadge}>⚠️</span>}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{role ? 'Edit Role' : 'Create Role'}</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    {/* Basic Info */}
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., warehouse_manager"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Display Name</label>
                            <input
                                type="text"
                                value={formData.display_name}
                                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                required
                                placeholder="e.g., Warehouse Manager"
                            />
                        </div>
                    </div>
                    
                    <div className={styles.formRow}>
                        <div className={styles.formGroup} style={{ flex: 3 }}>
                            <label>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                placeholder="Brief description of this role"
                            />
                        </div>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                            <label>Color</label>
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Permission Tabs */}
                    <div className={styles.formGroup}>
                        <label>Permissions</label>
                        
                        {/* Tab Navigation */}
                        <div className={styles.tabNavigation}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTabButton : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <span className={styles.tabIcon}>{tab.icon}</span>
                                    <span className={styles.tabLabel}>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className={styles.tabContentArea}>
                            {loading ? (
                                <div className={styles.loadingState}>Loading...</div>
                            ) : (
                                renderTabContent()
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryButton} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.primaryButton}>
                            {role ? 'Update Role' : 'Create Role'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
