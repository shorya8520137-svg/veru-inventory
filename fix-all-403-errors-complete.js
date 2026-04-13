/**
 * COMPLETE FIX FOR ALL 403 ERRORS
 * This script fixes the permission issues causing 403 errors
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 COMPLETE 403 ERROR FIX');
console.log('=' .repeat(50));

// Create SQL script to fix permissions
const createPermissionFixSQL = () => {
    const sqlContent = `
-- =====================================================
-- COMPLETE 403 ERROR FIX - PERMISSIONS SETUP
-- =====================================================

-- 1. Ensure warehouse-specific permissions exist
INSERT IGNORE INTO permissions (name, display_name, description, category) VALUES
-- Warehouse-specific Inventory permissions
('INVENTORY_VIEW_GGM_WH', 'View Gurgaon Warehouse Inventory', 'View inventory data for Gurgaon warehouse', 'Warehouse Access'),
('INVENTORY_VIEW_BLR_WH', 'View Bangalore Warehouse Inventory', 'View inventory data for Bangalore warehouse', 'Warehouse Access'),
('ORDERS_VIEW_GGM_WH', 'View Gurgaon Warehouse Orders', 'View orders for Gurgaon warehouse', 'Warehouse Access'),
('ORDERS_VIEW_BLR_WH', 'View Bangalore Warehouse Orders', 'View orders for Bangalore warehouse', 'Warehouse Access'),

-- Global permissions (fallback)
('INVENTORY_VIEW', 'View All Inventory', 'View inventory data for all warehouses', 'Inventory'),
('ORDERS_VIEW', 'View All Orders', 'View orders for all warehouses', 'Orders');

-- 2. Create a warehouse staff role if it doesn't exist
INSERT IGNORE INTO roles (name, display_name, description, is_active) VALUES
('warehouse_staff', 'Warehouse Staff', 'Staff with access to specific warehouses', 1);

-- 3. Get the role ID for warehouse staff
SET @warehouse_staff_role_id = (SELECT id FROM roles WHERE name = 'warehouse_staff' LIMIT 1);

-- 4. Assign warehouse-specific permissions to warehouse staff role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @warehouse_staff_role_id, p.id
FROM permissions p
WHERE p.name IN (
    'INVENTORY_VIEW_GGM_WH',
    'INVENTORY_VIEW_BLR_WH', 
    'ORDERS_VIEW_GGM_WH',
    'ORDERS_VIEW_BLR_WH'
);

-- 5. Update test user to have warehouse staff role
UPDATE users 
SET role_id = @warehouse_staff_role_id 
WHERE email = 'test@hunyhuny.com';

-- 6. Verify the setup
SELECT 
    u.email,
    r.name as role,
    p.name as permission
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'test@hunyhuny.com'
ORDER BY p.name;

-- 7. Alternative: Give admin role global permissions if needed
SET @admin_role_id = (SELECT id FROM roles WHERE name IN ('admin', 'super_admin', 'administrator') LIMIT 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @admin_role_id, p.id
FROM permissions p
WHERE p.name IN ('INVENTORY_VIEW', 'ORDERS_VIEW')
AND @admin_role_id IS NOT NULL;
`;

    return sqlContent;
};

// Create middleware fix
const createMiddlewareFix = () => {
    const middlewareContent = `
/**
 * ENHANCED AUTH MIDDLEWARE WITH BETTER ERROR HANDLING
 */

const checkWarehousePermission = (basePermissionName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const roleId = req.user.role_id;

            console.log(\`🔍 Checking permission: \${basePermissionName} for user \${userId} (role: \${roleId})\`);

            // First check for global permission
            const globalPermissionQuery = \`
                SELECT p.name 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.name = ?
                LIMIT 1
            \`;

            db.query(globalPermissionQuery, [roleId, basePermissionName], (err, globalResults) => {
                if (err) {
                    console.error('Global permission check error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Permission check failed',
                        error: err.message
                    });
                }

                console.log(\`🔍 Global permission check for \${basePermissionName}:\`, globalResults.length > 0 ? 'FOUND' : 'NOT FOUND');

                // If user has global permission, allow access
                if (globalResults.length > 0) {
                    console.log(\`✅ User has global permission: \${basePermissionName}\`);
                    return next();
                }

                // Check for warehouse-specific permissions
                const warehousePermissionQuery = \`
                    SELECT p.name 
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = ? AND p.name LIKE ?
                \`;

                const warehousePattern = \`\${basePermissionName}_%_WH\`;
                console.log(\`🔍 Checking warehouse pattern: \${warehousePattern}\`);
                
                db.query(warehousePermissionQuery, [roleId, warehousePattern], (warehouseErr, warehouseResults) => {
                    if (warehouseErr) {
                        console.error('Warehouse permission check error:', warehouseErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Permission check failed',
                            error: warehouseErr.message
                        });
                    }

                    console.log(\`🔍 Warehouse permissions found:\`, warehouseResults.length);
                    warehouseResults.forEach(result => console.log(\`   - \${result.name}\`));

                    if (warehouseResults.length === 0) {
                        console.log(\`❌ No permissions found for user \${userId}\`);
                        return res.status(403).json({
                            success: false,
                            message: 'Insufficient permissions',
                            required_permission: \`\${basePermissionName} or warehouse-specific permissions like \${basePermissionName}_GGM_WH\`,
                            user_role: req.user.role_name,
                            user_id: userId,
                            role_id: roleId
                        });
                    }

                    console.log(\`✅ User has warehouse-specific permissions\`);
                    // Add warehouse permissions to request for controller use
                    req.user.permissions = warehouseResults.map(p => p.name);
                    next();
                });
            });
        } catch (error) {
            console.error('Warehouse permission middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Permission check failed',
                error: error.message
            });
        }
    };
};
`;

    return middlewareContent;
};

// Create the fix files
const sqlFix = createPermissionFixSQL();
const middlewareFix = createMiddlewareFix();

// Write SQL fix file
fs.writeFileSync('fix-403-permissions.sql', sqlFix);
console.log('✅ Created fix-403-permissions.sql');

// Write middleware enhancement
fs.writeFileSync('enhanced-auth-middleware.js', middlewareFix);
console.log('✅ Created enhanced-auth-middleware.js');

console.log('\n🔧 MANUAL STEPS TO FIX 403 ERRORS:');
console.log('=' .repeat(50));

console.log('\n1. RUN SQL FIX:');
console.log('   Execute the SQL file in your database:');
console.log('   mysql -u username -p database_name < fix-403-permissions.sql');

console.log('\n2. UPDATE AUTH MIDDLEWARE:');
console.log('   Add the enhanced logging to middleware/auth.js');

console.log('\n3. RESTART SERVER:');
console.log('   Stop and restart your Node.js server');

console.log('\n4. TEST THE ENDPOINTS:');
console.log('   - GET /api/order-tracking');
console.log('   - GET /api/inventory');

console.log('\n5. CHECK SERVER LOGS:');
console.log('   Look for permission check logs to debug further');

console.log('\n📋 EXPECTED RESULTS:');
console.log('✅ test@hunyhuny.com should have warehouse-specific permissions');
console.log('✅ /api/order-tracking should return 200 OK');
console.log('✅ /api/inventory should return 200 OK');
console.log('✅ Server logs should show permission checks working');

console.log('\n🔍 IF STILL FAILING:');
console.log('1. Check if test@hunyhuny.com user exists in database');
console.log('2. Verify role_permissions table has correct entries');
console.log('3. Check if permissions table has warehouse-specific entries');
console.log('4. Ensure middleware is properly imported and used');

console.log('\n✅ Fix files created successfully!');