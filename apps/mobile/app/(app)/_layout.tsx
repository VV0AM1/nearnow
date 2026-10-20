import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/components/ui';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} size={24} color={color} />;
  }
  return TabIcon;
}

export default function AppTabs() {
  const { t } = useI18n();
  const c = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        // Not absolute: the bar never covers scroll content.
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t('tabs.feed'), tabBarIcon: tabIcon('newspaper', 'newspaper-outline') }} />
      <Tabs.Screen name="map" options={{ title: t('tabs.map'), tabBarIcon: tabIcon('map', 'map-outline') }} />
      <Tabs.Screen name="create" options={{ title: t('tabs.post'), tabBarIcon: tabIcon('add-circle', 'add-circle-outline') }} />
      <Tabs.Screen name="lost-found" options={{ title: t('tabs.lostFound'), tabBarIcon: tabIcon('search-circle', 'search-circle-outline') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('person-circle', 'person-circle-outline') }} />
    </Tabs>
  );
}
