
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemCall } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themeMode: ThemeMode;
    activeTheme: 'light' | 'dark';
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    themeMode: 'system',
    activeTheme: 'light',
    setThemeMode: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useSystemCall();
    const { setColorScheme } = useNativeWindColorScheme(); // NativeWind hook
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [loaded, setLoaded] = useState(false);

    // activeTheme calculates the actual visual theme
    const activeTheme = themeMode === 'system'
        ? (systemScheme === 'dark' ? 'dark' : 'light')
        : themeMode;

    useEffect(() => {
        // Load saved theme
        (async () => {
            try {
                const saved = await SecureStore.getItemAsync('user_theme_preference');
                if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
                    setThemeModeState(saved as ThemeMode);
                }
            } catch (e) {
                console.log('Failed to load theme preference', e);
            } finally {
                setLoaded(true);
            }
        })();
    }, []);

    useEffect(() => {
        if (!loaded) return;
        // Sync NativeWind
        setColorScheme(activeTheme);
        // Persist
        SecureStore.setItemAsync('user_theme_preference', themeMode).catch(console.error);
    }, [themeMode, activeTheme, loaded]);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
    };

    // Always render children to maintain Navigation hierarchy, even if loading preference
    return (
        <ThemeContext.Provider value={{ themeMode, activeTheme, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
