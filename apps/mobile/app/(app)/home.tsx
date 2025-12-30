import { View, FlatList, ActivityIndicator, Text, Image, TouchableOpacity, RefreshControl, TextInput, ScrollView } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import api, { API_URL } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import * as Location from 'expo-location';
import { CATEGORIES } from "@/constants/categories";
import { FeedPost } from "@/components/FeedPost";
import { useTheme } from "@/context/ThemeContext";


export default function Home() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { signOut, user } = useAuth(); // Get user token
    const { activeTheme } = useTheme();
    const router = useRouter(); // Import useRouter
    const isDark = activeTheme === 'dark';

    const [profile, setProfile] = useState<any>(null);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (user) {
            api.get('/users/me').then(res => setProfile(res.data)).catch(console.error);
        }
    }, [user]);

    const fetchPosts = useCallback(async () => {
        try {
            let queryParams = new URLSearchParams();

            const { status } = await Location.requestForegroundPermissionsAsync();
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

            // Default params expected by getFeed
            queryParams.append('radius', '10'); // Default 10km

            const response = await api.get(`/posts/feed?${queryParams.toString()}`);
            setPosts(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory, searchQuery]);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPosts();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategory, fetchPosts]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPosts();
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black" edges={['top']}>
            <View className="px-4 py-3 bg-white dark:bg-black border-b border-gray-200 dark:border-white/10">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-bold text-blue-600 dark:text-blue-500">NearNow</Text>

                    <View className="flex-row items-center space-x-4 gap-4">
                        <TouchableOpacity onPress={() => router.push('/notifications' as any)}>
                            <Ionicons name="notifications-outline" size={24} color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/(app)/profile' as any)}>
                            {profile?.avatar ? (
                                <Image
                                    source={{ uri: `${API_URL.replace('/api', '')}${profile.avatar}` }}
                                    className="w-8 h-8 rounded-full"
                                />
                            ) : (
                                <View className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center">
                                    <Text className="text-gray-600 dark:text-gray-300 font-bold text-xs">{profile?.name?.[0] || 'U'}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-gray-100 dark:bg-neutral-900 rounded-xl px-3 py-2 mb-3">
                    <Ionicons name="search" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <TextInput
                        placeholder="Search nearby..."
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        className="flex-1 ml-2 text-gray-900 dark:text-white font-medium"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Categories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-2">
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            className={`mr-2 px-4 py-1.5 rounded-full border ${selectedCategory === cat.id
                                ? 'bg-blue-600 border-blue-600'
                                : 'bg-white dark:bg-black border-gray-300 dark:border-neutral-700'
                                }`}
                        >
                            <Text className={`text-xs font-bold ${selectedCategory === cat.id
                                ? 'text-white'
                                : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-black">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item: any) => item.id}
                    renderItem={({ item }) => <FeedPost item={item} />}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Text className="text-gray-500 dark:text-gray-400">No posts found nearby.</Text>
                        </View>
                    }
                />
            )}

            {/* FAB Removed - Use Tab Bar "Post" button */}
        </SafeAreaView>
    );
}
