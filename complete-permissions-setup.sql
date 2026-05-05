-- ============================================================================
-- COMPLETE PERMISSIONS SYSTEM SETUP
-- Includes ALL 120+ permissions for the inventory management system
-- With dynamic warehouse permission generation
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE ALL STATIC PERMISSIONS
-- ============================================================================

-- 1. SYSTEM PERMISSIONS (15)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('SYSTEM_USER_MANAGEMENT', 'User Management', 'System', 'SYSTEM', FALSE, TRUE),
('SYSTEM_ROLE_MANAGEMENT', 'Role Management', 'System', 'SYSTEM', FALSE, TRUE),
('SYSTEM_PERMISSION_MANAGEMENT', 'Permission Management', 'System', 'SYSTEM', TRUE, TRUE),
('SYSTEM_AUDIT_LOG', 'Audit Log', 'System', 'SYSTEM', FALSE, TRUE),
('SYSTEM_MONITORING', 'System Monitoring', 'System', 'SYSTEM', FALSE, TRUE),
('SYSTEM_API_KEYS', 'API Keys Management', 'System', 'SYSTEM', FALSE, TRUE),
('SYSTEM_NOTIFICATIONS', 'Notifications Management', 'System', 'SYSTEM', FALSE, TRUE),
('SYSTEM_SETTINGS', 'System Settings', 'System', 'SYSTEM', TRUE, TRUE),
('SYSTEM_BACKUP', 'Database Backup/Restore', 'System', 'SYSTEM', TRUE, TRUE),
('SYSTEM_SECURITY', 'Security Settings', 'System', 'SYSTEM', TRUE, TRUE),
('SYSTEM_WEBHOOKS', 'Webhook Configuration', 'System', 'SYSTEM', FALSE, TRUE),
('SYSTEM_INTEGRATIONS', 'External Integrations', 'System', 'SYSTEM', FALSE, TRUE),
('SYSTEM_LOGS', 'System Logs', 'System', 'SYSTEM', FALSE, TRUE),
('SYSTEM_MAINTENANCE', 'Maintenance Mode', 'System', 'SYSTEM', TRUE, TRUE),
('SYSTEM_ANALYTICS', 'System Analytics', 'System', 'SYSTEM', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 2. INVENTORY PERMISSIONS (10)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('INVENTORY_VIEW', 'View Inventory', 'Inventory', 'INVENTORY', FALSE, TRUE),
('INVENTORY_EDIT', 'Edit Inventory', 'Inventory', 'INVENTORY', FALSE, TRUE),
('INVENTORY_CREATE', 'Create Inventory', 'Inventory', 'INVENTORY', FALSE, TRUE),
('INVENTORY_DELETE', 'Delete Inventory', 'Inventory', 'INVENTORY', TRUE, TRUE),
('INVENTORY_EXPORT', 'Export Inventory', 'Inventory', 'INVENTORY', FALSE, TRUE),
('INVENTORY_IMPORT', 'Import Inventory', 'Inventory', 'INVENTORY', FALSE, TRUE),
('INVENTORY_TIMELINE', 'View Timeline', 'Inventory', 'INVENTORY', FALSE, TRUE),
('INVENTORY_ADJUST', 'Manual Adjustments', 'Inventory', 'INVENTORY', FALSE, TRUE),
('INVENTORY_SNAPSHOT', 'Create Snapshots', 'Inventory', 'INVENTORY', FALSE, TRUE),
('INVENTORY_REPORTS', 'Generate Reports', 'Inventory', 'INVENTORY', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 3. PRODUCTS PERMISSIONS (12)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('PRODUCTS_VIEW', 'View Products', 'Products', 'PRODUCTS', FALSE, TRUE),
('PRODUCTS_CREATE', 'Create Products', 'Products', 'PRODUCTS', FALSE, TRUE),
('PRODUCTS_EDIT', 'Edit Products', 'Products', 'PRODUCTS', FALSE, TRUE),
('PRODUCTS_DELETE', 'Delete Products', 'Products', 'PRODUCTS', TRUE, TRUE),
('PRODUCTS_EXPORT', 'Export Products', 'Products', 'PRODUCTS', FALSE, TRUE),
('PRODUCTS_IMPORT', 'Import Products', 'Products', 'PRODUCTS', FALSE, TRUE),
('PRODUCTS_CATEGORIES_VIEW', 'View Categories', 'Products', 'PRODUCTS', FALSE, TRUE),
('PRODUCTS_CATEGORIES_CREATE', 'Create Categories', 'Products', 'PRODUCTS', FALSE, TRUE),
('PRODUCTS_CATEGORIES_EDIT', 'Edit Categories', 'Products', 'PRODUCTS', FALSE, TRUE),
('PRODUCTS_CATEGORIES_DELETE', 'Delete Categories', 'Products', 'PRODUCTS', TRUE, TRUE),
('PRODUCTS_BARCODE_SEARCH', 'Barcode Search', 'Products', 'PRODUCTS', FALSE, TRUE),
('PRODUCTS_TRANSFER', 'Transfer Products', 'Products', 'PRODUCTS', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 4. ORDERS PERMISSIONS (15)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('ORDERS_VIEW', 'View Orders', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_CREATE', 'Create Orders', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_EDIT', 'Edit Orders', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_DELETE', 'Delete Orders', 'Orders', 'ORDERS', TRUE, TRUE),
('ORDERS_EXPORT', 'Export Orders', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_CANCEL', 'Cancel Orders', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_REFUND', 'Process Refunds', 'Orders', 'ORDERS', TRUE, TRUE),
('ORDERS_TRACK', 'Track Orders', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_BULK_UPDATE', 'Bulk Update Orders', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_SHIPROCKET', 'Shiprocket Integration', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_TIMELINE', 'View Order Timeline', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_REPORTS', 'Generate Reports', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_INVOICE', 'Generate Invoices', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_PACKING_SLIP', 'Generate Packing Slips', 'Orders', 'ORDERS', FALSE, TRUE),
('ORDERS_SHIPPING_LABEL', 'Generate Shipping Labels', 'Orders', 'ORDERS', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 5. OPERATIONS PERMISSIONS (10)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('OPERATIONS_DISPATCH', 'Dispatch Operations', 'Operations', 'OPERATIONS', FALSE, TRUE),
('OPERATIONS_SELF_TRANSFER', 'Self Transfer', 'Operations', 'OPERATIONS', FALSE, TRUE),
('OPERATIONS_DAMAGE_RECOVERY', 'Damage Recovery', 'Operations', 'OPERATIONS', FALSE, TRUE),
('OPERATIONS_RETURNS', 'Returns Management', 'Operations', 'OPERATIONS', FALSE, TRUE),
('OPERATIONS_BULK_UPLOAD', 'Bulk Upload', 'Operations', 'OPERATIONS', FALSE, TRUE),
('OPERATIONS_DELIVERY', 'Delivery Management', 'Operations', 'OPERATIONS', FALSE, TRUE),
('OPERATIONS_LOGISTICS', 'Logistics Management', 'Operations', 'OPERATIONS', FALSE, TRUE),
('OPERATIONS_TRANSFER_SUGGESTIONS', 'Transfer Suggestions', 'Operations', 'OPERATIONS', FALSE, TRUE),
('OPERATIONS_MOVEMENT_RECORDS', 'Movement Records', 'Operations', 'OPERATIONS', FALSE, TRUE),
('OPERATIONS_STOCK_RECONCILIATION', 'Stock Reconciliation', 'Operations', 'OPERATIONS', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 6. WAREHOUSE MANAGEMENT PERMISSIONS (2 static)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('WAREHOUSE_MANAGEMENT', 'Warehouse Management', 'Warehouse', 'WAREHOUSE', FALSE, TRUE),
('STORE_MANAGEMENT', 'Store Management', 'Warehouse', 'WAREHOUSE', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 7. WEBSITE PERMISSIONS (18)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('WEBSITE_PRODUCTS_VIEW', 'View Website Products', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_PRODUCTS_CREATE', 'Create Website Products', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_PRODUCTS_EDIT', 'Edit Website Products', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_PRODUCTS_DELETE', 'Delete Website Products', 'Website', 'WEBSITE', TRUE, TRUE),
('WEBSITE_PRODUCTS_BULK_UPLOAD', 'Bulk Upload Website Products', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_PRODUCTS_FEATURED', 'Manage Featured Products', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_CATEGORIES_VIEW', 'View Website Categories', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_CATEGORIES_CREATE', 'Create Website Categories', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_CATEGORIES_EDIT', 'Edit Website Categories', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_CATEGORIES_DELETE', 'Delete Website Categories', 'Website', 'WEBSITE', TRUE, TRUE),
('WEBSITE_ORDERS_VIEW', 'View Website Orders', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_ORDERS_EDIT', 'Edit Website Orders', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_ORDERS_DELETE', 'Delete Website Orders', 'Website', 'WEBSITE', TRUE, TRUE),
('WEBSITE_ORDERS_EXPORT', 'Export Website Orders', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_ORDERS_BULK_UPDATE', 'Bulk Update Website Orders', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_ORDERS_REFUND', 'Process Website Refunds', 'Website', 'WEBSITE', TRUE, TRUE),
('WEBSITE_CUSTOMERS_VIEW', 'View Website Customers', 'Website', 'WEBSITE', FALSE, TRUE),
('WEBSITE_CUSTOMERS_EDIT', 'Edit Website Customers', 'Website', 'WEBSITE', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 8. CUSTOMER SUPPORT PERMISSIONS (12)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('CUSTOMER_SUPPORT_VIEW', 'View Support Conversations', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE),
('CUSTOMER_SUPPORT_CREATE', 'Create Support Conversations', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE),
('CUSTOMER_SUPPORT_EDIT', 'Edit Support Conversations', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE),
('CUSTOMER_SUPPORT_DELETE', 'Delete Support Conversations', 'Customer Support', 'CUSTOMER_SUPPORT', TRUE, TRUE),
('CUSTOMER_SUPPORT_MESSAGES', 'Send/Receive Messages', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE),
('CUSTOMER_SUPPORT_ASSIGN', 'Assign Conversations', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE),
('CUSTOMER_SUPPORT_CLOSE', 'Close Conversations', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE),
('CUSTOMER_SUPPORT_REOPEN', 'Reopen Conversations', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE),
('CUSTOMER_SUPPORT_RATINGS', 'View Ratings', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE),
('CUSTOMER_SUPPORT_BOT', 'Manage Bot Responses', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE),
('CUSTOMER_SUPPORT_EXPORT', 'Export Conversations', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE),
('CUSTOMER_SUPPORT_REPORTS', 'Generate Support Reports', 'Customer Support', 'CUSTOMER_SUPPORT', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 9. TICKETS PERMISSIONS (8)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('TICKETS_VIEW', 'View Tickets', 'Tickets', 'TICKETS', FALSE, TRUE),
('TICKETS_CREATE', 'Create Tickets', 'Tickets', 'TICKETS', FALSE, TRUE),
('TICKETS_EDIT', 'Edit Tickets', 'Tickets', 'TICKETS', FALSE, TRUE),
('TICKETS_DELETE', 'Delete Tickets', 'Tickets', 'TICKETS', TRUE, TRUE),
('TICKETS_ASSIGN', 'Assign Tickets', 'Tickets', 'TICKETS', FALSE, TRUE),
('TICKETS_FOLLOWUP', 'Add Follow-ups', 'Tickets', 'TICKETS', FALSE, TRUE),
('TICKETS_CLOSE', 'Close Tickets', 'Tickets', 'TICKETS', FALSE, TRUE),
('TICKETS_REPORTS', 'Generate Ticket Reports', 'Tickets', 'TICKETS', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 10. BILLING PERMISSIONS (8)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('BILLING_VIEW', 'View Billing', 'Billing', 'BILLING', FALSE, TRUE),
('BILLING_CREATE', 'Create Bills', 'Billing', 'BILLING', FALSE, TRUE),
('BILLING_EDIT', 'Edit Bills', 'Billing', 'BILLING', FALSE, TRUE),
('BILLING_DELETE', 'Delete Bills', 'Billing', 'BILLING', TRUE, TRUE),
('BILLING_STORE_INVENTORY', 'Manage Store Inventory', 'Billing', 'BILLING', FALSE, TRUE),
('BILLING_REPORTS', 'Generate Billing Reports', 'Billing', 'BILLING', FALSE, TRUE),
('BILLING_EXPORT', 'Export Billing Data', 'Billing', 'BILLING', FALSE, TRUE),
('BILLING_PAYMENT_MODES', 'Manage Payment Modes', 'Billing', 'BILLING', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 11. NOTIFICATIONS PERMISSIONS (6)
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active) VALUES
('NOTIFICATIONS_VIEW', 'View Notifications', 'Notifications', 'NOTIFICATIONS', FALSE, TRUE),
('NOTIFICATIONS_SEND', 'Send Notifications', 'Notifications', 'NOTIFICATIONS', FALSE, TRUE),
('NOTIFICATIONS_SETTINGS', 'Notification Settings', 'Notifications', 'NOTIFICATIONS', FALSE, TRUE),
('NOTIFICATIONS_FIREBASE', 'Manage Firebase Tokens', 'Notifications', 'NOTIFICATIONS', FALSE, TRUE),
('NOTIFICATIONS_TEST', 'Send Test Notifications', 'Notifications', 'NOTIFICATIONS', FALSE, TRUE),
('NOTIFICATIONS_BULK', 'Send Bulk Notifications', 'Notifications', 'NOTIFICATIONS', FALSE, TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ============================================================================
-- STEP 2: GENERATE DYNAMIC WAREHOUSE PERMISSIONS
-- ============================================================================

-- For each active warehouse, create 6 permissions:
-- 1. WAREHOUSE_{CODE}_VIEW
-- 2. WAREHOUSE_{CODE}_EDIT
-- 3. WAREHOUSE_{CODE}_ORDERS_VIEW
-- 4. WAREHOUSE_{CODE}_ORDERS_EDIT
-- 5. WAREHOUSE_{CODE}_MANAGE
-- 6. WAREHOUSE_{CODE}_REPORTS

-- View Permissions
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
SELECT 
    CONCAT('WAREHOUSE_', code, '_VIEW') as name,
    CONCAT('View ', name, ' Inventory') as display_name,
    'Warehouse Access' as category,
    'WAREHOUSE' as feature_section,
    FALSE as is_dangerous,
    TRUE as is_active
FROM warehouses 
WHERE is_active = TRUE
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Edit Permissions
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
SELECT 
    CONCAT('WAREHOUSE_', code, '_EDIT') as name,
    CONCAT('Edit ', name, ' Inventory') as display_name,
    'Warehouse Access' as category,
    'WAREHOUSE' as feature_section,
    FALSE as is_dangerous,
    TRUE as is_active
FROM warehouses 
WHERE is_active = TRUE
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Orders View Permissions
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
SELECT 
    CONCAT('WAREHOUSE_', code, '_ORDERS_VIEW') as name,
    CONCAT('View ', name, ' Orders') as display_name,
    'Warehouse Access' as category,
    'WAREHOUSE' as feature_section,
    FALSE as is_dangerous,
    TRUE as is_active
FROM warehouses 
WHERE is_active = TRUE
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Orders Edit Permissions
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
SELECT 
    CONCAT('WAREHOUSE_', code, '_ORDERS_EDIT') as name,
    CONCAT('Edit ', name, ' Orders') as display_name,
    'Warehouse Access' as category,
    'WAREHOUSE' as feature_section,
    FALSE as is_dangerous,
    TRUE as is_active
FROM warehouses 
WHERE is_active = TRUE
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Manage Permissions
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
SELECT 
    CONCAT('WAREHOUSE_', code, '_MANAGE') as name,
    CONCAT('Manage ', name, ' Settings') as display_name,
    'Warehouse Access' as category,
    'WAREHOUSE' as feature_section,
    FALSE as is_dangerous,
    TRUE as is_active
FROM warehouses 
WHERE is_active = TRUE
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Reports Permissions
INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
SELECT 
    CONCAT('WAREHOUSE_', code, '_REPORTS') as name,
    CONCAT('Generate ', name, ' Reports') as display_name,
    'Warehouse Access' as category,
    'WAREHOUSE' as feature_section,
    FALSE as is_dangerous,
    TRUE as is_active
FROM warehouses 
WHERE is_active = TRUE
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ============================================================================
-- STEP 3: CLEANUP - REMOVE PERMISSIONS FOR DELETED WAREHOUSES
-- ============================================================================

-- Remove warehouse permissions for warehouses that no longer exist or are inactive
DELETE FROM permissions 
WHERE feature_section = 'WAREHOUSE' 
AND name LIKE 'WAREHOUSE_%'
AND name NOT IN ('WAREHOUSE_MANAGEMENT', 'STORE_MANAGEMENT')
AND SUBSTRING_INDEX(SUBSTRING_INDEX(name, '_', 2), '_', -1) COLLATE utf8mb4_unicode_ci NOT IN (
    SELECT code COLLATE utf8mb4_unicode_ci FROM warehouses WHERE is_active = TRUE
);

-- ============================================================================
-- STEP 4: VERIFY PERMISSIONS COUNT
-- ============================================================================

SELECT 
    feature_section,
    COUNT(*) as permission_count
FROM permissions
WHERE is_active = TRUE
GROUP BY feature_section
ORDER BY feature_section;

-- ============================================================================
-- STEP 5: CREATE STORED PROCEDURE FOR WAREHOUSE PERMISSION SYNC
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sync_warehouse_permissions$$

CREATE PROCEDURE sync_warehouse_permissions()
BEGIN
    -- Add permissions for new warehouses
    INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
    SELECT 
        CONCAT('WAREHOUSE_', code, '_VIEW') as name,
        CONCAT('View ', name, ' Inventory') as display_name,
        'Warehouse Access' as category,
        'WAREHOUSE' as feature_section,
        FALSE as is_dangerous,
        TRUE as is_active
    FROM warehouses 
    WHERE is_active = TRUE
    ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);
    
    INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
    SELECT 
        CONCAT('WAREHOUSE_', code, '_EDIT') as name,
        CONCAT('Edit ', name, ' Inventory') as display_name,
        'Warehouse Access' as category,
        'WAREHOUSE' as feature_section,
        FALSE as is_dangerous,
        TRUE as is_active
    FROM warehouses 
    WHERE is_active = TRUE
    ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);
    
    INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
    SELECT 
        CONCAT('WAREHOUSE_', code, '_ORDERS_VIEW') as name,
        CONCAT('View ', name, ' Orders') as display_name,
        'Warehouse Access' as category,
        'WAREHOUSE' as feature_section,
        FALSE as is_dangerous,
        TRUE as is_active
    FROM warehouses 
    WHERE is_active = TRUE
    ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);
    
    INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
    SELECT 
        CONCAT('WAREHOUSE_', code, '_ORDERS_EDIT') as name,
        CONCAT('Edit ', name, ' Orders') as display_name,
        'Warehouse Access' as category,
        'WAREHOUSE' as feature_section,
        FALSE as is_dangerous,
        TRUE as is_active
    FROM warehouses 
    WHERE is_active = TRUE
    ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);
    
    INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
    SELECT 
        CONCAT('WAREHOUSE_', code, '_MANAGE') as name,
        CONCAT('Manage ', name, ' Settings') as display_name,
        'Warehouse Access' as category,
        'WAREHOUSE' as feature_section,
        FALSE as is_dangerous,
        TRUE as is_active
    FROM warehouses 
    WHERE is_active = TRUE
    ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);
    
    INSERT INTO permissions (name, display_name, category, feature_section, is_dangerous, is_active)
    SELECT 
        CONCAT('WAREHOUSE_', code, '_REPORTS') as name,
        CONCAT('Generate ', name, ' Reports') as display_name,
        'Warehouse Access' as category,
        'WAREHOUSE' as feature_section,
        FALSE as is_dangerous,
        TRUE as is_active
    FROM warehouses 
    WHERE is_active = TRUE
    ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);
    
    -- Remove permissions for deleted warehouses
    DELETE FROM permissions 
    WHERE feature_section = 'WAREHOUSE' 
    AND name LIKE 'WAREHOUSE_%'
    AND name NOT IN ('WAREHOUSE_MANAGEMENT', 'STORE_MANAGEMENT')
    AND SUBSTRING_INDEX(SUBSTRING_INDEX(name, '_', 2), '_', -1) COLLATE utf8mb4_unicode_ci NOT IN (
        SELECT code COLLATE utf8mb4_unicode_ci FROM warehouses WHERE is_active = TRUE
    );
END$$

DELIMITER ;

-- ============================================================================
-- STEP 6: CREATE TRIGGERS FOR AUTOMATIC WAREHOUSE PERMISSION SYNC
-- ============================================================================

DELIMITER $$

DROP TRIGGER IF EXISTS after_warehouse_insert$$

-- Trigger after warehouse insert
CREATE TRIGGER after_warehouse_insert
AFTER INSERT ON warehouses
FOR EACH ROW
BEGIN
    IF NEW.is_active = TRUE THEN
        CALL sync_warehouse_permissions();
    END IF;
END$$

DROP TRIGGER IF EXISTS after_warehouse_update$$

-- Trigger after warehouse update
CREATE TRIGGER after_warehouse_update
AFTER UPDATE ON warehouses
FOR EACH ROW
BEGIN
    IF OLD.is_active != NEW.is_active OR OLD.code != NEW.code OR OLD.name != NEW.name THEN
        CALL sync_warehouse_permissions();
    END IF;
END$$

DROP TRIGGER IF EXISTS after_warehouse_delete$$

-- Trigger after warehouse delete
CREATE TRIGGER after_warehouse_delete
AFTER DELETE ON warehouses
FOR EACH ROW
BEGIN
    CALL sync_warehouse_permissions();
END$$

DELIMITER ;

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT 'Permissions setup complete!' as status;
SELECT COUNT(*) as total_permissions FROM permissions WHERE is_active = TRUE;
