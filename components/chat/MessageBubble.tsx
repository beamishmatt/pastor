import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../ui/tokens';

interface MessageBubbleProps {
  content: string;
  createdAt: Date;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ content }) => {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: colors.userBubble },
        ]}
      >
        <Text
          style={[
            styles.content,
            { color: colors.textPrimary },
          ]}
        >
          {content}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-end',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderBottomRightRadius: Radius.sm,
  },
  content: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
  },
});

export default MessageBubble;
