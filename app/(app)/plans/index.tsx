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
import { useReadingPlans, ReadingPlan, PlanEnrollment, PlanRecommendation } from '../../../hooks/useReadingPlans';
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

function RecommendationCard({
  rec,
  isPro,
  colors,
  onPress,
}: {
  rec: PlanRecommendation;
  isPro: boolean;
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  const isLocked = rec.plan.is_pro && !isPro;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.recCard,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border, ...Shadow.sm },
      ]}
    >
      {isLocked && (
        <View style={[styles.lockBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.lockIcon, { color: colors.locked }]}>🔒</Text>
          <Text style={[styles.lockLabel, { color: colors.locked }]}>Pro</Text>
        </View>
      )}
      <View style={[styles.recDurationBadge, { backgroundColor: colors.accentSecondary + '22', borderColor: colors.accentSecondary + '44' }]}>
        <Text style={[styles.recDurationText, { color: colors.accentSecondary }]}>
          {rec.plan.duration_days} days
        </Text>
      </View>
      <Text style={[styles.recTitle, { color: isLocked ? colors.textTertiary : colors.textPrimary }]} numberOfLines={2}>
        {rec.plan.title}
      </Text>
      <Text style={[styles.recReason, { color: colors.accent }]} numberOfLines={2}>
        {rec.reason}
      </Text>
      <View style={[styles.recButton, { backgroundColor: isLocked ? colors.border : colors.accent }]}>
        <Text style={styles.recButtonText}>{isLocked ? 'Unlock' : 'Start'}</Text>
      </View>
    </TouchableOpacity>
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
  const completedDays = Math.round(progress * plan.duration_days);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.activeCard,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border, ...Shadow.sm },
      ]}
    >
      <View style={styles.activeCardContent}>
        <View style={styles.activeCardLeft}>
          <Text style={[styles.activeCardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {plan.title}
          </Text>
          <Text style={[styles.activeCardMeta, { color: colors.textSecondary }]}>
            Day {enrollment.current_day} of {plan.duration_days}
          </Text>
          <ProgressBar progress={progress} color={colors.accentSecondary} trackColor={colors.border} />
          <Text style={[styles.activeCardProgress, { color: colors.textTertiary }]}>
            {completedDays === 0 ? 'Just started' : `${completedDays} of ${plan.duration_days} days complete`}
          </Text>
        </View>
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
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border, ...Shadow.sm },
      ]}
    >
      {isLocked && (
        <View style={[styles.lockBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.lockIcon, { color: colors.locked }]}>🔒</Text>
          <Text style={[styles.lockLabel, { color: colors.locked }]}>Pro</Text>
        </View>
      )}
      <View style={styles.planCardInner}>
        <View style={styles.planCardHeader}>
          <Text
            style={[styles.planCardTitle, { color: isLocked ? colors.textTertiary : colors.textPrimary }]}
            numberOfLines={2}
          >
            {plan.title}
          </Text>
          <View style={[styles.durationBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.durationText, { color: colors.textSecondary }]}>{plan.duration_days}d</Text>
          </View>
        </View>
        <Text
          style={[styles.planCardDesc, { color: isLocked ? colors.textTertiary : colors.textSecondary }]}
          numberOfLines={2}
        >
          {plan.description}
        </Text>
        <View style={styles.planCardFooter}>
          <View style={styles.progressSection}>
            <ProgressBar
              progress={isLocked ? 0 : progress}
              color={colors.accentSecondary}
              trackColor={colors.border}
            />
            <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>
              {isLocked
                ? 'Unlock with Pro'
                : !hasStarted
                ? 'Not started'
                : progress >= 1
                ? 'Complete!'
                : `${Math.round(progress * 100)}% complete`}
            </Text>
          </View>
          {!isLocked && (
            <View style={[styles.actionButton, { backgroundColor: colors.accent }]}>
              <Text style={styles.actionButtonText}>
                {!hasStarted ? 'Start' : progress >= 1 ? 'Review' : 'Continue'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function BuildCustomPlanCard({
  colors,
  onPress,
}: {
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.buildCard,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border, ...Shadow.sm },
      ]}
    >
      <View style={[styles.buildIconWrap, { backgroundColor: colors.accent + '18' }]}>
        <Feather name="edit-3" size={18} color={colors.accent} />
      </View>
      <View style={styles.buildCardText}>
        <Text style={[styles.buildCardTitle, { color: colors.textPrimary }]}>Build a custom plan</Text>
        <Text style={[styles.buildCardDesc, { color: colors.textSecondary }]}>
          Tell Pastor what you're walking through and he'll build a personalized day-by-day reading plan for you.
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.textTertiary} />
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

  const { plans, enrollments, recommendations, isLoading, enroll, getEnrollmentForPlan, getProgress, reload } =
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

  const handleRecommendationPress = useCallback(
    async (rec: PlanRecommendation) => {
      const isLocked = rec.plan.is_pro && !isPro;
      if (isLocked) {
        router.push('/paywall');
        return;
      }
      // If not yet enrolled, enroll and navigate to day 1
      const existing = getEnrollmentForPlan(rec.plan.id);
      if (!existing) {
        try {
          await enroll(rec.plan.id);
        } catch (e) {
          console.error('Enroll error:', e);
        }
      }
      router.push(`/plans/${rec.plan.slug}`);
    },
    [isPro, getEnrollmentForPlan, enroll]
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

            {/* ── For You ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>For You</Text>
                {recommendations.length > 0 && (
                  <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
                    Chosen for your journey
                  </Text>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recScroll}
              >
                {recommendations.map(rec => (
                  <RecommendationCard
                    key={rec.plan.id}
                    rec={rec}
                    isPro={isPro}
                    colors={colors}
                    onPress={() => handleRecommendationPress(rec)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* ── Continue Reading ── */}
            {activePlans.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Continue Reading</Text>
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
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>All Plans</Text>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  sectionSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.5,
  },
  upgradeLink: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    fontWeight: '500',
  },
  // Recommendation horizontal cards
  recScroll: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  recCard: {
    width: 200,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  recDurationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  recDurationText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
  recTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    lineHeight: Typography.size.base * 1.35,
  },
  recReason: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    lineHeight: Typography.size.xs * 1.6,
    flex: 1,
  },
  recButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  recButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Build custom plan card
  buildCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.base,
  },
  buildIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  buildCardText: {
    flex: 1,
    gap: 2,
  },
  buildCardTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
  },
  buildCardDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },
  // Active plans
  activeList: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  activeCard: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  activeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  activeCardLeft: { flex: 1, gap: 4 },
  activeCardTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
  },
  activeCardMeta: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },
  activeCardProgress: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  continueButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  continueButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // All plans list
  planList: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  planCard: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  planCardInner: { padding: Spacing.base, gap: Spacing.sm },
  planCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  planCardTitle: {
    flex: 1,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    lineHeight: Typography.size.base * 1.4,
  },
  planCardDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.6,
  },
  planCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  durationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  durationText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
  progressSection: { flex: 1, gap: 4 },
  progressTrack: { height: 4, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full },
  progressLabel: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.xs },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  actionButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lockBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
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
