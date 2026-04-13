const express = require('express');
const router = express.Router();
const PermissionsController = require('../controllers/permissionsController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// ================= AUTHENTICATION ROUTES ================= //

// POST /api/auth/login - User login
router.post('/auth/login', PermissionsController.login);

// POST /api/auth/logout - User logout
router.post('/auth/logout', authenticateToken, PermissionsController.logout);

// POST /api/auth/refresh - Refresh JWT token
router.post('/auth/refresh', PermissionsController.refreshToken);

// ================= USER MANAGEMENT ROUTES ================= //

// GET /api/users - Get all users
router.get('/users', 
    authenticateToken, 
    checkPermission('SYSTEM_USER_MANAGEMENT'), 
    PermissionsController.getUsers
);

// GET /api/users/:userId - Get user by ID
router.get('/users/:userId', 
    authenticateToken, 
    checkPermission('SYSTEM_USER_MANAGEMENT'), 
    PermissionsController.getUserById
);

// POST /api/users - Create new user
router.post('/users', 
    authenticateToken, 
    checkPermission('SYSTEM_USER_MANAGEMENT'), 
    PermissionsController.createUser
);

// PUT /api/users/:userId - Update user
router.put('/users/:userId', 
    authenticateToken, 
    checkPermission('SYSTEM_USER_MANAGEMENT'), 
    PermissionsController.updateUser
);

// DELETE /api/users/:userId - Delete user
router.delete('/users/:userId', 
    authenticateToken, 
    checkPermission('SYSTEM_USER_MANAGEMENT'), 
    PermissionsController.deleteUser
);

// PUT /api/users/:userId/role - Update user role
router.put('/users/:userId/role', 
    authenticateToken, 
    checkPermission('SYSTEM_USER_MANAGEMENT'), 
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { roleId } = req.body;
            
            const db = require('../db/connection');
            
            await db.execute('UPDATE users SET role_id = ? WHERE id = ?', [roleId, userId]);
            
            // FIXED: Log audit with proper user_id and IP
            await PermissionsController.createAuditLog(
                req.user?.id,  // FIXED: was req.user?.userId
                'UPDATE_ROLE', 
                'USER', 
                userId, 
                { 
                    roleId,
                    ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                               req.headers['x-real-ip'] ||
                               req.connection.remoteAddress ||
                               req.ip ||
                               '127.0.0.1',
                    user_agent: req.get('User-Agent')
                }
            );
            
            res.json({
                success: true,
                message: 'User role updated successfully'
            });
            
        } catch (error) {
            console.error('Update user role error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user role'
            });
        }
    }
);

// ================= ROLE MANAGEMENT ROUTES ================= //

// GET /api/roles - Get all roles (public for frontend to load role data)
router.get('/roles', 
    PermissionsController.getRoles
);

// GET /api/roles/:roleId - Get role by ID
router.get('/roles/:roleId', 
    authenticateToken, 
    checkPermission('SYSTEM_ROLE_MANAGEMENT'), 
    async (req, res) => {
        try {
            const { roleId } = req.params;
            const db = require('../db/connection');
            
            const [roles] = await db.execute(`
                SELECT * FROM roles WHERE id = ? AND is_active = true
            `, [roleId]);
            
            if (roles.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            
            const role = roles[0];
            
            // Get role permissions
            const [permissions] = await db.execute(`
                SELECT p.id, p.name, p.display_name, p.category
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.is_active = true
                ORDER BY p.category, p.name
            `, [roleId]);
            
            role.permissions = permissions;
            
            res.json({
                success: true,
                data: role
            });
            
        } catch (error) {
            console.error('Get role error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch role'
            });
        }
    }
);

// POST /api/roles - Create new role
router.post('/roles', 
    authenticateToken, 
    checkPermission('SYSTEM_ROLE_MANAGEMENT'), 
    PermissionsController.createRole
);

// PUT /api/roles/:roleId - Update role
router.put('/roles/:roleId', 
    authenticateToken, 
    checkPermission('SYSTEM_ROLE_MANAGEMENT'), 
    async (req, res) => {
        try {
            const { roleId } = req.params;
            const { name, displayName, display_name, description, color, permissionIds } = req.body;
            
            // Accept both camelCase and snake_case
            const finalDisplayName = displayName || display_name;
            
            const db = require('../db/connection');
            
            // Update role basic info
            await db.execute(`
                UPDATE roles 
                SET name = ?, display_name = ?, description = ?, color = ?
                WHERE id = ?
            `, [name, finalDisplayName, description, color, roleId]);
            
            // Update permissions if provided
            if (permissionIds !== undefined && Array.isArray(permissionIds)) {
                // First, delete existing permissions
                await db.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
                
                // Insert new permissions if any
                if (permissionIds.length > 0) {
                    const values = permissionIds.map(permId => [roleId, permId]);
                    const placeholders = permissionIds.map(() => '(?, ?)').join(', ');
                    const flatValues = values.flat();
                    
                    await db.execute(
                        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`,
                        flatValues
                    );
                }
            }
            
            // FIXED: Log audit with proper user_id and IP
            await PermissionsController.createAuditLog(
                req.user?.id,  // FIXED: was req.user?.userId
                'UPDATE', 
                'ROLE', 
                roleId, 
                {
                    name, displayName: finalDisplayName, description, color, permissionIds,
                    ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                               req.headers['x-real-ip'] ||
                               req.connection.remoteAddress ||
                               req.ip ||
                               '127.0.0.1',
                    user_agent: req.get('User-Agent')
                }
            );
            
            res.json({
                success: true,
                message: 'Role updated successfully'
            });
            
        } catch (error) {
            console.error('Update role error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update role'
            });
        }
    }
);

// DELETE /api/roles/:roleId - Delete role
router.delete('/roles/:roleId', 
    authenticateToken, 
    checkPermission('SYSTEM_ROLE_MANAGEMENT'), 
    async (req, res) => {
        try {
            const { roleId } = req.params;
            const db = require('../db/connection');
            
            // Check if role has users (using callback-based query)
            db.query('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [roleId], (err, users) => {
                if (err) {
                    console.error('Delete role error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to delete role'
                    });
                }
                
                if (users[0].count > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot delete role with assigned users'
                    });
                }
                
                // Delete role permissions first
                db.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId], (err) => {
                    if (err) {
                        console.error('Delete role permissions error:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to delete role permissions'
                        });
                    }
                    
                    // Delete role
                    db.query('DELETE FROM roles WHERE id = ?', [roleId], async (err, result) => {
                        if (err) {
                            console.error('Delete role error:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to delete role'
                            });
                        }
                        
                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                success: false,
                                message: 'Role not found'
                            });
                        }
                        
                        // FIXED: Log audit with proper user_id and IP
                        try {
                            await PermissionsController.createAuditLog(
                                req.user?.id,  // FIXED: was req.user?.userId
                                'DELETE', 
                                'ROLE', 
                                roleId, 
                                {
                                    ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                                               req.headers['x-real-ip'] ||
                                               req.connection.remoteAddress ||
                                               req.ip ||
                                               '127.0.0.1',
                                    user_agent: req.get('User-Agent')
                                }
                            );
                        } catch (auditError) {
                            console.error('Audit log error:', auditError);
                            // Continue anyway - don't fail the deletion for audit log issues
                        }
                        
                        res.json({
                            success: true,
                            message: 'Role deleted successfully'
                        });
                    });
                });
            });
            
        } catch (error) {
            console.error('Delete role error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete role'
            });
        }
    }
);

// ================= ROLE-PERMISSION MAPPING ROUTES ================= //

// GET /api/roles/:roleId/permissions - Get role permissions
router.get('/roles/:roleId/permissions', 
    authenticateToken, 
    checkPermission('SYSTEM_ROLE_MANAGEMENT'), 
    async (req, res) => {
        try {
            const { roleId } = req.params;
            const db = require('../db/connection');
            
            const [permissions] = await db.execute(`
                SELECT p.id, p.name, p.display_name, p.category
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.is_active = true
                ORDER BY p.category, p.name
            `, [roleId]);
            
            res.json({
                success: true,
                data: permissions
            });
            
        } catch (error) {
            console.error('Get role permissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch role permissions'
            });
        }
    }
);

// POST /api/roles/:roleId/permissions - Assign permission to role
router.post('/roles/:roleId/permissions', 
    authenticateToken, 
    checkPermission('SYSTEM_ROLE_MANAGEMENT'), 
    async (req, res) => {
        try {
            const { roleId } = req.params;
            const { permissionId } = req.body;
            
            const db = require('../db/connection');
            
            await db.execute(`
                INSERT IGNORE INTO role_permissions (role_id, permission_id)
                VALUES (?, ?)
            `, [roleId, permissionId]);
            
            // FIXED: Log audit with proper user_id and IP
            await PermissionsController.createAuditLog(
                req.user?.id,  // FIXED: was req.user?.userId
                'ASSIGN_PERMISSION', 
                'ROLE', 
                roleId, 
                { 
                    permissionId,
                    ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                               req.headers['x-real-ip'] ||
                               req.connection.remoteAddress ||
                               req.ip ||
                               '127.0.0.1',
                    user_agent: req.get('User-Agent')
                }
            );
            
            res.json({
                success: true,
                message: 'Permission assigned to role successfully'
            });
            
        } catch (error) {
            console.error('Assign permission error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign permission'
            });
        }
    }
);

// DELETE /api/roles/:roleId/permissions/:permissionId - Remove permission from role
router.delete('/roles/:roleId/permissions/:permissionId', 
    authenticateToken, 
    checkPermission('SYSTEM_ROLE_MANAGEMENT'), 
    async (req, res) => {
        try {
            const { roleId, permissionId } = req.params;
            const db = require('../db/connection');
            
            await db.execute(`
                DELETE FROM role_permissions 
                WHERE role_id = ? AND permission_id = ?
            `, [roleId, permissionId]);
            
            // FIXED: Log audit with proper user_id and IP
            await PermissionsController.createAuditLog(
                req.user?.id,  // FIXED: was req.user?.userId
                'REMOVE_PERMISSION', 
                'ROLE', 
                roleId, 
                { 
                    permissionId,
                    ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                               req.headers['x-real-ip'] ||
                               req.connection.remoteAddress ||
                               req.ip ||
                               '127.0.0.1',
                    user_agent: req.get('User-Agent')
                }
            );
            
            res.json({
                success: true,
                message: 'Permission removed from role successfully'
            });
            
        } catch (error) {
            console.error('Remove permission error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove permission'
            });
        }
    }
);

// PUT /api/roles/:roleId/permissions - Update role permissions (bulk)
router.put('/roles/:roleId/permissions', 
    authenticateToken, 
    checkPermission('SYSTEM_ROLE_MANAGEMENT'), 
    async (req, res) => {
        try {
            const { roleId } = req.params;
            const { permissionIds } = req.body;
            
            const db = require('../db/connection');
            
            // Start transaction
            await db.execute('START TRANSACTION');
            
            try {
                // Remove all existing permissions
                await db.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
                
                // Add new permissions
                if (permissionIds && permissionIds.length > 0) {
                    const values = permissionIds.map(permId => `(${roleId}, ${permId})`).join(',');
                    await db.execute(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`);
                }
                
                await db.execute('COMMIT');
                
                // FIXED: Log audit with proper user_id and IP
                await PermissionsController.createAuditLog(
                    req.user?.id,  // FIXED: was req.user?.userId
                    'UPDATE_PERMISSIONS', 
                    'ROLE', 
                    roleId, 
                    { 
                        permissionIds,
                        ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                                   req.headers['x-real-ip'] ||
                                   req.connection.remoteAddress ||
                                   req.ip ||
                                   '127.0.0.1',
                        user_agent: req.get('User-Agent')
                    }
                );
                
                res.json({
                    success: true,
                    message: 'Role permissions updated successfully'
                });
                
            } catch (error) {
                await db.execute('ROLLBACK');
                throw error;
            }
            
        } catch (error) {
            console.error('Update role permissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update role permissions'
            });
        }
    }
);

// ================= PERMISSION MANAGEMENT ROUTES ================= //

// GET /api/permissions - Get all permissions (public for frontend to load permission data)
router.get('/permissions', 
    PermissionsController.getPermissions
);

// GET /api/permissions/:permissionId - Get permission by ID
router.get('/permissions/:permissionId', 
    authenticateToken, 
    checkPermission('SYSTEM_PERMISSION_MANAGEMENT'), 
    async (req, res) => {
        try {
            const { permissionId } = req.params;
            const db = require('../db/connection');
            
            db.query(`
                SELECT * FROM permissions WHERE id = ? AND is_active = true
            `, [permissionId], (err, permissions) => {
                if (err) {
                    console.error('Get permission error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch permission'
                    });
                }
                
                if (permissions.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Permission not found'
                    });
                }
                
                res.json({
                    success: true,
                    data: permissions[0]
                });
            });
            
        } catch (error) {
            console.error('Get permission error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch permission'
            });
        }
    }
);

// ================= AUDIT LOG ROUTES ================= //

// GET /api/audit-logs - Get audit logs (REMOVED PERMISSION CHECK FOR TESTING)
router.get('/audit-logs', 
    authenticateToken, 
    // checkPermission('SYSTEM_AUDIT_LOG'),  // TEMPORARILY REMOVED FOR TESTING
    PermissionsController.getAuditLogs
);

// GET /api/audit-logs/user/:userId - Get audit logs by user
router.get('/audit-logs/user/:userId', 
    authenticateToken, 
    checkPermission('SYSTEM_AUDIT_LOG'), 
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;
            
            const db = require('../db/connection');
            
            const [logs] = await db.execute(`
                SELECT al.*, u.name as user_name, u.email as user_email
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.user_id = ?
                ORDER BY al.created_at DESC
                LIMIT ? OFFSET ?
            `, [userId, parseInt(limit), parseInt(offset)]);
            
            res.json({
                success: true,
                data: logs
            });
            
        } catch (error) {
            console.error('Get user audit logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user audit logs'
            });
        }
    }
);

// GET /api/audit-logs/action/:action - Get audit logs by action
router.get('/audit-logs/action/:action', 
    authenticateToken, 
    checkPermission('SYSTEM_AUDIT_LOG'), 
    async (req, res) => {
        try {
            const { action } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;
            
            const db = require('../db/connection');
            
            const [logs] = await db.execute(`
                SELECT al.*, u.name as user_name, u.email as user_email
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.action = ?
                ORDER BY al.created_at DESC
                LIMIT ? OFFSET ?
            `, [action, parseInt(limit), parseInt(offset)]);
            
            res.json({
                success: true,
                data: logs
            });
            
        } catch (error) {
            console.error('Get action audit logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch action audit logs'
            });
        }
    }
);

// ================= SYSTEM STATS ROUTES ================= //

// GET /api/system/stats - Get system statistics
router.get('/system/stats', 
    authenticateToken, 
    checkPermission('SYSTEM_MONITORING'), 
    PermissionsController.getSystemStats
);

// GET /api/system/permission-usage - Get permission usage statistics
router.get('/system/permission-usage', 
    authenticateToken, 
    checkPermission('SYSTEM_MONITORING'), 
    async (req, res) => {
        try {
            const db = require('../db/connection');
            
            const [usage] = await db.execute(`
                SELECT p.name, p.display_name, p.category, COUNT(rp.role_id) as role_count
                FROM permissions p
                LEFT JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE p.is_active = true
                GROUP BY p.id
                ORDER BY role_count DESC, p.category, p.name
            `);
            
            res.json({
                success: true,
                data: usage
            });
            
        } catch (error) {
            console.error('Get permission usage error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch permission usage'
            });
        }
    }
);

// GET /api/system/role-distribution - Get role distribution statistics
router.get('/system/role-distribution', 
    authenticateToken, 
    checkPermission('SYSTEM_MONITORING'), 
    async (req, res) => {
        try {
            const db = require('../db/connection');
            
            const [distribution] = await db.execute(`
                SELECT r.name, r.display_name, r.color, COUNT(u.id) as user_count
                FROM roles r
                LEFT JOIN users u ON r.id = u.role_id AND u.status = 'active'
                WHERE r.is_active = true
                GROUP BY r.id
                ORDER BY user_count DESC
            `);
            
            res.json({
                success: true,
                data: distribution
            });
            
        } catch (error) {
            console.error('Get role distribution error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch role distribution'
            });
        }
    }
);

module.exports = router;
