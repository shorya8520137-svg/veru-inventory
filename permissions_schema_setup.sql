-- =====================================================
-- PERMISSIONS SYSTEM DATABASE SCHEMA
-- Based on backend controller analysis
-- =====================================================

-- =====================================================
-- 1. CORE TABLES STRUCTURE
-- =====================================================

-- Users table (main user management)
CREATE TABLE IF NOT EXISTS `users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL UNIQUE,
    `password` varchar(255) DEFAULT NULL,
    `password_hash` varchar(255) DEFAULT NULL,
    `role_id` int(11) NOT NULL,
    `is_active` tinyint(1) DEFAULT 1,
    `two_factor_enabled` tinyint(1) DEFAULT 0,
    `two_factor_secret` varchar(255) DEFAULT NULL,
    `backup_codes` text DEFAULT NULL,
    `last_login` timestamp NULL DEFAULT NULL,
    `login_count` int(11) DEFAULT 0,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_users_email` (`email`),
    KEY `idx_users_role_id` (`role_id`),
    KEY `idx_users_active` (`is_active`),
    KEY `idx_users_last_login` (`last_login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles table (role management)
CREATE TABLE IF NOT EXISTS `roles` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL UNIQUE,
    `display_name` varchar(255) NOT NULL,
    `description` text DEFAULT NULL,
    `color` varchar(7) DEFAULT '#6366f1',
    `priority` int(11) DEFAULT 100,
    `is_active` tinyint(1) DEFAULT 1,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_roles_name` (`name`),
    KEY `idx_roles_active` (`is_active`),
    KEY `idx_roles_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table (permission definitions)
CREATE TABLE IF NOT EXISTS `permissions` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL UNIQUE,
    `display_name` varchar(255) NOT NULL,
    `description` text DEFAULT NULL,
    `category` varchar(100) NOT NULL,
    `is_active` tinyint(1) DEFAULT 1,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_permissions_name` (`name`),
    KEY `idx_permissions_category` (`category`),
    KEY `idx_permissions_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role permissions mapping table
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `role_id` int(11) NOT NULL,
    `permission_id` int(11) NOT NULL,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_role_permission` (`role_id`, `permission_id`),
    KEY `idx_role_permissions_role` (`role_id`),
    KEY `idx_role_permissions_permission` (`permission_id`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs table (activity tracking)
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `action` varchar(50) NOT NULL,
    `resource_type` varchar(50) NOT NULL,
    `resource_id` varchar(100) DEFAULT NULL,
    `details` json DEFAULT NULL,
    `ip_address` varchar(45) DEFAULT NULL,
    `user_agent` text DEFAULT NULL,
    `location_country` varchar(100) DEFAULT NULL,
    `location_city` varchar(100) DEFAULT NULL,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_audit_user_id` (`user_id`),
    KEY `idx_audit_action` (`action`),
    KEY `idx_audit_resource` (`resource_type`),
    KEY `idx_audit_created_at` (`created_at`),
    KEY `idx_audit_ip_address` (`ip_address`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. DEFAULT ROLES SETUP
-- =====================================================

INSERT IGNORE INTO `roles` (`name`, `display_name`, `description`, `color`, `priority`) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', '#dc2626', 1),
('admin', 'Administrator', 'Administrative access to most system functions', '#ea580c', 2),
('manager', 'Manager', 'Management level access to operations', '#ca8a04', 3),
('supervisor', 'Supervisor', 'Supervisory access to daily operations', '#65a30d', 4),
('operator', 'Operator', 'Operational access to inventory and dispatch', '#0891b2', 5),
('viewer', 'Viewer', 'Read-only access to system data', '#6366f1', 6);

-- =====================================================
-- 3. DEFAULT PERMISSIONS SETUP
-- =====================================================

INSERT IGNORE INTO `permissions` (`name`, `display_name`, `description`, `category`) VALUES
-- User Management
('users.view', 'View Users', 'View user list and details', 'User Management'),
('users.create', 'Create Users', 'Create new user accounts', 'User Management'),
('users.edit', 'Edit Users', 'Edit existing user accounts', 'User Management'),
('users.delete', 'Delete Users', 'Delete user accounts', 'User Management'),
('users.manage_roles', 'Manage User Roles', 'Assign and change user roles', 'User Management'),

-- Role Management
('roles.view', 'View Roles', 'View role list and details', 'Role Management'),
('roles.create', 'Create Roles', 'Create new roles', 'Role Management'),
('roles.edit', 'Edit Roles', 'Edit existing roles', 'Role Management'),
('roles.delete', 'Delete Roles', 'Delete roles', 'Role Management'),
('roles.manage_permissions', 'Manage Role Permissions', 'Assign permissions to roles', 'Role Management'),

-- Inventory Management
('inventory.view', 'View Inventory', 'View inventory data and reports', 'Inventory'),
('inventory.create', 'Add Inventory', 'Add new inventory items', 'Inventory'),
('inventory.edit', 'Edit Inventory', 'Edit inventory quantities and details', 'Inventory'),
('inventory.delete', 'Delete Inventory', 'Remove inventory items', 'Inventory'),
('inventory.bulk_upload', 'Bulk Upload Inventory', 'Upload inventory via bulk operations', 'Inventory'),
('inventory.export', 'Export Inventory', 'Export inventory data', 'Inventory'),

-- Product Management
('products.view', 'View Products', 'View product catalog', 'Products'),
('products.create', 'Create Products', 'Add new products', 'Products'),
('products.edit', 'Edit Products', 'Edit product details', 'Products'),
('products.delete', 'Delete Products', 'Remove products', 'Products'),
('products.transfer', 'Transfer Products', 'Transfer products between locations', 'Products'),

-- Dispatch Operations
('dispatch.view', 'View Dispatches', 'View dispatch records', 'Dispatch'),
('dispatch.create', 'Create Dispatches', 'Create new dispatch orders', 'Dispatch'),
('dispatch.edit', 'Edit Dispatches', 'Edit dispatch details', 'Dispatch'),
('dispatch.delete', 'Delete Dispatches', 'Cancel or delete dispatches', 'Dispatch'),
('dispatch.track', 'Track Dispatches', 'Access dispatch tracking information', 'Dispatch'),

-- Damage & Recovery
('damage.view', 'View Damage Reports', 'View damage and recovery logs', 'Damage & Recovery'),
('damage.report', 'Report Damage', 'Report damaged inventory', 'Damage & Recovery'),
('damage.recover', 'Recover Stock', 'Recover stock from damage', 'Damage & Recovery'),

-- Returns Management
('returns.view', 'View Returns', 'View return records', 'Returns'),
('returns.process', 'Process Returns', 'Process customer returns', 'Returns'),
('returns.bulk_process', 'Bulk Process Returns', 'Process multiple returns', 'Returns'),

-- Self Transfer
('self_transfer.view', 'View Self Transfers', 'View self transfer records', 'Self Transfer'),
('self_transfer.create', 'Create Self Transfers', 'Create warehouse-to-warehouse transfers', 'Self Transfer'),

-- Order Tracking
('tracking.view', 'View Order Tracking', 'Access order tracking information', 'Order Tracking'),
('tracking.timeline', 'View Product Timeline', 'View detailed product movement timeline', 'Order Tracking'),

-- Audit & Security
('audit.view', 'View Audit Logs', 'Access system audit logs', 'Security'),
('audit.export', 'Export Audit Logs', 'Export audit log data', 'Security'),
('security.manage_2fa', 'Manage 2FA', 'Manage two-factor authentication', 'Security'),

-- System Administration
('system.view_stats', 'View System Stats', 'View system statistics and health', 'System'),
('system.manage_settings', 'Manage Settings', 'Manage system settings', 'System'),
('system.backup', 'System Backup', 'Perform system backups', 'System'),

-- Notifications
('notifications.view', 'View Notifications', 'View system notifications', 'Notifications'),
('notifications.manage', 'Manage Notifications', 'Manage notification settings', 'Notifications'),
('notifications.send', 'Send Notifications', 'Send system notifications', 'Notifications');

-- =====================================================
-- 4. DEFAULT ROLE-PERMISSION ASSIGNMENTS
-- =====================================================

-- Super Admin - All permissions
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'super_admin' AND p.is_active = 1;

-- Admin - Most permissions except system critical ones
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' 
    AND p.name NOT IN ('system.backup', 'users.delete', 'roles.delete')
    AND p.is_active = 1;

-- Manager - Operations and viewing permissions
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'manager' 
    AND p.name IN (
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.export',
        'products.view', 'products.create', 'products.edit', 'products.transfer',
        'dispatch.view', 'dispatch.create', 'dispatch.edit', 'dispatch.track',
        'damage.view', 'damage.report', 'damage.recover',
        'returns.view', 'returns.process',
        'self_transfer.view', 'self_transfer.create',
        'tracking.view', 'tracking.timeline',
        'users.view', 'audit.view',
        'notifications.view', 'notifications.manage'
    )
    AND p.is_active = 1;

-- Supervisor - Daily operations
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'supervisor' 
    AND p.name IN (
        'inventory.view', 'inventory.create', 'inventory.edit',
        'products.view', 'products.transfer',
        'dispatch.view', 'dispatch.create', 'dispatch.track',
        'damage.view', 'damage.report', 'damage.recover',
        'returns.view', 'returns.process',
        'self_transfer.view', 'self_transfer.create',
        'tracking.view', 'tracking.timeline',
        'notifications.view'
    )
    AND p.is_active = 1;

-- Operator - Basic operations
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'operator' 
    AND p.name IN (
        'inventory.view', 'inventory.create',
        'products.view',
        'dispatch.view', 'dispatch.create',
        'damage.view', 'damage.report',
        'returns.view', 'returns.process',
        'tracking.view',
        'notifications.view'
    )
    AND p.is_active = 1;

-- Viewer - Read-only access
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'viewer' 
    AND p.name IN (
        'inventory.view',
        'products.view',
        'dispatch.view', 'dispatch.track',
        'damage.view',
        'returns.view',
        'tracking.view', 'tracking.timeline',
        'notifications.view'
    )
    AND p.is_active = 1;

-- =====================================================
-- 5. DEFAULT ADMIN USER SETUP
-- =====================================================

-- Create default admin user (password: Admin@123)
INSERT IGNORE INTO `users` (`name`, `email`, `password`, `role_id`, `is_active`) 
SELECT 'System Administrator', 'admin@system.com', '$2b$10$rQZ8kHWKQVnqVQZ8kHWKQVnqVQZ8kHWKQVnqVQZ8kHWKQVnqVQZ8k', r.id, 1
FROM roles r 
WHERE r.name = 'super_admin'
LIMIT 1;

-- =====================================================
-- 6. USEFUL INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional indexes for better query performance
CREATE INDEX IF NOT EXISTS `idx_audit_logs_composite` ON `audit_logs` (`user_id`, `created_at`, `action`);
CREATE INDEX IF NOT EXISTS `idx_users_role_active` ON `users` (`role_id`, `is_active`);
CREATE INDEX IF NOT EXISTS `idx_permissions_category_active` ON `permissions` (`category`, `is_active`);

-- =====================================================
-- 7. TRIGGERS FOR AUDIT LOGGING
-- =====================================================

-- Trigger to log user changes
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS `users_audit_trigger` 
AFTER UPDATE ON `users`
FOR EACH ROW
BEGIN
    IF OLD.is_active != NEW.is_active OR OLD.role_id != NEW.role_id THEN
        INSERT INTO `audit_logs` (`user_id`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`)
        VALUES (
            NEW.id, 
            'UPDATE', 
            'USER', 
            NEW.id, 
            JSON_OBJECT(
                'old_active', OLD.is_active,
                'new_active', NEW.is_active,
                'old_role_id', OLD.role_id,
                'new_role_id', NEW.role_id,
                'changed_at', NOW()
            ),
            '127.0.0.1'
        );
    END IF;
END$$
DELIMITER ;

-- =====================================================
-- 8. STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================

-- Procedure to get user permissions
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS `GetUserPermissions`(IN user_id INT)
BEGIN
    SELECT 
        p.name,
        p.display_name,
        p.category,
        p.description
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = user_id 
        AND u.is_active = 1 
        AND r.is_active = 1 
        AND p.is_active = 1
    ORDER BY p.category, p.name;
END$$
DELIMITER ;

-- Procedure to check user permission
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS `CheckUserPermission`(IN user_id INT, IN permission_name VARCHAR(100))
BEGIN
    SELECT COUNT(*) as has_permission
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = user_id 
        AND p.name = permission_name
        AND u.is_active = 1 
        AND r.is_active = 1 
        AND p.is_active = 1;
END$$
DELIMITER ;

-- =====================================================
-- 9. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active users with roles
CREATE OR REPLACE VIEW `active_users_with_roles` AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.last_login,
    u.login_count,
    u.two_factor_enabled,
    r.name as role_name,
    r.display_name as role_display_name,
    r.color as role_color
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.is_active = 1 AND r.is_active = 1;

-- View for permission matrix
CREATE OR REPLACE VIEW `permission_matrix` AS
SELECT 
    r.name as role_name,
    r.display_name as role_display_name,
    p.name as permission_name,
    p.display_name as permission_display_name,
    p.category as permission_category
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.is_active = 1 AND p.is_active = 1
ORDER BY r.priority, p.category, p.name;

-- =====================================================
-- END OF SCHEMA SETUP
-- =====================================================