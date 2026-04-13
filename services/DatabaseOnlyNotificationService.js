/**
 * DATABASE-ONLY NOTIFICATION SERVICE
 * Simplified notification service that works without Firebase
 * Perfect for testing and basic notification functionality
 */

const db = require('../db/connection');
const IPGeolocationTracker = require('../IPGeolocationTracker');

// Create a single instance of IPGeolocationTracker
const geoTracker = new IPGeolocationTracker();

class DatabaseOnlyNotificationService {
    constructor() {
        console.log('📱 Database-Only Notification Service initialized');
    }

    // Create notification using your existing schema
    async createNotification(title, message, type, options = {}) {
        return new Promise((resolve, reject) => {
            const {
                userId = null,
                priority = 'medium',
                relatedEntityType = null,
                relatedEntityId = null,
                data = {},
                expiresAt = null
            } = options;

            const query = `
                INSERT INTO notifications (
                    title, message, type, priority, user_id, 
                    related_entity_type, related_entity_id, data, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.query(query, [
                title, 
                message, 
                type, 
                priority, 
                userId,
                relatedEntityType,
                relatedEntityId,
                JSON.stringify(data),
                expiresAt
            ], (err, result) => {
                if (err) {
                    console.error('Create notification error:', err);
                    reject(err);
                } else {
                    console.log(`📱 Notification created: ${title} (ID: ${result.insertId})`);
                    resolve(result.insertId);
                }
            });
        });
    }

    // Check user notification preferences
    async getUserPreferences(userId, notificationType) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT enabled, push_enabled, email_enabled 
                FROM notification_preferences 
                WHERE user_id = ? AND notification_type = ?
            `;
            
            db.query(query, [userId, notificationType], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    if (results.length > 0) {
                        resolve(results[0]);
                    } else {
                        // Default preferences if not found
                        resolve({ enabled: 1, push_enabled: 0, email_enabled: 0 });
                    }
                }
            });
        });
    }

    // Send notification to specific user (database only)
    async sendNotificationToUser(userId, title, message, type, options = {}) {
        try {
            // Check user preferences
            const preferences = await this.getUserPreferences(userId, type);
            
            if (!preferences.enabled) {
                console.log(`🔕 Notifications disabled for user ${userId}, type ${type}`);
                return { success: false, reason: 'User disabled notifications' };
            }

            // Create notification in database
            const notificationId = await this.createNotification(title, message, type, {
                userId: userId,
                ...options
            });
            
            console.log(`✅ Database notification sent to user ${userId}`);
            
            return {
                success: true,
                notificationId: notificationId,
                method: 'database',
                tokensCount: 0 // No push notifications
            };
            
        } catch (error) {
            console.error('Send notification error:', error);
            return { success: false, error: error.message };
        }
    }

    // Send notification to all users except sender
    async sendNotificationToAllExcept(senderId, title, message, type, options = {}) {
        try {
            // Get all active users except sender
            const users = await new Promise((resolve, reject) => {
                const query = `
                    SELECT id, name FROM users 
                    WHERE is_active = 1 AND id != ?
                `;
                
                db.query(query, [senderId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            const results = [];
            
            // Send notification to each user
            for (const user of users) {
                const result = await this.sendNotificationToUser(user.id, title, message, type, options);
                results.push({ userId: user.id, userName: user.name, ...result });
            }
            
            console.log(`📢 Broadcast notification sent to ${users.length} users`);
            
            return {
                success: true,
                totalUsers: users.length,
                results: results
            };
            
        } catch (error) {
            console.error('Broadcast notification error:', error);
            return { success: false, error: error.message };
        }
    }

    // Event-specific notification methods with location tracking
    async notifyUserLogin(loginUserId, loginUserName, ipAddress) {
        try {
            // Get location from IP
            const location = await geoTracker.getLocationData(ipAddress);
            const locationStr = location ? `${location.city}, ${location.region}, ${location.country}` : 'Unknown Location';
            
            const title = '👤 User Login Alert';
            const message = `${loginUserName} has logged in from ${locationStr}`;
            
            return await this.sendNotificationToAllExcept(loginUserId, title, message, 'user_login', {
                priority: 'low',
                relatedEntityType: 'user',
                relatedEntityId: loginUserId,
                data: {
                    action: 'LOGIN',
                    user_name: loginUserName,
                    location: locationStr,
                    ip_address: ipAddress,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Login notification error:', error);
            return { success: false, error: error.message };
        }
    }

    async notifyDispatchCreated(dispatchUserId, dispatchUserName, productName, quantity, ipAddress, dispatchId = null) {
        try {
            const location = await geoTracker.getLocationData(ipAddress);
            const locationStr = location ? `${location.city}, ${location.region}` : 'Unknown Location';
            
            const title = '📦 New Dispatch Created';
            const message = `${dispatchUserName} dispatched ${quantity}x ${productName} from ${locationStr}`;
            
            return await this.sendNotificationToAllExcept(dispatchUserId, title, message, 'dispatch', {
                priority: 'medium',
                relatedEntityType: 'dispatch',
                relatedEntityId: dispatchId,
                data: {
                    action: 'DISPATCH_CREATE',
                    user_name: dispatchUserName,
                    product_name: productName,
                    quantity: quantity,
                    location: locationStr,
                    ip_address: ipAddress,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Dispatch notification error:', error);
            return { success: false, error: error.message };
        }
    }

    async notifyReturnCreated(returnUserId, returnUserName, productName, quantity, ipAddress, returnId = null) {
        try {
            const location = await geoTracker.getLocationData(ipAddress);
            const locationStr = location ? `${location.city}, ${location.region}` : 'Unknown Location';
            
            const title = '↩️ Product Return';
            const message = `${returnUserName} processed return of ${quantity}x ${productName} from ${locationStr}`;
            
            return await this.sendNotificationToAllExcept(returnUserId, title, message, 'return', {
                priority: 'medium',
                relatedEntityType: 'return',
                relatedEntityId: returnId,
                data: {
                    action: 'RETURN_CREATE',
                    user_name: returnUserName,
                    product_name: productName,
                    quantity: quantity,
                    location: locationStr,
                    ip_address: ipAddress,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Return notification error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user notifications
    async getUserNotifications(userId, limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT n.*, u.name as sender_name
                FROM notifications n
                LEFT JOIN users u ON JSON_EXTRACT(n.data, '$.user_id') = u.id
                WHERE n.user_id = ? OR n.user_id IS NULL
                ORDER BY n.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            db.query(query, [userId, limit, offset], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    // Parse data JSON
                    const notifications = results.map(notification => ({
                        ...notification,
                        data: typeof notification.data === 'string' 
                            ? JSON.parse(notification.data) 
                            : notification.data
                    }));
                    resolve(notifications);
                }
            });
        });
    }

    // Mark notification as read
    async markAsRead(notificationId, userId) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE notifications 
                SET is_read = 1, read_at = CURRENT_TIMESTAMP
                WHERE id = ? AND (user_id = ? OR user_id IS NULL)
            `;
            
            db.query(query, [notificationId, userId], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.affectedRows > 0);
                }
            });
        });
    }
}

module.exports = new DatabaseOnlyNotificationService();