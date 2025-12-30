import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Image, Alert, ActivityIndicator, Switch } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import api, { API_URL } from '@/services/api';
import { format } from 'date-fns';
import { startBackgroundLocation, stopBackgroundLocation, COMPANION_LOCATION_TASK } from '@/services/location-task';

export default function ProfileScreen() {
    const { themeMode, activeTheme, setThemeMode } = useTheme();
    const { signOut } = useAuth();
    const router = useRouter();
    const isDark = activeTheme === 'dark';

    const [profile, setProfile] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null); // Notification Settings
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Background tracking state
    const [isTracking, setIsTracking] = useState(false);
    const [togglingTrack, setTogglingTrack] = useState(false);

    const fetchProfile = async () => {
        try {
            const [resProfile, resSettings] = await Promise.all([
                api.get('/users/me'),
                api.get('/notifications/me/settings')
            ]);
            setProfile(resProfile.data);
            setSettings(resSettings.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const checkTrackingStatus = async () => {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(COMPANION_LOCATION_TASK);
        setIsTracking(hasStarted);
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
            checkTrackingStatus();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile();
        checkTrackingStatus();
    }, []);

    // Update Radius
    const updateRadius = async (radius: number) => {
        try {
            // Optimistic update
            setSettings({ ...settings, radiusKm: radius });
            await api.put('/notifications/me/settings', {
                ...settings,
                radiusKm: radius
            });
        } catch (e) {
            Alert.alert("Error", "Failed to update settings");
        }
    };

    const toggleTracking = async (value: boolean) => {
        setTogglingTrack(true);
        try {
            if (value) {
                const success = await startBackgroundLocation();
                setIsTracking(success);
                if (!success) Alert.alert("Permission Required", "Please allow 'Always' location access in settings for background alerts.");
            } else {
                await stopBackgroundLocation();
                setIsTracking(false);
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not toggle tracking.");
            setIsTracking(false);
        } finally {
            setTogglingTrack(false);
        }
    };

    const THEME_OPTIONS = [
        { label: 'Light', value: 'light', icon: 'sunny' },
        { label: 'Dark', value: 'dark', icon: 'moon' },
        { label: 'System', value: 'system', icon: 'settings' },
    ] as const;

    const RADIUS_OPTIONS = [5, 10, 25, 50];

    // Colors
    const containerBg = isDark ? '#000000' : '#f9fafb';
    const cardBg = isDark ? '#171717' : '#ffffff';
    const textMain = isDark ? '#ffffff' : '#111827';
    const textSub = isDark ? '#9ca3af' : '#6b7280';
    const themeRowBg = isDark ? '#262626' : '#f3f4f6';

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

            {/* Notification & Location Settings (NEW) */}
            <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, margin: 16, marginTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-1 mr-4">
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: textSub, textTransform: 'uppercase' }}>
                            Live Safety Tracking
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                            Auto-update location for alerts even when the app is closed.
                        </Text>
                    </View>
                    {togglingTrack ? (
                        <ActivityIndicator />
                    ) : (
                        <Switch
                            value={isTracking}
                            onValueChange={toggleTracking}
                            trackColor={{ false: '#767577', true: '#3b82f6' }}
                            thumbColor={isTracking ? '#ffffff' : '#f4f3f4'}
                        />
                    )}
                </View>

                {/* Radius Selector */}
                <Text className="text-gray-500 dark:text-gray-400 text-xs mb-3">
                    Alert Radius: <Text className="font-bold dark:text-white">{settings?.radiusKm || 5} km</Text>
                </Text>

                <View className="flex-row justify-between mb-6">
                    {RADIUS_OPTIONS.map(km => {
                        const isActive = settings?.radiusKm === km;
                        return (
                            <TouchableOpacity
                                key={km}
                                onPress={() => updateRadius(km)}
                                className={`px-4 py-2 rounded-lg border ${isActive ? 'bg-blue-600 border-blue-600' : 'border-gray-200 dark:border-gray-700'}`}
                            >
                                <Text className={`${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'} font-bold`}>{km}km</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {/* Category Filters */}
                <Text className="text-gray-500 dark:text-gray-400 text-xs mb-3">
                    Filter Categories:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                    {[
                        { id: 'DANGER', label: 'SOS', color: '#ef4444' },
                        { id: 'CRIME', label: 'Crime', color: '#dc2626' },
                        { id: 'SAFETY', label: 'Safe', color: '#22c55e' },
                        { id: 'LOST_FOUND', label: 'Lost', color: '#eab308' },
                        { id: 'EVENT', label: 'Event', color: '#a855f7' },
                        { id: 'RECOMMENDATION', label: 'Rec', color: '#ec4899' },
                    ].map((cat) => {
                        const isSelected = settings?.categories?.includes(cat.id);
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={async () => {
                                    const current = settings?.categories || [];
                                    const newCats = isSelected
                                        ? current.filter((c: string) => c !== cat.id)
                                        : [...current, cat.id];

                                    setSettings({ ...settings, categories: newCats });
                                    await api.put('/notifications/me/settings', { ...settings, categories: newCats });
                                }}
                                style={{
                                    backgroundColor: isSelected ? cat.color : (isDark ? '#262626' : '#f3f4f6'),
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 20
                                }}
                            >
                                <Text style={{
                                    color: isSelected ? 'white' : (isDark ? '#d1d5db' : '#4b5563'),
                                    fontWeight: '600',
                                    fontSize: 12
                                }}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

            </View>

            {/* Stats Grid */}
            <View className="flex-row justify-between px-6 py-6 bg-white dark:bg-black mt-0 mx-4 rounded-2xl shadow-sm">
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

            {/* Menu Links */}
            <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 0, margin: 16, marginTop: 16, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                <TouchableOpacity
                    onPress={() => router.push('/(app)/saved' as any)}
                    className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800"
                >
                    <View className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-4">
                        <Ionicons name="bookmark" size={20} color="#2563eb" />
                    </View>
                    <Text className="flex-1 font-bold text-base dark:text-white">Saved Posts</Text>
                    <Ionicons name="chevron-forward" size={20} color={isDark ? '#4b5563' : '#d1d5db'} />
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-row items-center p-4"
                    onPress={() => router.push('/notifications' as any)}
                >
                    <View className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-4">
                        <Ionicons name="notifications" size={20} color="#9333ea" />
                    </View>
                    <Text className="flex-1 font-bold text-base dark:text-white">Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color={isDark ? '#4b5563' : '#d1d5db'} />
                </TouchableOpacity>
            </View>

            {/* Theme Selector */}
            <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, margin: 16, marginTop: 0, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
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
