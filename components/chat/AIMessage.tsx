import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Colors, Typography, Spacing } from '../ui/tokens';
import VerseChip from './VerseChip';

interface CitedVerse {
  reference: string;
  book: string;
  chapter: number;
  verse: number;
}

interface AIMessageProps {
  content: string;
  citedVerses: CitedVerse[];
  isStreaming?: boolean;
  onVersePress: (reference: string) => void;
}

const BlinkingCursor: React.FC<{ color: string }> = ({ color }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.Text style={{ opacity, color, fontSize: Typography.size.base }}>
      {'\u2588'}
    </Animated.Text>
  );
};

const AIMessage: React.FC<AIMessageProps> = ({
  content,
  citedVerses,
  isStreaming = false,
  onVersePress,
}) => {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const markdownStyles = {
    body: {
      color: colors.textPrimary,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.base,
      lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
    },
    paragraph: {
      color: colors.textPrimary,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.base,
      lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
      marginTop: 0,
      marginBottom: Spacing.sm,
    },
    strong: {
      color: colors.textPrimary,
      fontFamily: Typography.fontFamily.bold,
      fontWeight: '700' as const,
    },
    em: {
      color: colors.textSecondary,
      fontStyle: 'italic' as const,
    },
    heading1: {
      color: colors.textPrimary,
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.size.xl,
      lineHeight: Typography.size.xl * Typography.lineHeight.tight,
      marginBottom: Spacing.sm,
      marginTop: Spacing.base,
      fontWeight: '700' as const,
    },
    heading2: {
      color: colors.textPrimary,
      fontFamily: Typography.fontFamily.semibold,
      fontSize: Typography.size.lg,
      lineHeight: Typography.size.lg * Typography.lineHeight.tight,
      marginBottom: Spacing.xs,
      marginTop: Spacing.md,
      fontWeight: '600' as const,
    },
    heading3: {
      color: colors.textPrimary,
      fontFamily: Typography.fontFamily.semibold,
      fontSize: Typography.size.md,
      lineHeight: Typography.size.md * Typography.lineHeight.normal,
      marginBottom: Spacing.xs,
      marginTop: Spacing.sm,
      fontWeight: '600' as const,
    },
    bullet_list: {
      marginBottom: Spacing.sm,
    },
    ordered_list: {
      marginBottom: Spacing.sm,
    },
    list_item: {
      color: colors.textPrimary,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.base,
      lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
    },
    blockquote: {
      backgroundColor: 'transparent',
      borderLeftColor: colors.accent,
      borderLeftWidth: 3,
      paddingLeft: Spacing.md,
      marginLeft: 0,
      marginBottom: Spacing.sm,
    },
    code_inline: {
      color: colors.accent,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.sm,
      backgroundColor: colors.surface,
    },
    fence: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    code_block: {
      color: colors.textPrimary,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.sm,
    },
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: Spacing.md,
    },
    link: {
      color: colors.accent,
      textDecorationLine: 'underline' as const,
    },
  };

  return (
    <View style={styles.wrapper}>
      <Markdown style={markdownStyles}>
        {isStreaming ? content + '\u200B' : content}
      </Markdown>

      {isStreaming && (
        <View style={styles.cursorWrapper}>
          <BlinkingCursor color={colors.textPrimary} />
        </View>
      )}

      {citedVerses.length > 0 && (
        <View style={styles.versesWrapper}>
          {citedVerses.map((verse) => (
            <VerseChip
              key={verse.reference}
              reference={verse.reference}
              onPress={onVersePress}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  cursorWrapper: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.xs,
  },
  versesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
});

export default AIMessage;
