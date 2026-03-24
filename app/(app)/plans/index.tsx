import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../components/ui/tokens';
import { useSubscription } from '../../../hooks/useSubscription';
import { useReadingPlans, ReadingPlan, PlanEnrollment } from '../../../hooks/useReadingPlans';
import { supabase } from '../../../lib/supabase';

// ─── Sub-components ─────────────────────────────────────────────────────────

function ProgressBar({ progress, color, trackColor }: {
  progress: number;
  color: string;
  trackColor: string;
}) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View
        style={[
          styles.progressFill,
          { backgroundColor: color, width: `${Math.min(100, Math.max(0, progress * 100))}%` },
        ]}
      />
    </View>
  );
}


function ActivePlanCard({
  plan,
  enrollment,
  progress,
  colors,
  onPress,
}: {
  plan: ReadingPlan;
  enrollment: PlanEnrollment;
  progress: number;
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  const pct = Math.round(Math.min(100, Math.max(0, progress * 100)));
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.activeCard,
        { backgroundColor: colors.surfaceElevated, ...Shadow.sm },
      ]}
    >
      <View style={styles.activeCardContent}>
        <Text style={[styles.activeCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {plan.title}
        </Text>
        <Text style={[styles.activeCardSubtitle, { color: colors.textSecondary }]}>
          {plan.duration_days} Days
        </Text>
        <View style={styles.activeCardStats}>
          <Text style={[styles.activeCardStatText, { color: colors.textSecondary }]}>
            Day {enrollment.current_day} of {plan.duration_days}
          </Text>
          <Text style={[styles.activeCardStatText, { color: colors.textSecondary }]}>
            {pct}% Complete
          </Text>
        </View>
        <ProgressBar progress={progress} color={colors.accent} trackColor={colors.border} />
        <View style={[styles.continueButton, { backgroundColor: colors.accent }]}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function PlanListCard({
  plan,
  isPro,
  enrollment,
  progress,
  colors,
  onPress,
}: {
  plan: ReadingPlan;
  isPro: boolean;
  enrollment: PlanEnrollment | null;
  progress: number;
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  const isLocked = plan.is_pro && !isPro;
  const hasStarted = enrollment != null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.planCard,
        { backgroundColor: colors.surfaceElevated, ...Shadow.sm },
      ]}
    >
      {isLocked && (
        <View style={[styles.lockBadge, { backgroundColor: colors.surfaceContainerHighest }]}>
          <Text style={[styles.lockIcon, { color: colors.locked }]}>🔒</Text>
          <Text style={[styles.lockLabel, { color: colors.locked }]}>Pro</Text>
        </View>
      )}
      <View style={styles.planCardInner}>
        <Text
          style={[styles.planCardTitle, { color: isLocked ? colors.textTertiary : colors.textPrimary }]}
          numberOfLines={2}
        >
          {plan.title}
        </Text>
        <Text
          style={[styles.planCardDesc, { color: isLocked ? colors.textTertiary : colors.textSecondary }]}
          numberOfLines={2}
        >
          {plan.description}
        </Text>
        <View style={styles.activeCardStats}>
          <Text style={[styles.activeCardStatText, { color: isLocked ? colors.textTertiary : colors.textSecondary }]}>
            {plan.duration_days} Days
          </Text>
          <Text style={[styles.activeCardStatText, { color: isLocked ? colors.textTertiary : colors.textSecondary }]}>
            {isLocked
              ? 'Pro'
              : !hasStarted
              ? 'Not started'
              : progress >= 1
              ? 'Complete'
              : `${Math.round(progress * 100)}% complete`}
          </Text>
        </View>
        <ProgressBar
          progress={isLocked ? 0 : progress}
          color={colors.accent}
          trackColor={colors.border}
        />
        {!isLocked && (
          <View style={[styles.continueButton, { backgroundColor: colors.accent }]}>
            <Text style={styles.continueButtonText}>
              {!hasStarted ? 'Start' : progress >= 1 ? 'Review' : 'Continue'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function BuildCustomPlanCard({
  onPress,
}: {
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.buildCard}
    >
      {/* Decorative circle */}
      <View style={styles.buildCardCircle} pointerEvents="none" />
      <View style={styles.buildCardInner}>
        <Text style={styles.buildCardHeadline}>
          A plan shaped{'\n'}around your life.
        </Text>
        <Text style={styles.buildCardBody}>
          Tell Pastor what you're walking through — grief, growth, doubt, or wonder — and he'll build a day-by-day Scripture plan just for you.
        </Text>
        <View style={styles.buildCardButton}>
          <Text style={styles.buildCardButtonText}>Build a custom plan</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { isPro } = useSubscription();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id ?? null);
    });
  }, []);

  const { plans, enrollments, isLoading, getEnrollmentForPlan, getProgress, reload } =
    useReadingPlans(userId);

  useFocusEffect(
    useCallback(() => {
      if (userId) reload();
    }, [userId, reload])
  );

  const handlePlanPress = useCallback(
    (plan: ReadingPlan) => {
      const isLocked = plan.is_pro && !isPro;
      if (isLocked) {
        router.push('/paywall');
        return;
      }
      router.push(`/plans/${plan.slug}`);
    },
    [isPro]
  );

  // Active enrollments with their plans
  const activePlans = enrollments
    .map(e => {
      const plan = plans.find(p => p.id === e.plan_id);
      if (!plan) return null;
      const progress = getProgress(e.id, plan.duration_days);
      return { plan, enrollment: e, progress };
    })
    .filter((x): x is { plan: ReadingPlan; enrollment: PlanEnrollment; progress: number } => x !== null)
    .filter(x => x.progress < 1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Reading Plans</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <>
            {/* ── Build Custom Plan ── */}
            <View style={[styles.section, { paddingHorizontal: Spacing.base }]}>
              <BuildCustomPlanCard
                colors={colors}
                onPress={() => router.push({ pathname: '/', params: { plans: 'true' } })}
              />
            </View>

            {/* ── Continue Reading ── */}
            {activePlans.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Current Journey</Text>
                </View>
                <View style={styles.activeList}>
                  {activePlans.map(({ plan, enrollment, progress }) => (
                    <ActivePlanCard
                      key={enrollment.id}
                      plan={plan}
                      enrollment={enrollment}
                      progress={progress}
                      colors={colors}
                      onPress={() => router.push(`/plans/${plan.slug}`)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* ── All Plans ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>All Plans</Text>
                {!isPro && (
                  <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.7}>
                    <Text style={[styles.upgradeLink, { color: colors.accent }]}>Unlock Pro →</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.planList}>
                {plans.map(plan => {
                  const enrollment = getEnrollmentForPlan(plan.id);
                  const progress = enrollment ? getProgress(enrollment.id, plan.duration_days) : 0;
                  return (
                    <PlanListCard
                      key={plan.id}
                      plan={plan}
                      isPro={isPro}
                      enrollment={enrollment}
                      progress={progress}
                      colors={colors}
                      onPress={() => handlePlanPress(plan)}
                    />
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  backArrow: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.regular },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  headerRight: { width: 40 },
  scrollContent: { paddingBottom: Spacing['3xl'] },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  section: { paddingTop: Spacing.xl },
  sectionHeader: { paddingHorizontal: Spacing.base, marginBottom: Spacing.md, gap: 4 },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  upgradeLink: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    fontWeight: '500',
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  // Build custom plan hero card
  buildCard: {
    borderRadius: Radius.xl,
    backgroundColor: '#4B6456',
    overflow: 'hidden',
    minHeight: 280,
  },
  buildCardCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -60,
    right: -60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  buildCardInner: {
    padding: Spacing.xl,
    gap: Spacing.md,
    flex: 1,
    justifyContent: 'flex-end',
  },
  buildCardHeadline: {
    fontFamily: Typography.fontFamily.serifItalic,
    fontSize: Typography.size['2xl'],
    color: '#FFFFFF',
    lineHeight: Typography.size['2xl'] * 1.25,
    marginBottom: Spacing.xs,
  },
  buildCardBody: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: Typography.size.base * 1.55,
  },
  buildCardButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  buildCardButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: '#1E2A22',
  },
  // Active plans
  activeList: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  activeCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  activeCardContent: {
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  activeCardTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    fontWeight: '700',
    lineHeight: Typography.size.xl * 1.2,
  },
  activeCardSubtitle: {
    fontFamily: Typography.fontFamily.serifItalic,
    fontSize: Typography.size.base,
    marginBottom: Spacing.xs,
  },
  activeCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  activeCardStatText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  continueButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  continueButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // All plans list
  planList: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  planCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  planCardInner: { padding: Spacing.xl, gap: Spacing.sm },
  planCardTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    fontWeight: '700',
    lineHeight: Typography.size.xl * 1.2,
  },
  planCardDesc: {
    fontFamily: Typography.fontFamily.serifItalic,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.5,
    marginBottom: Spacing.xs,
  },
  progressTrack: { height: 6, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full },
  lockBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
    zIndex: 1,
  },
  lockIcon: { fontSize: 10 },
  lockLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
});
