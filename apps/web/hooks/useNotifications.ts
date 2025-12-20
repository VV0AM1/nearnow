import { useState, useEffect } from 'react';
import { getToken, getUserId } from '../lib/auth';

export interface NotificationSettings {
    id: string;
    radiusKm: number;
    latitude: number;
    longitude: number;
    categories: string[];
    pushEnabled: boolean;
}

export interface NotificationItem {
    id: string;
    type: 'POST_NEARBY' | 'COMMENT_REPLY';
    read: boolean;
    createdAt: string;
    post?: {
        id: string;
        title: string;
    };
}

export function useNotifications() {
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const userId = getUserId();
    const token = getToken();

    const fetchSettings = async () => {
        if (!userId || !token) return;
        try {
            const res = await fetch(`http://127.0.0.1:3002/notifications/settings/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Simple "Pop" sound (Base64) to avoid 404s
    const playNotificationSound = () => {
        try {
            // Using a silent fail approach if file missing, or could use base64
            const audio = new Audio("/sounds/notification.mp3");
            audio.play().catch(() => { }); // Ignore autoplay blocks
        } catch (e) {
            console.error("Sound error", e);
        }
    };

    const fetchNotifications = async () => {
        if (!userId || !token) return;
        try {
            const res = await fetch(`http://127.0.0.1:3002/notifications/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();

                // Sound check
                const newUnread = data.filter((n: any) => !n.read).length;
                if (newUnread > unreadCount && newUnread > 0) {
                    playNotificationSound();
                }

                setNotifications(data);
                setUnreadCount(newUnread);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
        if (!userId || !token) return;
        setLoading(true);
        try {
            // Merge current settings with updates
            const merged = { ...settings, ...newSettings };

            const res = await fetch(`http://127.0.0.1:3002/notifications/settings/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(merged)
            });

            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        if (!token) return;
        try {
            await fetch(`http://127.0.0.1:3002/notifications/${id}/read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchSettings();
            fetchNotifications();
            // In real app, listen to socket here
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s for MVP
            return () => clearInterval(interval);
        }
    }, [userId]);

    return {
        settings,
        notifications,
        unreadCount,
        updateSettings,
        markAsRead,
        refresh: fetchNotifications,
        loading
    };
}
