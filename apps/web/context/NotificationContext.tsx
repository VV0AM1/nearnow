"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_URL } from "../lib/config";
import { getToken, getUserId } from "../lib/auth";
import { useSocket } from "../lib/socket-provider";

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

interface NotificationContextType {
    settings: NotificationSettings | null;
    notifications: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // We can use the socket to listen for real-time notifications
    const socket = useSocket();
    const userId = getUserId();
    const token = getToken();

    const fetchSettings = async () => {
        if (!userId || !token) return;
        try {
            const res = await fetch(`${API_URL}/notifications/settings/${userId}`, {
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

    const playNotificationSound = () => {
        try {
            const audio = new Audio("/sounds/notification.mp3");
            audio.play().catch(() => { });
        } catch (e) {
            console.error("Sound error", e);
        }
    };

    const fetchNotifications = async () => {
        if (!userId || !token) return;
        try {
            const res = await fetch(`${API_URL}/notifications/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const newUnread = data.filter((n: any) => !n.read).length;

                // Only sound if count INCREASED
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
            const merged = { ...settings, ...newSettings };
            const res = await fetch(`${API_URL}/notifications/settings/${userId}`, {
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

        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error(err);
            // Revert on failure? For now, ignore.
        }
    };

    // Initial Load
    useEffect(() => {
        if (userId) {
            fetchSettings();
            fetchNotifications();
        }
    }, [userId]);

    // Socket Listener
    useEffect(() => {
        if (!socket) return;

        socket.on('notification', () => {
            console.log("New notification received via socket");
            fetchNotifications();
            playNotificationSound();
        });

        return () => {
            socket.off('notification');
        };
    }, [socket]);

    return (
        <NotificationContext.Provider value={{
            settings,
            notifications,
            unreadCount,
            loading,
            updateSettings,
            markAsRead,
            refresh: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
