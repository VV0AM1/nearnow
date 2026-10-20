import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/lib/i18n';

type IconName = keyof typeof Ionicons.glyphMap;

/** Colour tokens for places NativeWind classes cannot reach (icons, WebView, inline styles). */
export function useColors() {
  const { activeTheme } = useTheme();
  const dark = activeTheme === 'dark';
  return {
    dark,
    bg: dark ? '#0b1220' : '#f8fafc',
    card: dark ? '#111a2e' : '#ffffff',
    border: dark ? '#1f2a44' : '#e2e8f0',
    text: dark ? '#f1f5f9' : '#0f172a',
    muted: dark ? '#94a3b8' : '#475569',
    primary: '#2563eb',
    danger: '#dc2626',
    success: '#15803d',
    warning: '#b45309',
  };
}

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  icon?: IconName;
}

export function Button({ title, variant = 'primary', loading, icon, disabled, style, ...rest }: ButtonProps) {
  const c = useColors();
  const isDisabled = disabled || loading;
  const bg = { primary: c.primary, secondary: c.dark ? '#1e293b' : '#e2e8f0', danger: c.danger, ghost: 'transparent' }[variant];
  const fg = variant === 'secondary' || variant === 'ghost' ? c.text : '#ffffff';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={(state) => [
        {
          minHeight: 48,
          borderRadius: 12,
          paddingHorizontal: 16,
          backgroundColor: bg,
          opacity: isDisabled ? 0.55 : state.pressed ? 0.85 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color,
  size = 22,
  badge,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
  badge?: number;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label} (${badge})` : label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Ionicons name={icon} size={size} color={color ?? c.text} />
      {badge ? (
        <View style={{ position: 'absolute', top: 6, right: 4, backgroundColor: c.primary, borderRadius: 9, minWidth: 18, paddingHorizontal: 4 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) {
  const c = useColors();
  const tint = color ?? c.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: selected ? tint : c.border,
        backgroundColor: selected ? tint : c.card,
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: selected ? '#fff' : c.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

interface FieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  max?: number;
  right?: React.ReactNode;
}

export function Field({ label, error, max, right, value, style, ...rest }: FieldProps) {
  const c = useColors();
  const { t } = useI18n();
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: c.text, fontWeight: '600' }}>{label}</Text>
        {max ? (
          <Text style={{ color: c.muted, fontSize: 12 }} accessibilityElementsHidden>
            {t('create.chars', { n: value?.length ?? 0, max })}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: error ? c.danger : c.border,
          borderRadius: 12,
          backgroundColor: c.card,
        }}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={c.muted}
          value={value}
          maxLength={max}
          style={[{ flex: 1, minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, color: c.text, fontSize: 16 }, style]}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={{ color: c.danger, marginTop: 6 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function StateView({
  kind,
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  icon,
}: {
  kind: 'loading' | 'error' | 'empty';
  title?: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  icon?: IconName;
}) {
  const c = useColors();
  const { t } = useI18n();
  if (kind === 'loading') {
    return (
      <View style={{ padding: 32, alignItems: 'center' }} accessibilityLabel={t('common.loading')}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }
  return (
    <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
      <Ionicons name={icon ?? (kind === 'error' ? 'cloud-offline-outline' : 'leaf-outline')} size={40} color={c.muted} />
      {title ? <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>{title}</Text> : null}
      {body ? <Text style={{ color: c.muted, textAlign: 'center', lineHeight: 20 }}>{body}</Text> : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} style={{ alignSelf: 'stretch' }} /> : null}
      {secondaryLabel && onSecondary ? <Button title={secondaryLabel} variant="ghost" onPress={onSecondary} /> : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  const c = useColors();
  return (
    <Text accessibilityRole="header" style={{ color: c.muted, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 }}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 16 }, style]}>{children}</View>;
}
