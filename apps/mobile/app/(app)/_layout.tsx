import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { View, TouchableOpacity, Platform } from 'react-native';
import { SOSButton } from '@/components/SOSButton';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import '@/services/location-task';

function CreateTabBarButton({ children, onPress }: { children: React.ReactNode, onPress?: (e: any) => void }) {
    return (
        <TouchableOpacity
            style={{
                top: -20,
                justifyContent: 'center',
                alignItems: 'center',
            }}
            onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress?.(e);
            }}
        >
            <LinearGradient
                colors={['#f43f5e', '#f97316']}
                style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#f43f5e',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 10,
                    elevation: 10,
                    borderWidth: 4,
                    borderColor: '#000', // Match bg color usually, slightly hardcoded but effective
                }}
            >
                {children}
            </LinearGradient>
        </TouchableOpacity>
    );
}

export default function AppLayout() {
    const { activeTheme } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerTransparent: true,
                headerBackground: () => (
                    <BlurView
                        tint={activeTheme === 'dark' ? 'dark' : 'light'}
                        intensity={80}
                        style={{ flex: 1 }}
                    />
                ),
                headerTitleStyle: {
                    color: activeTheme === 'dark' ? '#fff' : '#000',
                    fontSize: 18,
                    fontWeight: 'bold',
                },
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 85 : 65,
                    backgroundColor: 'transparent',
                },
                tabBarBackground: () => (
                    <BlurView
                        tint={activeTheme === 'dark' ? 'dark' : 'light'}
                        intensity={95}
                        style={{ flex: 1, backgroundColor: activeTheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}
                    />
                ),
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: '#6b7280',
                headerRight: () => (
                    <View className="mr-4">
                        <SOSButton />
                    </View>
                ),
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Feed',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "map" : "map-outline"} size={26} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="create"
                options={{
                    title: '',
                    tabBarIcon: ({ focused }) => (
                        <Ionicons name="add" size={32} color="#fff" />
                    ),
                    tabBarButton: (props) => (
                        <CreateTabBarButton {...props} />
                    ),
                    headerShown: false,
                    // Hide tab bar when creating a post (optional, user might want it visible but standard is hide)
                    // But if we want the FAB to be the launcher, it stays in the bar.
                    // The 'create' route might be a modal, but standard screen is fine.
                }}
            />

            <Tabs.Screen
                name="safety"
                options={{
                    title: 'Safety',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
                    ),
                }}
            />

            {/* Hidden Routes */}
            <Tabs.Screen
                name="saved"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="post/[id]"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarStyle: { display: 'none' }, // Hide tabs on details
                }}
            />
        </Tabs>
    );
}
