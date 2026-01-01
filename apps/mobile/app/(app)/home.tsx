import { View, FlatList, Text, Image, TouchableOpacity, RefreshControl, TextInput, ScrollView, Platform, Keyboard } from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import api, { API_URL } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import * as Location from 'expo-location';
import { CATEGORIES } from "@/constants/categories";
import { FeedPost } from "@/components/FeedPost";
import { useTheme } from "@/context/ThemeContext";
import { GlassView } from "@/components/GlassView";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/context/ToastContext";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";

export default function Home() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const { activeTheme } = useTheme();
    const router = useRouter();
    const { showToast } = useToast();
    const isDark = activeTheme === 'dark';

    const [profile, setProfile] = useState<any>(null);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    useEffect(() => {
        if (user) {
            api.get('/users/me').then(res => setProfile(res.data)).catch(console.error);
        }
    }, [user]);

    const fetchPosts = useCallback(async (isRefresh = false) => {
        if (!isRefresh && !searchQuery) setLoading(true);
        try {
            let queryParams = new URLSearchParams();

            // Quietly try to get location, don't block if denied (use last known or default)
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                queryParams.append('latitude', location.coords.latitude.toString());
                queryParams.append('longitude', location.coords.longitude.toString());
            }

            if (selectedCategory && selectedCategory !== 'ALL') {
                queryParams.append('category', selectedCategory);
            }

            if (searchQuery) {
                queryParams.append('search', searchQuery);
            }

            queryParams.append('radius', '10'); // Default 10km

            const response = await api.get(`/posts/feed?${queryParams.toString()}`);
            setPosts(response.data);
        } catch (error) {
            console.error(error);
            showToast("Failed to load feed", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory, searchQuery]);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPosts();
        }, 800);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategory]);

    const onRefresh = () => {
        setRefreshing(true);
        // Haptic feedback could be added here
        fetchPosts(true);
    };

    const renderSkeleton = () => (
        <View className="px-4 pt-4">
            {[1, 2, 3].map(i => (
                <GlassView key={i} style={{ marginBottom: 16, height: 300, padding: 16 }}>
                    <View className="flex-row items-center mb-4">
                        <Skeleton width={40} height={40} borderRadius={20} />
                        <View className="ml-3">
                            <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
                            <Skeleton width={80} height={12} />
                        </View>
                    </View>
                    <Skeleton width="80%" height={20} style={{ marginBottom: 12 }} />
                    <Skeleton width="100%" height={150} borderRadius={12} />
                </GlassView>
            ))}
        </View>
    );

    return (
        <View className="flex-1 bg-[#f9fafb] dark:bg-[#020817]">
            <SafeAreaView edges={['top']} className="z-10 bg-[#f9fafb] dark:bg-[#020817]">
                <View className="px-4 pb-2 pt-2">
                    <View className="flex-row justify-end items-center mb-4">
                        <View className="flex-row items-center gap-3">
                            <TouchableOpacity
                                onPress={() => router.push('/notifications' as any)}
                                className="bg-white dark:bg-white/10 p-2.5 rounded-full border border-gray-100 dark:border-white/5 shadow-sm"
                            >
                                <Ionicons name="notifications-outline" size={22} color={isDark ? 'white' : 'black'} />
                                {/* Badge could go here */}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/(app)/profile' as any)}>
                                {profile?.avatar ? (
                                    <Image
                                        source={{ uri: `${API_URL.replace('/api', '')}${profile.avatar}` }}
                                        className="w-10 h-10 rounded-full border-2 border-white dark:border-white/10"
                                    />
                                ) : (
                                    <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center border-2 border-white dark:border-white/10 shadow-sm">
                                        <Text className="text-white font-bold text-sm">{profile?.name?.[0] || 'U'}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Search & Filter */}
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="flex-1 flex-row items-center bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-2.5 shadow-sm">
                            <Ionicons name="search" size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                            <TextInput
                                placeholder="Search alerts..."
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                className="flex-1 ml-2 text-gray-900 dark:text-white font-medium"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                cursorColor="#3b82f6"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
                                    <Ionicons name="close-circle" size={18} color={isDark ? '#6b7280' : '#9ca3af'} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* Categories - Horizontal Scroll */}
                <View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
                    >
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => {
                                    setSelectedCategory(cat.id);
                                    // Haptics.selectionAsync(); // Nice to have
                                }}
                                className={`px-4 py-2 rounded-full border ${selectedCategory === cat.id
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'
                                    }`}
                            >
                                <Text className={`text-xs font-bold tracking-wide ${selectedCategory === cat.id
                                    ? 'text-white'
                                    : 'text-gray-600 dark:text-gray-300'
                                    }`}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </SafeAreaView>

            {loading && !refreshing && !posts.length ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item: any) => item.id}
                    renderItem={({ item }) => <FeedPost item={item} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={isDark ? '#ffffff' : '#000000'}
                            colors={['#3b82f6']} // Android
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 px-10">
                            <View className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full items-center justify-center mb-4">
                                <Ionicons name="location-outline" size={40} color={isDark ? '#4b5563' : '#d1d5db'} />
                            </View>
                            <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">No Alerts Nearby</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-center leading-5">
                                Your safe! No alerts found within your 10km radius. Try adjusting your filters or radius in Profile.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
