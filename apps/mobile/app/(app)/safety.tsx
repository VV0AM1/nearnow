import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import api from "../../services/api";

export default function SafetyScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ topSafe: any[], topDangerous: any[], ranking: any[] }>({ topSafe: [], topDangerous: [], ranking: [] });
    const [radius, setRadius] = useState(5);
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            let loc = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            });
        })();
    }, []);

    useEffect(() => {
        if (!location) return;

        setLoading(true);
        // Use backend endpoint
        api.get(`/neighborhoods/rankings?lat=${location.latitude}&lng=${location.longitude}&radius=${radius}`)
            .then(res => {
                const mapItem = (item: any) => ({
                    ...item,
                    alerts: item.totalCount,
                    trend: item.score > 5 ? 'stable' : 'up'
                });

                setData({
                    topSafe: (res.data.topSafe || []).map(mapItem),
                    topDangerous: (res.data.topDangerous || []).map(mapItem),
                    ranking: (res.data.ranking || []).map(mapItem)
                });
            })
            .catch(err => console.error("Safety fetch failed", err))
            .finally(() => setLoading(false));
    }, [location, radius]);

    const RankingCard = ({ item, rank, type }: { item: any, rank: number, type: 'safe' | 'danger' }) => (
        <View className="mr-4 w-60">
            <LinearGradient
                colors={type === 'safe' ? ['#065f46', '#047857'] : ['#991b1b', '#7f1d1d']}
                className="p-4 rounded-2xl h-32 justify-between"
            >
                <View className="flex-row justify-between items-start">
                    <View className="bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">
                        <Text className="text-white font-bold text-xs">#{rank}</Text>
                    </View>
                    <Text className="text-white font-black text-2xl">{item.score.toFixed(1)}</Text>
                </View>
                <View>
                    <Text className="text-white font-bold text-lg" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-white/80 text-xs">{item.city?.name}</Text>
                </View>
            </LinearGradient>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="p-6">
                    <Text className="text-zinc-500 dark:text-zinc-400 uppercase text-xs font-bold tracking-widest mb-2">Command Center</Text>
                    <Text className="text-4xl font-black text-gray-900 dark:text-white">Safety Index</Text>

                    {/* Radius Control */}
                    <View className="mt-6 bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl flex-row justify-between items-center">
                        <View>
                            <Text className="text-gray-500 text-xs uppercase font-bold">Analysis Radius</Text>
                            <Text className="text-blue-600 dark:text-blue-400 font-black text-2xl">{radius} km</Text>
                        </View>
                        <View className="flex-row space-x-2">
                            {[5, 10, 25].map(r => (
                                <TouchableOpacity
                                    key={r}
                                    onPress={() => setRadius(r)}
                                    className={`px-3 py-2 rounded-lg ${radius === r ? 'bg-blue-600' : 'bg-gray-200 dark:bg-neutral-800'}`}
                                >
                                    <Text className={`font-bold ${radius === r ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{r}km</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {loading ? (
                    <View className="h-60 justify-center items-center">
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text className="text-gray-400 mt-4 font-medium">Scanning neighborhoods...</Text>
                    </View>
                ) : (
                    <View className="pb-20">
                        {/* Top Safe */}
                        <View className="mb-8">
                            <View className="flex-row items-center px-6 mb-4">
                                <View className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="shield-checkmark" size={18} color="#059669" />
                                </View>
                                <Text className="text-xl font-bold text-gray-900 dark:text-white">Safest Zones</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                                {data.topSafe.map((item, index) => (
                                    <RankingCard key={item.id} item={item} rank={index + 1} type="safe" />
                                ))}
                            </ScrollView>
                        </View>

                        {/* Top Dangerous */}
                        <View className="mb-8">
                            <View className="flex-row items-center px-6 mb-4">
                                <View className="h-8 w-8 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="warning" size={18} color="#dc2626" />
                                </View>
                                <Text className="text-xl font-bold text-gray-900 dark:text-white">High Alert Zones</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                                {data.topDangerous.map((item, index) => (
                                    <RankingCard key={item.id} item={item} rank={index + 1} type="danger" />
                                ))}
                            </ScrollView>
                        </View>

                        {/* Full Leaderboard */}
                        <View className="px-6">
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Regional Ranking</Text>
                            {data.ranking.map((item, index) => (
                                <View key={item.id} className="flex-row items-center bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl mb-3">
                                    <Text className="text-gray-400 font-black w-8 text-lg">#{index + 1}</Text>
                                    <View className="flex-1 ml-2">
                                        <Text className="font-bold text-gray-900 dark:text-white text-base">{item.name}</Text>
                                        <View className="h-1.5 bg-gray-200 dark:bg-neutral-800 rounded-full mt-2 w-full overflow-hidden">
                                            <View
                                                className={`h-full rounded-full ${item.score > 7 ? 'bg-green-500' : item.score > 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${(item.score / 10) * 100}%` }}
                                            />
                                        </View>
                                    </View>
                                    <View className="items-end ml-4">
                                        <Text className={`font-black text-lg ${item.score > 7 ? 'text-green-600' : item.score > 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {item.score.toFixed(1)}
                                        </Text>
                                        <Text className="text-xs text-gray-400">{item.alerts || 0} alerts</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
