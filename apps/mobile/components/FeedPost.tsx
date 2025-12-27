
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

export function FeedPost({ item }: { item: any }) {

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

            {item.imageUrl && (
                <Image
                    source={{ uri: item.imageUrl }}
                    className="w-full h-48 rounded-lg mb-3 bg-gray-100 dark:bg-neutral-800"
                    resizeMode="cover"
                />
            )}

            <View className="flex-row justify-between items-center border-t border-gray-100 dark:border-white/10 pt-3">
                <View className="flex-row items-center space-x-4">
                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="heart-outline" size={20} color="gray" />
                        <Text className="ml-1 text-gray-500">{item._count?.votes || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center ml-4">
                        <Ionicons name="chatbubble-outline" size={20} color="gray" />
                        <Text className="ml-1 text-gray-500">{item._count?.comments || 0}</Text>
                    </TouchableOpacity>
                </View>
                <Text className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </Text>
            </View>
        </View>
    );
}
