import { Platform, type TextStyle } from 'react-native';

/**
 * NearNow design tokens — the single source for colour, type, spacing, shape and
 * motion. iOS follows the Human Interface Guidelines (system grouped backgrounds,
 * text styles, continuous corners); Android follows Material 3 sizing with the same
 * palette, so both platforms feel native while sharing one brand.
 *
 * Brand: the existing NearNow blue, refined. Red is reserved for urgent help.
 */

export type ColorScheme = 'light' | 'dark';

export interface Palette {
  /** Screen background (iOS systemGroupedBackground). */
  background: string;
  /** Cards, list rows, sheets. */
  surface: string;
  /** Inputs, secondary fills, segmented-control tracks. */
  surfaceSecondary: string;
  /** Raised elements on top of surface (menus, popovers). */
  surfaceElevated: string;
  separator: string;
  /** Primary text. */
  label: string;
  /** Supporting text: metadata, captions. */
  labelSecondary: string;
  /** Placeholders and disabled text. */
  labelTertiary: string;
  accent: string;
  /** Text/icons drawn on top of `accent`. */
  onAccent: string;
  /** Tinted backgrounds: selected chips, tinted buttons. */
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  /** Translucent overlays behind sheets and dialogs. */
  scrim: string;
  shadow: string;
}

const light: Palette = {
  background: '#F2F3F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#EBEDF2',
  surfaceElevated: '#FFFFFF',
  separator: 'rgba(60, 60, 67, 0.16)',
  label: '#0B0D12',
  labelSecondary: 'rgba(31, 35, 48, 0.68)',
  labelTertiary: 'rgba(31, 35, 48, 0.42)',
  accent: '#2459E0',
  onAccent: '#FFFFFF',
  accentSoft: 'rgba(36, 89, 224, 0.12)',
  danger: '#C4231A',
  dangerSoft: 'rgba(196, 35, 26, 0.10)',
  success: '#167A3E',
  successSoft: 'rgba(22, 122, 62, 0.12)',
  warning: '#965100',
  warningSoft: 'rgba(150, 81, 0, 0.12)',
  scrim: 'rgba(8, 10, 15, 0.42)',
  shadow: '#0B0D12',
};

const dark: Palette = {
  background: '#000000',
  surface: '#16171B',
  surfaceSecondary: '#24262C',
  surfaceElevated: '#2A2C33',
  separator: 'rgba(235, 235, 245, 0.14)',
  label: '#F5F6F8',
  labelSecondary: 'rgba(235, 237, 245, 0.68)',
  labelTertiary: 'rgba(235, 237, 245, 0.40)',
  accent: '#5B8CFF',
  onAccent: '#04122E',
  accentSoft: 'rgba(91, 140, 255, 0.14)',
  danger: '#FF5B4F',
  dangerSoft: 'rgba(255, 91, 79, 0.16)',
  success: '#3DD27A',
  successSoft: 'rgba(61, 210, 122, 0.16)',
  warning: '#FFB547',
  warningSoft: 'rgba(255, 181, 71, 0.16)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};

export const palettes: Record<ColorScheme, Palette> = { light, dark };

/** 4-pt spacing grid. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/** Corner radii. On iOS these render as continuous ("squircle") corners. */
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Minimum touch target (Apple 44 pt, Material 48 dp). */
export const minTouch = Platform.OS === 'ios' ? 44 : 48;

export type TextVariant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption1'
  | 'caption2';

type TypeSpec = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'>;

/** iOS Human Interface Guidelines text styles (default "Large" content size). */
const iosType: Record<TextVariant, TypeSpec> = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.37 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0.36 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0.35 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: 0.38 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.41 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.41 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.32 },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.24 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.08 },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0 },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '400', letterSpacing: 0.07 },
};

/** Material 3 type scale mapped onto the same semantic names. */
const androidType: Record<TextVariant, TypeSpec> = {
  largeTitle: { fontSize: 32, lineHeight: 40, fontWeight: '500', letterSpacing: 0 },
  title1: { fontSize: 28, lineHeight: 36, fontWeight: '500', letterSpacing: 0 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '500', letterSpacing: 0 },
  title3: { fontSize: 18, lineHeight: 24, fontWeight: '500', letterSpacing: 0 },
  headline: { fontSize: 16, lineHeight: 24, fontWeight: '600', letterSpacing: 0.15 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0.5 },
  callout: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: 0.25 },
  subheadline: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0.25 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0.25 },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.4 },
  caption2: { fontSize: 11, lineHeight: 16, fontWeight: '500', letterSpacing: 0.5 },
};

export const type: Record<TextVariant, TypeSpec> = Platform.OS === 'ios' ? iosType : androidType;

/**
 * Motion. Springs for anything the user moves or presses; short timings for fades.
 * Always gate movement with Reanimated's useReducedMotion().
 */
export const motion = {
  spring: {
    /** Press feedback, toggles. */
    snappy: { damping: 22, stiffness: 380, mass: 0.6 },
    /** Sheets, cards entering. */
    gentle: { damping: 26, stiffness: 220, mass: 0.9 },
  },
  duration: { fast: 140, normal: 220, slow: 320 },
  /** Scale applied to pressed buttons and cards. */
  pressScale: 0.97,
} as const;

/** Subtle depth; iOS uses soft shadows, Android uses elevation. */
export function elevation(level: 0 | 1 | 2, scheme: ColorScheme) {
  if (level === 0) return {};
  const p = palettes[scheme];
  return Platform.select({
    ios: {
      shadowColor: p.shadow,
      shadowOpacity: scheme === 'dark' ? 0.5 : level === 1 ? 0.06 : 0.12,
      shadowRadius: level === 1 ? 6 : 16,
      shadowOffset: { width: 0, height: level === 1 ? 2 : 8 },
    },
    default: { elevation: level === 1 ? 1 : 4 },
  });
}

/** Continuous corner curvature on iOS (no-op elsewhere). */
export const continuous = Platform.OS === 'ios' ? ({ borderCurve: 'continuous' } as const) : {};
