import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import type { SFSymbol } from 'expo-symbols';
import { useI18n } from '@/lib/i18n';
import { useTokens, type IoniconName } from '@/design';

/**
 * SF Symbol on iOS, Ionicons drawn into the Material navigation bar on Android.
 * A plain function, not a component: NativeTabs reads `<Icon>` children by type.
 */
function tabIcon(sf: SFSymbol, sfSelected: SFSymbol, android: IoniconName) {
  return <Icon sf={{ default: sf, selected: sfSelected }} androidSrc={<VectorIcon family={Ionicons} name={android} />} />;
}

/**
 * System tab bar (UITabBarController / Material bottom navigation). On iOS 26 it
 * picks up Liquid Glass and minimises while scrolling without extra code.
 */
export default function AppTabs() {
  const { t } = useI18n();
  const tokens = useTokens();

  return (
    <NativeTabs
      tintColor={tokens.colors.accent}
      iconColor={tokens.colors.labelSecondary}
      // iOS keeps the system material (Liquid Glass on iOS 26); Android gets a solid bar.
      backgroundColor={Platform.OS === 'android' ? tokens.colors.surface : undefined}
      indicatorColor={tokens.colors.accentSoft}
      labelVisibilityMode="labeled"
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="home">
        <Label>{t('tabs.feed')}</Label>
        {tabIcon('newspaper', 'newspaper.fill', 'newspaper-outline')}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <Label>{t('tabs.map')}</Label>
        {tabIcon('map', 'map.fill', 'map-outline')}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <Label>{t('tabs.post')}</Label>
        {tabIcon('plus.circle', 'plus.circle.fill', 'add-circle-outline')}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lost-found">
        <Label>{t('tabs.lostFound')}</Label>
        {tabIcon('magnifyingglass.circle', 'magnifyingglass.circle.fill', 'search-circle-outline')}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>{t('tabs.profile')}</Label>
        {tabIcon('person.crop.circle', 'person.crop.circle.fill', 'person-circle-outline')}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
