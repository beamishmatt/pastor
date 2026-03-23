import React, { useCallback, useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../../../components/ui/Typography';
import { Colors, Spacing, Radius, Typography as T } from '../../../components/ui/tokens';
import {
  getAllBookmarks,
  getVerse,
  toggleBookmark,
  type Bookmark,
} from '../../../lib/bible-db';
import { supabase } from '../../../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BookmarkWithText = Bookmark & { verseText: string };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BookmarksScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [bookmarks, setBookmarks] = useState<BookmarkWithText[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const loadBookmarks = useCallback(async (uid: string) => {
    const bms = await getAllBookmarks(uid);
    const withText = await Promise.all(
      bms.map(async (b) => {
        const v = await getVerse(b.translation, b.book, b.chapter, b.verse);
        return { ...b, verseText: v?.text ?? '' };
      })
    );
    setBookmarks(withText);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        loadBookmarks(uid).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [loadBookmarks]);

  const handleOverflow = useCallback(
    (bookmark: BookmarkWithText) => {
      const reference = `${bookmark.book} ${bookmark.chapter}:${bookmark.verse}`;
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete', 'Chat', 'Open Chapter'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: reference,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            if (!userId) return;
            Alert.alert(
              'Remove Bookmark',
              `Remove ${reference}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: async () => {
                    await toggleBookmark(userId, bookmark.translation, bookmark.book, bookmark.chapter, bookmark.verse);
                    setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
                  },
                },
              ]
            );
          } else if (buttonIndex === 2) {
            router.push(`/?verse=${encodeURIComponent(reference)}`);
          } else if (buttonIndex === 3) {
            router.push(`/bible/${encodeURIComponent(bookmark.book)}/${bookmark.chapter}`);
          }
        }
      );
    },
    [userId]
  );

  const handlePress = useCallback((bookmark: BookmarkWithText) => {
    router.push(`/bible/${encodeURIComponent(bookmark.book)}/${bookmark.chapter}`);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <ThemedText serif weight="bold" size="lg" style={styles.title}>
          Bookmarks
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ThemedText variant="tertiary" size="sm">Loading…</ThemedText>
        </View>
      ) : !userId ? (
        <View style={styles.centerState}>
          <Feather name="bookmark" size={40} color={colors.textTertiary} />
          <ThemedText variant="tertiary" size="base" style={styles.emptyTitle}>
            Sign in to save bookmarks
          </ThemedText>
        </View>
      ) : bookmarks.length === 0 ? (
        <View style={styles.centerState}>
          <Feather name="bookmark" size={40} color={colors.textTertiary} />
          <ThemedText variant="tertiary" size="base" style={styles.emptyTitle}>
            No bookmarks yet
          </ThemedText>
          <ThemedText variant="tertiary" size="sm" style={styles.emptySubtitle}>
            Long-press any verse in the Bible reader{'\n'}or tap a verse chip in chat to bookmark it.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BookmarkRow
              bookmark={item}
              colors={colors}
              onPress={() => handlePress(item)}
              onOverflow={() => handleOverflow(item)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// BookmarkRow
// ---------------------------------------------------------------------------

function BookmarkRow({
  bookmark,
  colors,
  onPress,
  onOverflow,
}: {
  bookmark: BookmarkWithText;
  colors: (typeof Colors)['light'];
  onPress: () => void;
  onOverflow: () => void;
}) {
  const reference = `${bookmark.book} ${bookmark.chapter}:${bookmark.verse}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.row}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={reference}
    >
      <View style={styles.rowBody}>
        <ThemedText weight="semibold" size="sm" style={{ color: colors.accent }}>
          {reference}
        </ThemedText>
        {bookmark.verseText ? (
          <ThemedText
            serif
            size="sm"
            variant="secondary"
            numberOfLines={2}
            style={styles.rowText}
          >
            {bookmark.verseText}
          </ThemedText>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={onOverflow}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.overflowBtn}
        accessibilityRole="button"
        accessibilityLabel={`More options for ${reference}`}
      >
        <Feather name="more-vertical" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: T.size.sm * 1.6,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowText: {
    lineHeight: T.size.sm * 1.5,
  },
  overflowBtn: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
});
