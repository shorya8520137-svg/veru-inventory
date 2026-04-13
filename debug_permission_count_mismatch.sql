-- Debug permission count mismatch for Super Admin
-- Role table shows 24 permissions, but user profile shows 23

-- 1. Count total active permissions in database
SELECT 'Total Active Permissions' as check_type, COUNT(*) as count
FROM permissions 
WHERE is_active = 1;

-- 2. Count permissions assigned to Super Admin role (role_id = 1)
SELECT 'Super Admin Role Permissions' as check_type, COUNT(*) as count
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 1 AND p.is_active = 1;

-- 3. List all permissions assigned to Super Admin role
SELECT 
    p.id,
    p.name as permission_code,
    p.display_name as permission_name,
    p.category,
    p.is_active
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 1
ORDER BY p.category, p.name;

-- 4. Check for duplicate permissions
SELECT 
    p.name,
    COUNT(*) as duplicate_count
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 1
GROUP BY p.name
HAVING COUNT(*) > 1;

-- 5. Check for inactive permissions assigned to role
SELECT 
    p.name as permission_code,
    p.display_name as permission_name,
    p.is_active
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 1 AND p.is_active = 0;

-- 6. Count permissions by category for Super Admin
SELECT 
    p.category,
    COUNT(*) as permission_count
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 1 AND p.is_active = 1
GROUP BY p.category
ORDER BY p.category;

-- 7. Check if INVENTORY_EXPORT permission exists and is assigned
SELECT 
    p.name,
    p.display_name,
    p.is_active,
    CASE WHEN rp.role_id IS NOT NULL THEN 'Assigned' ELSE 'Not Assigned' END as assignment_status
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = 1
WHERE p.name = 'INVENTORY_EXPORT';

-- 8. Find any permissions that exist but are not assigned to Super Admin
SELECT 
    p.name as permission_code,
    p.display_name as permission_name,
    p.category
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = 1
WHERE p.is_active = 1 AND rp.role_id IS NULL
ORDER BY p.category, p.name;