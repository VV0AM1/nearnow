import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import api, { API_URL } from '@/services/api';
import { format } from 'date-fns';

export default function ProfileScreen() {
    const { themeMode, activeTheme, setThemeMode } = useTheme();
    const { signOut } = useAuth();
    const router = useRouter();
    const isDark = activeTheme === 'dark';

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            setProfile(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile();
    }, []);

    const THEME_OPTIONS = [
        { label: 'Light', value: 'light', icon: 'sunny' },
        { label: 'Dark', value: 'dark', icon: 'moon' },
        { label: 'System', value: 'system', icon: 'settings' },
    ] as const;

    // Colors
    const containerBg = isDark ? '#000000' : '#f9fafb';
    const cardBg = isDark ? '#171717' : '#ffffff';
    const textMain = isDark ? '#ffffff' : '#111827';
    const textSub = isDark ? '#9ca3af' : '#6b7280';
    const themeRowBg = isDark ? '#262626' : '#f3f4f6';

    // Gamification Data
    const level = profile?.gamification?.level || 1;
    const xp = profile?.gamification?.points || 0;
    const nextLevelXp = profile?.gamification?.nextLevelPoints || 5;
    const progress = profile?.gamification?.progress || 0;

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: containerBg }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header / Avatar */}
            <View className="items-center pt-8 pb-6 bg-white dark:bg-black border-b border-gray-100 dark:border-neutral-800">
                <View className="relative">
                    {profile?.avatar ? (
                        <Image
                            source={{ uri: `${API_URL.replace('/api', '')}${profile.avatar}` }}
                            className="w-24 h-24 rounded-full"
                        />
                    ) : (
                        <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center">
                            <Text className="text-white text-4xl font-bold">{profile?.name?.[0] || 'U'}</Text>
                        </View>
                    )}
                    <TouchableOpacity className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                        <Ionicons name="camera" size={16} color={isDark ? 'white' : 'black'} />
                    </TouchableOpacity>
                </View>

                <Text className="text-2xl font-bold mt-4 dark:text-white">{profile?.name || 'Loading...'}</Text>
                <Text className="text-gray-500 dark:text-gray-400">
                    Joined {profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : '...'}
                </Text>

                {/* Level / XP */}
                <View className="w-4/5 mt-6">
                    <View className="flex-row justify-between mb-2">
                        <Text className="font-bold text-blue-600">Level {level} <Text className="text-gray-500 font-normal">({profile?.gamification?.rank || 'Novice'})</Text></Text>
                        <Text className="text-gray-500 text-xs">{xp} / {nextLevelXp} XP</Text>
                    </View>
                    <View className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <View style={{ width: `${progress}%` }} className="h-full bg-blue-600 rounded-full" />
                    </View>
                </View>
            </View>

            {/* Stats Grid */}
            <View className="flex-row justify-between px-6 py-6 bg-white dark:bg-black mt-4 mx-4 rounded-2xl shadow-sm">
                <View className="items-center flex-1">
                    <Text className="text-xl font-bold dark:text-white">{profile?._count?.posts || 0}</Text>
                    <Text className="text-xs text-gray-500 uppercase tracking-wide mt-1">Posts</Text>
                </View>
                <View className="w-[1px] bg-gray-100 dark:bg-gray-800" />
                <View className="items-center flex-1">
                    <Text className="text-xl font-bold dark:text-white">{profile?._count?.votes || 0}</Text>
                    <Text className="text-xs text-gray-500 uppercase tracking-wide mt-1">Votes</Text>
                </View>
                <View className="w-[1px] bg-gray-100 dark:bg-gray-800" />
                <View className="items-center flex-1">
                    <Text className="text-xl font-bold dark:text-white">{profile?._count?.comments || 0}</Text>
                    <Text className="text-xs text-gray-500 uppercase tracking-wide mt-1">Comments</Text>
                </View>
            </View>

            {/* Theme Selector */}
            <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, margin: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: textSub, textTransform: 'uppercase', marginBottom: 16 }}>
                    Appearance
                </Text>

                <View style={{ flexDirection: 'row', backgroundColor: themeRowBg, padding: 4, borderRadius: 12 }}>
                    {THEME_OPTIONS.map((opt) => {
                        const isActive = themeMode === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => setThemeMode(opt.value)}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    gap: 8,
                                    backgroundColor: isActive ? (isDark ? '#404040' : '#ffffff') : 'transparent',
                                    shadowColor: isActive ? "#000" : undefined,
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: isActive ? 0.1 : 0,
                                    shadowRadius: 1,
                                    elevation: isActive ? 1 : 0
                                }}
                            >
                                <Ionicons
                                    name={opt.icon as any}
                                    size={18}
                                    color={isActive ? (isDark ? '#fff' : '#000') : '#9ca3af'}
                                />
                                <Text style={{
                                    fontWeight: '500',
                                    color: isActive ? textMain : '#9ca3af'
                                }}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Sign Out */}
            <TouchableOpacity
                onPress={() => {
                    signOut();
                    router.replace('/login');
                }}
                style={{ backgroundColor: isDark ? 'rgba(127, 29, 29, 0.2)' : '#fef2f2', padding: 16, margin: 16, marginTop: 0, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
                <Ionicons name="log-out" size={20} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
