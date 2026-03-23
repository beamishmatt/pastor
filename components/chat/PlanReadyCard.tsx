import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../ui/tokens';
import type { GeneratedPlan } from '../../hooks/useConversation';

interface PlanReadyCardProps {
  plan: GeneratedPlan | null;
  isGenerating: boolean;
  onViewPlan: (slug: string) => void;
  onDismiss: () => void;
}

const PlanReadyCard: React.FC<PlanReadyCardProps> = ({
  plan,
  isGenerating,
  onViewPlan,
  onDismiss,
}) => {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  const isVisible = isGenerating || !!plan;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(8);
    }
  }, [isVisible, opacity, translateY]);

  if (!isVisible) return null;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {isGenerating ? (
          <View style={styles.generatingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.generatingText, { color: colors.textSecondary }]}>
              Building your reading plan…
            </Text>
          </View>
        ) : plan ? (
          <View style={styles.planRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accent + '20' }]}>
              <Feather name="book-open" size={15} color={colors.accent} />
            </View>

            <View style={styles.textBlock}>
              <Text style={[styles.planTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {plan.title}
              </Text>
              <Text style={[styles.planMeta, { color: colors.textTertiary }]}>
                {plan.duration_days}-day plan · saved
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.openButton, { backgroundColor: colors.accent }]}
              onPress={() => onViewPlan(plan.slug)}
              activeOpacity={0.85}
            >
              <Text style={styles.openButtonText}>Open</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.dismissButton}
            >
              <Feather name="x" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  generatingText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  planTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
  },
  planMeta: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
  },
  openButton: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  openButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: '#fff',
  },
  dismissButton: {
    padding: 2,
  },
});

export default PlanReadyCard;
