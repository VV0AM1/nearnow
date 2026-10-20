"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { getToken } from "../lib/auth";
import { apiFetch } from "../lib/api";
import { useSocket } from "../lib/socket-provider";

/** Mirrors GET /notifications/me/settings. */
export interface NotificationSettings {
    radiusKm: number;
    latitude: number | null;
    longitude: number | null;
    areaLabel: string | null;
    hasAlertArea: boolean;
    categories: string[];
    pushEnabled: boolean;
    paused: boolean;
    pushAvailable: boolean;
}

export type SettingsUpdate = Partial<Pick<NotificationSettings, "radiusKm" | "latitude" | "longitude" | "areaLabel" | "categories" | "pushEnabled" | "paused">>;

/** Mirrors the API notification contract. */
export interface NotificationItem {
    id: string;
    type: string;
    title: string | null;
    message: string;
    read: boolean;
    createdAt: string;
    postId: string | null;
    post?: { id: string; title: string } | null;
}

interface NotificationContextType {
    settings: NotificationSettings | null;
    notifications: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    updateSettings: (settings: SettingsUpdate) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const socket = useSocket();
    const token = getToken();

    const fetchNotifications = useCallback(async () => {
        if (!getToken()) return;
        try {
            const data = await apiFetch<{ items: NotificationItem[]; unreadCount: number }>("/notifications/me?limit=20");
            setNotifications(data.items);
            setUnreadCount(data.unreadCount);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        if (!getToken()) return;
        try {
            setSettings(await apiFetch<NotificationSettings>("/notifications/me/settings"));
        } catch (err) {
            console.error(err);
        }
    }, []);

    const updateSettings = async (update: SettingsUpdate) => {
        setLoading(true);
        try {
            setSettings(await apiFetch<NotificationSettings>("/notifications/me/settings", { method: "PATCH", json: update }));
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
        try {
            await apiFetch(`/notifications/me/read/${id}`, { method: "POST" });
        } catch (err) {
            console.error(err);
            void fetchNotifications();
        }
    };

    useEffect(() => {
        if (token) {
            void fetchSettings();
            void fetchNotifications();
        }
    }, [token, fetchSettings, fetchNotifications]);

    // The server only delivers this user's events to an authenticated socket.
    useEffect(() => {
        if (!socket) return;
        const onNotification = () => void fetchNotifications();
        socket.on("notification", onNotification);
        return () => {
            socket.off("notification", onNotification);
        };
    }, [socket, fetchNotifications]);

    return (
        <NotificationContext.Provider value={{ settings, notifications, unreadCount, loading, updateSettings, markAsRead, refresh: fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
    return context;
}
