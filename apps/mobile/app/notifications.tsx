import { View, Text, FlatList, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "@/context/ThemeContext";

type Notification = {
    id: string;
    type: 'LIKE' | 'COMMENT' | 'ALERT' | 'SYSTEM' | 'LEVEL_UP';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: any;
};

export default function NotificationsScreen() {
    const router = useRouter();
    const { activeTheme } = useTheme();
    const isDark = activeTheme === 'dark';
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/me');
            setNotifications(res.data);
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            await api.post(`/notifications/me/read/${id}`);
        } catch (e) { console.error(e); }
    };

    const handlePress = (item: Notification) => {
        markAsRead(item.id, item.isRead);
        // If Alert/Comment, go to Post?
        // router.push(`/posts/${item.postId}`);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return { name: 'heart', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
            case 'COMMENT': return { name: 'chatbubble', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
            case 'ALERT': return { name: 'warning', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
            case 'LEVEL_UP': return { name: 'trophy', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' };
            default: return { name: 'information-circle', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 bg-white dark:bg-black border-b border-gray-100 dark:border-neutral-800 z-10">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
                        <Ionicons name="arrow-back" size={24} color={isDark ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold dark:text-white">Notifications</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(app)/profile' as any)}>
                    <Ionicons name="settings-outline" size={22} color={isDark ? "#9ca3af" : "#6b7280"} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">Loading...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? 'white' : 'black'} />}
                    renderItem={({ item }) => {
                        const icon = getIcon(item.type);
                        return (
                            <TouchableOpacity
                                onPress={() => handlePress(item)}
                                className={`flex-row p-4 mb-3 rounded-2xl border ${item.isRead ? 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800' : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'}`}
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: isDark ? 0 : 0.05,
                                    shadowRadius: 4,
                                    elevation: isDark ? 0 : 2
                                }}
                            >
                                {/* Icon Badge */}
                                <View style={{ backgroundColor: icon.bg }} className="w-12 h-12 rounded-full items-center justify-center mr-4">
                                    <Ionicons name={icon.name as any} size={22} color={icon.color} />
                                </View>

                                {/* Content */}
                                <View className="flex-1 justify-center">
                                    <View className="flex-row justify-between items-start">
                                        <Text className="text-gray-900 dark:text-gray-100 font-bold text-base flex-1 mr-2" numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        {!item.isRead && (
                                            <View className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                                        )}
                                    </View>

                                    <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1 leading-5" numberOfLines={2}>
                                        {item.message}
                                    </Text>

                                    <Text className="text-xs text-gray-400 mt-2 font-medium">
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 opacity-50">
                            <Ionicons name="notifications-off-outline" size={80} color={isDark ? "#333" : "#e5e7eb"} />
                            <Text className="text-gray-400 mt-6 text-lg font-medium">No notifications yet</Text>
                            <Text className="text-gray-500 text-sm mt-2">We'll alert you when something happens.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
