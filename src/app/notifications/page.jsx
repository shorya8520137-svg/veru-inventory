/**
 * NOTIFICATIONS PAGE
 * Full page view of all notifications with filtering and management
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Filter, Settings, Trash2, RefreshCw } from 'lucide-react';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Notification types for filtering
    const notificationTypes = [
        { value: 'all', label: 'All Types', icon: '🔔' },
        { value: 'LOGIN', label: 'Login', icon: '👤' },
        { value: 'DISPATCH', label: 'Dispatch', icon: '📦' },
        { value: 'RETURN', label: 'Return', icon: '↩️' },
        { value: 'DAMAGE', label: 'Damage', icon: '⚠️' },
        { value: 'PRODUCT', label: 'Product', icon: '🏷️' },
        { value: 'INVENTORY', label: 'Inventory', icon: '📊' },
        { value: 'SYSTEM', label: 'System', icon: '🔔' }
    ];

    // Fetch notifications
    const fetchNotifications = async (pageNum = 1, reset = false) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in'}/api/notifications?page=${pageNum}&limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    if (reset || pageNum === 1) {
                        setNotifications(data.data.notifications);
                    } else {
                        setNotifications(prev => [...prev, ...data.data.notifications]);
                    }
                    setUnreadCount(data.data.unreadCount);
                    setHasMore(data.data.notifications.length === 20);
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in'}/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notificationId 
                            ? { ...notif, is_read: true }
                            : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in'}/api/notifications/mark-all-read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications(prev => 
                    prev.map(notif => ({ ...notif, is_read: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread' && notification.is_read) return false;
        if (filter === 'read' && !notification.is_read) return false;
        if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
        return true;
    });

    // Format time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get notification icon
    const getNotificationIcon = (type) => {
        const typeObj = notificationTypes.find(t => t.value === type);
        return typeObj ? typeObj.icon : '🔔';
    };

    // Get notification color
    const getNotificationColor = (type) => {
        const colors = {
            'LOGIN': 'bg-blue-100 text-blue-800',
            'DISPATCH': 'bg-green-100 text-green-800',
            'RETURN': 'bg-yellow-100 text-yellow-800',
            'DAMAGE': 'bg-red-100 text-red-800',
            'PRODUCT': 'bg-purple-100 text-purple-800',
            'INVENTORY': 'bg-indigo-100 text-indigo-800',
            'SYSTEM': 'bg-gray-100 text-gray-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    // Load more notifications
    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage, false);
        }
    };

    // Refresh notifications
    const refresh = () => {
        setPage(1);
        fetchNotifications(1, true);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-full mx-auto">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Bell size={24} className="text-blue-600" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                                    <p className="text-gray-600">
                                        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={refresh}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw size={18} />
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <CheckCheck size={18} />
                                        Mark All Read
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-4">
                            {/* Read/Unread Filter */}
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-gray-500" />
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Notifications</option>
                                    <option value="unread">Unread Only</option>
                                    <option value="read">Read Only</option>
                                </select>
                            </div>

                            {/* Type Filter */}
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {notificationTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white">
                    {loading && notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                            <p className="text-gray-600">
                                {filter === 'unread' ? 'No unread notifications' : 
                                 filter === 'read' ? 'No read notifications' : 
                                 'No notifications match your filters'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-6 hover:bg-gray-50 transition-colors ${
                                        !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <span className="text-2xl">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 mb-1">
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-gray-700 mb-3">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span>{formatTime(notification.created_at)}</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNotificationColor(notification.type)}`}>
                                                            {notification.type}
                                                        </span>
                                                        {notification.event_data?.location && (
                                                            <span className="flex items-center gap-1">
                                                                📍 {notification.event_data.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                    {!notification.is_read && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Load More */}
                    {hasMore && filteredNotifications.length > 0 && (
                        <div className="p-6 border-t border-gray-200 text-center">
                            <button
                                onClick={loadMore}
                                disabled={loading}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;