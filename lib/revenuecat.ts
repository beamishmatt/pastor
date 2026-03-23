import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!;

export const ENTITLEMENT_PRO = 'pro';

export function configureRevenueCat() {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  }
  if (Platform.OS === 'ios') {
    Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
  }
}

export async function getOfferings() {
  try {
    return await Purchases.getOfferings();
  } catch (e) {
    console.error('RevenueCat getOfferings error:', e);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage) {
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo() {
  return Purchases.getCustomerInfo();
}

export function hasProEntitlement(customerInfo: Awaited<ReturnType<typeof getCustomerInfo>>) {
  return customerInfo.entitlements.active[ENTITLEMENT_PRO] !== undefined;
}
