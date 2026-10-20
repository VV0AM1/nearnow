import { useMemo } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { palettes, radius, space, type, motion, minTouch, type ColorScheme, type Palette } from './tokens';

export interface Tokens {
  scheme: ColorScheme;
  dark: boolean;
  colors: Palette;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
  motion: typeof motion;
  minTouch: number;
  /** True when the user asked the system to reduce motion. */
  reduceMotion: boolean;
}

/** Design tokens for the active colour scheme. Use this instead of hardcoded values. */
export function useTokens(): Tokens {
  const { activeTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  return useMemo(
    () => ({
      scheme: activeTheme,
      dark: activeTheme === 'dark',
      colors: palettes[activeTheme],
      space,
      radius,
      type,
      motion,
      minTouch,
      reduceMotion,
    }),
    [activeTheme, reduceMotion],
  );
}
