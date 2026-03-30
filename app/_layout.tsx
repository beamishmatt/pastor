import React, { useEffect, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  NotoSerif_400Regular,
  NotoSerif_400Regular_Italic,
  NotoSerif_500Medium,
  NotoSerif_600SemiBold,
  NotoSerif_700Bold,
  NotoSerif_700Bold_Italic,
} from '@expo-google-fonts/noto-serif';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Colors } from '../components/ui/tokens';
import { supabase } from '../lib/supabase';
import { seedBibleIfNeeded } from '../lib/bible-seed';
import { configureRevenueCat } from '../lib/revenuecat';
import type { Session } from '@supabase/supabase-js';

// Keep the splash screen visible while we set up the app
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [dataReady, setDataReady] = useState(false);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    NotoSerif_400Regular,
    NotoSerif_400Regular_Italic,
    NotoSerif_500Medium,
    NotoSerif_600SemiBold,
    NotoSerif_700Bold,
    NotoSerif_700Bold_Italic,
  });

  useEffect(() => {
    configureRevenueCat();

    // Resolve auth + seed local Bible DB in parallel before hiding splash
    Promise.all([
      supabase.auth.getSession(),
      seedBibleIfNeeded(),
    ]).then(([{ data: { session } }]) => {
      setSession(session);
      setDataReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (dataReady && fontsLoaded) SplashScreen.hideAsync();
  }, [dataReady, fontsLoaded]);

  // Redirect based on auth state once session is resolved
  useEffect(() => {
    if (session === undefined) return; // still loading
    if (session) {
      router.replace('/(app)');
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [session]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerShown: false,
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
