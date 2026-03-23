import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  View,
  Animated,
  StyleSheet,
  useColorScheme,
  ListRenderItemInfo,
} from 'react-native';
import { Colors, Spacing } from '../ui/tokens';
import MessageBubble from './MessageBubble';
import AIMessage from './AIMessage';
import type { Message } from '../../hooks/useConversation';

export type { Message };

interface MessageListProps {
  messages: Message[];
  onVersePress: (reference: string) => void;
  isStreaming?: boolean;
}

const TypingDot: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: -5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [translateY, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color, transform: [{ translateY }] },
      ]}
    />
  );
};

const TypingIndicator: React.FC = () => {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.typingWrapper}>
      <View style={styles.typingDots}>
        <TypingDot delay={0} color={colors.textTertiary} />
        <TypingDot delay={150} color={colors.textTertiary} />
        <TypingDot delay={300} color={colors.textTertiary} />
      </View>
    </View>
  );
};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onVersePress,
  isStreaming = false,
}) => {
  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator =
    isStreaming && (!lastMessage || lastMessage.role === 'user');

  const renderItem = ({ item }: ListRenderItemInfo<Message>) => {
    if (item.hidden) return null;
    if (item.role === 'user') {
      return (
        <MessageBubble
          content={item.content}
          createdAt={item.createdAt}
        />
      );
    }

    return (
      <AIMessage
        content={item.content}
        citedVerses={item.citedVerses ?? []}
        isStreaming={item.isStreaming}
        onVersePress={onVersePress}
      />
    );
  };

  const keyExtractor = (item: Message) => item.id;

  const ListHeader = showTypingIndicator ? <TypingIndicator /> : null;

  return (
    <FlatList
      data={[...messages].reverse()}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      inverted
      ListHeaderComponent={ListHeader}
      contentContainerStyle={styles.contentContainer}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
  },
  typingWrapper: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

export default MessageList;
