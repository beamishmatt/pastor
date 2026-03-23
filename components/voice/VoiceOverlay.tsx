import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Waveform from './Waveform';
import { Colors, Typography as T, Spacing, Radius } from '../ui/tokens';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  state: VoiceState;
  transcript?: string;
  onInterrupt: () => void;
}

const STATE_LABELS: Record<VoiceState, string> = {
  idle: 'Ready...',
  listening: 'Pastor is listening...',
  processing: 'Pastor is thinking...',
  speaking: 'Pastor is speaking...',
};

const DARK_BG = '#1A1A18';
const SWIPE_DOWN_THRESHOLD = 80;

export default function VoiceOverlay({
  isVisible,
  onClose,
  state,
  transcript,
  onInterrupt,
}: VoiceOverlayProps) {
  const dragY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 8,
      onPanResponderMove: (_, gestureState) => {
        dragY.current = gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SWIPE_DOWN_THRESHOLD) {
          onClose();
        }
        dragY.current = 0;
      },
    }),
  ).current;

  const isActive = state !== 'idle';

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container} {...panResponder.panHandlers}>
          {/* Close button */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close voice mode"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Swipe hint */}
          <View style={styles.swipeHandle} />

          {/* Center content */}
          <View style={styles.centerContent}>
            <Waveform isActive={isActive} state={state} />

            <Text style={styles.stateLabel}>{STATE_LABELS[state]}</Text>

            {!!transcript && (
              <Text style={styles.transcript} numberOfLines={4}>
                {transcript}
              </Text>
            )}
          </View>

          {/* Bottom area */}
          <View style={styles.footer}>
            {state === 'speaking' && (
              <TouchableOpacity
                onPress={onInterrupt}
                style={styles.interruptButton}
                accessibilityLabel="Interrupt Pastor"
                accessibilityRole="button"
              >
                <Text style={styles.interruptText}>Tap to interrupt</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
    paddingHorizontal: Spacing.xl,
  },
  swipeHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.dark.border,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + Spacing.sm : Spacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: Colors.dark.textPrimary,
    fontSize: T.size.sm,
    fontFamily: T.fontFamily.medium,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  stateLabel: {
    color: Colors.dark.textPrimary,
    fontSize: T.size.md,
    fontFamily: T.fontFamily.medium,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  transcript: {
    color: Colors.dark.textSecondary,
    fontSize: T.size.base,
    fontFamily: T.fontFamily.regular,
    textAlign: 'center',
    lineHeight: T.size.base * T.lineHeight.relaxed,
    maxWidth: 300,
    paddingHorizontal: Spacing.base,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Spacing['2xl'],
    minHeight: 60,
  },
  interruptButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  interruptText: {
    color: Colors.dark.textSecondary,
    fontSize: T.size.sm,
    fontFamily: T.fontFamily.regular,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
