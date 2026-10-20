import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { Text } from './Text';
import { Icon, type IoniconName } from './Icon';
import { Button } from './Button';
import { useTokens } from './theme';
import { continuous, elevation } from './tokens';

/** Content card: surface colour, continuous corners, subtle depth. */
export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const t = useTokens();
  return (
    <View style={[{ backgroundColor: t.colors.surface, borderRadius: t.radius.lg, padding: padded ? t.space.lg : 0, ...continuous, ...elevation(1, t.scheme) }, style]}>
      {children}
    </View>
  );
}

const liquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * Floating material for controls over content (map buttons, toolbars).
 * iOS 26+: Liquid Glass. Older iOS: system blur. Android: an opaque elevated surface
 * (Material does not use translucent blur for controls).
 */
export function GlassSurface({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTokens();
  const shape: ViewStyle = { borderRadius: t.radius.lg, overflow: 'hidden', ...continuous };
  if (liquidGlass) return <GlassView glassEffectStyle="regular" style={[shape, style]}>{children}</GlassView>;
  if (Platform.OS === 'ios') {
    return (
      <View style={[shape, elevation(2, t.scheme), style]}>
        <BlurView tint={t.dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} intensity={90} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
        {children}
      </View>
    );
  }
  return <View style={[shape, { backgroundColor: t.colors.surfaceElevated }, elevation(2, t.scheme), style]}>{children}</View>;
}

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

/** Status badge: icon + text, so meaning never relies on colour alone. */
export function Badge({ label, tone = 'neutral', icon, color }: { label: string; tone?: BadgeTone; icon?: IoniconName; color?: string }) {
  const t = useTokens();
  const map = {
    neutral: [t.colors.labelSecondary, t.colors.surfaceSecondary],
    accent: [t.colors.accent, t.colors.accentSoft],
    success: [t.colors.success, t.colors.successSoft],
    warning: [t.colors.warning, t.colors.warningSoft],
    danger: [t.colors.danger, t.colors.dangerSoft],
  } as const;
  const [fg, bg] = color ? [color, `${color}1F`] : map[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: t.radius.pill, backgroundColor: bg, alignSelf: 'flex-start' }}>
      {icon ? <Icon name={icon} size={12} color={fg} weight="semibold" /> : null}
      <Text variant="caption1" weight="600" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}

/** Inline message with an optional action (offline, tiles failed, info). */
export function Banner({ message, tone = 'neutral', icon, actionLabel, onAction }: { message: string; tone?: BadgeTone; icon?: IoniconName; actionLabel?: string; onAction?: () => void }) {
  const t = useTokens();
  const fg = { neutral: t.colors.labelSecondary, accent: t.colors.accent, success: t.colors.success, warning: t.colors.warning, danger: t.colors.danger }[tone];
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm, padding: t.space.md, borderRadius: t.radius.md, backgroundColor: t.colors.surface, ...continuous, ...elevation(1, t.scheme) }}>
      <Icon name={icon ?? 'information-circle-outline'} size={20} color={fg} />
      <Text variant="subheadline" style={{ flex: 1 }}>
        {message}
      </Text>
      {actionLabel && onAction ? <Button title={actionLabel} variant="plain" size="small" onPress={onAction} /> : null}
    </View>
  );
}

/** Loading / empty / error state. Every error offers an action. */
export function StateView({
  kind,
  title,
  body,
  icon,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  kind: 'loading' | 'empty' | 'error';
  title?: string;
  body?: string;
  icon?: IoniconName;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const t = useTokens();
  if (kind === 'loading') {
    return (
      <View style={{ padding: t.space.xxxl, alignItems: 'center' }} accessibilityRole="progressbar" accessibilityLabel={title ?? 'Loading'}>
        <ActivityIndicator color={t.colors.accent} />
      </View>
    );
  }
  return (
    <View style={{ paddingVertical: t.space.huge, paddingHorizontal: t.space.xxl, alignItems: 'center', gap: t.space.md }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: kind === 'error' ? t.colors.warningSoft : t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon ?? (kind === 'error' ? 'cloud-offline-outline' : 'leaf-outline')} size={30} color={kind === 'error' ? t.colors.warning : t.colors.accent} />
      </View>
      {title ? (
        <Text variant="title3" align="center">
          {title}
        </Text>
      ) : null}
      {body ? (
        <Text variant="subheadline" tone="secondary" align="center">
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} style={{ marginTop: t.space.sm, alignSelf: 'stretch' }} /> : null}
      {secondaryLabel && onSecondary ? <Button title={secondaryLabel} variant="plain" onPress={onSecondary} /> : null}
    </View>
  );
}

/** Shimmering placeholder; static when Reduce Motion is on. */
export function Skeleton({ width = '100%', height = 16, radius }: { width?: number | `${number}%`; height?: number; radius?: number }) {
  const t = useTokens();
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    if (t.reduceMotion) return;
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [t.reduceMotion, pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: t.reduceMotion ? 0.7 : pulse.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius ?? t.radius.xs, backgroundColor: t.colors.surfaceSecondary }, animated]}
    />
  );
}

/** Round avatar with initial fallback and a cached, fading image. */
export function Avatar({ uri, name, size = 40 }: { uri?: string | null; name?: string | null; size?: number }) {
  const t = useTokens();
  const initial = (name ?? '?').trim().slice(0, 1).toUpperCase() || '?';
  return (
    <View
      accessible
      accessibilityLabel={name ?? undefined}
      accessibilityRole="image"
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={t.reduceMotion ? 0 : 180} />
      ) : (
        <Text variant={size >= 64 ? 'title2' : 'headline'} tone="accent">
          {initial}
        </Text>
      )}
    </View>
  );
}
