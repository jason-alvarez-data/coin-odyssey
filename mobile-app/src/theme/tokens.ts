// Coin Odyssey Mobile — design tokens
// Hex values converted from the oklch source in the design bundle.
// Source: .design-extract/coin-odyssey/project/styles.css

export const palette = {
  // Surfaces (warm near-black, editorial)
  bg:   '#0f0b09',
  bg2:  '#1b1613',
  bg3:  '#251f1b',
  bg4:  '#312a24',
  line:  'rgba(255, 255, 255, 0.08)',
  line2: 'rgba(255, 255, 255, 0.04)',

  // Text
  fg:  '#f7f5f1',
  fg2: '#bbb7b0',
  fg3: '#7f7973',
  fg4: '#514c46',

  // Accent — warm gold
  gold:     '#e7b551',
  goldDeep: '#ae7c00',
  goldDim:  '#6b5018',
  goldFg:   '#100c0a',

  // Confidence
  cHigh: '#69c27e',
  cMed:  '#eab444',
  cLow:  '#f0834e',
  cNone: '#75716b',

  // Disc gradients
  goldCoinHi:  '#5d4a24',
  goldCoinMid: '#332710',
  goldCoinLo:  '#1c1508',
  silverHi:    '#6c7378',
  silverMid:   '#363b3f',
  silverLo:    '#1e2225',
  copperHi:    '#924d35',
  copperMid:   '#502515',
  copperLo:    '#2d1107',

  // Camera viewfinder gradient
  viewfinderHi: '#2e2722',
  viewfinderLo: '#0c0806',

  // Scan CTA gradient
  ctaTopWarm: '#3d2a02',
  ctaBotWarm: '#1b150b',
  ctaBorder:  'rgba(93, 67, 4, 0.6)',

  // Disclaimer card
  warnBorder: 'rgba(125, 70, 11, 0.6)',
  warnBg:     'rgba(59, 34, 13, 0.4)',

  // Chip / pill highlights
  chipActiveBg:    'rgba(61, 42, 2, 0.4)',
  rowSelectedBg:   'rgba(46, 38, 24, 0.3)',
  mapBg:           '#1a1511',
  mapBgWarmInner:  '#28231c',

  // Pin / disc accents
  goldRing:     '#48381a',
  pinDotBright: '#fff0d4',
} as const;

export const spacing = {
  pad:   16,
  padLg: 20,
  gap:   14,
  gapSm: 10,
  xs:    4,
  sm:    8,
  md:    12,
} as const;

export const radius = {
  sm:   10,
  base: 14,
  lg:   20,
  pill: 999,
} as const;

export const fontSize = {
  display:   30,
  displayLg: 52,
  displayMd: 28,
  displaySm: 22,
  body:      14,
  bodyLg:    15,
  bodyMd:    13,
  small:     12,
  micro:     11,
  eyebrow:   10.5,
  tiny:      9.5,
} as const;

export const fontFamily = {
  display: 'Newsreader_400Regular',
  displayMedium: 'Newsreader_500Medium',
  ui:      'DMSans_400Regular',
  uiMedium:'DMSans_500Medium',
  uiSemibold: 'DMSans_600SemiBold',
  mono:    'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const letterSpacing = {
  tight:    -0.6,   // display
  body:     0,
  mono:     0.06,
  monoWide: 0.14,
  eyebrow:  0.14,
} as const;

export type Palette = typeof palette;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
