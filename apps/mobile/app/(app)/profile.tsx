
import { View, Text, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
    const { themeMode, activeTheme, setThemeMode } = useTheme();
    const { user, signOut } = useAuth();
    const router = useRouter();

    const isDark = activeTheme === 'dark';

    const THEME_OPTIONS = [
        { label: 'Light', value: 'light', icon: 'sunny' },
        { label: 'Dark', value: 'dark', icon: 'moon' },
        { label: 'System', value: 'system', icon: 'settings' },
    ] as const;

    // Styles logic (Basic replacement for Tailwind to fix crash)
    const containerBg = isDark ? '#000000' : '#f9fafb'; // black / gray-50
    const cardBg = isDark ? '#171717' : '#ffffff'; // neutral-900 / white
    const textMain = isDark ? '#ffffff' : '#111827'; // white / gray-900
    const textSub = isDark ? '#9ca3af' : '#6b7280'; // gray-400 / gray-500
    const themeRowBg = isDark ? '#262626' : '#f3f4f6'; // neutral-800 / gray-100

    return (
        <ScrollView style={{ flex: 1, backgroundColor: containerBg, padding: 16 }}>
            {/* Header */}
            <View style={{ marginTop: 32, marginBottom: 32, alignItems: 'center' }}>
                <View style={{ width: 80, height: 80, backgroundColor: '#3b82f6', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>U</Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: textMain }}>User</Text>
            </View>

            {/* Theme Selector */}
            <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
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
                style={{ backgroundColor: isDark ? 'rgba(127, 29, 29, 0.2)' : '#fef2f2', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
                <Ionicons name="log-out" size={20} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
