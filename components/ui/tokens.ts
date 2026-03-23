import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Accents
    accent: '#8C7E6F',          // warm stone
    accentSecondary: '#9CAF94', // soft sage
    // Backgrounds
    background: '#FAFAF8',
    surface: '#F2F0EC',
    surfaceElevated: '#FFFFFF',
    // User message bubble
    userBubble: '#EDEAE5',
    // Text
    textPrimary: '#2C2A26',
    textSecondary: '#7A756D',
    textTertiary: '#ADA69D',
    // Verse chips
    verseChipBorder: '#C4BAB0',
    verseChipFill: '#F5F2EE',
    // Input chips (scope, mode)
    chipBackground: '#D9D2CB',
    // Borders
    border: '#E8E4DE',
    // Send button
    sendButton: '#2C2A26',
    // States
    success: '#7A9E6F',
    warning: '#C4A265',
    error: '#B5716D',
    // Lock state
    locked: '#ADA69D',
    // Prayer mode tint
    prayerTint: '#FAF6F0',
  },
  dark: {
    accent: '#8C7E6F',
    accentSecondary: '#9CAF94',
    background: '#1A1A18',
    surface: '#242422',
    surfaceElevated: '#2E2C28',
    userBubble: '#2E2C28',
    textPrimary: '#E8E5E0',
    textSecondary: '#9B958C',
    textTertiary: '#5E5A54',
    verseChipBorder: '#4A4540',
    verseChipFill: '#2E2C28',
    // Input chips (scope, mode)
    chipBackground: '#3C3934',
    border: '#333330',
    sendButton: '#E8E5E0',
    success: '#7A9E6F',
    warning: '#C4A265',
    error: '#B5716D',
    locked: '#5E5A54',
    prayerTint: '#1E1C16',
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
