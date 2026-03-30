import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../components/ui/tokens';

export default function SignupScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();

  const [emailExpanded, setEmailExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (isLoadingGoogle) return;
    setIsLoadingGoogle(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'pastor://auth/callback' },
      });
      if (error) throw error;
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message ?? 'An error occurred. Please try again.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (isLoadingEmail) return;
    setEmailError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setEmailError('Please enter your email and a password.');
      return;
    }
    if (password.length < 8) {
      setEmailError('Password must be at least 8 characters.');
      return;
    }

    setIsLoadingEmail(true);
    try {
      const { error } = await supabase.auth.signUp({ email: trimmedEmail, password });
      if (error) throw error;
      router.replace('/(auth)/paywall');
    } catch (e: any) {
      setEmailError(e?.message ?? 'Sign up failed. Please try again.');
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const isAnyLoading = isLoadingGoogle || isLoadingEmail;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing['2xl'], paddingBottom: insets.bottom + Spacing['2xl'] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={[styles.header, { color: colors.textPrimary }]}>
            Create your account.
          </Text>
          <Text style={[styles.subheader, { color: colors.textSecondary }]}>
            Save your journey and pick up where you left off on any device.
          </Text>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, Shadow.sm]}
            activeOpacity={0.8}
            onPress={handleGoogleSignIn}
            disabled={isAnyLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
          >
            {isLoadingGoogle ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <>
                <Text style={[styles.googleG, { color: '#4285F4' }]}>G</Text>
                <Text style={[styles.googleText, { color: colors.textPrimary }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerLabel, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email toggle */}
          <TouchableOpacity
            style={[
              styles.emailToggle,
              {
                borderColor: emailExpanded ? colors.accent : colors.border,
                backgroundColor: emailExpanded ? colors.surface : colors.background,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => setEmailExpanded((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={emailExpanded ? 'Collapse email form' : 'Expand email form'}
          >
            <Feather name="mail" size={16} color={colors.textSecondary} />
            <Text style={[styles.emailToggleText, { color: colors.textSecondary }]}>
              Email and password
            </Text>
            <Feather
              name={emailExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {emailExpanded && (
            <View style={[styles.emailForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Email */}
              <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, fontFamily: Typography.fontFamily.regular }]}
                  placeholder="Email address"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  accessibilityLabel="Email address"
                />
              </View>

              {/* Password */}
              <View style={[styles.inputRow, styles.inputRowLast]}>
                <TextInput
                  style={[styles.input, styles.inputFlex, { color: colors.textPrimary, fontFamily: Typography.fontFamily.regular }]}
                  placeholder="Password (min. 8 characters)"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password-new"
                  returnKeyType="done"
                  onSubmitEditing={handleEmailSignUp}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              {emailError && (
                <Text style={[styles.errorText, { color: colors.error }]}>{emailError}</Text>
              )}

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.accent, opacity: isAnyLoading ? 0.6 : 1 }]}
                activeOpacity={0.85}
                onPress={handleEmailSignUp}
                disabled={isAnyLoading}
                accessibilityRole="button"
                accessibilityLabel="Create account"
              >
                {isLoadingEmail ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Create account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Terms */}
          <View style={styles.termsRow}>
            <Text style={[styles.termsText, { color: colors.textTertiary }]}>
              By continuing you agree to our{' '}
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Terms of Service', 'Full terms coming soon.')}
              accessibilityRole="link"
            >
              <Text style={[styles.termsLink, { color: colors.textSecondary }]}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: colors.textTertiary }]}> and </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Privacy Policy', 'Full privacy policy coming soon.')}
              accessibilityRole="link"
            >
              <Text style={[styles.termsLink, { color: colors.textSecondary }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: colors.textTertiary }]}>.</Text>
          </View>

          {/* Sign in link */}
          <TouchableOpacity
            style={styles.signInLink}
            activeOpacity={0.6}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="link"
          >
            <Text style={[styles.signInText, { color: colors.textTertiary }]}>
              Already have an account?{' '}
              <Text style={{ color: colors.accent, fontFamily: Typography.fontFamily.medium }}>
                Sign in
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },

  header: {
    fontFamily: Typography.fontFamily.serifBold,
    fontSize: Typography.size['3xl'],
    lineHeight: Typography.size['3xl'] * 1.2,
    marginBottom: Spacing.sm,
  },
  subheader: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    lineHeight: Typography.size.md * 1.55,
    marginBottom: Spacing['3xl'],
  },

  googleButton: {
    flexDirection: 'row',
    height: 58,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  googleG: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.lg,
    lineHeight: Typography.size.lg,
  },
  googleText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },

  emailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  emailToggleText: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
  },

  emailForm: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.sm,
  },
  inputRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  input: {
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.5,
    paddingVertical: Spacing.sm,
  },
  inputFlex: { flex: 1 },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.5,
  },
  submitButton: {
    borderRadius: Radius.full,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  submitText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  termsText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    lineHeight: Typography.size.xs * 1.6,
  },
  termsLink: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    lineHeight: Typography.size.xs * 1.6,
    textDecorationLine: 'underline',
  },

  signInLink: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  signInText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
  },
});
