import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography as T, Spacing, Radius, Shadow } from '../../components/ui/tokens';
import { getOfferings, purchasePackage, restorePurchases, ENTITLEMENT_PRO } from '../../lib/revenuecat';
import { useSubscription } from '../../hooks/useSubscription';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES: Array<{ label: string; free: boolean; pro: boolean }> = [
  { label: 'Full Bible text',          free: true,  pro: true },
  { label: 'Daily verse',              free: true,  pro: true },
  { label: 'Bookmarks & highlights',   free: true,  pro: true },
  { label: 'AI conversation',          free: false, pro: true },
  { label: 'Voice prayer & study',     free: false, pro: true },
  { label: 'Spiritual journey memory', free: false, pro: true },
  { label: 'Personalized devotionals', free: false, pro: true },
];

const PRODUCT_IDS = {
  annual:  'pastor_pro_annual',
  monthly: 'pastor_pro_monthly',
  weekly:  'pastor_pro_weekly',
} as const;

const CHECKMARK = '✓';
const DASH = '—';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PaywallScreen() {
  const colors = Colors.light;
  const { refresh } = useSubscription();

  const [isLoading, setIsLoading] = useState(false);

  // Navigate to main app
  const goToApp = () => router.replace('/(app)/index');

  // Purchase a specific product by its ID
  const handlePurchase = async (productId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const offerings = await getOfferings();
      if (!offerings?.current) {
        Alert.alert('Unavailable', 'No subscription offerings found. Please try again later.');
        return;
      }

      // Find matching package across all offering packages
      const allPackages = offerings.current.availablePackages;
      const pkg = allPackages.find(
        (p) => p.product.identifier === productId
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
      // Code 1 = user cancelled — no-op
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
        Alert.alert('Nothing to restore', 'No active Pastor Pro subscription was found for your account.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message ?? 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Headline */}
        <View style={styles.heroSection}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Unlock your personal pastor
          </Text>
          <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
            Scripture-grounded answers. Remembers your journey.
          </Text>
        </View>

        {/* Feature comparison table */}
        <View
          style={[
            styles.table,
            { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
          ]}
        >
          {/* Table header */}
          <View
            style={[
              styles.tableRow,
              styles.tableHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.featureCell} />
            <View style={styles.planCell}>
              <Text style={[styles.planHeaderText, { color: colors.textSecondary }]}>
                Free
              </Text>
            </View>
            <View style={styles.planCell}>
              <Text
                style={[
                  styles.planHeaderText,
                  styles.proPlanText,
                  { color: colors.accent },
                ]}
              >
                Pro
              </Text>
            </View>
          </View>

          {FEATURES.map((feature, index) => {
            const isLast = index === FEATURES.length - 1;
            return (
              <View
                key={feature.label}
                style={[
                  styles.tableRow,
                  !isLast && styles.tableRowBorder,
                  !isLast && { borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.featureCell}>
                  <Text style={[styles.featureLabel, { color: colors.textPrimary }]}>
                    {feature.label}
                  </Text>
                </View>
                <View style={styles.planCell}>
                  <Text
                    style={[
                      styles.checkmark,
                      { color: feature.free ? colors.success : colors.textTertiary },
                    ]}
                  >
                    {feature.free ? CHECKMARK : DASH}
                  </Text>
                </View>
                <View style={styles.planCell}>
                  <Text style={[styles.checkmark, { color: colors.success }]}>
                    {CHECKMARK}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Pricing buttons */}
        <View style={styles.pricingSection}>
          {/* Annual — primary CTA */}
          <TouchableOpacity
            style={[
              styles.pricingButton,
              styles.annualButton,
              { backgroundColor: colors.textPrimary, opacity: isLoading ? 0.6 : 1 },
            ]}
            onPress={() => handlePurchase(PRODUCT_IDS.annual)}
            disabled={isLoading}
            accessibilityLabel="Start 7-day free trial — $3.83 per week, billed $199 per year"
            accessibilityRole="button"
            activeOpacity={0.85}
          >
            <View style={[styles.annualBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.annualBadgeText}>Best value</Text>
            </View>
            <Text style={[styles.pricingButtonTitle, styles.annualButtonTitle]}>
              Start 7-day free trial
            </Text>
            <Text style={[styles.pricingButtonSubtitle, styles.annualButtonSubtitle]}>
              $3.83/wk, billed $199/yr
            </Text>
          </TouchableOpacity>

          {/* Monthly */}
          <TouchableOpacity
            style={[
              styles.pricingButton,
              styles.secondaryButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
            onPress={() => handlePurchase(PRODUCT_IDS.monthly)}
            disabled={isLoading}
            accessibilityLabel="$18.99 per month"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text style={[styles.pricingButtonTitle, { color: colors.textPrimary }]}>
              $18.99 / month
            </Text>
          </TouchableOpacity>

          {/* Weekly */}
          <TouchableOpacity
            style={[
              styles.pricingButton,
              styles.secondaryButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
            onPress={() => handlePurchase(PRODUCT_IDS.weekly)}
            disabled={isLoading}
            accessibilityLabel="$5.99 per week"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text style={[styles.pricingButtonTitle, { color: colors.textPrimary }]}>
              $5.99 / week
            </Text>
          </TouchableOpacity>
        </View>

        {/* Free dismiss link */}
        <TouchableOpacity
          onPress={goToApp}
          style={styles.dismissLink}
          accessibilityLabel="Continue with free Bible reader"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.dismissText, { color: colors.textSecondary }]}>
            Continue with free Bible reader
          </Text>
        </TouchableOpacity>

        {/* Restore purchases */}
        <TouchableOpacity
          onPress={handleRestore}
          style={styles.restoreLink}
          disabled={isLoading}
          accessibilityLabel="Restore purchases"
          accessibilityRole="button"
        >
          <Text style={[styles.restoreText, { color: colors.textTertiary }]}>
            Restore purchases
          </Text>
        </TouchableOpacity>

        {/* Apple disclosure */}
        <Text style={[styles.disclosure, { color: colors.textTertiary }]}>
          {`Payment will be charged to your Apple ID account at the confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel subscriptions in your App Store account settings after purchase. Any unused portion of a free trial will be forfeited when you purchase a subscription.`}
        </Text>
      </ScrollView>

      {/* Full-screen loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingCard,
              { backgroundColor: colors.surfaceElevated },
              Shadow.md,
            ]}
          >
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Processing...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    paddingTop:
      Platform.OS === 'android'
        ? (StatusBar.currentHeight ?? 0) + Spacing.base
        : Spacing['2xl'],
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  headline: {
    fontSize: T.size['2xl'],
    fontFamily: T.fontFamily.serif,
    textAlign: 'center',
    lineHeight: T.size['2xl'] * 1.25,
  },
  subheadline: {
    fontSize: T.size.base,
    fontFamily: T.fontFamily.regular,
    textAlign: 'center',
    lineHeight: T.size.base * T.lineHeight.normal,
  },

  // Feature table
  table: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing['2xl'],
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  tableRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureCell: {
    flex: 1,
  },
  planCell: {
    width: 52,
    alignItems: 'center',
  },
  planHeaderText: {
    fontSize: T.size.sm,
    fontFamily: T.fontFamily.medium,
  },
  proPlanText: {
    fontFamily: T.fontFamily.bold,
  },
  featureLabel: {
    fontSize: T.size.sm,
    fontFamily: T.fontFamily.regular,
    lineHeight: T.size.sm * T.lineHeight.normal,
  },
  checkmark: {
    fontSize: T.size.base,
    fontFamily: T.fontFamily.medium,
  },

  // Pricing section
  pricingSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  pricingButton: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  annualButton: {
    paddingTop: Spacing.xl + 4,
    paddingBottom: Spacing.lg,
    minHeight: 88,
  },
  annualBadge: {
    position: 'absolute',
    top: -12,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  annualBadgeText: {
    color: '#FFFFFF',
    fontSize: T.size.xs,
    fontFamily: T.fontFamily.semibold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  annualButtonTitle: {
    color: '#FFFFFF',
    fontSize: T.size.md,
    fontFamily: T.fontFamily.semibold,
  },
  annualButtonSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  pricingButtonTitle: {
    fontSize: T.size.base,
    fontFamily: T.fontFamily.medium,
  },
  pricingButtonSubtitle: {
    fontSize: T.size.sm,
    fontFamily: T.fontFamily.regular,
  },

  // Links
  dismissLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dismissText: {
    fontSize: T.size.sm,
    fontFamily: T.fontFamily.regular,
    textDecorationLine: 'underline',
  },
  restoreLink: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  restoreText: {
    fontSize: T.size.xs,
    fontFamily: T.fontFamily.regular,
  },

  // Disclosure
  disclosure: {
    fontSize: T.size.xs,
    fontFamily: T.fontFamily.regular,
    textAlign: 'center',
    lineHeight: T.size.xs * T.lineHeight.relaxed,
  },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
    fontSize: T.size.sm,
    fontFamily: T.fontFamily.regular,
  },
});
