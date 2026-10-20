import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTokens } from './theme';
import type { TextVariant } from './tokens';

export type TextTone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'danger' | 'success' | 'warning' | 'onAccent';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: '400' | '500' | '600' | '700';
  align?: 'left' | 'center' | 'right';
}

const HEADING_VARIANTS: TextVariant[] = ['largeTitle', 'title1', 'title2', 'title3'];

/**
 * Text with semantic styles. Scales with the system text size (Dynamic Type /
 * Android font scale); very large titles are capped so layouts stay usable.
 */
export function Text({ variant = 'body', tone = 'primary', weight, align, style, maxFontSizeMultiplier, accessibilityRole, ...rest }: TextProps) {
  const t = useTokens();
  const color = {
    primary: t.colors.label,
    secondary: t.colors.labelSecondary,
    tertiary: t.colors.labelTertiary,
    accent: t.colors.accent,
    danger: t.colors.danger,
    success: t.colors.success,
    warning: t.colors.warning,
    onAccent: t.colors.onAccent,
  }[tone];
  const isHeading = HEADING_VARIANTS.includes(variant);
  return (
    <RNText
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (isHeading ? 1.6 : 2.4)}
      accessibilityRole={accessibilityRole ?? (isHeading ? 'header' : undefined)}
      style={[t.type[variant], { color }, weight ? { fontWeight: weight } : null, align ? { textAlign: align } : null, style]}
      {...rest}
    />
  );
}
