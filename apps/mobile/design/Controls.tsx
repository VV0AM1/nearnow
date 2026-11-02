import React, { useState } from 'react';
import { Pressable, TextInput, View, type LayoutChangeEvent, type TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { PressableScale } from './Pressable';
import { Text } from './Text';
import { Icon, type IoniconName } from './Icon';
import { useTokens } from './theme';
import { continuous } from './tokens';

/** iOS segmented control with an animated thumb (cross-fade when Reduce Motion is on). */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; accessibilityLabel: string }) {
  const t = useTokens();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width / options.length;
  const thumb = useAnimatedStyle(() => ({
    width: Math.max(0, segment - 4),
    transform: [{ translateX: t.reduceMotion ? withTiming(index * segment, { duration: 0 }) : withSpring(index * segment, t.motion.spring.snappy) }],
  }));
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', backgroundColor: t.colors.surfaceSecondary, borderRadius: t.radius.sm, padding: 2, minHeight: 36, ...continuous }}
    >
      {width > 0 ? (
        <Animated.View
          style={[
            { position: 'absolute', top: 2, bottom: 2, left: 2, borderRadius: t.radius.sm - 2, backgroundColor: t.dark ? t.colors.surfaceElevated : t.colors.surface, ...continuous },
            thumb,
          ]}
        />
      ) : null}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, minHeight: 32 }}
          >
            <Text variant="subheadline" weight={selected ? '600' : '500'} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Filter chip. Selection is shown by fill and a check mark, never colour alone. */
export function Chip({ label, selected, onPress, color, icon }: { label: string; selected: boolean; onPress: () => void; color?: string; icon?: IoniconName }) {
  const t = useTokens();
  // Selected chips always use the accent (contrast-tested); a custom colour only tints the icon.
  const iconTint = color ?? t.colors.accent;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={{
        minHeight: 34,
        paddingHorizontal: t.space.md,
        borderRadius: t.radius.pill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: selected ? t.colors.accent : t.colors.surface,
        borderWidth: selected ? 0 : 1,
        borderColor: t.colors.separator,
      }}
    >
      {selected ? <Icon name="checkmark" size={14} color={t.colors.onAccent} weight="bold" /> : icon ? <Icon name={icon} size={14} color={iconTint} /> : null}
      <Text variant="subheadline" weight="600" style={{ color: selected ? t.colors.onAccent : t.colors.label }}>
        {label}
      </Text>
    </PressableScale>
  );
}

/** Search field in the iOS style: filled, rounded, magnifier, clear button. */
export function SearchField({ value, onChangeText, placeholder, onSubmit }: { value: string; onChangeText: (v: string) => void; placeholder: string; onSubmit?: () => void }) {
  const t = useTokens();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surfaceSecondary, borderRadius: t.radius.sm + 2, paddingHorizontal: t.space.sm, minHeight: 40, gap: 6, ...continuous }}>
      <Icon name="search" size={17} color={t.colors.labelSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.labelTertiary}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCorrect={false}
        style={[t.type.body, { flex: 1, color: t.colors.label, paddingVertical: 8 }]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => onChangeText('')}>
          <Icon name="close-circle" size={17} color={t.colors.labelTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
  max?: number;
  right?: React.ReactNode;
}

/** Labelled text input with counter, hint and an error announced to screen readers. */
export function TextField({ label, error, hint, max, right, value, style, multiline, onFocus, onBlur, ...rest }: TextFieldProps) {
  const t = useTokens();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: t.space.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text variant="subheadline" weight="600">
          {label}
        </Text>
        {max ? (
          <Text variant="footnote" tone={value && value.length > max * 0.9 ? 'warning' : 'tertiary'} accessibilityElementsHidden>
            {value?.length ?? 0}/{max}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.sm + 2,
          borderWidth: focused || error ? 1.5 : 1,
          borderColor: error ? t.colors.danger : focused ? t.colors.accent : t.colors.separator,
          ...continuous,
        }}
      >
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={hint}
          placeholderTextColor={t.colors.labelTertiary}
          value={value}
          maxLength={max}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[t.type.body, { flex: 1, minHeight: t.minTouch + 4, paddingHorizontal: t.space.md, paddingVertical: t.space.md, color: t.colors.label }, multiline ? { minHeight: 110, textAlignVertical: 'top' } : null, style]}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center' }}>
          <Icon name="alert-circle" size={14} color={t.colors.danger} />
          <Text variant="footnote" tone="danger" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="footnote" tone="secondary" style={{ marginTop: 6 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
