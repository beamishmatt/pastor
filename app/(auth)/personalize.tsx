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
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius } from '../../components/ui/tokens';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface TranslationOption {
  key: string;
  label: string;
  available: boolean;
}

const TRANSLATIONS: TranslationOption[] = [
  { key: 'KJV', label: 'KJV', available: true },
  { key: 'WEB', label: 'WEB', available: true },
  { key: 'ESV', label: 'ESV', available: false },
  { key: 'NIV', label: 'NIV', available: false },
  { key: 'NASB', label: 'NASB', available: false },
];

const FAITH_BACKGROUNDS: string[] = [
  'New to faith',
  'Growing Christian',
  'Lifelong believer',
  'Exploring',
  'Prefer not to say',
];

const MAX_HEART_TEXT = 500;

const STORAGE_KEY_TRANSLATION = 'pastor_translation';
const STORAGE_KEY_FAITH_BG = 'pastor_faith_bg';
const STORAGE_KEY_HEART_TEXT = 'pastor_heart_text';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PersonalizeScreen() {
  const colors = Colors.light;

  const [selectedTranslation, setSelectedTranslation] = useState('KJV');
  const [selectedFaithBg, setSelectedFaithBg] = useState<string | null>(null);
  const [heartText, setHeartText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleTranslationPress = (option: TranslationOption) => {
    if (!option.available) {
      Alert.alert('Coming soon', `${option.label} will be available in a future update.`);
      return;
    }
    setSelectedTranslation(option.key);
  };

  const handleContinue = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEY_TRANSLATION, selectedTranslation],
        [STORAGE_KEY_FAITH_BG, selectedFaithBg ?? ''],
        [STORAGE_KEY_HEART_TEXT, heartText.trim()],
      ]);
      router.push('/(auth)/signup');
    } catch (e) {
      Alert.alert('Error', 'Could not save your preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={[styles.header, { color: colors.textPrimary }]}>
            Help Pastor understand you.
          </Text>
          <Text style={[styles.subheader, { color: colors.textSecondary }]}>
            These choices shape how Pastor reads scripture with you.
          </Text>

          {/* Translation picker */}
          <SectionLabel label="Bible translation" colors={colors} />
          <View style={styles.chipRow}>
            {TRANSLATIONS.map((option) => {
              const isSelected = selectedTranslation === option.key;
              const isDisabled = !option.available;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.chip,
                    {
                      borderColor: isSelected
                        ? colors.accent
                        : colors.border,
                      backgroundColor: isSelected
                        ? colors.surface
                        : colors.background,
                      opacity: isDisabled ? 0.45 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleTranslationPress(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected, disabled: isDisabled }}
                  accessibilityLabel={`${option.label}${isDisabled ? ', coming soon' : ''}`}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? colors.accent : colors.textSecondary,
                        fontFamily: isSelected
                          ? Typography.fontFamily.medium
                          : Typography.fontFamily.regular,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Faith background */}
          <SectionLabel label="Faith background" colors={colors} />
          <View style={styles.chipWrap}>
            {FAITH_BACKGROUNDS.map((bg) => {
              const isSelected = selectedFaithBg === bg;
              return (
                <TouchableOpacity
                  key={bg}
                  style={[
                    styles.chip,
                    {
                      borderColor: isSelected ? colors.accent : colors.border,
                      backgroundColor: isSelected ? colors.surface : colors.background,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() =>
                    setSelectedFaithBg((prev) => (prev === bg ? null : bg))
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={bg}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? colors.accent : colors.textSecondary,
                        fontFamily: isSelected
                          ? Typography.fontFamily.medium
                          : Typography.fontFamily.regular,
                      },
                    ]}
                  >
                    {bg}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Heart text */}
          <SectionLabel label="What's on your heart right now?" colors={colors} optional />
          <View
            style={[
              styles.textAreaContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <TextInput
              style={[
                styles.textArea,
                {
                  color: colors.textPrimary,
                  fontFamily: Typography.fontFamily.regular,
                },
              ]}
              placeholder="Share anything — a struggle, a season of life, a hope…"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={MAX_HEART_TEXT}
              value={heartText}
              onChangeText={setHeartText}
              textAlignVertical="top"
              returnKeyType="default"
              accessibilityLabel="What's on your heart right now"
            />
            <Text style={[styles.charCounter, { color: colors.textTertiary }]}>
              {heartText.length}/{MAX_HEART_TEXT}
            </Text>
          </View>

          {/* Continue CTA */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: colors.textPrimary,
                opacity: isSaving ? 0.6 : 1,
              },
            ]}
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={[styles.continueButtonText, { color: colors.background }]}>
              {isSaving ? 'Saving…' : 'Continue'}
            </Text>
          </TouchableOpacity>

          {/* Bottom padding for keyboard avoidance */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SectionLabelProps {
  label: string;
  colors: typeof Colors.light;
  optional?: boolean;
}

function SectionLabel({ label, colors, optional }: SectionLabelProps) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>{label}</Text>
      {optional && (
        <Text style={[styles.optionalTag, { color: colors.textTertiary }]}>optional</Text>
      )}
    </View>
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
  subheader: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.5,
    marginBottom: Spacing['2xl'],
  },

  // Section labels
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  optionalTag: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'nowrap',
    marginBottom: Spacing['2xl'],
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  chipText: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.4,
  },

  // Text area
  textAreaContainer: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing['2xl'],
    minHeight: 120,
  },
  textArea: {
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.6,
    minHeight: 90,
  },
  charCounter: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },

  // CTA
  continueButton: {
    borderRadius: Radius.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    letterSpacing: 0.3,
  },

  bottomSpacer: {
    height: Spacing.xl,
  },
});
