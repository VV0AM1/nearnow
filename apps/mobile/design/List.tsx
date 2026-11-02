import React, { Children, Fragment } from 'react';
import { Platform, Switch, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from './Pressable';
import { Text } from './Text';
import { Icon, type IoniconName } from './Icon';
import { useTokens } from './theme';
import { continuous } from './tokens';

/** iOS "inset grouped" section (Settings app). On Android, a flat Material list group. */
export function ListSection({ header, footer, children, style }: { header?: string; footer?: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTokens();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ marginBottom: t.space.xxl }, style]}>
      {header ? (
        <Text variant="footnote" tone="secondary" style={{ textTransform: Platform.OS === 'ios' ? 'uppercase' : 'none', marginHorizontal: t.space.lg, marginBottom: t.space.sm }} accessibilityRole="header">
          {header}
        </Text>
      ) : null}
      <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.md, overflow: 'hidden', ...continuous }}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {child}
            {i < items.length - 1 ? <View style={{ height: 0.5, backgroundColor: t.colors.separator, marginLeft: 60 }} /> : null}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <Text variant="footnote" tone="secondary" style={{ marginHorizontal: t.space.lg, marginTop: t.space.sm }}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Right-aligned secondary value, e.g. the current language. */
  value?: string;
  icon?: IoniconName;
  /** Background colour of the icon tile (iOS Settings style). */
  iconColor?: string;
  onPress?: () => void;
  /** Chevron for navigation rows (default when onPress is set). */
  accessory?: 'chevron' | 'check' | 'none';
  destructive?: boolean;
  right?: React.ReactNode;
  accessibilityHint?: string;
}

export function ListRow({ title, subtitle, value, icon, iconColor, onPress, accessory, destructive, right, accessibilityHint }: ListRowProps) {
  const t = useTokens();
  const acc = accessory ?? (onPress ? 'chevron' : 'none');
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: Math.max(t.minTouch + 8, 52), paddingHorizontal: t.space.lg, paddingVertical: t.space.sm, gap: t.space.md }}>
      {icon ? (
        <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: iconColor ?? (destructive ? t.colors.danger : t.colors.accent), alignItems: 'center', justifyContent: 'center', ...continuous }}>
          <Icon name={icon} size={17} color="#fff" weight="semibold" />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="body" tone={destructive ? 'danger' : 'primary'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" tone="secondary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="body" tone="secondary" numberOfLines={1} style={{ maxWidth: '45%' }}>
          {value}
        </Text>
      ) : null}
      {right}
      {acc === 'chevron' ? <Icon name="chevron-forward" size={15} color={t.colors.labelTertiary} weight="semibold" /> : null}
      {acc === 'check' ? <Icon name="checkmark" size={18} color={t.colors.accent} weight="semibold" /> : null}
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}>{content}</View>;
  return (
    <PressableScale
      onPress={onPress}
      scaleOnPress={false}
      accessibilityLabel={[title, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint ?? subtitle}
      accessibilityState={acc === 'check' ? { selected: true } : undefined}
    >
      {content}
    </PressableScale>
  );
}

export function ListSwitchRow({ title, subtitle, icon, iconColor, value, onValueChange, disabled }: { title: string; subtitle?: string; icon?: IoniconName; iconColor?: string; value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean }) {
  const t = useTokens();
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      accessory="none"
      right={
        <Switch
          accessibilityLabel={title}
          accessibilityHint={subtitle}
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ true: Platform.OS === 'ios' ? t.colors.success : t.colors.accent, false: t.colors.surfaceSecondary }}
          thumbColor={Platform.OS === 'android' ? (value ? '#fff' : t.colors.labelTertiary) : undefined}
          ios_backgroundColor={t.colors.surfaceSecondary}
        />
      }
    />
  );
}
