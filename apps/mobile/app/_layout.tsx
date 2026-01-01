import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import '../global.css';



export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(app)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

import { ToastProvider } from '@/context/ToastContext';

function RootLayoutNav() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <NavContent />
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function NavContent() {
  const { activeTheme } = useTheme();

  return (
    <NavigationThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ presentation: 'modal', title: 'Create Account' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal', title: 'Notifications' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
