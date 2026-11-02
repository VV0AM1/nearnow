import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useTokens } from './theme';

/**
 * Header options for a tab's root stack: iOS large title that collapses into a
 * translucent bar on scroll; a plain Material top bar on Android. Scroll views in
 * these screens must set `contentInsetAdjustmentBehavior="automatic"`.
 */
export function useLargeTitleOptions(): NativeStackNavigationOptions {
  const t = useTokens();
  const ios = Platform.OS === 'ios';
  return {
    headerLargeTitle: ios,
    headerLargeTitleShadowVisible: false,
    headerShadowVisible: false,
    headerTransparent: ios,
    headerBlurEffect: ios ? 'systemChromeMaterial' : undefined,
    headerStyle: ios ? undefined : { backgroundColor: t.colors.background },
    headerTintColor: t.colors.accent,
    headerTitleStyle: { color: t.colors.label },
    headerLargeTitleStyle: { color: t.colors.label },
    contentStyle: { backgroundColor: t.colors.background },
  };
}
