import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../ui/tokens';

interface VerseChipProps {
  reference: string;
  onPress: (reference: string) => void;
}

const VerseChip: React.FC<VerseChipProps> = ({ reference, onPress }) => {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(reference);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: colors.verseChipFill,
          borderColor: colors.verseChipBorder,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {reference}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    lineHeight: Typography.size.xs * Typography.lineHeight.normal,
  },
});

export default VerseChip;
