/**
 * NOTIFICATION ROUTES
 * API routes for notification system
 */

const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user notifications
router.get('/', NotificationController.getNotifications);

// Mark specific notification as read
router.put('/:notificationId/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', NotificationController.markAllAsRead);

// Register Firebase token
router.post('/register-token', NotificationController.registerToken);

// Get notification settings
router.get('/settings', NotificationController.getNotificationSettings);

// Update notification settings
router.put('/settings', NotificationController.updateNotificationSettings);

// Send test notification (admin only)
router.post('/test', NotificationController.sendTestNotification);

module.exports = router;