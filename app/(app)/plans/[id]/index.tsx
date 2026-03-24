import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../../components/ui/tokens';
import { getPlanTheme } from '../../../../components/ui/planThemes';
import { useSubscription } from '../../../../hooks/useSubscription';
import { useReadingPlans, PlanReading } from '../../../../hooks/useReadingPlans';
import { supabase } from '../../../../lib/supabase';

// ─── Hero illustration ────────────────────────────────────────────────────────

function PlanHero({ title, slug }: { title: string; slug: string }) {
  const theme = getPlanTheme(title, slug);

  if (theme.image) {
    return (
      <Image
        source={theme.image}
        style={styles.heroImage}
        resizeMode="cover"
      />
    );
  }

  // Pure-RN gradient fallback (no native module needed)
  const [dark, mid, light] = theme.colors;
  return (
    <View style={[styles.heroImage, { backgroundColor: dark, overflow: 'hidden' }]}>
      {/* Mid tone — large soft circle bottom-left */}
      <View style={[styles.heroBlob1, { backgroundColor: mid }]} />
      {/* Light tone — large soft circle top-right */}
      <View style={[styles.heroBlob2, { backgroundColor: light }]} />
      {/* Orb highlight */}
      <View style={[styles.heroOrb, { backgroundColor: theme.orbColor }]} />
    </View>
  );
}

// ─── Progress card ────────────────────────────────────────────────────────────

function ProgressCard({
  enrollment,
  plan,
  progress,
  todayReading,
  enrolling,
  colors,
  onContinue,
}: {
  enrollment: ReturnType<ReturnType<typeof useReadingPlans>['getEnrollmentForPlan']>;
  plan: { duration_days: number };
  progress: number;
  todayReading: PlanReading | null;
  enrolling: boolean;
  colors: typeof Colors.light;
  onContinue: () => void;
}) {
  const pct = Math.round(Math.min(100, Math.max(0, progress * 100)));
  return (
    <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.progressStats}>
        <Text style={[styles.progressStatText, { color: colors.textSecondary }]}>{pct}% complete</Text>
        <Text style={[styles.progressStatText, { color: colors.textSecondary }]}>
          Day {enrollment!.current_day} of {plan.duration_days}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${pct}%` }]} />
      </View>

      {todayReading && (
        <View style={styles.todaySection}>
          <Text style={[styles.todayTitle, { color: colors.textPrimary }]}>
            Today: {todayReading.title}
          </Text>
          <Text style={[styles.todayPassage, { color: colors.textSecondary }]}>
            Scripture Focus: {todayReading.passage_ref}
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onContinue}
        disabled={enrolling}
        style={[styles.continueBtn, { backgroundColor: colors.accent, opacity: enrolling ? 0.6 : 1 }]}
      >
        <Text style={styles.continueBtnText}>
          {enrolling ? 'Starting…' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlanDetailScreen() {
  const { id: slug } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { isPro } = useSubscription();
  const [userId, setUserId] = useState<string | null>(null);
  const [readings, setReadings] = useState<PlanReading[]>([]);
  const [readingsLoading, setReadingsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id ?? null);
    });
  }, []);

  const { plans, enroll, deletePlan, getEnrollmentForPlan, getCompletedDays, getProgress, isLoading } =
    useReadingPlans(userId);

  const plan = plans.find(p => p.slug === slug);

  useEffect(() => {
    if (!plan) return;
    setReadingsLoading(true);
    supabase
      .from('plan_readings')
      .select('*')
      .eq('plan_id', plan.id)
      .order('day_number', { ascending: true })
      .then(({ data }) => {
        setReadings((data ?? []) as PlanReading[]);
        setReadingsLoading(false);
      });
  }, [plan?.id]);

  const enrollment = plan ? getEnrollmentForPlan(plan.id) : null;
  const completedDays = enrollment ? getCompletedDays(enrollment.id) : [];
  const progress = plan && enrollment ? getProgress(enrollment.id, plan.duration_days) : 0;
  const todayReading = enrollment
    ? readings.find(r => r.day_number === enrollment.current_day) ?? null
    : null;

  const handleStartOrContinue = useCallback(async () => {
    if (!plan) return;
    if (plan.is_pro && !isPro) { router.push('/paywall'); return; }
    if (!enrollment) {
      setEnrolling(true);
      try { await enroll(plan.id); } catch {
        Alert.alert('Error', 'Could not start this plan. Please try again.');
        setEnrolling(false);
        return;
      }
      setEnrolling(false);
    }
    const currentDay = enrollment?.current_day ?? 1;
    router.push(`/plans/${slug}/${currentDay}`);
  }, [plan, isPro, enrollment, enroll, slug]);

  const handleDelete = useCallback(() => {
    if (!plan) return;
    const isAI = plan.is_ai_generated;
    Alert.alert(
      isAI ? 'Delete this plan?' : 'Remove this plan?',
      isAI
        ? 'This will permanently delete your personalized plan and all progress.'
        : 'This will remove the plan from your library. Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isAI ? 'Delete' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            try { await deletePlan(plan); router.back(); } catch {
              Alert.alert('Error', 'Could not delete this plan. Please try again.');
            }
          },
        },
      ]
    );
  }, [plan, deletePlan]);

  const handleDayPress = useCallback(
    (dayNumber: number) => {
      if (!plan) return;
      if (plan.is_pro && !isPro) { router.push('/paywall'); return; }
      if (!enrollment) {
        Alert.alert('Start this plan?', `Begin "${plan.title}" today?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: async () => {
              setEnrolling(true);
              try { await enroll(plan.id); } catch {
                Alert.alert('Error', 'Could not start this plan. Please try again.');
                setEnrolling(false);
                return;
              }
              setEnrolling(false);
              router.push(`/plans/${slug}/${dayNumber}`);
            },
          },
        ]);
        return;
      }
      router.push(`/plans/${slug}/${dayNumber}`);
    },
    [plan, isPro, enrollment, enroll, slug]
  );

  if (isLoading || !plan) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const isLocked = plan.is_pro && !isPro;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Nav row — sits above the hero, inside safe area */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.navBtn}
        >
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        {(enrollment || plan.is_ai_generated) && (
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.navBtn}
          >
            <Feather name="trash-2" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero image — inset with padding */}
        <View style={styles.heroWrap}>
          <PlanHero title={plan.title} slug={slug} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Label + title + description */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {enrollment ? 'Current Journey' : `${plan.duration_days}-Day Plan`}
          </Text>
          <Text style={[styles.planTitle, { color: colors.textPrimary }]}>{plan.title}</Text>
          <Text style={[styles.planDesc, { color: colors.textSecondary }]}>{plan.description}</Text>

          {/* Progress card (enrolled) or start button (not enrolled) */}
          {enrollment ? (
            <ProgressCard
              enrollment={enrollment}
              plan={plan}
              progress={progress}
              todayReading={todayReading}
              enrolling={enrolling}
              colors={colors}
              onContinue={handleStartOrContinue}
            />
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={isLocked ? () => router.push('/paywall') : handleStartOrContinue}
              disabled={enrolling}
              style={[styles.startBtn, { backgroundColor: colors.accent, opacity: enrolling ? 0.6 : 1 }]}
            >
              <Text style={styles.startBtnText}>
                {isLocked ? 'Unlock with Pro' : enrolling ? 'Starting…' : 'Start Plan'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Reading schedule */}
          <View style={styles.scheduleSection}>
            <View style={styles.scheduleHeader}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Reading Schedule</Text>
              <View style={[styles.scheduleDivider, { backgroundColor: colors.border }]} />
            </View>

            {readingsLoading ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing.xl }} />
            ) : (
              readings.map((reading, index) => {
                const isDone = completedDays.includes(reading.day_number);
                const isToday = enrollment?.current_day === reading.day_number;
                const isFuture = enrollment != null && reading.day_number > enrollment.current_day && !isDone;
                const isAccessible = !isLocked && (!isFuture || isDone);

                return (
                  <TouchableOpacity
                    key={reading.id}
                    activeOpacity={isAccessible ? 0.7 : 1}
                    onPress={() => isAccessible && handleDayPress(reading.day_number)}
                    style={[
                      styles.dayRow,
                      { borderBottomColor: colors.border },
                      index === 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                    ]}
                  >
                    {/* Check circle */}
                    <View
                      style={[
                        styles.dayCheck,
                        isDone
                          ? { backgroundColor: colors.accent, borderColor: colors.accent }
                          : { backgroundColor: 'transparent', borderColor: colors.border },
                      ]}
                    >
                      {isDone && <Feather name="check" size={12} color="#FFFFFF" />}
                    </View>

                    {/* Day label + title */}
                    <View style={styles.dayBody}>
                      <Text style={[styles.dayLabel, { color: colors.textTertiary }]}>
                        Day {reading.day_number}
                      </Text>
                      <Text
                        style={[
                          styles.dayTitle,
                          { color: isFuture ? colors.textTertiary : colors.textPrimary },
                          isDone && styles.dayTitleDone,
                        ]}
                        numberOfLines={1}
                      >
                        {reading.title}
                      </Text>
                    </View>

                    {/* Passage ref */}
                    <Text style={[styles.dayPassage, { color: colors.textTertiary }]} numberOfLines={1}>
                      {reading.passage_ref}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: Spacing['3xl'] },

  // Nav row above hero
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero landscape illustration
  heroWrap: {
    paddingHorizontal: Spacing.base,
  },
  heroImage: {
    height: 200,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  heroBlob1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: -80,
    left: -60,
    opacity: 0.7,
  },
  heroBlob2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -60,
    right: -40,
    opacity: 0.55,
  },
  heroOrb: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: 28,
    right: 52,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Content
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  planTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size['2xl'],
    fontWeight: '700',
    lineHeight: Typography.size['2xl'] * 1.2,
  },
  planDesc: {
    fontFamily: Typography.fontFamily.serif,
    fontStyle: 'italic',
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.65,
    marginBottom: Spacing.sm,
  },

  // Progress card
  progressCard: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.base,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStatText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    fontWeight: '500',
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  todaySection: {
    gap: 4,
    paddingTop: Spacing.xs,
  },
  todayTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.md,
    fontWeight: '700',
    lineHeight: Typography.size.md * 1.3,
  },
  todayPassage: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },
  continueBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  continueBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },

  // Start button (not enrolled)
  startBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  startBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Reading schedule
  scheduleSection: {
    marginTop: Spacing.md,
    gap: 0,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  scheduleDivider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dayBody: {
    flex: 1,
    gap: 2,
  },
  dayLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    fontWeight: '500',
  },
  dayTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  dayPassage: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    flexShrink: 0,
  },
});
