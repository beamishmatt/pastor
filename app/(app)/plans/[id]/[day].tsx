import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../../components/ui/tokens';
import { getPlanTheme } from '../../../../components/ui/planThemes';
import { useReadingPlans, PlanReading } from '../../../../hooks/useReadingPlans';
import { supabase } from '../../../../lib/supabase';

// ─── Hero ─────────────────────────────────────────────────────────────────────

function DayHero({ planTitle, slug }: { planTitle: string; slug: string }) {
  const theme = getPlanTheme(planTitle, slug);
  return (
    <View style={styles.heroWrap}>
      {theme.image ? (
        <Image source={theme.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors[0] }]}>
          <View style={[styles.heroBlob1, { backgroundColor: theme.colors[1] }]} />
          <View style={[styles.heroBlob2, { backgroundColor: theme.colors[2] }]} />
        </View>
      )}
      <View style={styles.heroOverlay} pointerEvents="none">
        <Text style={styles.heroTitle}>{planTitle}</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlanDayScreen() {
  const { id: slug, day } = useLocalSearchParams<{ id: string; day: string }>();
  const dayNumber = parseInt(day ?? '1', 10);
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [userId, setUserId] = useState<string | null>(null);
  const [reading, setReading] = useState<PlanReading | null>(null);
  const [readingLoading, setReadingLoading] = useState(true);
  const [keyVerseText, setKeyVerseText] = useState<string | null>(null);
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

  // Fetch key verse text from bible_verses
  useEffect(() => {
    if (!reading) return;
    supabase
      .from('bible_verses')
      .select('text')
      .eq('translation', 'KJV')
      .eq('book', reading.book)
      .eq('chapter', reading.chapter)
      .eq('verse', reading.verse_start ?? 1)
      .single()
      .then(({ data }) => {
        if (data?.text) setKeyVerseText(data.text);
      });
  }, [reading]);

  useEffect(() => {
    setIsCompleted(completedDays.includes(dayNumber));
  }, [completedDays, dayNumber]);

  const handleReadInBible = useCallback(() => {
    if (!reading) return;
    router.push(`/bible/${encodeURIComponent(reading.book)}/${reading.chapter}`);
  }, [reading]);

  const handleAskPastor = useCallback(() => {
    if (!reading) return;
    router.push({ pathname: '/', params: { verse: reading.passage_ref } });
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
        Alert.alert(
          'Day Complete',
          `Day ${dayNumber} marked as complete. Ready for day ${dayNumber + 1}?`,
          [
            { text: 'Not Now', style: 'cancel', onPress: () => router.back() },
            { text: `Day ${dayNumber + 1}`, onPress: () => router.replace(`/plans/${slug}/${dayNumber + 1}`) },
          ]
        );
      }
    } catch {
      Alert.alert('Error', 'Could not save your progress. Please try again.');
    } finally {
      setCompleting(false);
    }
  }, [enrollment, plan, dayNumber, notes, markDayComplete, slug]);

  if (isLoading || readingLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!reading || !plan) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnFallback}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.textTertiary }]}>Reading not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const reflectionParagraphs = reading.reflection_prompt
    ? reading.reflection_prompt.split(/\n+/).filter(s => s.trim().length > 0)
    : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <View style={[styles.dayPill, { backgroundColor: colors.accent }]}>
            <Text style={styles.dayPillText}>DAY {dayNumber}</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {reading.title}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero ── */}
          <DayHero planTitle={plan.title} slug={slug} />

          <View style={styles.content}>
            {/* ── THE WORD ── */}
            <View style={[styles.wordCard, { backgroundColor: colors.surfaceContainerHigh }]}>
              <View style={styles.wordCardHeader}>
                <Text style={[styles.wordLabel, { color: colors.textSecondary }]}>THE WORD</Text>
              </View>
              {keyVerseText ? (
                <Text style={[styles.verseQuote, { color: colors.textPrimary }]}>
                  "{keyVerseText}"
                </Text>
              ) : null}
              <Text style={[styles.verseAttribution, { color: colors.textTertiary }]}>
                — {reading.passage_ref} (KJV)
              </Text>
              <TouchableOpacity
                onPress={handleReadInBible}
                activeOpacity={0.8}
                style={[styles.readChapterBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.readChapterText}>Read Full Chapter</Text>
                <Feather name="external-link" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* ── Today's Reflection ── */}
            {reflectionParagraphs.length > 0 && (
              <View style={styles.reflectionSection}>
                <Text style={[styles.reflectionHeading, { color: colors.textPrimary }]}>
                  Today's Reflection
                </Text>
                {reflectionParagraphs.map((para, i) => (
                  <Text key={i} style={[styles.reflectionBody, { color: colors.textSecondary }]}>
                    {para}
                  </Text>
                ))}
              </View>
            )}

            {/* ── Ask Pastor ── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAskPastor}
              style={[styles.askPastorCard, { backgroundColor: colors.warning }]}
            >
              <Feather name="message-square" size={26} color="#FFFFFF" />
              <Text style={[styles.askPastorLabel, { color: '#FFFFFF' }]}>ASK PASTOR</Text>
            </TouchableOpacity>

            {/* ── Personal Journal ── */}
            {!isCompleted && (
              <View style={[styles.journalCard, { backgroundColor: colors.surface }]}>
                <View style={styles.journalHeader}>
                  <Feather name="edit-3" size={13} color={colors.accent} />
                  <Text style={[styles.journalLabel, { color: colors.accent }]}>PERSONAL JOURNAL</Text>
                </View>
                <Text style={[styles.journalPrompt, { color: colors.textPrimary }]}>
                  What is God speaking to you through today's reading?
                </Text>
                <TextInput
                  style={[
                    styles.journalInput,
                    {
                      backgroundColor: colors.surfaceContainerHighest,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Tap to write your thoughts..."
                  placeholderTextColor={colors.textTertiary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            {/* ── Completed state ── */}
            {isCompleted && (
              <View
                style={[
                  styles.completedBanner,
                  { backgroundColor: colors.accentSecondary + '22', borderColor: colors.accentSecondary + '55' },
                ]}
              >
                <Feather name="check-circle" size={18} color={colors.accentSecondary} />
                <Text style={[styles.completedBannerText, { color: colors.accentSecondary }]}>
                  Day {dayNumber} complete
                </Text>
                {dayNumber < plan.duration_days && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.replace(`/plans/${slug}/${dayNumber + 1}`)}
                    style={[styles.nextDayBtn, { backgroundColor: colors.accent }]}
                  >
                    <Text style={styles.nextDayBtnText}>Day {dayNumber + 1} →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* ── Sticky complete button ── */}
        {!isCompleted && (
          <View style={[styles.stickyBottom, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleComplete}
              disabled={completing || !enrollment}
              style={[
                styles.completeBtn,
                { backgroundColor: colors.accent, opacity: completing || !enrollment ? 0.6 : 1 },
              ]}
            >
              <Feather name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.completeBtnText}>
                {completing ? 'Saving…' : `Mark Day ${dayNumber} Complete`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.base },
  backBtnFallback: { padding: Spacing.base },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dayPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  dayPillText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    fontWeight: '500',
    flexShrink: 1,
  },
  headerSpacer: { width: 36 },

  // Hero
  heroWrap: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 220,
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
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: Typography.size.xl * 1.25,
  },

  // Scroll + content wrapper
  scroll: { paddingBottom: Spacing['3xl'] },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },

  // THE WORD card
  wordCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  wordCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  wordLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  verseQuote: {
    fontFamily: Typography.fontFamily.serifItalic,
    fontSize: Typography.size.md,
    lineHeight: Typography.size.md * 1.65,
  },
  verseAttribution: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },
  readChapterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  readChapterText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Today's Reflection
  reflectionSection: { gap: Spacing.md },
  reflectionHeading: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    fontWeight: '700',
    lineHeight: Typography.size.xl * 1.2,
  },
  reflectionBody: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.7,
  },

  // Ask Pastor
  askPastorCard: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  askPastorLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.sm,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Personal Journal
  journalCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  journalLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  journalPrompt: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    fontWeight: '500',
    lineHeight: Typography.size.base * 1.5,
  },
  journalInput: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.6,
    minHeight: 100,
  },

  // Completed banner
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  completedBannerText: {
    flex: 1,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
  },
  nextDayBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  nextDayBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Sticky complete button
  stickyBottom: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  completeBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
