import { API_URL } from "../services/api";
import api from "../services/api";
import { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Alert, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { Link } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export function FeedPost({ item }: { item: any }) {
    const { user } = useAuth();
    const [votes, setVotes] = useState(item.likes || 0); // Use .likes, not _count
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
                return Math.max(0, newVal); // Prevent negative
            });

            await api.post(`/posts/${item.id}/vote`, {
                type: 'UP'
            });
        } catch (e) {
            console.error(e);
            // Revert
            setLiked(!liked);
            setVotes((prev: number) => liked ? prev + 1 : prev - 1);
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
        } catch (error) {
            console.error("Save failed", error);
            setIsSaved(!isSaved); // Revert
        }
    };

    const handleReport = () => {
        Alert.alert(
            "Report Post",
            "Are you sure you want to report this post?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Report", style: "destructive", onPress: () => Alert.alert("Reported", "Thanks for keeping the community safe.") }
            ]
        );
    };

    return (
        <View className="bg-white dark:bg-neutral-900 p-4 mb-4 rounded-xl shadow-sm mx-4 border border-gray-100 dark:border-neutral-800">
            <View className="flex-row items-center mb-3">
                <View className="bg-gray-200 dark:bg-neutral-700 h-10 w-10 rounded-full items-center justify-center">
                    <Text className="text-gray-600 dark:text-gray-300 font-bold">{item.author?.name?.[0] || 'U'}</Text>
                </View>
                <View className="ml-3 flex-1">
                    <Text className="font-bold text-gray-800 dark:text-white text-base">{item.author?.name || 'Anonymous'}</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">{item.neighborhood?.name || 'Nearby'}</Text>
                </View>
                <TouchableOpacity onPress={handleReport} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} className="p-2">
                    <Ionicons name="ellipsis-horizontal" size={20} color="gray" />
                </TouchableOpacity>
            </View>

            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-6">{item.title}</Text>

            <View className="bg-blue-50 dark:bg-blue-900/30 self-start px-3 py-1.5 rounded-full mb-3">
                <Text className="text-blue-700 dark:text-blue-300 text-xs font-bold uppercase">{item.category}</Text>
            </View>

            <Text className="text-gray-600 dark:text-gray-300 mb-4 leading-6 text-base">{item.content}</Text>

            {imageUrl && (
                <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-56 rounded-xl mb-4 bg-gray-100 dark:bg-neutral-800"
                    resizeMode="cover"
                />
            )}

            <View className="flex-row justify-between items-center border-t border-gray-100 dark:border-white/10 pt-4 mt-2">
                <View className="flex-row items-center space-x-6">
                    <TouchableOpacity
                        className="flex-row items-center bg-gray-50 dark:bg-neutral-800 px-3 py-2 rounded-full"
                        onPress={handleVote}
                    >
                        <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? "#ef4444" : "gray"} />
                        <Text className={`ml-2 font-medium ${liked ? 'text-red-500' : 'text-gray-500'}`}>{votes}</Text>
                    </TouchableOpacity>

                    {/* @ts-ignore */}
                    <Link href={`/post/${item.id}`} asChild>
                        <TouchableOpacity className="flex-row items-center px-2 py-2">
                            <Ionicons name="chatbubble-outline" size={22} color="gray" />
                            <Text className="ml-2 text-gray-500 font-medium">{item.comments?.length || item._count?.comments || 0}</Text>
                        </TouchableOpacity>
                    </Link>

                    <TouchableOpacity onPress={handleShare} className="px-2 py-2">
                        <Ionicons name="share-social-outline" size={22} color="gray" />
                    </TouchableOpacity>
                </View>
                {/* @ts-ignore */}
                <Link href={`/post/${item.id}`} asChild>
                    <TouchableOpacity>
                        <Text className="text-xs text-gray-400 font-medium">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </Text>
                    </TouchableOpacity>
                </Link>

                <TouchableOpacity onPress={handleSave} className="ml-4">
                    <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? "#2563eb" : "gray"} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
