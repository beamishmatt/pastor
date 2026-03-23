import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../../components/ui/tokens';
import { useSubscription } from '../../../../hooks/useSubscription';
import { useReadingPlans, PlanReading } from '../../../../hooks/useReadingPlans';
import { supabase } from '../../../../lib/supabase';

export default function PlanDayScreen() {
  const { id: slug, day } = useLocalSearchParams<{ id: string; day: string }>();
  const dayNumber = parseInt(day ?? '1', 10);

  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { isPro } = useSubscription();
  const [userId, setUserId] = useState<string | null>(null);
  const [reading, setReading] = useState<PlanReading | null>(null);
  const [readingLoading, setReadingLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id ?? null);
    });
  }, []);

  const { plans, enrollments, markDayComplete, getCompletedDays, isLoading } =
    useReadingPlans(userId);

  const plan = plans.find(p => p.slug === slug);
  const enrollment = plan ? enrollments.find(e => e.plan_id === plan.id) ?? null : null;
  const completedDays = enrollment ? getCompletedDays(enrollment.id) : [];

  // Load this day's reading
  useEffect(() => {
    if (!plan) return;
    setReadingLoading(true);
    supabase
      .from('plan_readings')
      .select('*')
      .eq('plan_id', plan.id)
      .eq('day_number', dayNumber)
      .single()
      .then(({ data }) => {
        setReading(data as PlanReading | null);
        setReadingLoading(false);
      });
  }, [plan?.id, dayNumber]);

  // Check completion state
  useEffect(() => {
    setIsCompleted(completedDays.includes(dayNumber));
  }, [completedDays, dayNumber]);

  const handleReadInBible = useCallback(() => {
    if (!reading) return;
    router.push(`/bible/${encodeURIComponent(reading.book)}/${reading.chapter}`);
  }, [reading]);

  const handleComplete = useCallback(async () => {
    if (!enrollment || !plan) return;
    setCompleting(true);
    try {
      await markDayComplete(enrollment.id, dayNumber, notes.trim() || undefined);
      setIsCompleted(true);

      const isLastDay = dayNumber >= plan.duration_days;
      if (isLastDay) {
        Alert.alert(
          'Plan Complete!',
          `You've finished "${plan.title}". Well done for staying faithful through all ${plan.duration_days} days.`,
          [{ text: 'Back to Plans', onPress: () => router.push('/plans') }]
        );
      } else {
        // Offer to go to next day
        Alert.alert(
          'Day Complete',
          `Day ${dayNumber} marked as complete. Ready for day ${dayNumber + 1}?`,
          [
            { text: 'Not Now', style: 'cancel', onPress: () => router.back() },
            {
              text: `Day ${dayNumber + 1}`,
              onPress: () => router.replace(`/plans/${slug}/${dayNumber + 1}`),
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save your progress. Please try again.');
    } finally {
      setCompleting(false);
    }
  }, [enrollment, plan, dayNumber, notes, markDayComplete, slug]);

  const handleAskPastor = useCallback(() => {
    if (!reading) return;
    // Navigate to chat with the passage pre-set as scope
    router.push({ pathname: '/', params: { verse: reading.passage_ref } });
  }, [reading]);

  if (isLoading || readingLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!reading || !plan) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6} style={styles.backButton}>
            <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.textTertiary }]}>Reading not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerDay, { color: colors.textTertiary }]}>
            Day {dayNumber} of {plan.duration_days}
          </Text>
          <Text style={[styles.headerPlanTitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {plan.title}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Day title + passage */}
          <View style={styles.passageHeader}>
            {isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: colors.accentSecondary + '22', borderColor: colors.accentSecondary + '44' }]}>
                <Text style={[styles.completedBadgeText, { color: colors.accentSecondary }]}>✓ Completed</Text>
              </View>
            )}
            <Text style={[styles.dayTitle, { color: colors.textPrimary }]}>{reading.title}</Text>
            <Text style={[styles.passageRef, { color: colors.accent }]}>{reading.passage_ref}</Text>
          </View>

          {/* Open in Bible button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleReadInBible}
            style={[styles.bibleButton, { backgroundColor: colors.surface, borderColor: colors.border, ...Shadow.sm }]}
          >
            <View style={styles.bibleButtonInner}>
              <View>
                <Text style={[styles.bibleButtonLabel, { color: colors.textPrimary }]}>Read in Bible</Text>
                <Text style={[styles.bibleButtonSub, { color: colors.textTertiary }]}>
                  {reading.passage_ref} · Open full chapter
                </Text>
              </View>
              <Text style={[styles.bibleButtonArrow, { color: colors.textTertiary }]}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Reflection prompt */}
          {reading.reflection_prompt && (
            <View style={[styles.reflectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reflectionLabel, { color: colors.textTertiary }]}>REFLECT</Text>
              <Text style={[styles.reflectionText, { color: colors.textPrimary }]}>
                {reading.reflection_prompt}
              </Text>
            </View>
          )}

          {/* Ask Pastor button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAskPastor}
            style={[styles.askButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, ...Shadow.sm }]}
          >
            <View style={styles.askButtonInner}>
              <View>
                <Text style={[styles.askButtonLabel, { color: colors.textPrimary }]}>Ask Pastor</Text>
                <Text style={[styles.askButtonSub, { color: colors.textTertiary }]}>
                  Explore this passage in conversation
                </Text>
              </View>
              <Text style={[styles.askButtonArrow, { color: colors.accent }]}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Notes */}
          {!isCompleted && (
            <View style={styles.notesSection}>
              <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>
                Notes (optional)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="What is God speaking to you through this passage?"
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Complete button */}
          {!isCompleted ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleComplete}
              disabled={completing || !enrollment}
              style={[
                styles.completeButton,
                {
                  backgroundColor: colors.accent,
                  opacity: completing || !enrollment ? 0.6 : 1,
                },
              ]}
            >
              <Text style={styles.completeButtonText}>
                {completing ? 'Saving...' : `Mark Day ${dayNumber} Complete`}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.completedState, { backgroundColor: colors.accentSecondary + '22', borderColor: colors.accentSecondary }]}>
              <Text style={[styles.completedStateText, { color: colors.accentSecondary }]}>
                ✓ Day {dayNumber} complete
              </Text>
              {dayNumber < plan.duration_days && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.replace(`/plans/${slug}/${dayNumber + 1}`)}
                  style={[styles.nextDayButton, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.nextDayButtonText}>Day {dayNumber + 1} →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Navigation between days */}
          <View style={styles.dayNav}>
            {dayNumber > 1 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.replace(`/plans/${slug}/${dayNumber - 1}`)}
                style={[styles.navButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>← Day {dayNumber - 1}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.navSpacer} />
            {dayNumber < plan.duration_days && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.replace(`/plans/${slug}/${dayNumber + 1}`)}
                style={[styles.navButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>Day {dayNumber + 1} →</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  backArrow: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.regular },
  headerCenter: { flex: 1, alignItems: 'center', gap: 1 },
  headerDay: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
  },
  headerPlanTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    fontWeight: '500',
  },
  headerRight: { width: 40 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.base },
  // Passage header
  passageHeader: { gap: Spacing.sm },
  completedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  completedBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
  dayTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    fontWeight: '700',
    lineHeight: Typography.size.xl * 1.2,
  },
  passageRef: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    fontWeight: '500',
  },
  // Bible button
  bibleButton: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.base,
  },
  bibleButtonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bibleButtonLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
  },
  bibleButtonSub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  bibleButtonArrow: { fontSize: Typography.size.lg },
  // Reflection card
  reflectionCard: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  reflectionLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  reflectionText: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.7,
  },
  // Ask Pastor
  askButton: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.base,
  },
  askButtonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  askButtonLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
  },
  askButtonSub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  askButtonArrow: { fontSize: Typography.size.lg },
  // Notes
  notesSection: { gap: Spacing.sm },
  notesLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.6,
    minHeight: 100,
  },
  // Complete
  completeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  completeButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  completedStateText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
  },
  nextDayButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  nextDayButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Day navigation
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  navButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  navButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    fontWeight: '500',
  },
  navSpacer: { flex: 1 },
});
