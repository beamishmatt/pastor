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
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../../components/ui/tokens';
import { useSubscription } from '../../../../hooks/useSubscription';
import { useReadingPlans, PlanReading } from '../../../../hooks/useReadingPlans';
import { supabase } from '../../../../lib/supabase';

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

  // Load day-by-day readings for this plan
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

  const handleStartOrContinue = useCallback(async () => {
    if (!plan) return;
    if (plan.is_pro && !isPro) {
      router.push('/paywall');
      return;
    }
    if (!enrollment) {
      setEnrolling(true);
      try {
        await enroll(plan.id);
      } catch (e) {
        Alert.alert('Error', 'Could not start this plan. Please try again.');
        setEnrolling(false);
        return;
      }
      setEnrolling(false);
    }
    // Navigate to current day (or day 1 if just enrolled)
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
            try {
              await deletePlan(plan);
              router.back();
            } catch {
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
      if (plan.is_pro && !isPro) {
        router.push('/paywall');
        return;
      }
      if (!enrollment) {
        // Need to enroll first
        Alert.alert(
          'Start this plan?',
          `Begin "${plan.title}" today?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Start',
              onPress: async () => {
                setEnrolling(true);
                try {
                  await enroll(plan.id);
                } catch {
                  Alert.alert('Error', 'Could not start this plan. Please try again.');
                  setEnrolling(false);
                  return;
                }
                setEnrolling(false);
                router.push(`/plans/${slug}/${dayNumber}`);
              },
            },
          ]
        );
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
  const currentDay = enrollment?.current_day ?? null;

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {plan.title}
        </Text>
        <View style={styles.headerRight}>
          {(enrollment || plan.is_ai_generated) && (
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Delete plan"
            >
              <Feather name="trash-2" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.durationPill, { backgroundColor: colors.accentSecondary + '22', borderColor: colors.accentSecondary + '44' }]}>
            <Text style={[styles.durationPillText, { color: colors.accentSecondary }]}>
              {plan.duration_days}-day plan
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{plan.title}</Text>
          <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>{plan.description}</Text>

          {enrollment && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.accentSecondary, width: `${Math.round(progress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                {Math.round(progress * 100)}% complete · Day {enrollment.current_day} of {plan.duration_days}
              </Text>
            </View>
          )}

          {isLocked ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/paywall')}
              style={[styles.ctaButton, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.ctaButtonText}>Unlock with Pro</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleStartOrContinue}
              disabled={enrolling}
              style={[styles.ctaButton, { backgroundColor: colors.accent, opacity: enrolling ? 0.6 : 1 }]}
            >
              <Text style={styles.ctaButtonText}>
                {enrolling ? 'Starting...' : !enrollment ? 'Start Plan' : `Continue — Day ${enrollment.current_day}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Day List */}
        <View style={styles.dayList}>
          <Text style={[styles.dayListTitle, { color: colors.textPrimary }]}>Your Reading Schedule</Text>

          {readingsLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing.xl }} />
          ) : (
            readings.map(reading => {
              const isDone = completedDays.includes(reading.day_number);
              const isToday = currentDay === reading.day_number;
              const isFuture = currentDay != null && reading.day_number > currentDay && !isDone;
              const isAccessible = !isLocked && (!isFuture || isDone);

              return (
                <TouchableOpacity
                  key={reading.id}
                  activeOpacity={isAccessible ? 0.7 : 1}
                  onPress={() => isAccessible && handleDayPress(reading.day_number)}
                  style={[
                    styles.dayRow,
                    {
                      backgroundColor: isToday
                        ? colors.accent + '11'
                        : colors.surfaceElevated,
                      borderColor: isToday ? colors.accent + '44' : colors.border,
                      opacity: isFuture ? 0.5 : 1,
                    },
                    Shadow.sm,
                  ]}
                >
                  {/* Day indicator */}
                  <View
                    style={[
                      styles.dayIndicator,
                      {
                        backgroundColor: isDone
                          ? colors.accentSecondary
                          : isToday
                          ? colors.accent
                          : colors.surface,
                        borderColor: isDone ? colors.accentSecondary : isToday ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    {isDone ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : (
                      <Text
                        style={[
                          styles.dayNumber,
                          { color: isToday ? '#FFFFFF' : colors.textTertiary },
                        ]}
                      >
                        {reading.day_number}
                      </Text>
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.dayContent}>
                    <Text
                      style={[
                        styles.dayTitle,
                        { color: isFuture ? colors.textTertiary : colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {reading.title}
                    </Text>
                    <Text style={[styles.dayPassage, { color: colors.textSecondary }]} numberOfLines={1}>
                      {reading.passage_ref}
                    </Text>
                  </View>

                  {/* Today badge */}
                  {isToday && (
                    <View style={[styles.todayBadge, { backgroundColor: colors.accent }]}>
                      <Text style={styles.todayBadgeText}>Today</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  headerRight: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  scrollContent: { paddingBottom: Spacing['3xl'] },
  // Hero
  hero: {
    padding: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  durationPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  durationPillText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    fontWeight: '700',
    lineHeight: Typography.size.xl * 1.2,
  },
  heroDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.6,
  },
  progressContainer: { gap: Spacing.xs },
  progressTrack: { height: 5, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full },
  progressText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.sm },
  ctaButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  ctaButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Day list
  dayList: { padding: Spacing.base, gap: Spacing.sm, paddingTop: Spacing.xl },
  dayListTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  dayIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayNumber: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    fontWeight: '500',
  },
  dayContent: { flex: 1, gap: 2 },
  dayTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    fontWeight: '500',
  },
  dayPassage: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.sm },
  todayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  todayBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
