import { View, Text, FlatList, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "@/context/ThemeContext";
import { GlassView } from "@/components/GlassView";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/context/ToastContext";

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
    const { showToast } = useToast();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get('/notifications/me');
            setNotifications(res.data);
        } catch (error) {
            console.error("Failed to load notifications", error);
            showToast("Failed to load notifications", "error");
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
        // Navigate based on type if needed
        // router.push(`/posts/${item.postId}`);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications(true);
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return { name: 'heart', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
            case 'COMMENT': return { name: 'chatbubble', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
            case 'ALERT': return { name: 'warning', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
            case 'LEVEL_UP': return { name: 'trophy', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
            default: return { name: 'notifications', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' };
        }
    };

    const renderSkeleton = () => (
        <View className="px-4">
            {[1, 2, 3, 4].map(i => (
                <GlassView key={i} style={{ marginBottom: 12, padding: 16, height: 100 }}>
                    <View className="flex-row items-center">
                        <Skeleton width={48} height={48} borderRadius={24} />
                        <View className="ml-4 flex-1">
                            <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                            <Skeleton width="90%" height={12} style={{ marginBottom: 8 }} />
                            <Skeleton width="30%" height={10} />
                        </View>
                    </View>
                </GlassView>
            ))}
        </View>
    );

    return (
        <View className="flex-1 bg-[#f9fafb] dark:bg-[#020817]">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header Removed - Using System Header */}

                {loading && !refreshing ? (
                    renderSkeleton()
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? 'white' : 'black'} />}
                        renderItem={({ item }) => {
                            const icon = getIcon(item.type);
                            return (
                                <GlassView
                                    style={{
                                        marginBottom: 12,
                                        borderRadius: 16,
                                        opacity: item.isRead ? 0.7 : 1
                                    }}
                                    intensity={item.isRead ? 10 : 25} // Subtler for read items
                                >
                                    <TouchableOpacity
                                        onPress={() => handlePress(item)}
                                        className="flex-row p-4 items-start"
                                    >
                                        {/* Icon Badge */}
                                        <View style={{ backgroundColor: icon.bg }} className="w-12 h-12 rounded-full items-center justify-center mr-4">
                                            <Ionicons name={icon.name as any} size={22} color={icon.color} />
                                        </View>

                                        {/* Content */}
                                        <View className="flex-1">
                                            <View className="flex-row justify-between items-start">
                                                <Text className={`text-base flex-1 mr-2 ${item.isRead ? 'font-medium text-gray-700 dark:text-gray-300' : 'font-bold text-gray-900 dark:text-white'}`} numberOfLines={1}>
                                                    {item.title}
                                                </Text>
                                                {!item.isRead && (
                                                    <View className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 shadow-sm shadow-blue-500" />
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
                                </GlassView>
                            );
                        }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20 opacity-50">
                                <GlassView style={{ padding: 40, borderRadius: 100, marginBottom: 20 }}>
                                    <Ionicons name="notifications-off-outline" size={60} color={isDark ? "#9ca3af" : "#9ca3af"} />
                                </GlassView>
                                <Text className="text-gray-500 dark:text-gray-400 mt-4 text-lg font-bold">No notifications yet</Text>
                                <Text className="text-gray-400 text-sm mt-2">We'll alert you when something happens.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
