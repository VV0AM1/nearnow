import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

interface GlassViewProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
    colors?: readonly [string, string, ...string[]];
}

export const GlassView: React.FC<GlassViewProps> = ({
    children,
    style,
    intensity = 20,
    colors
}) => {
    const { activeTheme } = useTheme();
    const isDark = activeTheme === 'dark';

    // Default gradients based on theme
    const darkGradient = [Colors.dark.gradientStart, 'rgba(2, 8, 23, 0.6)'];
    const lightGradient = ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'];

    const gradientColors = colors || (isDark ? darkGradient : lightGradient);

    const Container = Platform.OS === 'android' ? View : BlurView;
    const containerProps = Platform.OS === 'android' ? {} : { intensity: isDark ? intensity : intensity + 10, tint: isDark ? 'dark' : 'light' };

    return (
        <View style={[styles.wrapper, style, {
            borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.5)',
            borderWidth: 1,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: Platform.OS === 'android' && isDark ? '#0f172a' : 'transparent' // Fallback for android
        }]}>
            <LinearGradient
                colors={gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {/* on iOS, BlurView goes UNDER the content but inside the border */}
            {Platform.OS === 'ios' && (
                <BlurView
                    style={StyleSheet.absoluteFill}
                    intensity={intensity}
                    tint={isDark ? 'dark' : 'light'}
                />
            )}

            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    content: {
        zIndex: 1,
    }
});
