-- =====================================================
-- USER-WISE PERMISSIONS BREAKDOWN
-- Show each user and their specific permissions
-- =====================================================

-- =====================================================
-- 1. COMPLETE USER-WISE PERMISSIONS TABLE
-- =====================================================

SELECT 
    u.id as 'User ID',
    u.name as 'User Name',
    u.email as 'Email',
    r.display_name as 'Role',
    
    -- User Status
    CASE 
        WHEN u.is_active = 1 THEN '✅ Active'
        ELSE '❌ Inactive'
    END as 'Status',
    
    CASE 
        WHEN u.two_factor_enabled = 1 THEN '🔐 2FA On'
        ELSE '🔓 2FA Off'
    END as '2FA',
    
    -- Activity Status
    CASE 
        WHEN u.last_login IS NULL THEN '❌ Never Logged In'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 15 MINUTE) THEN '🟢 Online Now'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN '🟡 Recently Active'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN '🔵 Active Today'
        ELSE '⚪ Inactive'
    END as 'Activity',
    
    -- Permission Count
    COUNT(DISTINCT p.id) as 'Total Permissions',
    
    -- All Permissions List
    GROUP_CONCAT(
        DISTINCT CONCAT(p.category, ': ', p.display_name)
        ORDER BY p.category, p.display_name
        SEPARATOR ' | '
    ) as 'All User Permissions'

FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1
GROUP BY u.id, u.name, u.email, u.is_active, u.two_factor_enabled, u.last_login, r.display_name
ORDER BY r.priority, u.name;

-- =====================================================
-- 2. USER PERMISSIONS BY CATEGORY
-- =====================================================

SELECT 
    u.name as 'User Name',
    u.email as 'Email',
    r.display_name as 'Role',
    
    -- Count permissions by category
    SUM(CASE WHEN p.category = 'User Management' THEN 1 ELSE 0 END) as 'User Mgmt',
    SUM(CASE WHEN p.category = 'Role Management' THEN 1 ELSE 0 END) as 'Role Mgmt', 
    SUM(CASE WHEN p.category = 'Inventory' THEN 1 ELSE 0 END) as 'Inventory',
    SUM(CASE WHEN p.category = 'Products' THEN 1 ELSE 0 END) as 'Products',
    SUM(CASE WHEN p.category = 'Dispatch' THEN 1 ELSE 0 END) as 'Dispatch',
    SUM(CASE WHEN p.category = 'Damage & Recovery' THEN 1 ELSE 0 END) as 'Damage',
    SUM(CASE WHEN p.category = 'Returns' THEN 1 ELSE 0 END) as 'Returns',
    SUM(CASE WHEN p.category = 'Self Transfer' THEN 1 ELSE 0 END) as 'Transfer',
    SUM(CASE WHEN p.category = 'Order Tracking' THEN 1 ELSE 0 END) as 'Tracking',
    SUM(CASE WHEN p.category = 'Security' THEN 1 ELSE 0 END) as 'Security',
    SUM(CASE WHEN p.category = 'System' THEN 1 ELSE 0 END) as 'System',
    SUM(CASE WHEN p.category = 'Notifications' THEN 1 ELSE 0 END) as 'Notifications',
    
    COUNT(DISTINCT p.id) as 'Total'

FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1
GROUP BY u.id, u.name, u.email, r.display_name, r.priority
ORDER BY r.priority, u.name;

-- =====================================================
-- 3. DETAILED USER PERMISSION BREAKDOWN (One Row Per Permission)
-- =====================================================

SELECT 
    u.name as 'User Name',
    u.email as 'Email',
    r.display_name as 'User Role',
    p.category as 'Permission Category',
    p.name as 'Permission Code',
    p.display_name as 'Permission Name',
    p.description as 'What User Can Do',
    
    -- Security Level
    CASE 
        WHEN p.name LIKE '%.delete' THEN '🔴 HIGH RISK'
        WHEN p.name LIKE 'system.%' THEN '🔴 HIGH RISK'
        WHEN p.name LIKE 'users.%' OR p.name LIKE 'roles.%' THEN '🟡 MEDIUM RISK'
        ELSE '🟢 NORMAL'
    END as 'Security Level',
    
    -- 2FA Status for this user
    CASE 
        WHEN u.two_factor_enabled = 1 THEN '🔐 Protected'
        WHEN p.name LIKE '%.delete' OR p.name LIKE 'system.%' THEN '⚠️ UNPROTECTED HIGH RISK'
        ELSE '🔓 No 2FA'
    END as '2FA Protection'

FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = 1 AND r.is_active = true AND p.is_active = true
ORDER BY u.name, p.category, p.name;

-- =====================================================
-- 4. USERS WITH SPECIFIC HIGH-RISK PERMISSIONS
-- =====================================================

SELECT 
    '🔴 HIGH-RISK PERMISSIONS AUDIT' as 'Audit Type',
    u.name as 'User Name',
    u.email as 'Email',
    r.display_name as 'Role',
    p.display_name as 'High-Risk Permission',
    
    CASE 
        WHEN u.two_factor_enabled = 1 THEN '✅ Has 2FA'
        ELSE '❌ NO 2FA - SECURITY RISK!'
    END as '2FA Status',
    
    u.last_login as 'Last Login',
    
    CASE 
        WHEN u.last_login < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN '⚠️ Inactive 30+ days'
        WHEN u.last_login < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN '⚠️ Inactive 7+ days'
        ELSE '✅ Recently active'
    END as 'Activity Risk'

FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = 1 
    AND r.is_active = true 
    AND p.is_active = true
    AND (
        p.name LIKE '%.delete' 
        OR p.name LIKE 'system.%' 
        OR p.name IN ('users.create', 'users.edit', 'roles.create', 'roles.edit')
    )
ORDER BY 
    CASE WHEN u.two_factor_enabled = 0 THEN 1 ELSE 2 END,
    u.name, 
    p.name;

-- =====================================================
-- 5. USERS WITHOUT CERTAIN PERMISSIONS (Permission Gaps)
-- =====================================================

SELECT 
    '🔍 PERMISSION GAPS ANALYSIS' as 'Analysis',
    u.name as 'User Name',
    u.email as 'Email',
    r.display_name as 'Role',
    
    -- Check for common permissions they might be missing
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM role_permissions rp2 
            JOIN permissions p2 ON rp2.permission_id = p2.id 
            WHERE rp2.role_id = r.id AND p2.name = 'inventory.view'
        ) THEN '❌ Cannot view inventory'
        ELSE '✅ Can view inventory'
    END as 'Inventory Access',
    
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM role_permissions rp2 
            JOIN permissions p2 ON rp2.permission_id = p2.id 
            WHERE rp2.role_id = r.id AND p2.name = 'dispatch.view'
        ) THEN '❌ Cannot view dispatch'
        ELSE '✅ Can view dispatch'
    END as 'Dispatch Access',
    
    COUNT(DISTINCT p.id) as 'Total Permissions'

FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1 AND r.is_active = true
GROUP BY u.id, u.name, u.email, r.display_name, r.id
ORDER BY COUNT(DISTINCT p.id) ASC;  -- Show users with fewer permissions first

-- =====================================================
-- 6. USER PERMISSION COMPARISON TABLE
-- =====================================================

SELECT 
    '👥 USER PERMISSION COMPARISON' as 'Comparison Type',
    '' as 'User 1',
    '' as 'User 2', 
    '' as 'Shared Permissions',
    '' as 'User 1 Only',
    '' as 'User 2 Only'

UNION ALL

SELECT 
    'SAMPLE COMPARISON',
    u1.name,
    u2.name,
    CAST(COUNT(CASE WHEN p1.id IS NOT NULL AND p2.id IS NOT NULL THEN 1 END) as CHAR),
    CAST(COUNT(CASE WHEN p1.id IS NOT NULL AND p2.id IS NULL THEN 1 END) as CHAR),
    CAST(COUNT(CASE WHEN p1.id IS NULL AND p2.id IS NOT NULL THEN 1 END) as CHAR)
FROM users u1
CROSS JOIN users u2
LEFT JOIN roles r1 ON u1.role_id = r1.id
LEFT JOIN roles r2 ON u2.role_id = r2.id
LEFT JOIN role_permissions rp1 ON r1.id = rp1.role_id
LEFT JOIN role_permissions rp2 ON r2.id = rp2.role_id
LEFT JOIN permissions p1 ON rp1.permission_id = p1.id AND p1.is_active = true
LEFT JOIN permissions p2 ON rp2.permission_id = p2.id AND p2.is_active = true AND p2.id = p1.id
WHERE u1.is_active = 1 
    AND u2.is_active = 1 
    AND u1.id < u2.id  -- Avoid duplicate comparisons
    AND r1.is_active = true 
    AND r2.is_active = true
GROUP BY u1.id, u1.name, u2.id, u2.name
LIMIT 10;  -- Show first 10 comparisons

-- =====================================================
-- 7. SIMPLE USER PERMISSIONS SUMMARY
-- =====================================================

SELECT 
    '📋 QUICK USER SUMMARY' as 'Summary',
    u.name as 'User',
    r.display_name as 'Role',
    COUNT(DISTINCT p.id) as 'Permissions',
    
    -- Top 3 permission categories for this user
    SUBSTRING_INDEX(
        GROUP_CONCAT(
            DISTINCT p.category 
            ORDER BY COUNT(p.id) DESC 
            SEPARATOR ', '
        ), 
        ',', 3
    ) as 'Main Categories',
    
    CASE 
        WHEN u.two_factor_enabled = 1 THEN '🔐'
        ELSE '🔓'
    END as '2FA',
    
    CASE 
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN '🟢'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN '🟡'
        ELSE '🔴'
    END as 'Activity'

FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1
GROUP BY u.id, u.name, u.email, u.two_factor_enabled, u.last_login, r.display_name
ORDER BY COUNT(DISTINCT p.id) DESC;

-- =====================================================
-- END OF USER-WISE PERMISSIONS
-- =====================================================