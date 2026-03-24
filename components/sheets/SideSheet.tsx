import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../ui/Typography';
import { Colors, Spacing, Radius, Shadow } from '../ui/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
}

interface SideSheetProps {
  isVisible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onBiblePress: () => void;
  onBookmarksPress: () => void;
  onPlansPress: () => void;
  onSettingsPress: () => void;
  isPro: boolean;
  userName?: string;
  userAvatar?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
export const SHEET_WIDTH = Math.round(SCREEN_WIDTH * 0.8);
// How much the chat interface overlaps the right edge of the sheet
const CHAT_OVERLAP = Math.round(SHEET_WIDTH * 0.12);


type ConversationGroup = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'Older';

function getGroup(date: Date): ConversationGroup {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1) return 'Today';
  if (diffDays < 2) return 'Yesterday';
  if (diffDays < 7) return 'Last 7 Days';
  if (diffDays < 30) return 'Last 30 Days';
  return 'Older';
}


type ListItem =
  | { type: 'group-header'; label: string; key: string }
  | { type: 'conversation'; conversation: Conversation; key: string };

function buildListItems(conversations: Conversation[]): ListItem[] {
  const GROUP_ORDER: ConversationGroup[] = [
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Last 30 Days',
    'Older',
  ];

  const grouped: Partial<Record<ConversationGroup, Conversation[]>> = {};
  for (const c of conversations) {
    const g = getGroup(c.updatedAt);
    if (!grouped[g]) grouped[g] = [];
    grouped[g]!.push(c);
  }

  const items: ListItem[] = [];
  for (const group of GROUP_ORDER) {
    const convs = grouped[group];
    if (!convs || convs.length === 0) continue;
    items.push({ type: 'group-header', label: group, key: `header-${group}` });
    for (const c of convs) {
      items.push({ type: 'conversation', conversation: c, key: `conv-${c.id}` });
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SideSheet({
  isVisible,
  onClose,
  conversations,
  onNewChat,
  onSelectConversation,
  onBiblePress,
  onBookmarksPress,
  onPlansPress,
  onSettingsPress,
  isPro,
  userName,
  userAvatar,
}: SideSheetProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  // Slide animation: translateX starts offscreen to the left
  const translateX = useRef(new Animated.Value(-SHEET_WIDTH)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isVisible ? 0 : -SHEET_WIDTH,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [isVisible, translateX]);

  // ---------------------------------------------------------------------------
  // List items
  // ---------------------------------------------------------------------------

  const listItems = buildListItems(conversations);

  const renderListItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'group-header') {
      return (
        <ThemedText
          variant="tertiary"
          size="xs"
          weight="semibold"
          style={[styles.groupHeader, { color: colors.textTertiary }]}
        >
          {item.label}
        </ThemedText>
      );
    }

    const { conversation } = item;
    const truncatedTitle =
      conversation.title.length > 50
        ? conversation.title.slice(0, 50) + '…'
        : conversation.title;

    return (
      <TouchableOpacity
        onPress={() => {
          onSelectConversation(conversation.id);
          onClose();
        }}
        style={styles.conversationRow}
        accessibilityRole="button"
        accessibilityLabel={conversation.title}
      >
        <ThemedText variant="primary" size="sm" style={styles.conversationTitle} numberOfLines={1}>
          {truncatedTitle}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const sheetBg = colors.surface;
  const borderColor = colors.border;
  const accentColor = colors.accent;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          backgroundColor: sheetBg,
          borderRightColor: borderColor,
          transform: [{ translateX }],
          width: SHEET_WIDTH,
        },
        Shadow.md,
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
        {/* 1. Wordmark */}
        <View style={[styles.userRow, { borderBottomColor: borderColor }]}>
          <Text style={styles.wordmark}>Pastor</Text>
        </View>

        {/* 2. New Chat + navigation rows */}
        <NavRow
          icon="edit"
          label="New Chat"
          onPress={() => { onNewChat(); onClose(); }}
          iconColor={textSecondary}
        />
        <NavRow
          icon="book-open"
          label="Bible"
          onPress={() => { onBiblePress(); onClose(); }}
          iconColor={textSecondary}
        />
        <NavRow
          icon="bookmark"
          label="Bookmarks"
          onPress={() => { onBookmarksPress(); onClose(); }}
          iconColor={textSecondary}
        />
        <NavRow
          icon="check-square"
          label="Reading Plans"
          onPress={() => { onPlansPress(); onClose(); }}
          iconColor={textSecondary}
        />
        {/* 3. Divider */}
        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        {/* 4. Conversation history */}
        <FlatList
          data={listItems}
          keyExtractor={(item) => item.key}
          renderItem={renderListItem}
          style={styles.conversationList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <ThemedText variant="tertiary" size="sm" style={styles.emptyText}>
              No conversations yet
            </ThemedText>
          }
        />

        {/* 5. Divider */}
        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        {/* 9. Settings */}
        <NavRow
          icon="settings"
          label="Settings"
          onPress={() => { onSettingsPress(); onClose(); }}
          iconColor={textSecondary}
        />

        {/* 10. Pro upgrade badge (non-pro only) */}
        {!isPro && (
          <TouchableOpacity
            style={[
              styles.proBadge,
              { backgroundColor: colors.verseChipFill, borderColor: accentColor },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Pastor Pro"
          >
            <View style={styles.proBadgeInner}>
              <Feather name="zap" size={16} color={accentColor} />
              <View style={styles.proBadgeText}>
                <ThemedText weight="bold" size="sm" style={{ color: textPrimary }}>
                  Pastor Pro
                </ThemedText>
                <ThemedText variant="secondary" size="xs">
                  Unlock devotionals & more
                </ThemedText>
              </View>
            </View>
            <ThemedText
              weight="semibold"
              size="xs"
              style={[styles.upgradeLabel, { color: accentColor }]}
            >
              Upgrade
            </ThemedText>
          </TouchableOpacity>
        )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// NavRow sub-component
// ---------------------------------------------------------------------------

interface NavRowProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  iconColor: string;
  lockOverlay?: boolean;
  lockColor?: string;
}

function NavRow({ icon, label, onPress, iconColor, lockOverlay, lockColor }: NavRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.navRow}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icon} size={18} color={lockOverlay ? lockColor : iconColor} />
      <ThemedText
        size="base"
        style={[styles.navLabel, { color: lockOverlay ? lockColor : undefined }]}
      >
        {label}
      </ThemedText>
      {lockOverlay && lockColor && (
        <Feather name="lock" size={14} color={lockColor} style={styles.lockIcon} />
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['3xl'],
    paddingRight: CHAT_OVERLAP,
    overflow: 'hidden',
  },

  // Wordmark row
  userRow: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
  },
  wordmark: {
    fontFamily: 'AlumniSans_600SemiBold',
    fontSize: 28,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },

  // Conversation list
  conversationList: {
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
  groupHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  conversationTitle: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.xs,
  },

  // Nav rows
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  navLabel: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  lockIcon: {
    marginLeft: Spacing.xs,
  },

  // Pro badge
  proBadge: {
    margin: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  proBadgeText: {
    flex: 1,
    gap: 2,
  },
  upgradeLabel: {
    flexShrink: 0,
  },
});
