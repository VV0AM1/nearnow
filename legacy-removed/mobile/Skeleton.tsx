import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    style?: ViewStyle;
    borderRadius?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    style,
    borderRadius = 4
}) => {
    const { activeTheme } = useTheme();
    const isDark = activeTheme === 'dark';
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    const bg = isDark ? '#1e293b' : '#e2e8f0';

    return (
        <Animated.View
            style={[
                {
                    opacity,
                    backgroundColor: bg,
                    width: width as any, // Cast to any to avoid Animated TS issues with string percentages
                    height: height as any,
                    borderRadius,
                },
                style,
            ]}
        />
    );
};
