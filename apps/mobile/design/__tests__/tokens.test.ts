import ioniconGlyphs from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json';
import { palettes, type Palette } from '../tokens';
import { SF_SYMBOL_MAP } from '../Icon';

// The icon font loader needs native asset modules; only the glyph names matter here.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

type RGBA = [number, number, number, number];

function parse(color: string): RGBA {
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgba = color.match(/^rgba?\(([^)]+)\)$/);
  if (!rgba) throw new Error(`Unparseable colour ${color}`);
  const [r, g, b, a = '1'] = rgba[1].split(',').map((s) => s.trim());
  return [Number(r), Number(g), Number(b), Number(a)];
}

/** Composite a translucent colour over an opaque background. */
function over(fg: RGBA, bg: RGBA): RGBA {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
}

function luminance([r, g, b]: RGBA) {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function contrast(fgColor: string, bgColor: string, base: string): number {
  const bg = over(parse(bgColor), parse(base));
  const fg = over(parse(fgColor), bg);
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Text/background pairs used by the kit, with the WCAG level each must meet. */
const PAIRS: [keyof Palette, keyof Palette, number][] = [
  ['label', 'background', 4.5],
  ['label', 'surface', 4.5],
  ['labelSecondary', 'surface', 4.5],
  ['labelSecondary', 'background', 4.5],
  ['accent', 'surface', 4.5],
  ['accent', 'background', 4.5],
  ['accent', 'accentSoft', 4.5],
  ['onAccent', 'accent', 4.5],
  ['onAccent', 'danger', 4.5],
  ['danger', 'surface', 4.5],
  ['danger', 'dangerSoft', 4.5],
  ['success', 'successSoft', 4.5],
  ['warning', 'warningSoft', 4.5],
  ['warning', 'surface', 4.5],
  // Placeholders/disabled text are exempt from 4.5:1 but must stay legible.
  ['labelTertiary', 'surface', 2.4],
];

describe('design tokens', () => {
  for (const scheme of ['light', 'dark'] as const) {
    it(`meets WCAG contrast targets in ${scheme} mode`, () => {
      const p = palettes[scheme];
      const failures = PAIRS.map(([fg, bg, min]) => ({ fg, bg, min, ratio: contrast(p[fg], p[bg], p.surface) })).filter((r) => r.ratio < r.min);
      expect(failures).toEqual([]);
    });
  }

  it('has an Ionicons fallback for every SF Symbol mapping', () => {
    const missing = Object.keys(SF_SYMBOL_MAP).filter((name) => !(name in ioniconGlyphs));
    expect(missing).toEqual([]);
  });
});
