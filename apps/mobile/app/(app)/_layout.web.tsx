import { Tabs } from 'expo-router';
import { useI18n } from '@/lib/i18n';
import { Icon, useTokens, type IoniconName } from '@/design';

function tabIcon(active: IoniconName, inactive: IoniconName) {
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Icon name={focused ? active : inactive} size={24} color={color} />;
  }
  return TabIcon;
}

/**
 * Web build (local testing in a browser): a classic bottom tab bar, because the
 * native tab bar used on iOS/Android is not designed for the web.
 */
export default function AppTabsWeb() {
  const { t } = useI18n();
  const tokens = useTokens();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.accent,
        tabBarInactiveTintColor: tokens.colors.labelSecondary,
        tabBarStyle: { backgroundColor: tokens.colors.surface, borderTopColor: tokens.colors.separator },
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
