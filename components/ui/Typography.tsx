import React from 'react';
import { Text, TextProps, StyleSheet, useColorScheme } from 'react-native';
import { Typography as T, Colors } from './tokens';

interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'scripture';
  size?: keyof typeof T.size;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  serif?: boolean;
}

export function ThemedText({
  variant = 'primary',
  size = 'base',
  weight = 'regular',
  serif = false,
  style,
  ...props
}: ThemedTextProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const colorMap = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    scripture: colors.textPrimary,
  };

  const fontFamilyMap = {
    regular: serif ? T.fontFamily.serif : T.fontFamily.regular,
    medium: serif ? T.fontFamily.serifMedium : T.fontFamily.medium,
    semibold: T.fontFamily.semibold,
    bold: T.fontFamily.bold,
  };

  return (
    <Text
      style={[
        {
          color: colorMap[variant],
          fontSize: T.size[size],
          fontFamily: fontFamilyMap[weight],
          lineHeight: T.size[size] * (serif ? T.lineHeight.scripture : T.lineHeight.normal),
        },
        style,
      ]}
      {...props}
    />
  );
}
