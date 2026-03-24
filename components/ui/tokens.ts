import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary accent — sage green
    accent: '#4B6456',
    accentSecondary: '#8AA495',
    // Surface hierarchy — "Paper on Paper"
    background: '#FCF9F2',            // base canvas
    surface: '#F6F3EC',               // content blocks
    surfaceContainer: '#F0EDE6',      // grouped sections
    surfaceContainerHigh: '#EAE7E0',  // interactive cards
    surfaceContainerHighest: '#E5E2DB', // primary action cards
    surfaceElevated: '#FFFFFF',       // lifted / nesting
    // User message bubble
    userBubble: '#EAE7E0',
    // Text
    textPrimary: '#1C1C18',           // on-surface (warm near-black)
    textSecondary: '#4A5E52',
    textTertiary: '#8A9A8E',
    // Verse chips
    verseChipBorder: '#C8B89A',
    verseChipFill: '#F6F3EC',
    // Input chips
    chipBackground: '#E5E2DB',
    // Tonal border (ghost — 15% opacity applied at usage site)
    border: '#C8C4BC',
    // Send button
    sendButton: '#4B6456',
    // States
    success: '#8AA495',
    warning: '#B58D67',
    error: '#B5716D',
    locked: '#8A9A8E',
    // Prayer / overlay tint
    prayerTint: '#FAF8F3',
  },
  dark: {
    accent: '#8AA495',
    accentSecondary: '#B58D67',
    background: '#141C18',
    surface: '#1C2820',
    surfaceContainer: '#223028',
    surfaceContainerHigh: '#2A3830',
    surfaceContainerHighest: '#324038',
    surfaceElevated: '#243028',
    userBubble: '#2A3830',
    textPrimary: '#F0EDE6',
    textSecondary: '#8A9A8E',
    textTertiary: '#4A5E52',
    verseChipBorder: '#344238',
    verseChipFill: '#1C2820',
    chipBackground: '#2A3830',
    border: '#2E3C34',
    sendButton: '#F0EDE6',
    success: '#8AA495',
    warning: '#B58D67',
    error: '#B5716D',
    locked: '#4A5E52',
    prayerTint: '#0E1410',
  },
};

export const Typography = {
  // Plus Jakarta Sans (body/UI) + Noto Serif (display/scripture)
  fontFamily: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    serif: 'NotoSerif_400Regular',
    serifMedium: 'NotoSerif_500Medium',
    serifSemiBold: 'NotoSerif_600SemiBold',
    serifBold: 'NotoSerif_700Bold',
    serifItalic: 'NotoSerif_400Regular_Italic',
    serifBoldItalic: 'NotoSerif_700Bold_Italic',
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
    shadowColor: '#1C1C18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1C18',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 32,
    elevation: 4,
  },
};
