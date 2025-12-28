import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";

type Notification = {
    id: string;
    type: 'LIKE' | 'COMMENT' | 'ALERT' | 'SYSTEM' | 'LEVEL_UP';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: any; // JSON payload
};

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth(); // for context if needed, but api handles token in header
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
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            await api.post(`/notifications/me/read/${id}`);
        } catch (e) {
            console.error(e);
        }
    };

    const handlePress = (item: Notification) => {
        markAsRead(item.id, item.isRead);
        // Navigate based on type/data if needed
        // For now just mark read.
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
            case 'LIKE': return { name: 'heart', color: '#ef4444' };
            case 'COMMENT': return { name: 'chatbubble', color: '#3b82f6' };
            case 'ALERT': return { name: 'warning', color: '#f59e0b' };
            case 'LEVEL_UP': return { name: 'trophy', color: '#fbbf24' };
            default: return { name: 'information-circle', color: '#6b7280' };
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
            <View className="flex-row items-center px-4 py-2 border-b border-gray-100 dark:border-neutral-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="gray" />
                </TouchableOpacity>
                <Text className="text-xl font-bold dark:text-white">Notifications</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">Loading...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    renderItem={({ item }) => {
                        const icon = getIcon(item.type);
                        return (
                            <TouchableOpacity
                                onPress={() => handlePress(item)}
                                className={`flex-row items-start px-4 py-3 border-b border-gray-50 dark:border-neutral-900 ${item.isRead ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}
                            >
                                <View className={`p-2 rounded-full mr-3 bg-gray-100 dark:bg-neutral-800`}>
                                    <Ionicons name={icon.name as any} size={20} color={icon.color} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-900 dark:text-white font-semibold text-base mb-1">{item.title}</Text>
                                    <Text className="text-gray-600 dark:text-gray-400 leading-5">{item.message}</Text>
                                    <Text className="text-xs text-gray-400 mt-2">
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                    </Text>
                                </View>
                                {!item.isRead && (
                                    <View className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
                            <Text className="text-gray-500 mt-4 text-center">No notifications yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
