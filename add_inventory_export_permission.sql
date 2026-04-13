-- Add INVENTORY_EXPORT permission to enable download functionality
-- Run this on your database to enable the export/download button

-- 1. Add the INVENTORY_EXPORT permission
INSERT INTO permissions (name, display_name, description, category, is_active) 
VALUES ('INVENTORY_EXPORT', 'Export Inventory', 'Export inventory data to CSV files', 'inventory', 1)
ON DUPLICATE KEY UPDATE 
    display_name = 'Export Inventory',
    description = 'Export inventory data to CSV files',
    category = 'inventory',
    is_active = 1;

-- 2. Get the permission ID
SET @export_permission_id = (SELECT id FROM permissions WHERE name = 'INVENTORY_EXPORT');

-- 3. Assign INVENTORY_EXPORT permission to System Administrator role (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (1, @export_permission_id)
ON DUPLICATE KEY UPDATE role_id = role_id;

-- 4. Assign INVENTORY_EXPORT permission to other roles that should have it
-- Warehouse Manager (role_id = 2)
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (2, @export_permission_id)
ON DUPLICATE KEY UPDATE role_id = role_id;

-- 5. Verify the permission was added
SELECT 
    p.name as permission_name,
    p.display_name,
    p.category,
    r.display_name as role_name
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON rp.role_id = r.id
WHERE p.name = 'INVENTORY_EXPORT'
ORDER BY r.display_name;

-- Expected output should show INVENTORY_EXPORT assigned to roles