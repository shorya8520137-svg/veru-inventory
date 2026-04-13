
-- =====================================================
-- COMPLETE 403 ERROR FIX - PERMISSIONS SETUP
-- =====================================================

-- 1. Ensure warehouse-specific permissions exist
INSERT IGNORE INTO permissions (name, display_name, description, category) VALUES
-- Warehouse-specific Inventory permissions
('INVENTORY_VIEW_GGM_WH', 'View Gurgaon Warehouse Inventory', 'View inventory data for Gurgaon warehouse', 'Warehouse Access'),
('INVENTORY_VIEW_BLR_WH', 'View Bangalore Warehouse Inventory', 'View inventory data for Bangalore warehouse', 'Warehouse Access'),
('ORDERS_VIEW_GGM_WH', 'View Gurgaon Warehouse Orders', 'View orders for Gurgaon warehouse', 'Warehouse Access'),
('ORDERS_VIEW_BLR_WH', 'View Bangalore Warehouse Orders', 'View orders for Bangalore warehouse', 'Warehouse Access'),

-- Global permissions (fallback)
('INVENTORY_VIEW', 'View All Inventory', 'View inventory data for all warehouses', 'Inventory'),
('ORDERS_VIEW', 'View All Orders', 'View orders for all warehouses', 'Orders');

-- 2. Create a warehouse staff role if it doesn't exist
INSERT IGNORE INTO roles (name, display_name, description, is_active) VALUES
('warehouse_staff', 'Warehouse Staff', 'Staff with access to specific warehouses', 1);

-- 3. Get the role ID for warehouse staff
SET @warehouse_staff_role_id = (SELECT id FROM roles WHERE name = 'warehouse_staff' LIMIT 1);

-- 4. Assign warehouse-specific permissions to warehouse staff role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @warehouse_staff_role_id, p.id
FROM permissions p
WHERE p.name IN (
    'INVENTORY_VIEW_GGM_WH',
    'INVENTORY_VIEW_BLR_WH', 
    'ORDERS_VIEW_GGM_WH',
    'ORDERS_VIEW_BLR_WH'
);

-- 5. Update test user to have warehouse staff role
UPDATE users 
SET role_id = @warehouse_staff_role_id 
WHERE email = 'test@hunyhuny.com';

-- 6. Verify the setup
SELECT 
    u.email,
    r.name as role,
    p.name as permission
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'test@hunyhuny.com'
ORDER BY p.name;

-- 7. Alternative: Give admin role global permissions if needed
SET @admin_role_id = (SELECT id FROM roles WHERE name IN ('admin', 'super_admin', 'administrator') LIMIT 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @admin_role_id, p.id
FROM permissions p
WHERE p.name IN ('INVENTORY_VIEW', 'ORDERS_VIEW')
AND @admin_role_id IS NOT NULL;
