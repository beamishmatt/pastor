import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../components/ui/tokens';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Slide {
  id: string;
  image: ReturnType<typeof require>;
  headline: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    image: require('../../assets/images/plan-heroes/onboarding2b.png'),
    headline: 'Ask anything.\nGet scripture.',
    body: "Grounded in God's Word, each answer is tailored to your journey—connecting Scripture to your life as it unfolds.",
  },
  {
    id: '2',
    image: require('../../assets/images/plan-heroes/onboarding03.png'),
    headline: 'It remembers\nyour journey.',
    body: 'Pastor builds a living picture of your faith—what you explore, what moves you, and what you carry in prayer.',
  },
  {
    id: '3',
    image: require('../../assets/images/plan-heroes/onboarding04.png'),
    headline: 'A space for\nsacred conversation.',
    body: 'Designed for reverent, unhurried dialogue—where Scripture, prayer, and reflection come together.',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_CARD_SIZE = SCREEN_WIDTH - Spacing.xl * 2;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CarouselScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const handleContinue = () => {
    if (isLast) {
      router.push('/(auth)/personalize');
    } else {
      setIndex(index + 1);
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/personalize');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <View style={[styles.inner, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg }]}>
        {/* Hero image card */}
        <View style={styles.imageCard}>
          <Image
            source={slide.image}
            style={styles.image}
            resizeMode="cover"
          />
          {/* Soft vignette: fades edges into card background */}
          <LinearGradient
            colors={['rgba(252,249,242,0.45)', 'transparent', 'transparent', 'rgba(252,249,242,0.55)']}
            locations={[0, 0.18, 0.72, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Overall softening tint */}
          <View style={[StyleSheet.absoluteFill, styles.imageTint]} />
        </View>

        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index
                  ? [styles.dotActive, { backgroundColor: colors.accent }]
                  : [styles.dotInactive, { backgroundColor: colors.accentSecondary, opacity: 0.35 }],
              ]}
            />
          ))}
        </View>

        {/* Copy */}
        <View style={styles.copy}>
          <Text style={[styles.headline, { color: colors.accent }]}>
            {slide.headline}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {slide.body}
          </Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Get started' : 'Continue to next slide'}
          >
            <Text style={styles.continueText}>
              {isLast ? 'Get Started' : 'Continue'}
            </Text>
          </TouchableOpacity>

          {!isLast && (
            <TouchableOpacity
              style={styles.skipLink}
              activeOpacity={0.6}
              onPress={handleSkip}
              accessibilityRole="link"
              accessibilityLabel="Skip onboarding"
            >
              <Text style={[styles.skipText, { color: colors.textTertiary }]}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },

  // Image card
  imageCard: {
    width: IMAGE_CARD_SIZE,
    aspectRatio: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageTint: {
    backgroundColor: 'rgba(252,249,242,0.12)',
  },

  // Dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    borderRadius: Radius.full,
  },
  dotActive: {
    width: 22,
    height: 7,
  },
  dotInactive: {
    width: 7,
    height: 7,
  },

  // Copy
  copy: {
    flex: 1,
    gap: Spacing.base,
  },
  headline: {
    fontFamily: Typography.fontFamily.serifBold,
    fontSize: Typography.size['3xl'],
    lineHeight: Typography.size['3xl'] * 1.2,
    textAlign: 'center',
  },
  body: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    lineHeight: Typography.size.md * 1.6,
    textAlign: 'center',
  },

  // CTAs
  ctas: {
    gap: Spacing.sm,
  },
  continueButton: {
    borderRadius: Radius.lg,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
  },
});
