import { API_URL } from "../services/api";
import api from "../services/api";
import { useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { Link } from "expo-router";

export function FeedPost({ item }: { item: any }) {
    const [votes, setVotes] = useState(item._count?.votes || 0);
    const [liked, setLiked] = useState(false); // Optimistic state, ideally check from backend

    // Fix Image URL: If relative path, prepend API URL.
    const ROOT_URL = API_URL.replace('/api', '');
    const imageUrl = item.imageUrl
        ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${ROOT_URL}${item.imageUrl}`)
        : null;

    const handleVote = async () => {
        try {
            setLiked(!liked);
            setVotes((prev: number) => liked ? prev - 1 : prev + 1);
            await api.post(`/posts/${item.id}/vote`, {
                userId: item.authorId,
                type: 'UP'
            });
        } catch (e) {
            console.error(e);
            // Revert on error
            setLiked(!liked);
            setVotes((prev: number) => liked ? prev + 1 : prev - 1);
        }
    };

    return (
        <View className="bg-white dark:bg-neutral-900 p-4 mb-4 rounded-lg shadow-sm mx-4">
            <View className="flex-row items-center mb-2">
                <View className="bg-gray-200 dark:bg-neutral-700 h-10 w-10 rounded-full items-center justify-center">
                    <Text className="text-gray-600 dark:text-gray-300 font-bold">{item.author?.name?.[0] || 'U'}</Text>
                </View>
                <View className="ml-3">
                    <Text className="font-bold text-gray-800 dark:text-white">{item.author?.name || 'Anonymous'}</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">{item.neighborhood?.name || 'Nearby'}</Text>
                </View>
            </View>

            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">{item.title}</Text>

            <View className="bg-blue-100 dark:bg-blue-900/40 self-start px-2 py-1 rounded mb-2">
                <Text className="text-blue-800 dark:text-blue-200 text-xs font-bold uppercase">{item.category}</Text>
            </View>

            <Text className="text-gray-600 dark:text-gray-300 mb-3 leading-5">{item.content}</Text>

            {imageUrl && (
                <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-48 rounded-lg mb-3 bg-gray-100 dark:bg-neutral-800"
                    resizeMode="cover"
                />
            )}

            <View className="flex-row justify-between items-center border-t border-gray-100 dark:border-white/10 pt-3">
                <View className="flex-row items-center space-x-4">
                    <TouchableOpacity className="flex-row items-center" onPress={handleVote}>
                        <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "red" : "gray"} />
                        <Text className="ml-1 text-gray-500">{votes}</Text>
                    </TouchableOpacity>

                    {/* @ts-ignore */}
                    <Link href={`/post/${item.id}`} asChild>
                        <TouchableOpacity className="flex-row items-center ml-4">
                            <Ionicons name="chatbubble-outline" size={20} color="gray" />
                            <Text className="ml-1 text-gray-500">{item._count?.comments || 0}</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
                {/* @ts-ignore */}
                <Link href={`/post/${item.id}`} asChild>
                    <TouchableOpacity>
                        <Text className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}
