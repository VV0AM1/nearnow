import { View, FlatList, ActivityIndicator, Text, Image, TouchableOpacity, RefreshControl, TextInput, ScrollView } from "react-native";
import { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
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
    const { signOut } = useAuth();
    const { activeTheme } = useTheme();
    const isDark = activeTheme === 'dark';

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

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
                queryParams.append('categoryId', selectedCategory);
            }

            if (searchQuery) {
                queryParams.append('search', searchQuery);
            }

            const response = await api.get(`/posts?${queryParams.toString()}`);
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
                    <TouchableOpacity onPress={signOut}>
                        <Ionicons className="text-black dark:text-white" name="log-out-outline" size={24} color={undefined} />
                    </TouchableOpacity>
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

            {/* Create Post FAB */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg elevation-5"
                onPress={() => alert('Open Create Modal')}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
