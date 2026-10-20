import React from 'react';
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTokens } from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Shrink slightly while pressed (spring). Falls back to opacity when Reduce Motion is on. */
  scaleOnPress?: boolean;
  /** Light haptic on press — only for meaningful actions. */
  haptic?: boolean;
  /** Android ripple colour; defaults to a translucent label colour. */
  rippleColor?: string;
}

/** Base pressable used by every tappable element in the kit. */
export function PressableScale({ scaleOnPress = true, haptic, rippleColor, style, onPressIn, onPressOut, onPress, disabled, ...rest }: PressableScaleProps) {
  const t = useTokens();
  const pressed = useSharedValue(0);

  const animated = useAnimatedStyle(() => {
    if (t.reduceMotion || !scaleOnPress) return { opacity: 1 - pressed.value * 0.35 };
    return { transform: [{ scale: 1 - pressed.value * (1 - t.motion.pressScale) }], opacity: 1 - pressed.value * 0.08 };
  });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      android_ripple={Platform.OS === 'android' ? { color: rippleColor ?? (t.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'), borderless: false } : undefined}
      onPressIn={(e) => {
        pressed.value = t.reduceMotion ? withTiming(1, { duration: 60 }) : withSpring(1, t.motion.spring.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = t.reduceMotion ? withTiming(0, { duration: 120 }) : withSpring(0, t.motion.spring.snappy);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        onPress?.(e);
      }}
      style={[style, animated]}
      {...rest}
    />
  );
}
