/**
 * Compatibility layer: the original component API, implemented with the NearNow
 * design kit (`@/design`). Screens being rebuilt should import from `@/design`
 * directly; this file keeps not-yet-migrated screens on the same design system.
 */
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  Button as KitButton,
  Card as KitCard,
  Chip as KitChip,
  IconButton as KitIconButton,
  StateView as KitStateView,
  Text,
  TextField,
  useTokens,
  type ButtonVariant,
  type IoniconName,
  type TextFieldProps,
} from '@/design';

/** Legacy colour names mapped onto design tokens. */
export function useColors() {
  const t = useTokens();
  return {
    dark: t.dark,
    bg: t.colors.background,
    card: t.colors.surface,
    border: t.colors.separator,
    text: t.colors.label,
    muted: t.colors.labelSecondary,
    primary: t.colors.accent,
    danger: t.colors.danger,
    success: t.colors.success,
    warning: t.colors.warning,
  };
}

const VARIANT: Record<'primary' | 'secondary' | 'danger' | 'ghost', ButtonVariant> = {
  primary: 'filled',
  secondary: 'tinted',
  danger: 'destructive',
  ghost: 'plain',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: keyof typeof VARIANT;
  loading?: boolean;
  disabled?: boolean;
  icon?: IoniconName;
  style?: StyleProp<ViewStyle>;
}) {
  return <KitButton title={title} onPress={onPress} variant={VARIANT[variant]} loading={loading} disabled={disabled} icon={icon} style={style} />;
}

export function IconButton(props: { icon: IoniconName; label: string; onPress: () => void; color?: string; size?: number; badge?: number }) {
  return <KitIconButton {...props} />;
}

export function Chip(props: { label: string; selected: boolean; onPress: () => void; color?: string }) {
  return <KitChip {...props} />;
}

export function Field(props: TextFieldProps) {
  return <TextField {...props} />;
}

export const StateView = KitStateView;

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text variant="footnote" tone="secondary" weight="600" style={{ textTransform: 'uppercase', marginTop: 8, marginBottom: 8 }} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <KitCard style={style}>{children}</KitCard>;
}
