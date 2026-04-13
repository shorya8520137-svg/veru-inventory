-- =====================================================
-- FIX NULL PERMISSIONS ISSUE
-- Diagnose and fix why permissions show as NULL
-- =====================================================

-- =====================================================
-- 1. DIAGNOSE THE ISSUE
-- =====================================================

-- Check if users exist
SELECT 'USERS CHECK' as 'Check Type', COUNT(*) as 'Count' FROM users WHERE is_active = 1
UNION ALL
-- Check if roles exist  
SELECT 'ROLES CHECK', COUNT(*) FROM roles WHERE is_active = true
UNION ALL
-- Check if permissions exist
SELECT 'PERMISSIONS CHECK', COUNT(*) FROM permissions WHERE is_active = true
UNION ALL
-- Check if role_permissions mapping exists
SELECT 'ROLE_PERMISSIONS CHECK', COUNT(*) FROM role_permissions
UNION ALL
-- Check if users have roles assigned
SELECT 'USERS WITH ROLES', COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.is_active = 1;

-- =====================================================
-- 2. CHECK SPECIFIC USER DATA
-- =====================================================

-- Check the specific user from your screenshot
SELECT 
    'USER DATA CHECK' as 'Check',
    u.id,
    u.name,
    u.email,
    u.role_id,
    r.name as role_name,
    r.display_name as role_display_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email LIKE '%hunhuny%' OR u.name LIKE '%hunhuny%'
LIMIT 5;

-- =====================================================
-- 3. CHECK ROLE-PERMISSION MAPPING
-- =====================================================

-- Check if the user's role has permissions assigned
SELECT 
    'ROLE PERMISSIONS CHECK' as 'Check',
    r.name as 'Role Name',
    COUNT(rp.permission_id) as 'Permissions Assigned'
FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE u.email LIKE '%hunhuny%' OR u.name LIKE '%hunhuny%'
GROUP BY r.id, r.name;

-- =====================================================
-- 4. STEP-BY-STEP DEBUG QUERY
-- =====================================================

-- Step 1: Get user and role
SELECT 
    'STEP 1: USER + ROLE' as 'Step',
    u.id as user_id,
    u.name as user_name,
    u.role_id,
    r.id as role_table_id,
    r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.is_active = 1
LIMIT 3;

-- Step 2: Add role_permissions
SELECT 
    'STEP 2: + ROLE_PERMISSIONS' as 'Step',
    u.name as user_name,
    r.name as role_name,
    COUNT(rp.id) as role_permission_records
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE u.is_active = 1
GROUP BY u.id, u.name, r.name
LIMIT 3;

-- Step 3: Add permissions
SELECT 
    'STEP 3: + PERMISSIONS' as 'Step',
    u.name as user_name,
    r.name as role_name,
    COUNT(p.id) as permission_records,
    GROUP_CONCAT(p.name LIMIT 3) as sample_permissions
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1
GROUP BY u.id, u.name, r.name
LIMIT 3;

-- =====================================================
-- 5. FIXED QUERY (INNER JOINS INSTEAD OF LEFT JOINS)
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
    END as '2FA Status',
    
    -- Activity Status
    CASE 
        WHEN u.last_login IS NULL THEN '❌ Never Logged In'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 15 MINUTE) THEN '🟢 Online Now'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN '🟡 Recently Active'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN '🔵 Active Today'
        ELSE '⚪ Inactive'
    END as 'Activity Status',
    
    u.last_login as 'Last Login',
    u.login_count as 'Login Count',
    
    -- Permission Count
    COUNT(DISTINCT p.id) as 'Total Permissions',
    
    -- All Permissions List (FIXED - using INNER JOIN)
    COALESCE(
        GROUP_CONCAT(
            DISTINCT CONCAT(p.category, ': ', p.display_name)
            ORDER BY p.category, p.display_name
            SEPARATOR ' | '
        ),
        'NO PERMISSIONS ASSIGNED'
    ) as 'All Permissions',
    
    -- Permission Categories (FIXED)
    COALESCE(
        GROUP_CONCAT(
            DISTINCT p.category 
            ORDER BY p.category 
            SEPARATOR ', '
        ),
        'NO CATEGORIES'
    ) as 'Permission Categories',
    
    u.created_at as 'Account Created'

FROM users u
INNER JOIN roles r ON u.role_id = r.id AND r.is_active = true  -- INNER JOIN ensures role exists
LEFT JOIN role_permissions rp ON r.id = rp.role_id             -- LEFT JOIN to handle roles without permissions
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1
GROUP BY 
    u.id, u.name, u.email, u.is_active, u.two_factor_enabled, 
    u.last_login, u.login_count, u.created_at, r.display_name
ORDER BY u.name;

-- =====================================================
-- 6. ALTERNATIVE QUERY - SUBQUERY APPROACH
-- =====================================================

SELECT 
    u.id as 'User ID',
    u.name as 'User Name',
    u.email as 'Email',
    r.display_name as 'Role',
    
    -- Get permission count using subquery
    (SELECT COUNT(DISTINCT p2.id)
     FROM role_permissions rp2 
     JOIN permissions p2 ON rp2.permission_id = p2.id 
     WHERE rp2.role_id = u.role_id AND p2.is_active = true
    ) as 'Total Permissions',
    
    -- Get permissions list using subquery
    (SELECT GROUP_CONCAT(
        DISTINCT CONCAT(p3.category, ': ', p3.display_name)
        ORDER BY p3.category, p3.display_name
        SEPARATOR ' | '
     )
     FROM role_permissions rp3 
     JOIN permissions p3 ON rp3.permission_id = p3.id 
     WHERE rp3.role_id = u.role_id AND p3.is_active = true
    ) as 'All Permissions',
    
    -- Get categories using subquery
    (SELECT GROUP_CONCAT(
        DISTINCT p4.category 
        ORDER BY p4.category 
        SEPARATOR ', '
     )
     FROM role_permissions rp4 
     JOIN permissions p4 ON rp4.permission_id = p4.id 
     WHERE rp4.role_id = u.role_id AND p4.is_active = true
    ) as 'Permission Categories'

FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE u.is_active = 1
ORDER BY u.name;

-- =====================================================
-- 7. CHECK FOR COMMON ISSUES
-- =====================================================

-- Issue 1: Check if role_id is NULL
SELECT 'USERS WITH NULL ROLE_ID' as 'Issue', COUNT(*) as 'Count'
FROM users 
WHERE role_id IS NULL AND is_active = 1;

-- Issue 2: Check if role doesn't exist
SELECT 'USERS WITH INVALID ROLE_ID' as 'Issue', COUNT(*) as 'Count'
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.is_active = 1 AND r.id IS NULL;

-- Issue 3: Check if role has no permissions
SELECT 'ROLES WITHOUT PERMISSIONS' as 'Issue', r.name as 'Role Name'
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.is_active = true AND rp.role_id IS NULL;

-- Issue 4: Check GROUP_CONCAT limits
SELECT 'GROUP_CONCAT_MAX_LEN' as 'Setting', @@group_concat_max_len as 'Value';

-- =====================================================
-- 8. POSSIBLE SOLUTIONS
-- =====================================================

-- Solution 1: Increase GROUP_CONCAT limit if needed
-- SET SESSION group_concat_max_len = 10000;

-- Solution 2: Use COALESCE to handle NULL values
-- COALESCE(GROUP_CONCAT(...), 'NO PERMISSIONS') 

-- Solution 3: Use INNER JOIN instead of LEFT JOIN for critical relationships
-- INNER JOIN roles r ON u.role_id = r.id

-- =====================================================
-- END OF DIAGNOSIS
-- =====================================================