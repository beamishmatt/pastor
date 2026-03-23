import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../components/ui/tokens';
import { useSubscription } from '../../../hooks/useSubscription';
import { supabase } from '../../../lib/supabase';

interface DailyDevotional {
  id: string;
  date: string;
  verse_text: string;
  verse_reference: string;
  reflection: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ----- Pro gate screen -----

function LockedScreen({ colors, scheme }: { colors: (typeof Colors)['light']; scheme: string }) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Daily Devotional</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.lockedContent}>
        <Text style={[styles.lockIcon, { color: colors.locked }]}>🔒</Text>
        <Text style={[styles.lockedTitle, { color: colors.textPrimary }]}>
          Daily Devotional
        </Text>
        <Text style={[styles.lockedSubtitle, { color: colors.textSecondary }]}>
          Get a fresh scripture passage and reflection every morning — exclusive to Pastor Pro.
        </Text>

        <View style={styles.featureList}>
          {[
            'A new passage every day',
            'Thoughtful reflections & commentary',
            'Share with friends & family',
            'Offline access',
          ].map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={[styles.featureTick, { color: colors.accentSecondary }]}>✓</Text>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/paywall')}
          style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Pastor Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => router.back()}
          style={styles.dismissButton}
        >
          <Text style={[styles.dismissText, { color: colors.textTertiary }]}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ----- Main devotional screen -----

export default function DevotionalScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { isPro, isLoading: subLoading } = useSubscription();

  const [devotional, setDevotional] = useState<DailyDevotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = todayISODate();
  const formattedDate = formatDate(new Date());

  useEffect(() => {
    if (!isPro && !subLoading) return;
    if (!isPro) return;

    async function fetchDevotional() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: sbError } = await supabase
          .from('daily_verses')
          .select('id, date, verse_text, verse_reference, reflection')
          .eq('date', today)
          .single();

        if (sbError) throw sbError;
        setDevotional(data as DailyDevotional);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load devotional';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchDevotional();
  }, [isPro, subLoading, today]);

  const handleShare = useCallback(() => {
    if (!devotional) return;
    Share.share({
      message: `"${devotional.verse_text}"\n— ${devotional.verse_reference}\n\n${devotional.reflection}`,
    });
  }, [devotional]);

  // Show nothing while subscription status loads
  if (subLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // Pro gate
  if (!isPro) {
    return <LockedScreen colors={colors} scheme={scheme} />;
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Today's Devotional
          </Text>
          <Text style={[styles.headerDate, { color: colors.textTertiary }]}>
            {formattedDate}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.shareButton}
          disabled={!devotional}
        >
          <Text style={[styles.shareIcon, { color: devotional ? colors.accent : colors.textTertiary }]}>
            ↑
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading today's devotional…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => setLoading(true)}
            activeOpacity={0.7}
            style={[styles.retryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.retryText, { color: colors.textSecondary }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : devotional ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Verse card */}
          <View
            style={[
              styles.verseCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                ...Shadow.md,
              },
            ]}
          >
            <Text style={[styles.verseText, { color: colors.textPrimary }]}>
              {devotional.verse_text}
            </Text>
            <View style={[styles.referenceDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.verseReference, { color: colors.textSecondary }]}>
              {devotional.verse_reference}
            </Text>
          </View>

          {/* Reflection */}
          <View style={styles.reflectionSection}>
            <Text style={[styles.reflectionLabel, { color: colors.textTertiary }]}>
              REFLECTION
            </Text>
            <Text style={[styles.reflectionText, { color: colors.textPrimary }]}>
              {devotional.reflection}
            </Text>
          </View>

          {/* Share CTA */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleShare}
            style={[
              styles.shareCardButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.shareCardText, { color: colors.textSecondary }]}>
              Share today's devotional
            </Text>
            <Text style={[styles.shareArrow, { color: colors.accent }]}>→</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No devotional found for today. Check back soon.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.regular,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  headerDate: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  shareButton: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: '600',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.xl,
  },
  verseCard: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xl,
    gap: Spacing.base,
  },
  verseText: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.size.xl,
    lineHeight: Typography.size.xl * Typography.lineHeight.scripture,
    textAlign: 'center',
  },
  referenceDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.xl,
  },
  verseReference: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  reflectionSection: {
    gap: Spacing.md,
  },
  reflectionLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
    letterSpacing: 0.8,
  },
  reflectionText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
  },
  shareCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shareCardText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
  },
  shareArrow: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
  },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    fontWeight: '500',
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
  },
  // Locked screen styles
  lockedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.base,
  },
  lockIcon: {
    fontSize: 44,
    marginBottom: Spacing.sm,
  },
  lockedTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size['2xl'],
    fontWeight: '600',
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing.sm,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureTick: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    width: 20,
  },
  featureText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    flex: 1,
  },
  upgradeButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  upgradeButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    paddingVertical: Spacing.sm,
  },
  dismissText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },
});
