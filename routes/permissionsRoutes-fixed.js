/**
 * PERMISSIONS ROUTES - FIXED VERSION
 * Fixed: req.user?.userId -> req.user?.id (this was causing NULL user_id)
 * Fixed: Added IP address capture
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const PermissionsController = require('../controllers/permissionsController');

// Helper function to get real IP address
const getRealIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.ip ||
           '127.0.0.1';
};

// Enhanced audit logging with IP address
const createAuditLog = async (req, action, resource, resourceId, details = {}) => {
    try {
        await PermissionsController.createAuditLog(
            req.user?.id,  // FIXED: was req.user?.userId
            action,
            resource,
            resourceId,
            {
                ...details,
                ip_address: getRealIP(req),
                user_agent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Audit logging failed:', error);
    }
};

// Update user role
router.put('/users/:id/role',
    authenticateToken,
    requirePermission('SYSTEM_USER_MANAGEMENT'),
    async (req, res) => {
        try {
            const { id: userId } = req.params;
            const { roleId } = req.body;
            
            await PermissionsController.updateUserRole(userId, roleId);
            
            // FIXED: Log audit with proper user_id and IP
            await createAuditLog(req, 'UPDATE_ROLE', 'USER', userId, { roleId });
            
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

// Create role
router.post('/roles',
    authenticateToken,
    requirePermission('SYSTEM_ROLE_MANAGEMENT'),
    async (req, res) => {
        try {
            const { name, displayName, description, color, permissionIds } = req.body;
            
            const result = await PermissionsController.createRole({
                name,
                displayName,
                description,
                color,
                permissionIds
            });
            
            // FIXED: Log audit with proper user_id and IP
            await createAuditLog(req, 'CREATE', 'ROLE', result.roleId, {
                name, displayName, description, color, permissionIds
            });
            
            res.json({
                success: true,
                message: 'Role created successfully',
                roleId: result.roleId
            });
        } catch (error) {
            console.error('Create role error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create role'
            });
        }
    }
);

// Delete role
router.delete('/roles/:id',
    authenticateToken,
    requirePermission('SYSTEM_ROLE_MANAGEMENT'),
    async (req, res) => {
        try {
            const { id: roleId } = req.params;
            
            await PermissionsController.deleteRole(roleId);
            
            // FIXED: Log audit with proper user_id and IP
            await createAuditLog(req, 'DELETE', 'ROLE', roleId, {});
            
            res.json({
                success: true,
                message: 'Role deleted successfully'
            });
        } catch (error) {
            console.error('Delete role error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete role'
            });
        }
    }
);

module.exports = router;