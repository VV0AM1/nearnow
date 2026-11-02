import React from 'react';
import { ActivityIndicator, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from './Pressable';
import { Text } from './Text';
import { Icon, type IoniconName } from './Icon';
import { useTokens } from './theme';
import { continuous } from './tokens';

export type ButtonVariant = 'filled' | 'tinted' | 'plain' | 'destructive' | 'destructiveTinted';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IoniconName;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to the container width. */
  block?: boolean;
  haptic?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT: Record<ButtonSize, number> = { small: 36, medium: 48, large: 54 };

/**
 * iOS-style buttons (filled / tinted / plain), shaped as Material pills on Android.
 * Loading keeps the label for screen readers and blocks repeat presses.
 */
export function Button({ title, onPress, variant = 'filled', size = 'medium', icon, loading, disabled, block, haptic, accessibilityHint, style }: ButtonProps) {
  const t = useTokens();
  const c = t.colors;
  const bg = { filled: c.accent, tinted: c.accentSoft, plain: 'transparent', destructive: c.danger, destructiveTinted: c.dangerSoft }[variant];
  const fg = { filled: c.onAccent, tinted: c.accent, plain: c.accent, destructive: c.onAccent, destructiveTinted: c.danger }[variant];
  const inactive = disabled || loading;
  const height = Math.max(HEIGHT[size], size === 'small' ? 36 : t.minTouch);

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      haptic={haptic}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      hitSlop={size === 'small' ? 6 : undefined}
      style={[
        {
          minHeight: height,
          paddingHorizontal: size === 'small' ? t.space.md : t.space.xl,
          borderRadius: Platform.OS === 'android' ? t.radius.pill : size === 'large' ? t.radius.md : t.radius.sm + 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: t.space.sm,
          opacity: inactive && !loading ? 0.45 : 1,
          alignSelf: block ? 'stretch' : 'auto',
          overflow: 'hidden',
          ...continuous,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={size === 'small' ? 16 : 19} color={fg} weight="semibold" /> : null}
      <View>
        <Text variant={size === 'small' ? 'subheadline' : 'headline'} style={{ color: fg }} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </PressableScale>
  );
}

export interface IconButtonProps {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  /** 'plain' = icon only; 'filled' = circular tinted background (map controls, toolbars). */
  variant?: 'plain' | 'filled';
  color?: string;
  size?: number;
  badge?: number;
  selected?: boolean;
  disabled?: boolean;
}

export function IconButton({ icon, label, onPress, variant = 'plain', color, size = 22, badge, selected, disabled }: IconButtonProps) {
  const t = useTokens();
  const dim = t.minTouch;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      accessibilityState={{ selected, disabled }}
      hitSlop={4}
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: variant === 'filled' ? t.colors.surfaceElevated : 'transparent',
        overflow: 'hidden',
      }}
    >
      <Icon name={icon} size={size} color={disabled ? t.colors.labelTertiary : (color ?? (selected ? t.colors.accent : t.colors.label))} />
      {badge ? (
        <View
          accessibilityElementsHidden
          style={{ position: 'absolute', top: 6, right: 4, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: t.colors.danger, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text variant="caption2" weight="700" style={{ color: t.colors.onAccent }} maxFontSizeMultiplier={1.2}>
            {badge > 99 ? '99+' : String(badge)}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}
