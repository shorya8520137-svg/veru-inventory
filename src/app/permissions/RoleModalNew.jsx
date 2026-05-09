"use client";

import { useState, useEffect } from "react";
import styles from "./fullpage-modal.module.css";
import { apiRequest } from "@/utils/api";

/**
 * MODERN ENTERPRISE ROLE MODAL - EXACT SCREENSHOT DESIGN
 * Full-page modal with 2-column layout, toggle switches, and modern UI
 */
export default function RoleModalNew({ role, permissions, onSave, onClose }) {
    const [activeTab, setActiveTab] = useState("system");
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedColor, setSelectedColor] = useState(role?.color || '#3B82F6');
    
    const [formData, setFormData] = useState({
        name: role?.name || '',
        display_name: role?.display_name || '',
        description: role?.description || '',
        color: role?.color || '#3B82F6',
        permissionIds: role?.permissions?.map(p => p.id) || []
    });

    // Color palette - 8 colors + custom
    const colorOptions = [
        { id: 'blue', name: 'Blue', value: '#3B82F6' },
        { id: 'brown', name: 'Brown', value: '#92400E' },
        { id: 'gray', name: 'Gray', value: '#4B5563' },
        { id: 'purple', name: 'Purple', value: '#8B5CF6' },
        { id: 'pink', name: 'Pink', value: '#EC4899' },
        { id: 'orange', name: 'Orange', value: '#F97316' },
        { id: 'green', name: 'Green', value: '#10B981' },
        { id: 'cyan', name: 'Cyan', value: '#06B6D4' },
        { id: 'slate', name: 'Dark Slate', value: '#475569' }
    ];

    // Tab configuration - NO ICONS
    const tabs = [
        { id: 'system', label: 'System', section: 'SYSTEM' },
        { id: 'inventory', label: 'Inventory', section: 'INVENTORY' },
        { id: 'products', label: 'Products', section: 'PRODUCTS' },
        { id: 'orders', label: 'Orders', section: 'ORDERS' },
        { id: 'operations', label: 'Operations', section: 'OPERATIONS' },
        { id: 'warehouse', label: 'Warehouse Access', section: 'WAREHOUSE' },
        { id: 'website', label: 'Website', section: 'WEBSITE' }
    ];

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

    const handleColorSelect = (color) => {
        setSelectedColor(color.value);
        setFormData({ ...formData, color: color.value });
    };

    // Group permissions by feature section
    const groupedPermissions = permissions.reduce((acc, permission) => {
        const section = permission.feature_section || 'OTHER';
        if (!acc[section]) {
            acc[section] = [];
        }
        if (!permission.name.startsWith('WAREHOUSE_') || 
            permission.name === 'WAREHOUSE_MANAGEMENT' || 
            permission.name === 'STORE_MANAGEMENT') {
            acc[section].push(permission);
        }
        return acc;
    }, {});

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

    const selectAllInTab = () => {
        const currentTab = tabs.find(t => t.id === activeTab);
        if (!currentTab) return;
        
        const sectionPerms = groupedPermissions[currentTab.section] || [];
        const sectionPermIds = sectionPerms.map(p => p.id);
        const allSelected = sectionPermIds.every(id => formData.permissionIds.includes(id));
        
        if (allSelected) {
            setFormData({
                ...formData,
                permissionIds: formData.permissionIds.filter(id => !sectionPermIds.includes(id))
            });
        } else {
            const newPermissionIds = [...new Set([...formData.permissionIds, ...sectionPermIds])];
            setFormData({ ...formData, permissionIds: newPermissionIds });
        }
    };

    const renderTabContent = () => {
        const currentTab = tabs.find(t => t.id === activeTab);
        if (!currentTab) return null;

        const sectionPerms = groupedPermissions[currentTab.section] || [];
        
        if (sectionPerms.length === 0) {
            return (
                <div className={styles.emptyTab}>
                    <p>No permissions available in this category</p>
                </div>
            );
        }

        return (
            <div className={styles.fullPagePermissionSection}>
                <div className={styles.fullPagePermissionGrid}>
                    {sectionPerms.map((permission) => {
                        const isEnabled = formData.permissionIds.includes(permission.id);
                        return (
                            <div key={permission.id} className={styles.permissionCard}>
                                {permission.is_dangerous && (
                                    <div className={styles.criticalBadge}>
                                        <span>⚠ CRITICAL</span>
                                    </div>
                                )}
                                
                                <div className={styles.permissionInfo}>
                                    <h4 className={styles.permissionTitle}>
                                        {permission.display_name}
                                    </h4>
                                    <p className={styles.permissionDescription}>
                                        {permission.description || 'Manage access and control for this feature.'}
                                    </p>
                                </div>
                                
                                <label className={styles.toggleSwitch}>
                                    <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={() => togglePermission(permission.id)}
                                    />
                                    <span className={styles.toggleSlider}></span>
                                </label>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.fullPageModalOverlay} onClick={onClose}>
            <div className={styles.fullPageModal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.fullPageHeader}>
                    <button type="button" className={styles.fullPageCloseBtn} onClick={onClose} title="Close">
                        ✕
                    </button>
                    <p className={styles.fullPageSubtitle}>
                        Define the permission scope and access levels for organization members.
                    </p>
                    <div className={styles.fullPageHeaderActions}>
                        <button type="button" className={styles.fullPageCancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" form="roleForm" className={styles.fullPageSaveBtn}>
                            Save Changes
                        </button>
                    </div>
                </div>

                <form id="roleForm" onSubmit={handleSubmit} className={styles.fullPageContent}>
                    {/* Two Column Layout */}
                    <div className={styles.fullPageTwoColumn}>
                        {/* Left Column - General Information */}
                        <div className={styles.fullPageCard}>
                            <h2 className={styles.fullPageCardTitle}>General Information</h2>
                            
                            <div className={styles.fullPageFormRow}>
                                <div className={styles.fullPageFormGroup}>
                                    <label>Role Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Operations Manager"
                                        required
                                    />
                                </div>
                                <div className={styles.fullPageFormGroup}>
                                    <label>Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.display_name}
                                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                        placeholder="e.g. OPS_MGR_01"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.fullPageFormGroup}>
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the responsibilities and access context for this role..."
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Right Column - Visual Identity */}
                        <div className={styles.fullPageCard}>
                            <h2 className={styles.fullPageCardTitle}>Visual Identity</h2>
                            <p className={styles.fullPageCardDesc}>
                                Select a color tag for role identification across the system.
                            </p>
                            
                            <div className={styles.fullPageColorGrid}>
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.id}
                                        type="button"
                                        onClick={() => handleColorSelect(color)}
                                        className={`${styles.fullPageColorBtn} ${selectedColor === color.value ? styles.fullPageColorSelected : ''}`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                                <button
                                    type="button"
                                    className={styles.fullPageColorCustom}
                                    title="Custom color"
                                >
                                    +
                                </button>
                            </div>

                            <div className={styles.fullPageColorPreview}>
                                <div 
                                    className={styles.fullPageColorDot} 
                                    style={{ backgroundColor: selectedColor }}
                                />
                                <div>
                                    <div className={styles.fullPageColorLabel}>Kinetic Obsidian</div>
                                    <div className={styles.fullPageColorSub}>Active branding profile applied.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Permissions Section */}
                    <div className={styles.fullPagePermissionsWrapper}>
                        {/* Tab Navigation */}
                        <div className={styles.fullPageTabsWrapper}>
                            <div className={styles.fullPageTabs}>
                                <button type="button" className={styles.fullPageTabArrow}>‹</button>
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={`${styles.fullPageTab} ${activeTab === tab.id ? styles.fullPageTabActive : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                                <button type="button" className={styles.fullPageTabArrow}>›</button>
                            </div>
                            <button 
                                type="button" 
                                className={styles.fullPageSelectAllTop}
                                onClick={selectAllInTab}
                            >
                                ✓ Select All
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className={styles.fullPageTabContent}>
                            {loading ? (
                                <div className={styles.loadingState}>Loading...</div>
                            ) : (
                                renderTabContent()
                            )}
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className={styles.fullPageFooter}>
                        <button type="button" className={styles.fullPageCancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.fullPageSaveBtn}>
                            Create Role
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
