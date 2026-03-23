import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../components/ui/tokens';

export default function WelcomeScreen() {
  const colors = Colors.light;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.container}>
        {/* Top third — logo area */}
        <View style={styles.logoSection}>
          {/* Cross-like icon composed from two overlapping bars */}
          <View style={styles.crossContainer}>
            <View style={[styles.crossVertical, { backgroundColor: colors.accent }]} />
            <View style={[styles.crossHorizontal, { backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.wordmark, { color: colors.textPrimary }]}>PASTOR</Text>
        </View>

        {/* Copy */}
        <View style={styles.copySection}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Your personal guide through scripture.
          </Text>
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            Grounded in the Bible. Remembers your journey.
          </Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.textPrimary }]}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/carousel')}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Text style={[styles.primaryButtonText, { color: colors.background }]}>
              Get started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="link"
            accessibilityLabel="Sign in to existing account"
          >
            <Text style={[styles.signInText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium }}>
                Sign in
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    justifyContent: 'space-between',
  },

  // Logo section — occupies roughly the top third
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: '38%',
  },
  crossContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  crossVertical: {
    position: 'absolute',
    width: 6,
    height: 52,
    borderRadius: 3,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 36,
    height: 6,
    borderRadius: 3,
    top: 14,
  },
  wordmark: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.size['2xl'],
    letterSpacing: 6,
  },

  // Copy section — headline + subtext
  copySection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  headline: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.size['3xl'],
    lineHeight: Typography.size['3xl'] * 1.25,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  subtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    lineHeight: Typography.size.md * 1.5,
    textAlign: 'center',
  },

  // CTA section
  ctaSection: {
    paddingBottom: Spacing.base,
    gap: Spacing.base,
  },
  primaryButton: {
    borderRadius: Radius.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    letterSpacing: 0.3,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  signInText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
  },
});
