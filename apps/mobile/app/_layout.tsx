import { useEffect } from 'react';
import { Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import { AuthProvider, onBeforeSignOut, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { LocationProvider, useArea } from '@/context/LocationContext';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { config } from '@/lib/config';
import { postIdFromNotification, registerForPush, unregisterPush } from '@/lib/push';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const PUBLIC_ROUTES = new Set(['login', 'signup', 'forgot-password']);
const SETUP_ROUTES = new Set(['onboarding', 'city-picker']);

export default function RootLayout() {
  const [loaded, error] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'), ...FontAwesome.font });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <ThemeProvider>
            {config.configError ? (
              <ConfigError />
            ) : (
              <AuthProvider>
                <LocationProvider>
                  <ToastProvider>
                    <Navigation />
                  </ToastProvider>
                </LocationProvider>
              </AuthProvider>
            )}
          </ThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ConfigError() {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0b1220' }}>
      <Text accessibilityRole="header" style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
        {t('error.configTitle')}
      </Text>
      <Text style={{ color: '#cbd5e1', lineHeight: 22, marginBottom: 12 }}>{t('error.configBody')}</Text>
      <Text style={{ color: '#94a3b8', fontFamily: 'SpaceMono' }}>{config.configError}</Text>
    </View>
  );
}

/** Single place that decides where an unauthenticated / unconfigured user may be. */
function useRouteGuard() {
  const { status } = useAuth();
  const { ready, area } = useArea();
  const segments = useSegments();
  const router = useRouter();
  const first = (segments[0] as string | undefined) ?? '';

  useEffect(() => {
    if (status === 'loading' || !ready) return;
    // Design-kit gallery: reviewable without an account, development builds only.
    if (__DEV__ && first === 'dev') return;
    const isPublic = PUBLIC_ROUTES.has(first);
    const isSetup = SETUP_ROUTES.has(first);
    if (status === 'signedOut') {
      if (!isPublic) router.replace('/login');
      return;
    }
    if (!area) {
      if (!isSetup) router.replace('/onboarding');
      return;
    }
    if (isPublic || first === '' || first === 'index') router.replace('/(app)/home');
  }, [status, ready, area, first, router]);
}

function usePushIntegration() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const off = onBeforeSignOut(unregisterPush);
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    if (status !== 'signedIn') return;
    // Only registers if the user already granted permission; asking happens in Alerts settings.
    void registerForPush(false);
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const postId = postIdFromNotification(response.notification.request.content.data);
      router.push(postId ? { pathname: '/post/[id]', params: { id: postId } } : '/notifications');
    });
    return () => sub.remove();
  }, [status, router]);
}

function Navigation() {
  const { activeTheme } = useTheme();
  const { t } = useI18n();
  useRouteGuard();
  usePushIntegration();

  return (
    <NavigationThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerBackTitle: t('common.back') }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ title: t('auth.signUp') }} />
        <Stack.Screen name="forgot-password" options={{ title: t('auth.resetTitle') }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="city-picker" options={{ title: t('area.pickTitle'), presentation: 'modal' }} />
        <Stack.Screen name="post/[id]" options={{ title: '' }} />
        <Stack.Screen name="notifications" options={{ title: t('notifications.title') }} />
        <Stack.Screen name="alerts" options={{ title: t('alerts.title') }} />
        <Stack.Screen name="contact-requests" options={{ title: t('contacts.title') }} />
        <Stack.Screen name="saved" options={{ title: t('profile.saved') }} />
        <Stack.Screen name="area" options={{ title: t('activity.title') }} />
        <Stack.Screen name="dev/gallery" options={{ title: 'Design kit' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </NavigationThemeProvider>
  );
}
