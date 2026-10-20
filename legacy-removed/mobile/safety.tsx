import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useTheme } from "@/context/ThemeContext";
import { Skeleton } from "@/components/Skeleton";
import { GlassView } from "@/components/GlassView";

export default function SafetyScreen() {
    const router = useRouter();
    const { activeTheme } = useTheme();
    const isDark = activeTheme === 'dark';
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
                style={{ opacity: 0.9 }}
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

    const renderSkeleton = () => (
        <View className="mt-8 px-6">
            <Skeleton width={150} height={20} style={{ marginBottom: 16 }} />
            <View className="flex-row overflow-hidden mb-8">
                <Skeleton width={240} height={128} borderRadius={16} style={{ marginRight: 16 }} />
                <Skeleton width={240} height={128} borderRadius={16} />
            </View>

            <Skeleton width={180} height={20} style={{ marginBottom: 16 }} />
            <View className="flex-row overflow-hidden mb-8">
                <Skeleton width={240} height={128} borderRadius={16} style={{ marginRight: 16 }} />
                <Skeleton width={240} height={128} borderRadius={16} />
            </View>

            <Skeleton width={200} height={30} style={{ marginBottom: 16 }} />
            {[1, 2, 3].map(i => (
                <Skeleton key={i} width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
            ))}
        </View>
    );

    return (
        <View className="flex-1 bg-[#f9fafb] dark:bg-[#020817]">
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Main Content */}
                    <View className="px-6 pt-6">
                        {/* Radius Control */}
                        <GlassView style={{ padding: 20, borderRadius: 24, marginBottom: 24 }}>
                            <View className="flex-row justify-between items-center mb-6">
                                <View>
                                    <Text className="text-gray-900 dark:text-white font-bold text-lg">Scan Radius</Text>
                                    <Text className="text-gray-500 text-xs">Analyze safety in range</Text>
                                </View>
                                <View className="bg-blue-600/10 px-3 py-1 rounded-full border border-blue-500/20">
                                    <Text className="text-blue-600 dark:text-blue-400 font-black">{radius} km</Text>
                                </View>
                            </View>
                            <View className="flex-row gap-3">
                                {[5, 10, 25, 50].map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        onPress={() => setRadius(r)}
                                        className={`flex-1 py-3 rounded-xl items-center justify-center transition-all ${radius === r ? 'bg-blue-600 shadow-lg shadow-blue-500/25' : 'bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/5'}`}
                                    >
                                        <Text className={`font-bold text-xs ${radius === r ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{r}km</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </GlassView>
                    </View>

                    {loading ? (
                        renderSkeleton()
                    ) : (
                        <View className="pb-20">
                            {/* Top Safe */}
                            <View className="mb-8">
                                <View className="flex-row items-center px-6 mb-4">
                                    <View className="h-8 w-8 bg-green-100 dark:bg-green-900/40 rounded-full items-center justify-center mr-3 border border-green-200 dark:border-green-800">
                                        <Ionicons name="shield-checkmark" size={18} color="#059669" />
                                    </View>
                                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Safest Zones</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                                    {data.topSafe.map((item, index) => (
                                        <RankingCard key={item.id} item={item} rank={index + 1} type="safe" />
                                    ))}
                                    {!data.topSafe.length && <Text className="text-gray-500 ml-2">No safe zones found nearby.</Text>}
                                </ScrollView>
                            </View>

                            {/* Top Dangerous */}
                            <View className="mb-8">
                                <View className="flex-row items-center px-6 mb-4">
                                    <View className="h-8 w-8 bg-red-100 dark:bg-red-900/40 rounded-full items-center justify-center mr-3 border border-red-200 dark:border-red-800">
                                        <Ionicons name="warning" size={18} color="#dc2626" />
                                    </View>
                                    <Text className="text-xl font-bold text-gray-900 dark:text-white">High Alert Zones</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                                    {data.topDangerous.map((item, index) => (
                                        <RankingCard key={item.id} item={item} rank={index + 1} type="danger" />
                                    ))}
                                    {!data.topDangerous.length && <Text className="text-gray-500 ml-2">No danger zones found nearby.</Text>}
                                </ScrollView>
                            </View>

                            {/* Full Leaderboard */}
                            <View className="px-6">
                                <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Regional Ranking</Text>
                                {data.ranking.map((item, index) => (
                                    <View key={item.id} className="flex-row items-center bg-white dark:bg-white/5 p-4 rounded-xl mb-3 border border-gray-100 dark:border-white/5 shadow-sm">
                                        <Text className="text-gray-400 font-black w-8 text-lg">#{index + 1}</Text>
                                        <View className="flex-1 ml-2">
                                            <Text className="font-bold text-gray-900 dark:text-white text-base">{item.name}</Text>
                                            <View className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full mt-2 w-full overflow-hidden">
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
        </View>
    );
}
