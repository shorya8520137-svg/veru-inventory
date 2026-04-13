-- =====================================================
-- COMPLETE USER PERMISSIONS TABLE VIEW
-- Simple table showing all users with their permissions
-- =====================================================

-- =====================================================
-- MAIN QUERY: Complete Users with Permissions Table
-- =====================================================

SELECT 
    -- User Information
    u.id as 'User ID',
    u.name as 'User Name',
    u.email as 'Email',
    
    -- Role Information
    r.display_name as 'Role',
    r.name as 'Role Code',
    
    -- Status Information
    CASE 
        WHEN u.is_active = 1 THEN '✅ Active'
        ELSE '❌ Inactive'
    END as 'Status',
    
    CASE 
        WHEN u.two_factor_enabled = 1 THEN '🔐 Enabled'
        ELSE '🔓 Disabled'
    END as '2FA Status',
    
    -- Activity Information
    CASE 
        WHEN u.last_login IS NULL THEN '❌ Never'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 15 MINUTE) THEN '🟢 Online Now'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN '🟡 Recently Active'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN '🔵 Active Today'
        ELSE '⚪ Inactive'
    END as 'Activity Status',
    
    u.last_login as 'Last Login',
    u.login_count as 'Login Count',
    
    -- Permissions Information
    COUNT(DISTINCT p.id) as 'Total Permissions',
    
    -- All Permissions (comma separated)
    GROUP_CONCAT(
        DISTINCT CONCAT(p.category, ': ', p.display_name) 
        ORDER BY p.category, p.display_name 
        SEPARATOR ' | '
    ) as 'All Permissions',
    
    -- Permission Categories
    GROUP_CONCAT(
        DISTINCT p.category 
        ORDER BY p.category 
        SEPARATOR ', '
    ) as 'Permission Categories',
    
    -- Account Information
    u.created_at as 'Account Created',
    
    -- Security Risk Assessment
    CASE 
        WHEN u.two_factor_enabled = 0 AND r.name IN ('super_admin', 'admin') THEN '🔴 HIGH RISK'
        WHEN u.two_factor_enabled = 0 AND r.name = 'manager' THEN '🟡 MEDIUM RISK'
        WHEN u.two_factor_enabled = 0 THEN '🟠 LOW RISK'
        ELSE '🟢 SECURE'
    END as 'Security Risk'

FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1  -- Only show active users
GROUP BY 
    u.id, u.name, u.email, u.is_active, u.two_factor_enabled, 
    u.last_login, u.login_count, u.created_at,
    r.display_name, r.name
ORDER BY 
    -- Sort by security risk first, then by role priority, then by last login
    CASE 
        WHEN u.two_factor_enabled = 0 AND r.name IN ('super_admin', 'admin') THEN 1
        WHEN u.two_factor_enabled = 0 AND r.name = 'manager' THEN 2
        WHEN u.two_factor_enabled = 0 THEN 3
        ELSE 4
    END,
    r.priority,
    u.last_login DESC;

-- =====================================================
-- ALTERNATIVE VIEW: Simplified User Permissions Table
-- =====================================================

-- Uncomment below to create a permanent view:
/*
CREATE OR REPLACE VIEW user_permissions_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    r.display_name as role,
    u.is_active,
    u.two_factor_enabled,
    u.last_login,
    COUNT(DISTINCT p.id) as permission_count,
    GROUP_CONCAT(DISTINCT p.name ORDER BY p.name) as permissions_list
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
GROUP BY u.id, u.name, u.email, r.display_name, u.is_active, u.two_factor_enabled, u.last_login
ORDER BY r.priority, u.name;
*/

-- =====================================================
-- DETAILED BREAKDOWN: Users by Permission Category
-- =====================================================

SELECT 
    p.category as 'Permission Category',
    COUNT(DISTINCT u.id) as 'Users with Access',
    GROUP_CONCAT(
        DISTINCT CONCAT(u.name, ' (', r.display_name, ')') 
        ORDER BY r.priority, u.name 
        SEPARATOR ' | '
    ) as 'Users List'
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id AND r.is_active = true
LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
WHERE p.is_active = true
GROUP BY p.category
ORDER BY COUNT(DISTINCT u.id) DESC, p.category;

-- =====================================================
-- SECURITY AUDIT: High-Risk Users
-- =====================================================

SELECT 
    '🔴 HIGH SECURITY RISK USERS' as 'Alert Type',
    u.name as 'User Name',
    u.email as 'Email',
    r.display_name as 'Role',
    CASE 
        WHEN u.two_factor_enabled = 0 THEN 'No 2FA Enabled'
        WHEN u.last_login < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'Inactive for 30+ days'
        WHEN u.login_count = 0 THEN 'Never logged in'
        ELSE 'Other risk factors'
    END as 'Risk Factor',
    COUNT(DISTINCT p.id) as 'Total Permissions',
    u.last_login as 'Last Login'
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1 
    AND (
        (u.two_factor_enabled = 0 AND r.name IN ('super_admin', 'admin', 'manager'))
        OR u.last_login < DATE_SUB(NOW(), INTERVAL 30 DAY)
        OR u.login_count = 0
    )
GROUP BY u.id, u.name, u.email, r.display_name, u.two_factor_enabled, u.last_login, u.login_count
ORDER BY 
    CASE 
        WHEN u.two_factor_enabled = 0 AND r.name = 'super_admin' THEN 1
        WHEN u.two_factor_enabled = 0 AND r.name = 'admin' THEN 2
        WHEN u.two_factor_enabled = 0 AND r.name = 'manager' THEN 3
        WHEN u.login_count = 0 THEN 4
        ELSE 5
    END;

-- =====================================================
-- QUICK STATS: System Overview
-- =====================================================

SELECT 
    'SYSTEM OVERVIEW' as 'Metric Category',
    'Total Active Users' as 'Metric',
    COUNT(*) as 'Count',
    '' as 'Details'
FROM users 
WHERE is_active = 1

UNION ALL

SELECT 
    'SYSTEM OVERVIEW',
    'Users Online Now',
    COUNT(*),
    CONCAT('Last 15 minutes: ', GROUP_CONCAT(name SEPARATOR ', '))
FROM users 
WHERE is_active = 1 
    AND last_login >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)

UNION ALL

SELECT 
    'SYSTEM OVERVIEW',
    'Users with 2FA Enabled',
    COUNT(*),
    CONCAT(ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE is_active = 1)), 1), '% of active users')
FROM users 
WHERE is_active = 1 
    AND two_factor_enabled = 1

UNION ALL

SELECT 
    'SYSTEM OVERVIEW',
    'High-Risk Users (Admin without 2FA)',
    COUNT(*),
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️ SECURITY RISK'
        ELSE '✅ SECURE'
    END
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.is_active = 1 
    AND u.two_factor_enabled = 0 
    AND r.name IN ('super_admin', 'admin')

UNION ALL

SELECT 
    'SYSTEM OVERVIEW',
    'Total Roles',
    COUNT(*),
    GROUP_CONCAT(display_name ORDER BY priority SEPARATOR ', ')
FROM roles 
WHERE is_active = true

UNION ALL

SELECT 
    'SYSTEM OVERVIEW',
    'Total Permissions',
    COUNT(*),
    CONCAT(COUNT(DISTINCT category), ' categories')
FROM permissions 
WHERE is_active = true;

-- =====================================================
-- END OF USER PERMISSIONS TABLE QUERIES
-- =====================================================