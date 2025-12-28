import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import api, { API_URL } from "../../../services/api";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../../../context/AuthContext";

export default function PostDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth(); // If needed for avatar
    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchDetails = async () => {
        try {
            // Parallel fetch: Post details and Comemnts
            const [postRes, commentsRes] = await Promise.all([
                api.get(`/posts/${id}`),
                api.get(`/comments/${id}`)
            ]);
            setPost(postRes.data);
            setComments(commentsRes.data);
        } catch (error) {
            console.error("Failed to load details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDetails();
    }, [id]);

    const handleSendComment = async () => {
        if (!newComment.trim()) return;

        try {
            const tempComment = {
                id: Date.now().toString(), // Temp ID
                content: newComment,
                author: { name: 'Me' }, // Optimistic
                createdAt: new Date(),
            };
            setComments((prev: any[]) => [...prev, tempComment]);
            setNewComment('');

            // API Call
            await api.post('/comments', {
                postId: id,
                content: tempComment.content
            });

            // Refresh to get real ID and data
            const res = await api.get(`/comments/${id}`);
            setComments(res.data);

        } catch (error) {
            console.error("Failed to post comment", error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-black justify-center items-center">
                <Text className="text-gray-500">Loading...</Text>
            </SafeAreaView>
        );
    }

    if (!post) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-black justify-center items-center">
                <Text className="text-gray-500">Post not found.</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                    <Text className="text-blue-600">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Header + Post Content
    const renderHeader = () => {
        const ROOT_URL = API_URL.replace('/api', '');
        const imageUrl = post.imageUrl
            ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${ROOT_URL}${post.imageUrl}`)
            : null;

        return (
            <View className="border-b border-gray-100 dark:border-neutral-800 pb-4 mb-4">
                <View className="flex-row items-center mb-3">
                    <View className="bg-gray-200 dark:bg-neutral-700 h-10 w-10 rounded-full items-center justify-center">
                        <Text className="text-gray-600 dark:text-gray-300 font-bold">{post.author?.name?.[0] || 'U'}</Text>
                    </View>
                    <View className="ml-3">
                        <Text className="font-bold text-gray-800 dark:text-white">{post.author?.name || 'Anonymous'}</Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </Text>
                    </View>
                </View>

                <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">{post.title}</Text>
                <Text className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{post.content}</Text>

                {imageUrl && (
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-64 rounded-xl bg-gray-100 dark:bg-neutral-800"
                        resizeMode="cover"
                    />
                )}

                <View className="mt-4 flex-row items-center">
                    <Ionicons name="chatbubble-outline" size={20} color="gray" />
                    <Text className="ml-2 text-gray-500 font-medium">{comments.length} Comments</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
            {/* Header Bar */}
            <View className="flex-row items-center px-4 py-2 border-b border-gray-100 dark:border-neutral-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="gray" />
                </TouchableOpacity>
                <Text className="text-lg font-bold dark:text-white">Back</Text>
            </View>

            <FlatList
                data={comments}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <View className="flex-row mb-4">
                        <View className="bg-gray-200 dark:bg-neutral-700 h-8 w-8 rounded-full items-center justify-center mt-1">
                            <Text className="text-xs font-bold text-gray-600">{item.author?.name?.[0] || 'U'}</Text>
                        </View>
                        <View className="ml-3 flex-1 bg-gray-50 dark:bg-neutral-900 p-3 rounded-2xl rounded-tl-none">
                            <View className="flex-row justify-between mb-1">
                                <Text className="font-bold text-gray-800 dark:text-white text-xs">{item.author?.name || 'Unknown'}</Text>
                                <Text className="text-[10px] text-gray-400">
                                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                </Text>
                            </View>
                            <Text className="text-gray-700 dark:text-gray-300">{item.content}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text className="text-gray-400 text-center py-4">No comments yet. Be the first!</Text>}
            />

            {/* Input Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                className="absolute bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-neutral-800 p-4"
            >
                <View className="flex-row items-center bg-gray-100 dark:bg-neutral-900 rounded-full px-4 py-2">
                    <TextInput
                        className="flex-1 text-base dark:text-white mr-2 py-2"
                        placeholder="Add a comment..."
                        placeholderTextColor="gray"
                        value={newComment}
                        onChangeText={setNewComment}
                    />
                    <TouchableOpacity
                        onPress={handleSendComment}
                        disabled={!newComment.trim()}
                    >
                        <Ionicons
                            name="send"
                            size={24}
                            color={newComment.trim() ? "#2563eb" : "gray"}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
