import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius } from '../ui/tokens';

type WaveformState = 'idle' | 'listening' | 'processing' | 'speaking';

interface WaveformProps {
  isActive: boolean;
  state: WaveformState;
}

const BAR_COUNT = 6;
const BAR_WIDTH = 5;
const BAR_MAX_HEIGHT = 56;
const BAR_MIN_HEIGHT = 4;
const BAR_GAP = 7;
const ACCENT_COLOR = Colors.dark.accent; // #8C7E6F — same in both schemes

// Per-bar config: base delays and target heights so bars feel organic
const BAR_CONFIGS: Array<{ listeningDelay: number; speakingDelay: number }> = [
  { listeningDelay: 0, speakingDelay: 0 },
  { listeningDelay: 120, speakingDelay: 60 },
  { listeningDelay: 60, speakingDelay: 140 },
  { listeningDelay: 200, speakingDelay: 30 },
  { listeningDelay: 90, speakingDelay: 110 },
  { listeningDelay: 150, speakingDelay: 80 },
];

// Deterministic pseudo-random heights per bar so they feel varied but stable
const LISTENING_HEIGHTS = [0.55, 0.85, 0.45, 1.0, 0.65, 0.75];
const SPEAKING_HEIGHTS = [0.75, 1.0, 0.6, 0.95, 0.85, 0.7];

function AnimatedBar({
  index,
  isActive,
  state,
}: {
  index: number;
  isActive: boolean;
  state: WaveformState;
}) {
  const height = useSharedValue(BAR_MIN_HEIGHT);
  const config = BAR_CONFIGS[index];

  useEffect(() => {
    cancelAnimation(height);

    if (!isActive || state === 'idle') {
      height.value = withTiming(BAR_MIN_HEIGHT, { duration: 300, easing: Easing.out(Easing.quad) });
      return;
    }

    if (state === 'listening') {
      const targetH = BAR_MIN_HEIGHT + (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT) * LISTENING_HEIGHTS[index];
      height.value = withDelay(
        config.listeningDelay,
        withRepeat(
          withTiming(targetH, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      );
    }

    if (state === 'processing') {
      // All bars pulse together in a slow, breathing sync
      const targetH = BAR_MIN_HEIGHT + (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT) * 0.6;
      height.value = withDelay(
        index * 40,
        withRepeat(
          withTiming(targetH, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          -1,
          true,
        ),
      );
    }

    if (state === 'speaking') {
      const targetH = BAR_MIN_HEIGHT + (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT) * SPEAKING_HEIGHTS[index];
      height.value = withDelay(
        config.speakingDelay,
        withRepeat(
          withTiming(targetH, { duration: 260, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      );
    }
  }, [isActive, state]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
}

export default function Waveform({ isActive, state }: WaveformProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <AnimatedBar key={i} index={i} isActive={isActive} state={state} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_MAX_HEIGHT + Spacing.sm,
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: Radius.full,
    backgroundColor: ACCENT_COLOR,
    minHeight: BAR_MIN_HEIGHT,
  },
});
