const jwt = require('jsonwebtoken');
const db = require('../db/connection');

// JWT Secret (should be in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate JWT Token
 */
const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        role_name: user.role_name || user.role,
        iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'inventory-system',
        audience: 'inventory-users'
    });
};

/**
 * Verify JWT Token Middleware
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required',
            error: 'NO_TOKEN'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('JWT verification failed:', err.message);
            
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired',
                    error: 'TOKEN_EXPIRED'
                });
            }
            
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token',
                    error: 'INVALID_TOKEN'
                });
            }

            return res.status(403).json({
                success: false,
                message: 'Token verification failed',
                error: 'TOKEN_VERIFICATION_FAILED'
            });
        }

        // Add user info to request
        req.user = decoded;
        next();
    });
};

/**
 * Check if user has specific permission
 */
const checkPermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const roleId = req.user.role_id;

            // Check if user has the permission through their role
            const permissionQuery = `
                SELECT p.name 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.name = ?
                LIMIT 1
            `;

            db.query(permissionQuery, [roleId, permissionName], (err, results) => {
                if (err) {
                    console.error('Permission check error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Permission check failed'
                    });
                }

                if (results.length === 0) {
                    return res.status(403).json({
                        success: false,
                        message: 'Insufficient permissions',
                        required_permission: permissionName,
                        user_role: req.user.role_name
                    });
                }

                next();
            });
        } catch (error) {
            console.error('Permission middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Permission check failed'
            });
        }
    };
};

/**
 * Check if user has permission (global or warehouse-specific)
 * For example: checkWarehousePermission('ORDERS_VIEW') will check for:
 * - ORDERS_VIEW (global)
 * - ORDERS_VIEW_GGM_WH, ORDERS_VIEW_BLR_WH, etc. (warehouse-specific)
 */
const checkWarehousePermission = (basePermissionName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const roleId = req.user.role_id;

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
                        message: 'Permission check failed'
                    });
                }

                // If user has global permission, allow access
                if (globalResults.length > 0) {
                    // Set global permission in user object for controller use
                    req.user.permissions = [basePermissionName];
                    return next();
                }

                // Check for warehouse-specific permissions
                const warehousePermissionQuery = `
                    SELECT p.name 
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = ? AND p.name LIKE ?
                    LIMIT 1
                `;

                const warehousePattern = `${basePermissionName}_%_WH`;
                
                db.query(warehousePermissionQuery, [roleId, warehousePattern], (warehouseErr, warehouseResults) => {
                    if (warehouseErr) {
                        console.error('Warehouse permission check error:', warehouseErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Permission check failed'
                        });
                    }

                    if (warehouseResults.length === 0) {
                        return res.status(403).json({
                            success: false,
                            message: 'Insufficient permissions',
                            required_permission: `${basePermissionName} or warehouse-specific permissions`,
                            user_role: req.user.role_name
                        });
                    }

                    // User has warehouse-specific permissions, get them for filtering
                    const getAllWarehousePermissionsQuery = `
                        SELECT p.name 
                        FROM permissions p
                        JOIN role_permissions rp ON p.id = rp.permission_id
                        WHERE rp.role_id = ? AND p.name LIKE ?
                    `;

                    db.query(getAllWarehousePermissionsQuery, [roleId, warehousePattern], (allErr, allResults) => {
                        if (allErr) {
                            console.error('Get all warehouse permissions error:', allErr);
                            return res.status(500).json({
                                success: false,
                                message: 'Permission check failed'
                            });
                        }

                        // Add warehouse permissions to request for controller use
                        req.user.permissions = allResults.map(p => p.name);
                        next();
                    });
                });
            });
        } catch (error) {
            console.error('Warehouse permission middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Permission check failed'
            });
        }
    };
};

/**
 * Alias for requirePermission (for compatibility)
 */
const requirePermission = checkPermission;

/**
 * Get user permissions
 */
const getUserPermissions = async (userId, roleId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT DISTINCT p.name, p.display_name, p.category
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
            ORDER BY p.category, p.name
        `;

        db.query(query, [roleId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

module.exports = {
    generateToken,
    authenticateToken,
    checkPermission,
    checkWarehousePermission,
    requirePermission,
    getUserPermissions,
    JWT_SECRET
};