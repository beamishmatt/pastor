import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="carousel" />
      <Stack.Screen name="personalize" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="paywall" />
    </Stack>
  );
}
