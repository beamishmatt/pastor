import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Colors, Typography as T, Spacing, Radius, Shadow } from '../ui/tokens';

interface PaywallModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPurchase: (productId: string) => Promise<void>;
  isLoading?: boolean;
}

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
  annual: 'pastor_pro_annual',
  monthly: 'pastor_pro_monthly',
  weekly: 'pastor_pro_weekly',
} as const;

const CHECKMARK = '✓';
const DASH = '—';

export default function PaywallModal({
  isVisible,
  onClose,
  onPurchase,
  isLoading = false,
}: PaywallModalProps) {
  const scheme = 'light' as const; // Paywall always uses light scheme for readability
  const colors = Colors[scheme];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.closeIcon, { color: colors.textTertiary }]}>✕</Text>
          </TouchableOpacity>

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
          <View style={[styles.table, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
            {/* Table header */}
            <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.featureCell} />
              <View style={styles.planCell}>
                <Text style={[styles.planHeaderText, { color: colors.textSecondary }]}>Free</Text>
              </View>
              <View style={styles.planCell}>
                <Text style={[styles.planHeaderText, styles.proPlanText, { color: colors.accent }]}>
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
                    <Text style={[styles.checkmark, { color: colors.success }]}>{CHECKMARK}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Pricing section */}
          <View style={styles.pricingSection}>
            {/* Annual — primary CTA */}
            <TouchableOpacity
              style={[styles.pricingButton, styles.annualButton, { backgroundColor: colors.textPrimary }]}
              onPress={() => onPurchase(PRODUCT_IDS.annual)}
              accessibilityLabel="Start 7-day free trial — $3.83 per week, billed $199 per year"
              accessibilityRole="button"
              activeOpacity={0.85}
            >
              <View style={styles.annualBadge}>
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
              style={[styles.pricingButton, styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
              onPress={() => onPurchase(PRODUCT_IDS.monthly)}
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
              style={[styles.pricingButton, styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
              onPress={() => onPurchase(PRODUCT_IDS.weekly)}
              accessibilityLabel="$5.99 per week"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <Text style={[styles.pricingButtonTitle, { color: colors.textPrimary }]}>
                $5.99 / week
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dismiss link */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.dismissLink}
            accessibilityLabel="Continue with free Bible reader"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.dismissText, { color: colors.textSecondary }]}>
              Continue with free Bible reader
            </Text>
          </TouchableOpacity>

          {/* Apple disclosure */}
          <Text style={[styles.disclosure, { color: colors.textTertiary }]}>
            {`Payment will be charged to your Apple ID account at the confirmation of purchase. Subscription automatically renews unless it is cancelled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your account settings on the App Store after purchase. Any unused portion of a free trial period, if offered, will be forfeited when you purchase a subscription.`}
          </Text>
        </ScrollView>

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={[styles.loadingCard, { backgroundColor: colors.surfaceElevated }, Shadow.md]}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Processing...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + Spacing.base : Spacing.base,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  closeIcon: {
    fontSize: T.size.base,
    fontFamily: T.fontFamily.regular,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  headline: {
    fontSize: T.size['2xl'],
    fontFamily: T.fontFamily.bold,
    textAlign: 'center',
    lineHeight: T.size['2xl'] * 1.25,
  },
  subheadline: {
    fontSize: T.size.base,
    fontFamily: T.fontFamily.regular,
    textAlign: 'center',
    lineHeight: T.size.base * T.lineHeight.normal,
  },

  // Table
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

  // Pricing
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
    paddingTop: Spacing.xl + 4, // extra top padding to clear the badge
    paddingBottom: Spacing.lg,
    minHeight: 88,
  },
  annualBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: Colors.light.accent,
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

  // Dismiss
  dismissLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dismissText: {
    fontSize: T.size.sm,
    fontFamily: T.fontFamily.regular,
    textDecorationLine: 'underline',
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
