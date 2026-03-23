import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../components/ui/tokens';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface Slide {
  id: string;
  icon: FeatherIconName;
  headline: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'message-circle',
    headline: 'Ask anything. Get scripture.',
    body:
      'Every answer is grounded in God\'s Word. Ask your deepest questions and receive responses rooted in the Bible, with verses you can read in full.',
  },
  {
    id: '2',
    icon: 'heart',
    headline: 'It remembers your journey.',
    body:
      'Pastor builds a living knowledge graph of your faith walk — the themes you explore, the passages that move you, and the prayers on your heart.',
  },
  {
    id: '3',
    icon: 'sun',
    headline: 'Pray together.',
    body:
      'This is not ChatGPT with a Bible. Pastor is designed for sacred conversation — a quiet, reverent space for prayer, reflection, and growth.',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AUTO_ADVANCE_INTERVAL = 4000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CarouselScreen() {
  const colors = Colors.light;
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const userSwipedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start / restart auto-advance
  const startAutoAdvance = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev < SLIDES.length - 1 ? prev + 1 : 0;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_INTERVAL);
  }, []);

  useEffect(() => {
    startAutoAdvance();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoAdvance]);

  // Viewability callback — updates active dot
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Pause auto-advance while user is swiping, restart when they lift
  const handleScrollBeginDrag = useCallback(() => {
    userSwipedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    userSwipedRef.current = false;
    startAutoAdvance();
  }, [startAutoAdvance]);

  // Render each slide
  const renderSlide = useCallback(
    ({ item }: { item: Slide }) => (
      <View style={styles.slide}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <Feather name={item.icon} size={40} color={colors.accent} />
        </View>
        <Text style={[styles.headline, { color: colors.textPrimary }]}>
          {item.headline}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {item.body}
        </Text>
      </View>
    ),
    [colors]
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
      />

      {/* Dot indicators */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex
                ? [styles.dotActive, { backgroundColor: colors.accent }]
                : [styles.dotInactive, { borderColor: colors.accent }],
            ]}
          />
        ))}
      </View>

      {/* Continue CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.textPrimary }]}
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/personalize')}
          accessibilityRole="button"
          accessibilityLabel="Continue to personalization"
        >
          <Text style={[styles.continueButtonText, { color: colors.background }]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    // no extra styles needed — pagingEnabled handles widths
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  headline: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.size['2xl'],
    lineHeight: Typography.size['2xl'] * 1.25,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  body: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    lineHeight: Typography.size.md * 1.6,
    textAlign: 'center',
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  dot: {
    borderRadius: Radius.full,
  },
  dotActive: {
    width: 20,
    height: 7,
    borderRadius: Radius.full,
  },
  dotInactive: {
    width: 7,
    height: 7,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  continueButton: {
    borderRadius: Radius.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    letterSpacing: 0.3,
  },
});
