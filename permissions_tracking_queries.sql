-- =====================================================
-- PERMISSIONS & ACTIVE USERS TRACKING SQL QUERIES
-- Generated from backend controller analysis
-- =====================================================

-- =====================================================
-- 1. USER MANAGEMENT QUERIES
-- =====================================================

-- Get all users with their roles and permissions
SELECT 
    u.id,
    u.name,
    u.email,
    u.is_active,
    u.last_login,
    u.login_count,
    u.created_at,
    u.two_factor_enabled,
    r.name as role_name,
    r.display_name as role_display_name,
    r.color as role_color,
    r.priority as role_priority,
    GROUP_CONCAT(p.name ORDER BY p.category, p.name) as permissions,
    GROUP_CONCAT(p.display_name ORDER BY p.category, p.name) as permission_names,
    COUNT(DISTINCT p.id) as permission_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1
GROUP BY u.id, u.name, u.email, u.is_active, u.last_login, u.login_count, u.created_at, u.two_factor_enabled, r.name, r.display_name, r.color, r.priority
ORDER BY u.last_login DESC;

-- =====================================================
-- 2. ACTIVE USERS TRACKING
-- =====================================================

-- Users active in last 24 hours
SELECT 
    u.id,
    u.name,
    u.email,
    u.last_login,
    r.display_name as role,
    TIMESTAMPDIFF(MINUTE, u.last_login, NOW()) as minutes_since_login,
    CASE 
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 15 MINUTE) THEN 'Online'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 'Recently Active'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 'Active Today'
        ELSE 'Inactive'
    END as status
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.is_active = 1 
    AND u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY u.last_login DESC;

-- =====================================================
-- 3. ROLE & PERMISSION ANALYSIS
-- =====================================================

-- Complete role breakdown with user counts
SELECT 
    r.id,
    r.name,
    r.display_name,
    r.description,
    r.color,
    r.priority,
    r.is_active,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.is_active = 1 THEN u.id END) as active_users,
    COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN u.id END) as users_active_today,
    COUNT(DISTINCT rp.permission_id) as permission_count,
    GROUP_CONCAT(DISTINCT p.category ORDER BY p.category) as permission_categories
FROM roles r
LEFT JOIN users u ON r.id = u.role_id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE r.is_active = true
GROUP BY r.id, r.name, r.display_name, r.description, r.color, r.priority, r.is_active
ORDER BY r.priority, r.name;

-- =====================================================
-- 4. PERMISSION MATRIX
-- =====================================================

-- Show which roles have which permissions
SELECT 
    p.category,
    p.name as permission_name,
    p.display_name as permission_display,
    p.description as permission_description,
    GROUP_CONCAT(DISTINCT r.display_name ORDER BY r.priority) as roles_with_permission,
    COUNT(DISTINCT r.id) as role_count,
    COUNT(DISTINCT u.id) as users_with_permission
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id AND r.is_active = true
LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
WHERE p.is_active = true
GROUP BY p.id, p.category, p.name, p.display_name, p.description
ORDER BY p.category, p.name;

-- =====================================================
-- 5. AUDIT LOG TRACKING
-- =====================================================

-- Recent user activity from audit logs
SELECT 
    al.id,
    al.created_at,
    u.name as user_name,
    u.email as user_email,
    r.display_name as user_role,
    al.action,
    al.resource_type,
    al.resource_id,
    al.ip_address,
    al.user_agent,
    JSON_EXTRACT(al.details, '$.user_name') as logged_user_name,
    JSON_EXTRACT(al.details, '$.create_time') as action_time
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN roles r ON u.role_id = r.id
WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY al.created_at DESC
LIMIT 100;

-- =====================================================
-- 6. LOGIN/LOGOUT TRACKING
-- =====================================================

-- Login sessions from audit logs
SELECT 
    DATE(al.created_at) as login_date,
    u.name as user_name,
    u.email as user_email,
    r.display_name as role,
    COUNT(CASE WHEN al.action = 'LOGIN' THEN 1 END) as login_count,
    COUNT(CASE WHEN al.action = 'LOGOUT' THEN 1 END) as logout_count,
    MAX(CASE WHEN al.action = 'LOGIN' THEN al.created_at END) as last_login,
    MAX(CASE WHEN al.action = 'LOGOUT' THEN al.created_at END) as last_logout,
    GROUP_CONCAT(DISTINCT al.ip_address ORDER BY al.created_at DESC) as ip_addresses
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN roles r ON u.role_id = r.id
WHERE al.resource_type = 'SESSION' 
    AND al.action IN ('LOGIN', 'LOGOUT')
    AND al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(al.created_at), u.id, u.name, u.email, r.display_name
ORDER BY login_date DESC, last_login DESC;

-- =====================================================
-- 7. SECURITY MONITORING
-- =====================================================

-- Failed login attempts (if tracked)
SELECT 
    DATE(al.created_at) as attempt_date,
    al.ip_address,
    JSON_EXTRACT(al.details, '$.user_email') as attempted_email,
    COUNT(*) as failed_attempts,
    MIN(al.created_at) as first_attempt,
    MAX(al.created_at) as last_attempt
FROM audit_logs al
WHERE al.action = 'LOGIN_FAILED' 
    OR (al.action = 'LOGIN' AND JSON_EXTRACT(al.details, '$.status') = 'failed')
    AND al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(al.created_at), al.ip_address, JSON_EXTRACT(al.details, '$.user_email')
HAVING failed_attempts > 3
ORDER BY attempt_date DESC, failed_attempts DESC;

-- =====================================================
-- 8. 2FA STATUS TRACKING
-- =====================================================

-- Two-Factor Authentication status
SELECT 
    u.id,
    u.name,
    u.email,
    u.two_factor_enabled,
    r.display_name as role,
    u.last_login,
    CASE 
        WHEN u.two_factor_enabled = 1 THEN 'Enabled'
        ELSE 'Disabled'
    END as tfa_status,
    CASE 
        WHEN u.two_factor_enabled = 0 AND r.name IN ('admin', 'super_admin') THEN 'HIGH RISK'
        WHEN u.two_factor_enabled = 0 THEN 'MEDIUM RISK'
        ELSE 'SECURE'
    END as security_risk
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.is_active = 1
ORDER BY 
    CASE WHEN u.two_factor_enabled = 0 AND r.name IN ('admin', 'super_admin') THEN 1
         WHEN u.two_factor_enabled = 0 THEN 2
         ELSE 3 END,
    u.last_login DESC;

-- =====================================================
-- 9. PERMISSION USAGE ANALYTICS
-- =====================================================

-- Most used permissions (based on audit logs)
SELECT 
    al.resource_type as permission_area,
    al.action,
    COUNT(*) as usage_count,
    COUNT(DISTINCT al.user_id) as unique_users,
    COUNT(DISTINCT DATE(al.created_at)) as active_days,
    MIN(al.created_at) as first_used,
    MAX(al.created_at) as last_used
FROM audit_logs al
WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    AND al.resource_type IN ('INVENTORY', 'DISPATCH', 'PRODUCT', 'USER', 'ROLE', 'DAMAGE', 'RECOVERY', 'RETURN')
GROUP BY al.resource_type, al.action
ORDER BY usage_count DESC;

-- =====================================================
-- 10. USER SESSION ANALYTICS
-- =====================================================

-- User session duration analysis
WITH login_logout_pairs AS (
    SELECT 
        user_id,
        created_at as login_time,
        LEAD(created_at) OVER (PARTITION BY user_id ORDER BY created_at) as logout_time,
        action,
        LEAD(action) OVER (PARTITION BY user_id ORDER BY created_at) as next_action
    FROM audit_logs 
    WHERE resource_type = 'SESSION' 
        AND action IN ('LOGIN', 'LOGOUT')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
)
SELECT 
    u.name,
    u.email,
    r.display_name as role,
    COUNT(*) as session_count,
    AVG(TIMESTAMPDIFF(MINUTE, llp.login_time, llp.logout_time)) as avg_session_minutes,
    MIN(TIMESTAMPDIFF(MINUTE, llp.login_time, llp.logout_time)) as min_session_minutes,
    MAX(TIMESTAMPDIFF(MINUTE, llp.login_time, llp.logout_time)) as max_session_minutes,
    SUM(TIMESTAMPDIFF(MINUTE, llp.login_time, llp.logout_time)) as total_session_minutes
FROM login_logout_pairs llp
JOIN users u ON llp.user_id = u.id
LEFT JOIN roles r ON u.role_id = r.id
WHERE llp.action = 'LOGIN' 
    AND llp.next_action = 'LOGOUT'
    AND llp.logout_time IS NOT NULL
GROUP BY u.id, u.name, u.email, r.display_name
ORDER BY total_session_minutes DESC;

-- =====================================================
-- 11. SYSTEM HEALTH DASHBOARD
-- =====================================================

-- Overall system statistics
SELECT 
    'Total Users' as metric,
    COUNT(*) as value,
    'users' as unit
FROM users
WHERE is_active = 1

UNION ALL

SELECT 
    'Active Today' as metric,
    COUNT(*) as value,
    'users' as unit
FROM users 
WHERE is_active = 1 
    AND last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR)

UNION ALL

SELECT 
    'With 2FA Enabled' as metric,
    COUNT(*) as value,
    'users' as unit
FROM users 
WHERE is_active = 1 
    AND two_factor_enabled = 1

UNION ALL

SELECT 
    'Total Roles' as metric,
    COUNT(*) as value,
    'roles' as unit
FROM roles 
WHERE is_active = true

UNION ALL

SELECT 
    'Total Permissions' as metric,
    COUNT(*) as value,
    'permissions' as unit
FROM permissions 
WHERE is_active = true

UNION ALL

SELECT 
    'Audit Logs (7 days)' as metric,
    COUNT(*) as value,
    'logs' as unit
FROM audit_logs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- =====================================================
-- 12. PERMISSION COMPLIANCE CHECK
-- =====================================================

-- Users without required permissions for their role
SELECT 
    u.id,
    u.name,
    u.email,
    r.display_name as role,
    COUNT(p.id) as assigned_permissions,
    CASE 
        WHEN r.name = 'super_admin' AND COUNT(p.id) < 10 THEN 'INSUFFICIENT PERMISSIONS'
        WHEN r.name = 'admin' AND COUNT(p.id) < 5 THEN 'INSUFFICIENT PERMISSIONS'
        WHEN COUNT(p.id) = 0 THEN 'NO PERMISSIONS'
        ELSE 'OK'
    END as compliance_status
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = 1
GROUP BY u.id, u.name, u.email, r.display_name, r.name
HAVING compliance_status != 'OK'
ORDER BY 
    CASE compliance_status 
        WHEN 'NO PERMISSIONS' THEN 1
        WHEN 'INSUFFICIENT PERMISSIONS' THEN 2
        ELSE 3 
    END;

-- =====================================================
-- 13. REAL-TIME MONITORING VIEWS
-- =====================================================

-- Create views for real-time monitoring (optional)
-- Uncomment to create views:

/*
CREATE OR REPLACE VIEW active_users_now AS
SELECT 
    u.id,
    u.name,
    u.email,
    r.display_name as role,
    u.last_login,
    TIMESTAMPDIFF(MINUTE, u.last_login, NOW()) as minutes_ago,
    CASE 
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 15 MINUTE) THEN 'Online'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 'Recently Active'
        ELSE 'Offline'
    END as status
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.is_active = 1;

CREATE OR REPLACE VIEW permission_summary AS
SELECT 
    r.display_name as role,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT p.id) as permission_count,
    GROUP_CONCAT(DISTINCT p.category ORDER BY p.category) as categories
FROM roles r
LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE r.is_active = true
GROUP BY r.id, r.display_name
ORDER BY user_count DESC;
*/

-- =====================================================
-- END OF PERMISSIONS TRACKING QUERIES
-- =====================================================