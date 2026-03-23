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

export default function LoginScreen() {
  const colors = Colors.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isAnyLoading = isLoadingEmail;

  const handleEmailSignIn = async () => {
    if (isLoadingEmail) return;
    setEmailError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setEmailError('Please enter your email and password.');
      return;
    }

    setIsLoadingEmail(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) throw error;
      // _layout auth listener handles redirect
    } catch (e: any) {
      setEmailError(e?.message ?? 'Sign in failed. Please try again.');
    } finally {
      setIsLoadingEmail(false);
    }
  };

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
          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.header, { color: colors.textPrimary }]}>
            Welcome back
          </Text>
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            Sign in to continue your journey.
          </Text>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
              Or sign in with email
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email form */}
          <View style={[styles.emailForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
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

            <View style={[styles.inputContainer, styles.inputContainerLast, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, styles.inputFlex, { color: colors.textPrimary, fontFamily: Typography.fontFamily.regular }]}
                placeholder="Password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleEmailSignIn}
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
              style={[styles.submitButton, { backgroundColor: colors.textPrimary, opacity: isAnyLoading ? 0.6 : 1 }]}
              activeOpacity={0.85}
              onPress={handleEmailSignIn}
              disabled={isAnyLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              {isLoadingEmail ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={[styles.submitText, { color: colors.background }]}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => Alert.alert('Reset password', 'Password reset coming soon.')}
            accessibilityRole="link"
          >
            <Text style={[styles.forgotText, { color: colors.textSecondary }]}>
              Forgot your password?
            </Text>
          </TouchableOpacity>

          {/* Sign up link */}
          <TouchableOpacity
            style={styles.signUpRow}
            onPress={() => router.replace('/(auth)/signup')}
            accessibilityRole="link"
          >
            <Text style={[styles.signUpText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium }}>
                Sign up
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  backButton: {
    marginBottom: Spacing.xl,
    alignSelf: 'flex-start',
  },
  header: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.size['2xl'],
    lineHeight: Typography.size['2xl'] * 1.25,
    marginBottom: Spacing.sm,
  },
  subtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.5,
    marginBottom: Spacing['2xl'],
  },
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
  emailForm: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
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
  inputFlex: { flex: 1 },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },
  submitButton: {
    borderRadius: Radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  submitText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
  },
  forgotRow: {
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  forgotText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },
  signUpRow: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  signUpText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
  },
});
