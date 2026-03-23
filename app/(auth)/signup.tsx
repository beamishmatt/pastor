import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../components/ui/tokens';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SignupScreen() {
  const colors = Colors.light;

  const [emailExpanded, setEmailExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Google Sign-In (OAuth redirect — placeholder implementation)
  // -------------------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    if (isLoadingGoogle) return;
    setIsLoadingGoogle(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'pastor://auth/callback',
        },
      });
      if (error) throw error;
      // The OAuth flow opens a browser; session is picked up on redirect.
      // Navigation to paywall will be handled by auth state listener in _layout.
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message ?? 'An error occurred. Please try again.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // -------------------------------------------------------------------------
  // Email Sign-Up
  // -------------------------------------------------------------------------
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
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      if (error) throw error;

      router.replace('/(auth)/paywall');
    } catch (e: any) {
      setEmailError(e?.message ?? 'Sign up failed. Please try again.');
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const isAnyLoading = isLoadingGoogle || isLoadingEmail;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={[styles.header, { color: colors.textPrimary }]}>
            Create your free account
          </Text>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Account required to save your journey across devices.
          </Text>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
              Shadow.sm,
            ]}
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
                {/* Inline Google "G" mark */}
                <Text style={[styles.googleG, { color: '#4285F4' }]}>G</Text>
                <Text
                  style={[
                    styles.socialButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Sign in with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
              Or continue with email
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Expandable email section */}
          <TouchableOpacity
            style={[
              styles.emailToggle,
              {
                borderColor: colors.border,
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
              style={styles.chevron}
            />
          </TouchableOpacity>

          {emailExpanded && (
            <View
              style={[
                styles.emailForm,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Email field */}
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: colors.border },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.textPrimary,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
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

              {/* Password field */}
              <View
                style={[
                  styles.inputContainer,
                  styles.inputContainerLast,
                  { borderColor: colors.border },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    styles.inputFlex,
                    {
                      color: colors.textPrimary,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
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
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* Inline error */}
              {emailError && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {emailError}
                </Text>
              )}

              {/* Create account button */}
              <TouchableOpacity
                style={[
                  styles.emailSubmitButton,
                  {
                    backgroundColor: colors.textPrimary,
                    opacity: isAnyLoading ? 0.6 : 1,
                  },
                ]}
                activeOpacity={0.85}
                onPress={handleEmailSignUp}
                disabled={isAnyLoading}
                accessibilityRole="button"
                accessibilityLabel="Create account"
              >
                {isLoadingEmail ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text
                    style={[
                      styles.emailSubmitText,
                      { color: colors.background },
                    ]}
                  >
                    Create account
                  </Text>
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
              onPress={() =>
                Alert.alert('Terms of Service', 'Full terms coming soon.')
              }
              accessibilityRole="link"
            >
              <Text style={[styles.termsLink, { color: colors.textSecondary }]}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: colors.textTertiary }]}> and </Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Privacy Policy', 'Full privacy policy coming soon.')
              }
              accessibilityRole="link"
            >
              <Text style={[styles.termsLink, { color: colors.textSecondary }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: colors.textTertiary }]}>.</Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
  },

  // Header
  header: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.size['2xl'],
    lineHeight: Typography.size['2xl'] * 1.25,
    marginBottom: Spacing.sm,
  },
  noteText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.5,
    marginBottom: Spacing['2xl'],
  },

  // Google button
  socialButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: Radius.lg,
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
  socialButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Email toggle
  emailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  emailToggleText: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
  },
  chevron: {
    marginLeft: 'auto',
  },

  // Email form
  emailForm: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.sm,
  },
  inputContainerLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  input: {
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.5,
    paddingVertical: Spacing.sm,
  },
  inputFlex: {
    flex: 1,
  },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.5,
  },
  emailSubmitButton: {
    borderRadius: Radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  emailSubmitText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
  },

  // Terms
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

  bottomSpacer: {
    height: Spacing.xl,
  },
});
