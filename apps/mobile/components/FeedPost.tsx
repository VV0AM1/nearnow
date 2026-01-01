import { API_URL } from "../services/api";
import api from "../services/api";
import { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { GlassView } from "./GlassView"; // New Premium Component
import { useToast } from "@/context/ToastContext"; // Custom Toasts

export function FeedPost({ item }: { item: any }) {
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast(); // Use Toast

    const [votes, setVotes] = useState(item.likes || 0);
    const [liked, setLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Initial Check
    useEffect(() => {
        if (user) {
            // Check Vote
            api.get(`/posts/${item.id}/vote/check`)
                .then(res => {
                    if (res.data.hasVoted && res.data.type === 'UP') {
                        setLiked(true);
                    }
                })
                .catch(err => console.log("Vote check failed", err));

            // Check Saved
            api.get(`/users/me/saved/${item.id}/check`)
                .then(res => setIsSaved(res.data.isSaved))
                .catch(err => console.log("Save check failed", err));
        }
    }, [user, item.id]);

    // Fix Image URL
    const ROOT_URL = API_URL.replace('/api', '');
    const imageUrl = item.imageUrl
        ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${ROOT_URL}${item.imageUrl}`)
        : null;

    const handleVote = async () => {
        try {
            const newLikedState = !liked;
            setLiked(newLikedState);
            setVotes((prev: number) => {
                const newVal = newLikedState ? prev + 1 : prev - 1;
                return Math.max(0, newVal);
            });

            await api.post(`/posts/${item.id}/vote`, {
                type: 'UP'
            });
        } catch (e) {
            console.error(e);
            // Revert
            setLiked(!liked);
            setVotes((prev: number) => liked ? prev + 1 : prev - 1);
            showToast("Failed to vote", "error");
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this post on Nearnow: ${item.title}`,
                url: `https://nearnow.app/post/${item.id}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleSave = async () => {
        try {
            const newState = !isSaved;
            setIsSaved(newState);
            await api.post(`/users/me/saved/${item.id}`);
            if (newState) showToast("Post Saved!", "success");
        } catch (error) {
            console.error("Save failed", error);
            setIsSaved(!isSaved); // Revert
            showToast("Failed to save", "error");
        }
    };

    const handleMapPress = () => {
        if (item.latitude && item.longitude) {
            router.push({
                pathname: '/(app)/map',
                params: {
                    latitude: item.latitude,
                    longitude: item.longitude,
                    highlightPostId: item.id
                }
            } as any);
        } else {
            showToast("No location data", "info");
        }
    };

    return (
        <GlassView style={{ marginBottom: 16, marginHorizontal: 16, borderRadius: 16 }}>
            <View style={{ padding: 16 }}>
                {/* Header */}
                <View className="flex-row items-center mb-3">
                    <View className="bg-blue-100 dark:bg-blue-900/40 h-10 w-10 rounded-full items-center justify-center border border-blue-200 dark:border-blue-800">
                        <Text className="text-blue-700 dark:text-blue-300 font-bold">{item.author?.name?.[0] || 'U'}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                        <Text className="font-bold text-gray-800 dark:text-gray-100 text-base">{item.author?.name || 'Anonymous'}</Text>
                        <View className="flex-row items-center mt-0.5">
                            <Text className="text-xs text-gray-500 dark:text-gray-400">{item.neighborhood?.name || 'Nearby'}</Text>
                            {item.latitude && (
                                <TouchableOpacity onPress={handleMapPress} className="ml-2 flex-row items-center bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                                    <Ionicons name="location-sharp" size={10} color="#2563eb" />
                                    <Text className="text-[10px] text-gray-600 dark:text-gray-300 ml-0.5 font-bold">Map</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} className="p-2 opacity-60">
                        <Ionicons name="ellipsis-horizontal" size={20} color="gray" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-6">{item.title}</Text>

                <View className="flex-row items-center mb-3">
                    <View className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/50">
                        <Text className="text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">{item.category}</Text>
                    </View>
                </View>

                <Text className="text-gray-600 dark:text-gray-300 mb-4 leading-6 text-base">{item.content}</Text>

                {imageUrl && (
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-56 rounded-xl mb-4 bg-gray-100 dark:bg-neutral-800"
                        resizeMode="cover"
                    />
                )}

                {/* Footer */}
                <View className="flex-row justify-between items-center border-t border-gray-100 dark:border-white/10 pt-4 mt-2">
                    <View className="flex-row items-center space-x-6 gap-6">
                        <TouchableOpacity
                            className="flex-row items-center"
                            onPress={handleVote}
                        >
                            <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? "#ef4444" : "#9ca3af"} />
                            <Text className={`ml-2 font-medium ${liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>{votes}</Text>
                        </TouchableOpacity>

                        {/* @ts-ignore */}
                        <Link href={`/post/${item.id}`} asChild>
                            <TouchableOpacity className="flex-row items-center">
                                <Ionicons name="chatbubble-outline" size={22} color="#9ca3af" />
                                <Text className="ml-2 text-gray-500 dark:text-gray-400 font-medium">{item.comments?.length || item._count?.comments || 0}</Text>
                            </TouchableOpacity>
                        </Link>

                        <TouchableOpacity onPress={handleShare}>
                            <Ionicons name="share-social-outline" size={22} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity onPress={handleSave}>
                            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? "#3b82f6" : "#9ca3af"} />
                        </TouchableOpacity>

                        {/* @ts-ignore */}
                        <Link href={`/post/${item.id}`} asChild>
                            <TouchableOpacity>
                                <Text className="text-xs text-gray-400 font-medium">
                                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </View>
        </GlassView>
    );
}
