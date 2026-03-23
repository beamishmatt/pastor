import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { CustomerInfo } from 'react-native-purchases';
import { getCustomerInfo, hasProEntitlement } from '../lib/revenuecat';

interface SubscriptionState {
  isPro: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const devProOverride = __DEV__ && process.env.EXPO_PUBLIC_DEV_PRO === 'true';

  const refresh = useCallback(async () => {
    if (devProOverride) {
      setIsLoading(false);
      return;
    }
    try {
      const info = await getCustomerInfo();
      setCustomerInfo(info);
    } catch (e) {
      console.error('useSubscription refresh error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [devProOverride]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-check on foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refresh();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [refresh]);

  return {
    isPro: devProOverride || (customerInfo ? hasProEntitlement(customerInfo) : false),
    isLoading,
    customerInfo,
    refresh,
  };
}
