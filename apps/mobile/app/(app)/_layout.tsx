import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { View } from 'react-native';
import { SOSButton } from '@/components/SOSButton';

export default function AppLayout() {
    const { activeTheme } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerRight: () => (
                    <View className="mr-4">
                        <SOSButton />
                    </View>
                ),
                tabBarStyle: {
                    backgroundColor: activeTheme === 'dark' ? '#1f2937' : '#ffffff',
                    borderTopColor: activeTheme === 'dark' ? '#374151' : '#e5e7eb',
                },
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#9ca3af',
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Feed',
                    tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
