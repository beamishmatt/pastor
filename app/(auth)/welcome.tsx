import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../components/ui/tokens';


export default function WelcomeScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Full-screen hero image */}
      <ImageBackground
        source={require('../../assets/images/plan-heroes/onboarding01.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Gradient fade: transparent → cream across bottom half */}
      <LinearGradient
        colors={['transparent', 'rgba(252,249,242,0.55)', 'rgba(252,249,242,0.92)', colors.background]}
        locations={[0.3, 0.55, 0.75, 0.92]}
        style={StyleSheet.absoluteFill}
      />

      {/* Wordmark — top of screen */}
      <View style={[styles.wordmarkContainer, { paddingTop: insets.top + Spacing.lg }]}>
        <Text style={styles.wordmark}>Pastor</Text>
      </View>

      {/* Bottom content */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.copy}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Walk deeper{'\n'}into the Word.
          </Text>
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            A personal guide through Scripture—{'\n'}grounded in truth, shaped by your journey.
          </Text>
        </View>

        <View style={styles.ctas}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/carousel')}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="link"
            accessibilityLabel="Sign in to existing account"
          >
            <Text style={[styles.signInText, { color: colors.textSecondary }]}>
              SIGN IN
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  wordmarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: Typography.fontFamily.serifItalic,
    fontSize: Typography.size['2xl'],
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.xl,
    gap: Spacing['2xl'],
  },
  copy: {
    gap: Spacing.base,
  },
  headline: {
    fontFamily: Typography.fontFamily.serifBold,
    fontSize: 38,
    lineHeight: 38 * 1.18,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    lineHeight: Typography.size.md * 1.55,
    textAlign: 'center',
  },
  ctas: {
    gap: Spacing.base,
  },
  primaryButton: {
    borderRadius: Radius.full,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  signInText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    letterSpacing: 1.5,
  },
});
