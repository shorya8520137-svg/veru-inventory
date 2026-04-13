-- =====================================================
-- LIST ALL 23 PERMISSIONS
-- Simple table showing exactly what permissions exist
-- =====================================================

-- =====================================================
-- COMPLETE LIST OF ALL 23 PERMISSIONS
-- =====================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY p.category, p.name) as '#',
    p.category as 'Category',
    p.name as 'Permission Code',
    p.display_name as 'Permission Name',
    p.description as 'What it allows',
    
    -- Show which roles have this permission
    COALESCE(
        GROUP_CONCAT(
            DISTINCT r.display_name 
            ORDER BY r.priority 
            SEPARATOR ', '
        ),
        'Not assigned'
    ) as 'Assigned to Roles',
    
    -- Count users who have this permission
    COUNT(DISTINCT u.id) as 'Users with Access'

FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id AND r.is_active = true
LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
WHERE p.is_active = true
GROUP BY p.id, p.category, p.name, p.display_name, p.description
ORDER BY p.category, p.name;

-- =====================================================
-- PERMISSIONS GROUPED BY CATEGORY
-- =====================================================

SELECT 
    '📂 CATEGORY BREAKDOWN' as 'Section',
    '' as 'Permission #',
    '' as 'Permission Code', 
    '' as 'Permission Name',
    '' as 'Description'

UNION ALL

-- User Management Category
SELECT 
    '👥 USER MANAGEMENT',
    CAST(ROW_NUMBER() OVER (ORDER BY p.name) as CHAR),
    p.name,
    p.display_name,
    p.description
FROM permissions p 
WHERE p.category = 'User Management' AND p.is_active = true

UNION ALL

-- Role Management Category  
SELECT 
    '🔐 ROLE MANAGEMENT',
    CAST(ROW_NUMBER() OVER (ORDER BY p.name) as CHAR),
    p.name,
    p.display_name,
    p.description
FROM permissions p 
WHERE p.category = 'Role Management' AND p.is_active = true

UNION ALL

-- Inventory Category
SELECT 
    '📦 INVENTORY',
    CAST(ROW_NUMBER() OVER (ORDER BY p.name) as CHAR),
    p.name,
    p.display_name,
    p.description
FROM permissions p 
WHERE p.category = 'Inventory' AND p.is_active = true

UNION ALL

-- Products Category
SELECT 
    '🏷️ PRODUCTS',
    CAST(ROW_NUMBER() OVER (ORDER BY p.name) as CHAR),
    p.name,
    p.display_name,
    p.description
FROM permissions p 
WHERE p.category = 'Products' AND p.is_active = true

UNION ALL

-- Dispatch Category
SELECT 
    '🚚 DISPATCH',
    CAST(ROW_NUMBER() OVER (ORDER BY p.name) as CHAR),
    p.name,
    p.display_name,
    p.description
FROM permissions p 
WHERE p.category = 'Dispatch' AND p.is_active = true

UNION ALL

-- Other categories (if they exist)
SELECT 
    CONCAT('📋 ', UPPER(p.category)),
    CAST(ROW_NUMBER() OVER (ORDER BY p.name) as CHAR),
    p.name,
    p.display_name,
    p.description
FROM permissions p 
WHERE p.category NOT IN ('User Management', 'Role Management', 'Inventory', 'Products', 'Dispatch') 
    AND p.is_active = true;

-- =====================================================
-- SIMPLE COUNT BY CATEGORY
-- =====================================================

SELECT 
    '📊 SUMMARY BY CATEGORY' as 'Category',
    '' as 'Count',
    '' as 'Permissions List'

UNION ALL

SELECT 
    p.category,
    CAST(COUNT(*) as CHAR),
    GROUP_CONCAT(p.display_name ORDER BY p.name SEPARATOR ' | ')
FROM permissions p 
WHERE p.is_active = true
GROUP BY p.category
ORDER BY COUNT(*) DESC;

-- =====================================================
-- JUST THE PERMISSION NAMES (SIMPLE LIST)
-- =====================================================

SELECT 
    '📋 ALL 23 PERMISSIONS (Simple List)' as 'All Permissions'

UNION ALL

SELECT 
    CONCAT(
        ROW_NUMBER() OVER (ORDER BY p.category, p.name), 
        '. ', 
        p.display_name, 
        ' (', p.name, ')'
    )
FROM permissions p 
WHERE p.is_active = true
ORDER BY p.category, p.name;

-- =====================================================
-- PERMISSION CODES ONLY (For Reference)
-- =====================================================

SELECT 
    '🔑 PERMISSION CODES REFERENCE' as 'Reference'

UNION ALL

SELECT p.name
FROM permissions p 
WHERE p.is_active = true
ORDER BY p.category, p.name;

-- =====================================================
-- END OF PERMISSION LIST
-- =====================================================