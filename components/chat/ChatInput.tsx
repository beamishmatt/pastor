import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../ui/tokens';
import { ChatMode, CHAT_MODES } from '../../hooks/useConversation';

interface ChatInputProps {
  onSend: (text: string) => void;
  isPro: boolean;
  onPaywallPress: () => void;
  disabled?: boolean;
  activeMode?: ChatMode;
  onModeMenuPress?: () => void;
  onModeReset?: () => void;
  /** Pre-fills the input (e.g. from Ask Pastor in the Bible reader). Clears after being set. */
  externalText?: string;
  onExternalTextConsumed?: () => void;
  /** Verse/passage reference this session is scoped to (e.g. "John 3:16"). */
  scopeLabel?: string;
  onScopeReset?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isPro,
  onPaywallPress,
  disabled = false,
  activeMode = 'standard',
  onModeMenuPress,
  onModeReset,
  externalText,
  onExternalTextConsumed,
  scopeLabel,
  onScopeReset,
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (externalText) {
      setText(externalText);
      inputRef.current?.focus();
      onExternalTextConsumed?.();
    }
  }, [externalText, onExternalTextConsumed]);
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const isLocked = !isPro;
  const hasText = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isLocked) return;
    onSend(trimmed);
    setText('');
  };

  const handleActionPress = () => {
    if (isLocked) {
      onPaywallPress();
      return;
    }
    handleSend();
  };

  return (
    <View style={[styles.container, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={isLocked ? 'Unlock Pastor Pro to chat…' : 'Ask anything…'}
          placeholderTextColor={isLocked ? colors.locked : colors.textTertiary}
          multiline
          maxLength={4000}
          editable={!disabled && !isLocked}
          returnKeyType="default"
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontFamily: Typography.fontFamily.regular,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          onSubmitEditing={Platform.OS === 'ios' ? undefined : handleSend}
        />

        <View style={styles.actionsRow}>
          {/* Left group: plus + optional scope chip + optional mode chip */}
          <View style={styles.leftGroup}>
            <TouchableOpacity
              onPress={onModeMenuPress}
              disabled={disabled}
              activeOpacity={0.75}
              style={[styles.modeButton, { opacity: disabled ? 0.4 : 1 }]}
              accessibilityLabel="Chat mode"
              accessibilityRole="button"
            >
              <Feather name="plus" size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            {!!scopeLabel && (
              <TouchableOpacity
                onPress={onScopeReset}
                disabled={disabled}
                activeOpacity={0.75}
                style={[
                  styles.scopeChip,
                  { backgroundColor: colors.chipBackground, opacity: disabled ? 0.4 : 1 },
                ]}
                accessibilityLabel={`Scoped to ${scopeLabel}, tap to clear`}
                accessibilityRole="button"
              >
                <Text
                  style={[styles.scopeChipLabel, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {scopeLabel}
                </Text>
                <Feather name="x" size={10} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

            {activeMode !== 'standard' && (
              <TouchableOpacity
                onPress={onModeReset}
                disabled={disabled}
                activeOpacity={0.75}
                style={[
                  styles.modeChip,
                  { backgroundColor: colors.chipBackground, opacity: disabled ? 0.4 : 1 },
                ]}
                accessibilityLabel={`${activeMode} mode, tap to clear`}
                accessibilityRole="button"
              >
                <Text style={[styles.modeChipLabel, { color: colors.textPrimary }]}>
                  {CHAT_MODES.find((m) => m.id === activeMode)?.label ?? activeMode}
                </Text>
                <Feather name="x" size={10} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Send / lock — bottom right */}
          <TouchableOpacity
            onPress={handleActionPress}
            disabled={disabled || (!isLocked && !hasText)}
            activeOpacity={0.8}
            style={[
              styles.actionButton,
              {
                backgroundColor: isLocked ? colors.locked : colors.sendButton,
                opacity: (disabled || (!isLocked && !hasText)) ? 0.35 : 1,
              },
            ]}
          >
            {isLocked ? (
              <Feather name="lock" size={16} color={colors.background} />
            ) : (
              <Feather name="arrow-up" size={16} color={colors.background} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xs : 0,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
    minHeight: 44,
    maxHeight: Typography.size.base * Typography.lineHeight.normal * 5,
    paddingVertical: Spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    marginRight: -Spacing.sm - 2,
    marginLeft: -Spacing.sm - 2,
    marginBottom: -Spacing.xs,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    maxWidth: 160,
  },
  scopeChipLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    flexShrink: 1,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  modeChipLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatInput;
