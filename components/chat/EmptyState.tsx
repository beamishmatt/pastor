import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors, Typography, Spacing } from '../ui/tokens';

interface EmptyStateProps {
  onPromptSelect: (prompt: string) => void;
  onVersePress: (reference: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = () => {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.wordmark, { color: colors.textPrimary }]}>Pastor</Text>
      <Text style={[styles.tagline, { color: colors.textSecondary }]}>
        Your AI Bible companion
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  wordmark: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.size['3xl'],
    lineHeight: Typography.size['3xl'] * Typography.lineHeight.tight,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
  },
});

export default EmptyState;
