-- =====================================================
-- DETAILED PERMISSION TRACKING
-- Track all 23 permissions across 5 categories
-- =====================================================

-- =====================================================
-- 1. COMPLETE PERMISSIONS LIST WITH USAGE TRACKING
-- =====================================================

SELECT 
    p.id as 'Permission ID',
    p.category as 'Category',
    p.name as 'Permission Code',
    p.display_name as 'Permission Name',
    p.description as 'Description',
    
    -- Usage Statistics
    COUNT(DISTINCT rp.role_id) as 'Roles Using',
    COUNT(DISTINCT u.id) as 'Users with Access',
    
    -- Roles that have this permission
    GROUP_CONCAT(
        DISTINCT r.display_name 
        ORDER BY r.priority 
        SEPARATOR ', '
    ) as 'Assigned to Roles',
    
    -- Users who have this permission
    GROUP_CONCAT(
        DISTINCT CONCAT(u.name, ' (', r.display_name, ')')
        ORDER BY r.priority, u.name
        SEPARATOR ' | '
    ) as 'Users with Permission',
    
    -- Status and Risk Assessment
    CASE 
        WHEN COUNT(DISTINCT u.id) = 0 THEN '🔴 UNUSED'
        WHEN COUNT(DISTINCT u.id) = 1 THEN '🟡 SINGLE USER'
        WHEN COUNT(DISTINCT u.id) <= 3 THEN '🟠 LIMITED ACCESS'
        ELSE '🟢 NORMAL USAGE'
    END as 'Usage Status',
    
    p.is_active as 'Active',
    p.created_at as 'Created Date'

FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id AND r.is_active = true
LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
WHERE p.is_active = true
GROUP BY 
    p.id, p.category, p.name, p.display_name, p.description, p.is_active, p.created_at
ORDER BY 
    p.category, p.name;

-- =====================================================
-- 2. PERMISSIONS BY CATEGORY BREAKDOWN
-- =====================================================

SELECT 
    p.category as 'Permission Category',
    COUNT(*) as 'Total Permissions in Category',
    COUNT(DISTINCT rp.role_id) as 'Roles Using Category',
    COUNT(DISTINCT u.id) as 'Users with Category Access',
    
    -- List all permissions in this category
    GROUP_CONCAT(
        DISTINCT p.display_name 
        ORDER BY p.name 
        SEPARATOR ' | '
    ) as 'Permissions in Category',
    
    -- Category usage percentage
    CONCAT(
        ROUND(
            (COUNT(DISTINCT u.id) * 100.0) / 
            (SELECT COUNT(*) FROM users WHERE is_active = 1), 
            1
        ), 
        '%'
    ) as 'User Coverage %'

FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id AND r.is_active = true
LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
WHERE p.is_active = true
GROUP BY p.category
ORDER BY COUNT(*) DESC, p.category;

-- =====================================================
-- 3. PERMISSION USAGE MATRIX (Roles vs Permissions)
-- =====================================================

SELECT 
    r.display_name as 'Role',
    r.priority as 'Priority',
    COUNT(DISTINCT p.id) as 'Total Permissions',
    COUNT(DISTINCT u.id) as 'Users in Role',
    
    -- Permissions by category for this role
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
    
    -- Permission coverage percentage
    CONCAT(
        ROUND(
            (COUNT(DISTINCT p.id) * 100.0) / 
            (SELECT COUNT(*) FROM permissions WHERE is_active = true), 
            1
        ), 
        '%'
    ) as 'Permission Coverage'

FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
WHERE r.is_active = true
GROUP BY r.id, r.display_name, r.priority
ORDER BY r.priority;

-- =====================================================
-- 4. UNUSED OR UNDERUSED PERMISSIONS ALERT
-- =====================================================

SELECT 
    '🔍 PERMISSION USAGE ANALYSIS' as 'Analysis Type',
    p.category as 'Category',
    p.display_name as 'Permission Name',
    p.name as 'Permission Code',
    
    COUNT(DISTINCT u.id) as 'Users Count',
    
    CASE 
        WHEN COUNT(DISTINCT u.id) = 0 THEN '🔴 CRITICAL: No users have this permission'
        WHEN COUNT(DISTINCT u.id) = 1 THEN '🟡 WARNING: Only 1 user has this permission'
        WHEN COUNT(DISTINCT u.id) <= 2 THEN '🟠 CAUTION: Very limited access'
        ELSE '🟢 NORMAL: Good distribution'
    END as 'Status Alert',
    
    COALESCE(
        GROUP_CONCAT(
            DISTINCT CONCAT(u.name, ' (', r.display_name, ')')
            ORDER BY u.name
            SEPARATOR ', '
        ),
        'NO USERS'
    ) as 'Current Users'

FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id AND r.is_active = true
LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
WHERE p.is_active = true
GROUP BY p.id, p.category, p.display_name, p.name
HAVING COUNT(DISTINCT u.id) <= 2  -- Show permissions with 2 or fewer users
ORDER BY 
    COUNT(DISTINCT u.id) ASC,  -- Show most critical first
    p.category, 
    p.name;

-- =====================================================
-- 5. PERMISSION AUDIT TRAIL (Recent Changes)
-- =====================================================

SELECT 
    al.created_at as 'Change Date',
    u.name as 'Changed By',
    al.action as 'Action',
    al.resource_type as 'Resource',
    
    -- Extract details from JSON
    JSON_UNQUOTE(JSON_EXTRACT(al.details, '$.name')) as 'Permission/Role Name',
    JSON_UNQUOTE(JSON_EXTRACT(al.details, '$.displayName')) as 'Display Name',
    
    CASE 
        WHEN al.resource_type = 'ROLE' THEN 'Role Management'
        WHEN al.resource_type = 'USER' THEN 'User Management'
        WHEN al.resource_type = 'PERMISSION' THEN 'Permission Management'
        ELSE al.resource_type
    END as 'Change Category',
    
    al.ip_address as 'IP Address',
    
    -- Risk assessment for the change
    CASE 
        WHEN al.action = 'DELETE' AND al.resource_type IN ('ROLE', 'USER') THEN '🔴 HIGH IMPACT'
        WHEN al.action = 'CREATE' AND al.resource_type = 'USER' THEN '🟡 MEDIUM IMPACT'
        WHEN al.action = 'UPDATE' AND al.resource_type = 'ROLE' THEN '🟠 ROLE CHANGE'
        ELSE '🟢 NORMAL'
    END as 'Impact Level'

FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.resource_type IN ('USER', 'ROLE', 'PERMISSION')
    AND al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)  -- Last 30 days
ORDER BY al.created_at DESC
LIMIT 50;

-- =====================================================
-- 6. PERMISSION SECURITY RISK ASSESSMENT
-- =====================================================

SELECT 
    'SECURITY RISK ANALYSIS' as 'Analysis Type',
    
    -- High-risk permissions (admin-level)
    (SELECT COUNT(*) 
     FROM permissions p 
     JOIN role_permissions rp ON p.id = rp.permission_id 
     JOIN roles r ON rp.role_id = r.id 
     WHERE p.name LIKE '%.delete' OR p.name LIKE 'system.%' OR p.name LIKE 'users.%'
    ) as 'High-Risk Permissions',
    
    -- Users with high-risk permissions but no 2FA
    (SELECT COUNT(DISTINCT u.id)
     FROM users u
     JOIN roles r ON u.role_id = r.id
     JOIN role_permissions rp ON r.id = rp.role_id
     JOIN permissions p ON rp.permission_id = p.id
     WHERE u.is_active = 1 
       AND u.two_factor_enabled = 0
       AND (p.name LIKE '%.delete' OR p.name LIKE 'system.%' OR r.name IN ('super_admin', 'admin'))
    ) as 'High-Risk Users without 2FA',
    
    -- Roles with excessive permissions
    (SELECT COUNT(*)
     FROM roles r
     JOIN role_permissions rp ON r.id = rp.role_id
     WHERE r.is_active = true
     GROUP BY r.id
     HAVING COUNT(rp.permission_id) > 15
    ) as 'Roles with 15+ Permissions',
    
    -- Permissions not assigned to any role
    (SELECT COUNT(*)
     FROM permissions p
     LEFT JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE p.is_active = true AND rp.permission_id IS NULL
    ) as 'Unassigned Permissions';

-- =====================================================
-- 7. QUICK PERMISSION SUMMARY DASHBOARD
-- =====================================================

SELECT 
    '📊 PERMISSION DASHBOARD' as 'Dashboard',
    '' as 'Metric',
    '' as 'Value',
    '' as 'Status'

UNION ALL

SELECT 
    '',
    'Total Active Permissions',
    CAST(COUNT(*) AS CHAR),
    CASE WHEN COUNT(*) = 23 THEN '✅ Expected' ELSE '⚠️ Check Count' END
FROM permissions 
WHERE is_active = true

UNION ALL

SELECT 
    '',
    'Permission Categories',
    CAST(COUNT(DISTINCT category) AS CHAR),
    CASE WHEN COUNT(DISTINCT category) = 5 THEN '✅ Expected' ELSE '⚠️ Check Categories' END
FROM permissions 
WHERE is_active = true

UNION ALL

SELECT 
    '',
    'Permissions in Use',
    CAST(COUNT(DISTINCT p.id) AS CHAR),
    CONCAT('✅ ', ROUND((COUNT(DISTINCT p.id) * 100.0) / 23, 1), '% utilized')
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE p.is_active = true

UNION ALL

SELECT 
    '',
    'Unused Permissions',
    CAST(COUNT(*) AS CHAR),
    CASE WHEN COUNT(*) = 0 THEN '✅ All in use' ELSE '⚠️ Review unused' END
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
WHERE p.is_active = true AND rp.permission_id IS NULL

UNION ALL

SELECT 
    '',
    'Average Permissions per Role',
    CAST(ROUND(AVG(perm_count), 1) AS CHAR),
    '📊 Distribution'
FROM (
    SELECT COUNT(rp.permission_id) as perm_count
    FROM roles r
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    WHERE r.is_active = true
    GROUP BY r.id
) as role_perms;

-- =====================================================
-- END OF DETAILED PERMISSION TRACKING
-- =====================================================