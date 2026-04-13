/**
 * NOTIFICATION CONTROLLER
 * Handles notification API endpoints
 */

const ExistingSchemaNotificationService = require('../services/ExistingSchemaNotificationService');
const db = require('../db/connection');

class NotificationController {
    
    // Get user notifications
    static async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;
            
            const notifications = await ExistingSchemaNotificationService.getUserNotifications(
                userId, 
                parseInt(limit), 
                parseInt(offset)
            );
            
            // Get unread count
            const unreadCount = await new Promise((resolve, reject) => {
                const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE';
                db.query(query, [userId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0].count);
                });
            });
            
            res.json({
                success: true,
                data: {
                    notifications: notifications,
                    unreadCount: unreadCount,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: notifications.length
                    }
                }
            });
            
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications'
            });
        }
    }
    
    // Mark notification as read
    static async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { notificationId } = req.params;
            
            const success = await ExistingSchemaNotificationService.markAsRead(notificationId, userId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Notification marked as read'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read'
            });
        }
    }
    
    // Mark all notifications as read
    static async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            
            const query = `
                UPDATE notifications 
                SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND is_read = FALSE
            `;
            
            db.query(query, [userId], (err, result) => {
                if (err) {
                    console.error('Mark all as read error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to mark notifications as read'
                    });
                }
                
                res.json({
                    success: true,
                    message: `${result.affectedRows} notifications marked as read`
                });
            });
            
        } catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notifications as read'
            });
        }
    }
    
    // Register Firebase token
    static async registerToken(req, res) {
        try {
            const userId = req.user.id;
            const { token, deviceType = 'web', deviceInfo = {} } = req.body;
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Firebase token is required'
                });
            }
            
            await ExistingSchemaNotificationService.registerToken(userId, token, deviceType, deviceInfo);
            
            res.json({
                success: true,
                message: 'Firebase token registered successfully'
            });
            
        } catch (error) {
            console.error('Register token error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to register Firebase token'
            });
        }
    }
    
    // Get notification settings
    static getNotificationSettings(req, res) {
        try {
            const userId = req.user.id;
            
            const query = `
                SELECT * FROM notification_settings 
                WHERE user_id = ?
            `;
            
            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Get notification settings error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch notification settings'
                    });
                }
                
                // If no settings exist, return defaults
                if (results.length === 0) {
                    const defaultSettings = {
                        user_id: userId,
                        login_notifications: true,
                        dispatch_notifications: true,
                        return_notifications: true,
                        damage_notifications: true,
                        product_notifications: true,
                        inventory_notifications: true,
                        system_notifications: true,
                        push_enabled: true,
                        email_enabled: false
                    };
                    
                    return res.json({
                        success: true,
                        data: defaultSettings
                    });
                }
                
                res.json({
                    success: true,
                    data: results[0]
                });
            });
            
        } catch (error) {
            console.error('Get notification settings error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notification settings'
            });
        }
    }
    
    // Update notification settings
    static updateNotificationSettings(req, res) {
        try {
            const userId = req.user.id;
            const settings = req.body;
            
            const query = `
                INSERT INTO notification_settings (
                    user_id, login_notifications, dispatch_notifications, 
                    return_notifications, damage_notifications, product_notifications,
                    inventory_notifications, system_notifications, push_enabled, email_enabled
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                login_notifications = VALUES(login_notifications),
                dispatch_notifications = VALUES(dispatch_notifications),
                return_notifications = VALUES(return_notifications),
                damage_notifications = VALUES(damage_notifications),
                product_notifications = VALUES(product_notifications),
                inventory_notifications = VALUES(inventory_notifications),
                system_notifications = VALUES(system_notifications),
                push_enabled = VALUES(push_enabled),
                email_enabled = VALUES(email_enabled),
                updated_at = CURRENT_TIMESTAMP
            `;
            
            const values = [
                userId,
                settings.login_notifications || false,
                settings.dispatch_notifications || false,
                settings.return_notifications || false,
                settings.damage_notifications || false,
                settings.product_notifications || false,
                settings.inventory_notifications || false,
                settings.system_notifications || false,
                settings.push_enabled || false,
                settings.email_enabled || false
            ];
            
            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('Update notification settings error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update notification settings'
                    });
                }
                
                res.json({
                    success: true,
                    message: 'Notification settings updated successfully'
                });
            });
            
        } catch (error) {
            console.error('Update notification settings error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update notification settings'
            });
        }
    }
    
    // Send test notification (admin only)
    static async sendTestNotification(req, res) {
        try {
            const { title, message, type = 'SYSTEM' } = req.body;
            const senderId = req.user.id;
            
            if (!title || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Title and message are required'
                });
            }
            
            const result = await ExistingSchemaNotificationService.sendNotificationToAllExcept(
                senderId, 
                title, 
                message, 
                type,
                { test: true }
            );
            
            res.json({
                success: true,
                message: 'Test notification sent',
                data: result
            });
            
        } catch (error) {
            console.error('Send test notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send test notification'
            });
        }
    }
}

module.exports = NotificationController;