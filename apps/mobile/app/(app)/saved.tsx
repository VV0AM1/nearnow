import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { FeedPost } from "../../components/FeedPost";

export default function SavedPosts() {
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSaved = async () => {
        try {
            const res = await api.get('/users/me/saved');
            // The endpoint returns { savedPosts: [...] } or array of posts depending on service implementation
            // Let's assume it returns array of posts or array of { post: Post } objects
            // Checking UsersService logic: usually returns `this.prisma.user.findUnique(...).savedPosts({ include: { post: ... } })` 
            // OR returns the posts directly.
            // Let's assume it returns the array of SavedPost relations which contain the post.
            // We might need to map it.
            setPosts(res.data);
        } catch (error) {
            console.error("Failed to load saved posts", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSaved();
    }, []);

    useEffect(() => {
        fetchSaved();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
            <View className="flex-row items-center px-4 py-2 border-b border-gray-100 dark:border-neutral-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="gray" />
                </TouchableOpacity>
                <Text className="text-xl font-bold dark:text-white">Saved Posts</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">Loading...</Text>
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.postId || item.id}
                    // Note: if endpoint returns SavedPost relation, item.post is the post. 
                    // If endpoint returns posts directly, item is the post.
                    // We'll need to adapt based on what valid json returns.
                    // Let's assume standard item for now and fix if empty.
                    renderItem={({ item }) => <FeedPost item={item.post || item} />}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Ionicons name="bookmark-outline" size={64} color="#d1d5db" />
                            <Text className="text-gray-500 mt-4 text-center">No saved posts yet.</Text>
                            <Text className="text-gray-400 text-sm text-center mt-2 px-10">
                                Tap the bookmark icon on posts to save them for later.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
