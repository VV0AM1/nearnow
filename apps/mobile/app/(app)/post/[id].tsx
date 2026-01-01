import { View, Text, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList, Alert, Share } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import api, { API_URL } from "../../../services/api";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../../../context/AuthContext";
import { GlassView } from "@/components/GlassView";
import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/context/ThemeContext";

export default function PostDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { activeTheme } = useTheme();
    const isDark = activeTheme === 'dark';

    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    // Vote Logic
    const [votes, setVotes] = useState(0);
    const [liked, setLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const fetchDetails = async () => {
        try {
            const [postRes, commentsRes] = await Promise.all([
                api.get(`/posts/${id}`),
                api.get(`/comments/${id}`)
            ]);
            setPost(postRes.data);
            setVotes(postRes.data?.likes || 0);
            setComments(commentsRes.data);
        } catch (error) {
            console.error("Failed to load details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchDetails();
            if (user) {
                api.get(`/posts/${id}/vote/check`)
                    .then(res => { if (res.data.hasVoted && res.data.type === 'UP') setLiked(true); })
                    .catch(e => console.log('Vote check err', e));
                api.get(`/users/me/saved/${id}/check`)
                    .then(res => setIsSaved(res.data.isSaved))
                    .catch(err => console.log('Save check err', err));
            }
        }
    }, [id, user]);

    const handleVote = async () => {
        try {
            const newLikedState = !liked;
            setLiked(newLikedState);
            setVotes((prev: number) => {
                const newVal = newLikedState ? prev + 1 : prev - 1;
                return Math.max(0, newVal);
            });
            await api.post(`/posts/${id}/vote`, { type: 'UP' });
        } catch (e) {
            console.error(e);
            setLiked(!liked);
            setVotes((prev: number) => liked ? prev + 1 : prev - 1);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this post on Nearnow: ${post.title}`,
                url: `https://nearnow.app/post/${id}`,
            });
        } catch (error) { console.log(error); }
    };

    const handleSave = async () => {
        try {
            const newState = !isSaved;
            setIsSaved(newState);
            await api.post(`/users/me/saved/${id}`);
        } catch (error) {
            console.error("Save failed", error);
            setIsSaved(!isSaved);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        try {
            const tempComment = {
                id: Date.now().toString(),
                content: newComment,
                author: { name: 'Me' },
                createdAt: new Date(),
            };
            setComments((prev: any[]) => [...prev, tempComment]);
            setNewComment('');

            await api.post('/comments', { postId: id, content: tempComment.content });
            const res = await api.get(`/comments/${id}`);
            setComments(res.data);
        } catch (error) { console.error("Failed to post comment", error); }
    };

    const renderHeader = () => {
        const ROOT_URL = API_URL.replace('/api', '');
        const imageUrl = post.imageUrl
            ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${ROOT_URL}${post.imageUrl}`)
            : null;

        return (
            <View className="border-b border-gray-100 dark:border-white/10 pb-6 mb-4">
                <View className="flex-row items-center mb-4">
                    <View className="bg-blue-100 dark:bg-blue-900/30 h-10 w-10 rounded-full items-center justify-center border border-blue-200 dark:border-blue-800">
                        <Text className="text-blue-700 dark:text-blue-300 font-bold">{post.author?.name?.[0] || 'U'}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                        <Text className="font-bold text-gray-800 dark:text-white text-base">{post.author?.name || 'Anonymous'}</Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </Text>
                    </View>
                </View>

                <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">{post.title}</Text>
                <View className="bg-blue-50 dark:bg-blue-900/20 self-start px-3 py-1 rounded-full mb-4 border border-blue-100 dark:border-blue-900/40">
                    <Text className="text-blue-700 dark:text-blue-300 text-xs font-bold uppercase">{post.category}</Text>
                </View>
                <Text className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{post.content}</Text>

                {imageUrl && (
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-64 rounded-xl bg-gray-100 dark:bg-neutral-800 mb-6"
                        resizeMode="cover"
                    />
                )}

                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity
                            className="flex-row items-center bg-gray-100 dark:bg-white/10 px-4 py-2 rounded-full"
                            onPress={handleVote}
                        >
                            <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? "#ef4444" : (isDark ? "#9ca3af" : "gray")} />
                            <Text className={`ml-2 font-medium ${liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>{votes}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleShare} className="bg-gray-100 dark:bg-white/10 p-2 rounded-full">
                            <Ionicons name="share-social-outline" size={22} color={isDark ? "#9ca3af" : "gray"} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={handleSave}>
                        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#3b82f6" : (isDark ? "#9ca3af" : "gray")} />
                    </TouchableOpacity>
                </View>

                <View className="mt-8 mb-2 flex-row items-center">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">Comments ({comments.length})</Text>
                </View>
            </View>
        );
    };

    const renderSkeleton = () => (
        <View className="p-4">
            <View className="flex-row items-center mb-6">
                <Skeleton width={40} height={40} borderRadius={20} />
                <View className="ml-3">
                    <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
                    <Skeleton width={80} height={12} />
                </View>
            </View>
            <Skeleton width="80%" height={24} style={{ marginBottom: 12 }} />
            <Skeleton width={60} height={20} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 24 }} />
            <Skeleton width="100%" height={200} borderRadius={16} style={{ marginBottom: 20 }} />
        </View>
    );

    return (
        <View className="flex-1 bg-[#f9fafb] dark:bg-[#020817]">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header Bar */}
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#020817]">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
                        <Ionicons name="arrow-back" size={24} color={isDark ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">Post</Text>
                </View>

                {loading ? (
                    renderSkeleton()
                ) : !post ? (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-gray-500">Post not found.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={comments}
                        keyExtractor={(item: any) => item.id}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        ListHeaderComponent={renderHeader}
                        renderItem={({ item }) => (
                            <View className="flex-row mb-6">
                                <View className="bg-gray-200 dark:bg-white/10 h-8 w-8 rounded-full items-center justify-center mt-1">
                                    <Text className="text-xs font-bold text-gray-600 dark:text-gray-300">{item.author?.name?.[0] || 'U'}</Text>
                                </View>
                                <GlassView style={{ marginLeft: 12, flex: 1, padding: 12, borderRadius: 16, borderTopLeftRadius: 4 }}>
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="font-bold text-gray-800 dark:text-white text-xs">{item.author?.name || 'Unknown'}</Text>
                                        <Text className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                        </Text>
                                    </View>
                                    <Text className="text-gray-700 dark:text-gray-300 leading-5">{item.content}</Text>
                                </GlassView>
                            </View>
                        )}
                        ListEmptyComponent={<Text className="text-gray-400 dark:text-gray-500 text-center py-8">No comments yet. Be the first!</Text>}
                    />
                )}

                {/* Input Bar */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                    className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#020817] border-t border-gray-100 dark:border-white/10 p-4"
                >
                    <View className="flex-row items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-4 py-2">
                        <TextInput
                            className="flex-1 text-base text-gray-900 dark:text-white py-2 mr-2"
                            placeholder="Add a comment..."
                            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
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
                                color={newComment.trim() ? "#2563eb" : (isDark ? "#4b5563" : "#d1d5db")}
                            />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
