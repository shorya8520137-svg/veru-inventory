
/**
 * ENHANCED AUTH MIDDLEWARE WITH BETTER ERROR HANDLING
 */

const checkWarehousePermission = (basePermissionName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const roleId = req.user.role_id;

            console.log(`🔍 Checking permission: ${basePermissionName} for user ${userId} (role: ${roleId})`);

            // First check for global permission
            const globalPermissionQuery = `
                SELECT p.name 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.name = ?
                LIMIT 1
            `;

            db.query(globalPermissionQuery, [roleId, basePermissionName], (err, globalResults) => {
                if (err) {
                    console.error('Global permission check error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Permission check failed',
                        error: err.message
                    });
                }

                console.log(`🔍 Global permission check for ${basePermissionName}:`, globalResults.length > 0 ? 'FOUND' : 'NOT FOUND');

                // If user has global permission, allow access
                if (globalResults.length > 0) {
                    console.log(`✅ User has global permission: ${basePermissionName}`);
                    return next();
                }

                // Check for warehouse-specific permissions
                const warehousePermissionQuery = `
                    SELECT p.name 
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = ? AND p.name LIKE ?
                `;

                const warehousePattern = `${basePermissionName}_%_WH`;
                console.log(`🔍 Checking warehouse pattern: ${warehousePattern}`);
                
                db.query(warehousePermissionQuery, [roleId, warehousePattern], (warehouseErr, warehouseResults) => {
                    if (warehouseErr) {
                        console.error('Warehouse permission check error:', warehouseErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Permission check failed',
                            error: warehouseErr.message
                        });
                    }

                    console.log(`🔍 Warehouse permissions found:`, warehouseResults.length);
                    warehouseResults.forEach(result => console.log(`   - ${result.name}`));

                    if (warehouseResults.length === 0) {
                        console.log(`❌ No permissions found for user ${userId}`);
                        return res.status(403).json({
                            success: false,
                            message: 'Insufficient permissions',
                            required_permission: `${basePermissionName} or warehouse-specific permissions like ${basePermissionName}_GGM_WH`,
                            user_role: req.user.role_name,
                            user_id: userId,
                            role_id: roleId
                        });
                    }

                    console.log(`✅ User has warehouse-specific permissions`);
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
