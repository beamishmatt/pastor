import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Colors, Typography as T, Spacing, Radius, Shadow } from '../../components/ui/tokens';
import { getOfferings, purchasePackage, restorePurchases, ENTITLEMENT_PRO } from '../../lib/revenuecat';
import { useSubscription } from '../../hooks/useSubscription';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES: { title: string; description: string }[] = [
  {
    title: 'Full access to Scripture',
    description: 'Read any passage in its complete context',
  },
  {
    title: 'Personalized guidance',
    description: "Conversations grounded in God's Word and shaped by your journey",
  },
  {
    title: 'Devotionals that grow with you',
    description: 'Reflections built from what you explore, return to, and carry in prayer',
  },
];

type PlanKey = 'annual' | 'monthly' | 'weekly';

const PLANS: { key: PlanKey; title: string; subtitle: string; price: string; unit: string; productId: string }[] = [
  {
    key: 'annual',
    title: 'Annual Plan',
    subtitle: 'First 7 days free, then $199/yr',
    price: '$3.83',
    unit: 'per week',
    productId: 'pastor_pro_annual',
  },
  {
    key: 'monthly',
    title: 'Monthly Plan',
    subtitle: 'Billed every month',
    price: '$18.99',
    unit: 'per month',
    productId: 'pastor_pro_monthly',
  },
  {
    key: 'weekly',
    title: 'Weekly Plan',
    subtitle: 'Flexible, cancel anytime',
    price: '$5.99',
    unit: 'per week',
    productId: 'pastor_pro_weekly',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PaywallScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const { refresh } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('annual');
  const [isLoading, setIsLoading] = useState(false);

  const goToApp = () => router.replace('/(app)/index');

  const handleSubscribe = async () => {
    if (isLoading) return;
    const plan = PLANS.find((p) => p.key === selectedPlan)!;
    setIsLoading(true);
    try {
      const offerings = await getOfferings();
      if (!offerings?.current) {
        Alert.alert('Unavailable', 'No subscription offerings found. Please try again later.');
        return;
      }
      const pkg = offerings.current.availablePackages.find(
        (p) => p.product.identifier === plan.productId
      );
      if (!pkg) {
        Alert.alert('Unavailable', 'That subscription option is not currently available.');
        return;
      }
      const { customerInfo } = await purchasePackage(pkg);
      if (customerInfo.entitlements.active[ENTITLEMENT_PRO]) {
        await refresh();
        goToApp();
      }
    } catch (e: any) {
      if (e?.code !== 1) {
        Alert.alert('Purchase failed', e?.message ?? 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const info = await restorePurchases();
      if (info.entitlements.active[ENTITLEMENT_PRO]) {
        await refresh();
        Alert.alert('Restored', 'Your Pro subscription has been restored!', [
          { text: 'Continue', onPress: goToApp },
        ]);
      } else {
        Alert.alert('Nothing to restore', 'No active Pastor Pro subscription was found.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message ?? 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const ctaLabel = selectedPlan === 'annual' ? 'Start 7-Day Free Trial' : 'Get Started';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <View style={styles.hero}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>Unlock Pro</Text>
          <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
            Deepen your spiritual journey with{'\n'}Scripture, prayer, and AI guidance.
          </Text>
        </View>

        {/* Feature list */}
        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.featureCardTitle, { color: colors.textTertiary }]}>
            YOUR JOURNEY, GUIDED BY SCRIPTURE
          </Text>
          {FEATURES.map((f, i) => (
            <View
              key={f.title}
              style={[
                styles.featureRow,
                i < FEATURES.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <Text style={[styles.bullet, { color: colors.textPrimary }]}>{'\u2022'}</Text>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.plans}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.key;
            const isAnnual = plan.key === 'annual';
            return (
              <View key={plan.key} style={styles.planWrapper}>
                {isAnnual && (
                  <View style={[styles.bestValueBadge, { backgroundColor: colors.surfaceContainerHighest, borderColor: colors.accent }]}>
                    <Text style={[styles.bestValueText, { color: colors.accent }]}>BEST VALUE</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: isSelected ? colors.surfaceElevated : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.border,
                      borderWidth: isSelected ? 2 : 1.5,
                    },
                    isAnnual && styles.planCardAnnual,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedPlan(plan.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`${plan.title}, ${plan.price} ${plan.unit}`}
                >
                  <View style={styles.planLeft}>
                    <Text style={[styles.planTitle, { color: colors.textPrimary }]}>{plan.title}</Text>
                    <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>{plan.subtitle}</Text>
                  </View>
                  <View style={styles.planRight}>
                    <Text style={[styles.planPrice, { color: colors.textPrimary }]}>{plan.price}</Text>
                    <Text style={[styles.planUnit, { color: colors.textSecondary }]}>{plan.unit}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Restore */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={isLoading}
          style={styles.restoreLink}
          accessibilityRole="button"
        >
          <Text style={[styles.restoreText, { color: colors.textTertiary }]}>Restore purchases</Text>
        </TouchableOpacity>

        {/* Disclosure */}
        <Text style={[styles.disclosure, { color: colors.textTertiary }]}>
          Payment charged to your Apple ID at confirmation. Subscription renews automatically unless cancelled at least 24 hours before the end of the current period. Any unused free trial portion is forfeited on purchase.
        </Text>

        {/* Bottom padding for sticky CTA */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + Spacing.base, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.accent, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSubscribe}
          disabled={isLoading}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          {isLoading
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={styles.ctaText}>{ctaLabel}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceElevated }, Shadow.md]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Processing…</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },

  hero: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  headline: {
    fontFamily: T.fontFamily.serifBold,
    fontSize: T.size['3xl'],
    lineHeight: T.size['3xl'] * 1.2,
    textAlign: 'center',
  },
  subheadline: {
    fontFamily: T.fontFamily.regular,
    fontSize: T.size.md,
    lineHeight: T.size.md * 1.55,
    textAlign: 'center',
  },

  // Feature list
  featureCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  featureCardTitle: {
    fontFamily: T.fontFamily.semibold,
    fontSize: T.size.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  bullet: {
    fontFamily: T.fontFamily.bold,
    fontSize: T.size.md,
    lineHeight: T.size.base * 1.5,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontFamily: T.fontFamily.semibold,
    fontSize: T.size.base,
    lineHeight: T.size.base * 1.4,
  },
  featureDesc: {
    fontFamily: T.fontFamily.regular,
    fontSize: T.size.sm,
    lineHeight: T.size.sm * 1.5,
  },

  // Plans
  plans: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  planWrapper: {
    position: 'relative',
  },
  bestValueBadge: {
    alignSelf: 'flex-start',
    marginLeft: Spacing.base,
    marginBottom: -10,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    zIndex: 1,
  },
  bestValueText: {
    fontFamily: T.fontFamily.semibold,
    fontSize: T.size.xs,
    letterSpacing: 0.8,
  },
  planCard: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardAnnual: {
    paddingTop: Spacing.lg,
  },
  planLeft: {
    flex: 1,
    gap: 2,
  },
  planTitle: {
    fontFamily: T.fontFamily.medium,
    fontSize: T.size.base,
  },
  planSubtitle: {
    fontFamily: T.fontFamily.regular,
    fontSize: T.size.sm,
  },
  planRight: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontFamily: T.fontFamily.serifBold,
    fontSize: T.size.xl,
  },
  planUnit: {
    fontFamily: T.fontFamily.regular,
    fontSize: T.size.xs,
  },

  restoreLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.base,
  },
  restoreText: {
    fontFamily: T.fontFamily.regular,
    fontSize: T.size.sm,
  },

  disclosure: {
    fontFamily: T.fontFamily.regular,
    fontSize: T.size.xs,
    textAlign: 'center',
    lineHeight: T.size.xs * 1.7,
  },

  // Sticky footer
  stickyFooter: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaButton: {
    borderRadius: Radius.full,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: T.fontFamily.semibold,
    fontSize: T.size.md,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.base,
    minWidth: 140,
  },
  loadingText: {
    fontFamily: T.fontFamily.regular,
    fontSize: T.size.sm,
  },
});
