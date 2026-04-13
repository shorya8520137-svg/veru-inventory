/**
 * NOTIFICATION BELL COMPONENT
 * Shows notification count and redirects to notifications page
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const NotificationBell = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch notification count only
    const fetchNotificationCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token || !user) return;

            const response = await fetch('/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUnreadCount(data.data.unreadCount || 0);
                }
            } else {
                console.error('Failed to fetch notification count:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Failed to fetch notification count:', error);
        }
    };

    // Handle notification bell click - redirect to notifications page
    const handleNotificationClick = () => {
        router.push('/notifications');
    };

    // Fetch notification count on component mount and set up polling
    useEffect(() => {
        if (user) {
            fetchNotificationCount();
            
            // Set up polling for new notifications every 30 seconds
            const interval = setInterval(fetchNotificationCount, 30000);
            
            return () => clearInterval(interval);
        }
    }, [user]);

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                title={`${unreadCount} unread notifications - Click to view all`}
            >
                <Bell size={18} className={unreadCount > 0 ? 'animate-pulse' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default NotificationBell;