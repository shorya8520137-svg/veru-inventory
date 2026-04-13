-- =====================================================
-- TICKET MANAGEMENT PERMISSIONS FIX - MANUAL SQL
-- =====================================================
-- Run this manually in MySQL to fix ticket tab visibility
-- =====================================================

-- 1. Create missing ticket permissions
INSERT IGNORE INTO permissions (name, description, category, is_active, created_at) 
VALUES 
    ('TICKETS_MANAGE', 'Manage tickets and ticket system', 'Tickets', 1, NOW()),
    ('TICKETS_VIEW', 'View tickets', 'Tickets', 1, NOW()),
    ('TICKETS_CREATE', 'Create new tickets', 'Tickets', 1, NOW()),
    ('TICKETS_EDIT', 'Edit existing tickets', 'Tickets', 1, NOW());

-- 2. Get permission IDs and assign to super_admin role (ID: 1)
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT 1, id, NOW() FROM permissions WHERE name IN ('TICKETS_MANAGE', 'TICKETS_VIEW', 'TICKETS_CREATE', 'TICKETS_EDIT');

-- 3. Verification - Check created permissions
SELECT '=== CREATED PERMISSIONS ===' as info;
SELECT id, name, description, category FROM permissions WHERE name LIKE 'TICKETS_%' ORDER BY name;

-- 4. Verification - Check role assignments
SELECT '=== ASSIGNED TO SUPER_ADMIN ===' as info;
SELECT r.name as role_name, p.name as permission_name, p.description
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name LIKE 'TICKETS_%' AND r.id = 1
ORDER BY p.name;

-- 5. Verification - Check users who will get access
SELECT '=== USERS WHO WILL GET ACCESS ===' as info;
SELECT u.id, u.name, u.email, r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.id = 1 AND u.is_active = 1
ORDER BY u.name;