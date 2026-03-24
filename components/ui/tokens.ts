import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Accents — sage/earth palette
    accent: '#728C7D',          // primary sage green
    accentSecondary: '#B58D67', // tertiary warm brown
    // Backgrounds
    background: '#F4F1EA',      // neutral warm off-white
    surface: '#EAE6DC',         // slightly deeper neutral
    surfaceElevated: '#FFFFFF',
    // User message bubble
    userBubble: '#E3DDD2',      // neutral tint
    // Text
    textPrimary: '#1E2A22',     // very dark forest green
    textSecondary: '#4A5E52',   // mid sage
    textTertiary: '#8A9E92',    // light sage-gray
    // Verse chips
    verseChipBorder: '#C4A882', // muted warm brown
    verseChipFill: '#F0E8DC',   // light tertiary tint
    // Input chips (scope, mode)
    chipBackground: '#DDD8CE',  // warm neutral chip
    // Borders
    border: '#D8D3C8',          // warm neutral border
    // Send button
    sendButton: '#728C7D',      // primary sage
    // States
    success: '#A4B494',         // secondary sage
    warning: '#B58D67',         // tertiary warm brown
    error: '#B5716D',
    // Lock state
    locked: '#8A9E92',
    // Prayer mode tint
    prayerTint: '#FAF8F3',
  },
  dark: {
    accent: '#A4B494',          // secondary sage on dark
    accentSecondary: '#B58D67', // warm brown accent
    background: '#141C18',      // very dark forest
    surface: '#1C2820',
    surfaceElevated: '#243028',
    userBubble: '#243028',
    textPrimary: '#F4F1EA',     // neutral warm off-white
    textSecondary: '#8A9E92',
    textTertiary: '#4A5E52',
    verseChipBorder: '#344238',
    verseChipFill: '#1C2820',
    // Input chips (scope, mode)
    chipBackground: '#2A3830',
    border: '#2E3C34',
    sendButton: '#F4F1EA',
    success: '#A4B494',
    warning: '#B58D67',
    error: '#B5716D',
    locked: '#4A5E52',
    prayerTint: '#0E1410',
  },
};

export const Typography = {
  // SF Pro weights (system font)
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    semibold: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
    // New York serif for scripture display
    serif: Platform.OS === 'ios' ? 'NewYorkSmall-Regular' : 'serif',
    serifMedium: Platform.OS === 'ios' ? 'NewYorkSmall-Medium' : 'serif',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
    scripture: 1.8,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};
