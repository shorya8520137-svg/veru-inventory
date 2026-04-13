-- =====================================================
-- COUNT USER PERMISSIONS
-- Simple count of permissions per user
-- =====================================================

-- =====================================================
-- 1. PERMISSION COUNT PER USER
-- =====================================================

SELECT 
    u.name as 'User Name',
    u.email as 'Email',
    r.display_name as 'Role',
    COUNT(DISTINCT p.id) as 'Total Permissions',
    
    -- Breakdown by category
    COUNT(DISTINCT CASE WHEN p.category = 'inventory' THEN p.id END) as 'Inventory',
    COUNT(DISTINCT CASE WHEN p.category = 'operations' THEN p.id END) as 'Operations', 
    COUNT(DISTINCT CASE WHEN p.category = 'orders' THEN p.id END) as 'Orders',
    COUNT(DISTINCT CASE WHEN p.category = 'products' THEN p.id END) as 'Products',
    COUNT(DISTINCT CASE WHEN p.category = 'system' OR p.category = 'SYSTEM' THEN p.id END) as 'System',
    
    -- Status
    CASE 
        WHEN u.two_factor_enabled = 1 THEN '🔐 Protected'
        ELSE '🔓 No 2FA'
    END as '2FA Status'

FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1
GROUP BY u.id, u.name, u.email, u.two_factor_enabled, r.display_name
ORDER BY COUNT(DISTINCT p.id) DESC;

-- =====================================================
-- 2. SPECIFIC COUNT FOR SYSTEM ADMINISTRATOR
-- =====================================================

SELECT 
    '📊 SYSTEM ADMINISTRATOR PERMISSIONS' as 'Analysis',
    u.name as 'User Name',
    COUNT(DISTINCT p.id) as 'Total Permissions',
    
    -- List all permission categories
    GROUP_CONCAT(DISTINCT p.category ORDER BY p.category) as 'Categories',
    
    -- Count by category
    CONCAT(
        'Inventory: ', COUNT(DISTINCT CASE WHEN p.category = 'inventory' THEN p.id END), ', ',
        'Operations: ', COUNT(DISTINCT CASE WHEN p.category = 'operations' THEN p.id END), ', ',
        'Orders: ', COUNT(DISTINCT CASE WHEN p.category = 'orders' THEN p.id END), ', ',
        'Products: ', COUNT(DISTINCT CASE WHEN p.category = 'products' THEN p.id END), ', ',
        'System: ', COUNT(DISTINCT CASE WHEN p.category = 'system' OR p.category = 'SYSTEM' THEN p.id END)
    ) as 'Breakdown'

FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.name = 'System Administrator' AND u.is_active = 1
GROUP BY u.id, u.name;

-- =====================================================
-- 3. DETAILED PERMISSION LIST FOR SYSTEM ADMINISTRATOR
-- =====================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY p.category, p.name) as '#',
    p.category as 'Category',
    p.name as 'Permission Code',
    p.display_name as 'Permission Name'
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.name = 'System Administrator' 
    AND u.is_active = 1 
    AND r.is_active = true 
    AND p.is_active = true
ORDER BY p.category, p.name;

-- =====================================================
-- 4. QUICK COUNT FROM YOUR TABLE DATA
-- =====================================================

-- Based on your table output, System Administrator has:
SELECT 
    'BASED ON YOUR TABLE OUTPUT' as 'Source',
    '23' as 'Total Permissions',
    'inventory: 3, operations: 5, orders: 3, products: 9, system: 3' as 'Breakdown',
    '5 categories' as 'Categories';

-- =====================================================
-- 5. PERMISSION COMPARISON WITH OTHER USERS
-- =====================================================

SELECT 
    u.name as 'User Name',
    r.display_name as 'Role',
    COUNT(DISTINCT p.id) as 'Permission Count',
    
    -- Percentage of total permissions
    CONCAT(
        ROUND(
            (COUNT(DISTINCT p.id) * 100.0) / 
            (SELECT COUNT(*) FROM permissions WHERE is_active = true), 
            1
        ), 
        '%'
    ) as 'Coverage %',
    
    -- Compare to System Administrator
    CASE 
        WHEN COUNT(DISTINCT p.id) = (
            SELECT COUNT(DISTINCT p2.id)
            FROM users u2
            JOIN roles r2 ON u2.role_id = r2.id
            JOIN role_permissions rp2 ON r2.id = rp2.role_id
            JOIN permissions p2 ON rp2.permission_id = p2.id
            WHERE u2.name = 'System Administrator' AND u2.is_active = 1 AND p2.is_active = true
        ) THEN '✅ Same as Admin'
        WHEN COUNT(DISTINCT p.id) > (
            SELECT COUNT(DISTINCT p2.id)
            FROM users u2
            JOIN roles r2 ON u2.role_id = r2.id
            JOIN role_permissions rp2 ON r2.id = rp2.role_id
            JOIN permissions p2 ON rp2.permission_id = p2.id
            WHERE u2.name = 'System Administrator' AND u2.is_active = 1 AND p2.is_active = true
        ) THEN '⬆️ More than Admin'
        ELSE CONCAT(
            '⬇️ ', 
            (SELECT COUNT(DISTINCT p2.id)
             FROM users u2
             JOIN roles r2 ON u2.role_id = r2.id
             JOIN role_permissions rp2 ON r2.id = rp2.role_id
             JOIN permissions p2 ON rp2.permission_id = p2.id
             WHERE u2.name = 'System Administrator' AND u2.is_active = 1 AND p2.is_active = true
            ) - COUNT(DISTINCT p.id),
            ' fewer than Admin'
        )
    END as 'vs Admin'

FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1
GROUP BY u.id, u.name, r.display_name
ORDER BY COUNT(DISTINCT p.id) DESC;

-- =====================================================
-- END OF PERMISSION COUNTING
-- =====================================================