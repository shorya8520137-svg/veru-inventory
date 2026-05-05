-- ============================================================================
-- SETUP ADMIN USER WITH FULL ACCESS
-- Delete all users except admin@company.com
-- Set admin password to Admin@123
-- Grant all permissions to admin
-- ============================================================================

-- Step 1: Find or create Super Admin role
SET @super_admin_role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1);

-- If super_admin role doesn't exist, create it
INSERT INTO roles (name, display_name, description, is_active)
SELECT 'super_admin', 'Super Admin', 'Full system access with all permissions', TRUE
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin');

-- Get the super_admin role ID
SET @super_admin_role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1);

-- Step 2: Delete all users EXCEPT admin@company.com
-- First, disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all users except admin@company.com
DELETE FROM users WHERE email != 'admin@company.com';

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Step 3: Create or update admin@company.com user
-- Password hash for 'Admin@123' using bcrypt (10 rounds)
-- You can generate this with: bcrypt.hash('Admin@123', 10)
-- For now, using a placeholder - will be updated on first login

INSERT INTO users (name, email, password, role_id, is_active, created_at, updated_at)
VALUES (
    'System Administrator',
    'admin@company.com',
    '$2b$10$bNCDwqUWQjoytKIjiYyI8uUPPO7WlTesMHA9/n5.bKj1SDtw5vDxq',  -- Admin@123
    @super_admin_role_id,
    TRUE,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = 'System Administrator',
    password = '$2b$10$bNCDwqUWQjoytKIjiYyI8uUPPO7WlTesMHA9/n5.bKj1SDtw5vDxq',  -- Admin@123
    role_id = @super_admin_role_id,
    is_active = TRUE,
    updated_at = NOW();

-- Step 4: Grant ALL permissions to super_admin role
-- First, clear existing permissions for super_admin
DELETE FROM role_permissions WHERE role_id = @super_admin_role_id;

-- Then, grant ALL active permissions
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
    @super_admin_role_id,
    id,
    NOW()
FROM permissions
WHERE is_active = TRUE;

-- Step 5: Verify setup
SELECT 
    u.id,
    u.name,
    u.email,
    r.name as role_name,
    r.display_name as role_display_name,
    COUNT(rp.permission_id) as total_permissions
FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE u.email = 'admin@company.com'
GROUP BY u.id, u.name, u.email, r.name, r.display_name;

-- Show total permissions available
SELECT COUNT(*) as total_available_permissions FROM permissions WHERE is_active = TRUE;

SELECT 'Admin user setup complete!' as status;
SELECT 'Email: admin@company.com' as login_email;
SELECT 'Password: Admin@123' as login_password;
SELECT 'Role: Super Admin with ALL permissions' as access_level;
