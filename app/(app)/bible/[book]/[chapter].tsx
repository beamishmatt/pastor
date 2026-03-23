import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  GestureResponderEvent,
  Platform,
  SafeAreaView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../../components/ui/tokens';
import { useBibleReader } from '../../../../hooks/useBibleReader';
import {
  CHAPTER_COUNTS,
  Verse,
  getBookmarksForChapter,
  toggleBookmark,
  getHighlightsForChapter,
  upsertHighlight,
} from '../../../../lib/bible-db';
import { supabase } from '../../../../lib/supabase';
import { VerseActionTooltip } from '../../../../components/bible/VerseActionTooltip';

const TRANSLATION_KEY = 'pastor_translation';
const TRANSLATIONS = ['KJV', 'WEB'] as const;
type Translation = (typeof TRANSLATIONS)[number];

export default function ChapterScreen() {
  const { book: rawBook, chapter: rawChapter } = useLocalSearchParams<{
    book: string;
    chapter: string;
  }>();

  const book = decodeURIComponent(rawBook ?? 'Genesis');
  const chapterNumber = parseInt(rawChapter ?? '1', 10);

  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [translation, setTranslationState] = useState<Translation>('KJV');
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [menuAnchorY, setMenuAnchorY] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [highlightedVerses, setHighlightedVerses] = useState<Record<number, string>>({});
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  const { verses, isLoading, error, navigateTo, nextChapter, prevChapter } = useBibleReader(
    translation,
    book,
    chapterNumber
  );

  // Load saved translation and user session on mount
  useEffect(() => {
    AsyncStorage.getItem(TRANSLATION_KEY).then((stored) => {
      if (stored === 'KJV' || stored === 'WEB') {
        setTranslationState(stored as Translation);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, []);

  // Load chapter + persisted annotations whenever inputs change
  useEffect(() => {
    navigateTo(book, chapterNumber);
    if (userId) {
      Promise.all([
        getBookmarksForChapter(userId, translation, book, chapterNumber),
        getHighlightsForChapter(userId, translation, book, chapterNumber),
      ]).then(([bms, hls]) => {
        setBookmarkedVerses(new Set(bms.map((b) => b.verse)));
        setHighlightedVerses(Object.fromEntries(hls.map((h) => [h.verse, h.color])));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapterNumber, translation, userId]);

  const toggleTranslation = useCallback(async () => {
    const next: Translation = translation === 'KJV' ? 'WEB' : 'KJV';
    setTranslationState(next);
    await AsyncStorage.setItem(TRANSLATION_KEY, next);
  }, [translation]);

  const maxChapter = CHAPTER_COUNTS[book] ?? 1;

  const handlePrevChapter = useCallback(() => {
    if (chapterNumber > 1) {
      router.replace(`/bible/${encodeURIComponent(book)}/${chapterNumber - 1}`);
    } else {
      prevChapter();
    }
  }, [book, chapterNumber, prevChapter]);

  const handleNextChapter = useCallback(() => {
    if (chapterNumber < maxChapter) {
      router.replace(`/bible/${encodeURIComponent(book)}/${chapterNumber + 1}`);
    } else {
      nextChapter();
    }
  }, [book, chapterNumber, maxChapter, nextChapter]);

  // ─── Long press: just open the tooltip ──────────────────────────────────────

  const handleLongPress = useCallback((item: Verse, event: GestureResponderEvent) => {
    setSelectedVerse(item.verse);
    setMenuAnchorY(event.nativeEvent.pageY);
    setMenuVisible(true);
  }, []);

  // ─── Tooltip action handlers ─────────────────────────────────────────────────

  const handleHighlight = useCallback(async (color: string | null) => {
    if (selectedVerse === null) return;
    if (userId) await upsertHighlight(userId, translation, book, chapterNumber, selectedVerse, color);
    if (color === null) {
      setHighlightedVerses((prev) => { const n = { ...prev }; delete n[selectedVerse]; return n; });
    } else {
      setHighlightedVerses((prev) => ({ ...prev, [selectedVerse]: color }));
    }
  }, [selectedVerse, userId, translation, book, chapterNumber]);

  const handleBookmark = useCallback(async () => {
    if (selectedVerse === null) return;
    if (userId) {
      const added = await toggleBookmark(userId, translation, book, chapterNumber, selectedVerse);
      setBookmarkedVerses((prev) => {
        const n = new Set(prev);
        added ? n.add(selectedVerse) : n.delete(selectedVerse);
        return n;
      });
    } else {
      setBookmarkedVerses((prev) => {
        const n = new Set(prev);
        n.has(selectedVerse) ? n.delete(selectedVerse) : n.add(selectedVerse);
        return n;
      });
    }
  }, [selectedVerse, userId, translation, book, chapterNumber]);

  const handleShare = useCallback(() => {
    if (selectedVerse === null) return;
    const verse = verses.find((v) => v.verse === selectedVerse);
    if (!verse) return;
    Share.share({ message: `"${verse.text}" — ${book} ${chapterNumber}:${selectedVerse}` });
  }, [selectedVerse, verses, book, chapterNumber]);

  const handleCopy = useCallback(() => {
    if (selectedVerse === null) return;
    const verse = verses.find((v) => v.verse === selectedVerse);
    if (!verse) return;
    Share.share({ message: `${book} ${chapterNumber}:${selectedVerse}\n\n${verse.text}` });
  }, [selectedVerse, verses, book, chapterNumber]);

  const handleAskPastor = useCallback(async () => {
    if (selectedVerse === null) return;
    const verse = verses.find((v) => v.verse === selectedVerse);
    if (!verse) return;
    const ref = `${book} ${chapterNumber}:${selectedVerse}`;
    await AsyncStorage.setItem('pastor_ask_verse', JSON.stringify({ ref, text: verse.text }));
    router.push('/(app)');
  }, [selectedVerse, verses, book, chapterNumber]);

  const handleMenuDismiss = useCallback(() => {
    setMenuVisible(false);
    setSelectedVerse(null);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  const renderVerse = useCallback(
    ({ item }: { item: Verse }) => {
      const highlight = highlightedVerses[item.verse];
      const isBookmarked = bookmarkedVerses.has(item.verse);
      const isSelected = selectedVerse === item.verse;

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={(e) => handleLongPress(item, e)}
          delayLongPress={400}
          style={[
            styles.verseContainer,
            highlight ? { backgroundColor: highlight + 'BB' } : undefined,
            isSelected && !highlight ? { backgroundColor: colors.surface } : undefined,
          ]}
        >
          {isBookmarked && (
            <Text style={[styles.bookmarkIndicator, { color: colors.accent }]}>▌ </Text>
          )}
          <Text style={[styles.verseBody, { color: colors.textPrimary }]}>
            <Text style={[styles.verseNumber, { color: colors.textSecondary }]}>
              {item.verse}{' '}
            </Text>
            {item.text}
          </Text>
        </TouchableOpacity>
      );
    },
    [colors, highlightedVerses, bookmarkedVerses, selectedVerse, handleLongPress]
  );

  const keyExtractor = useCallback((item: Verse) => String(item.verse), []);

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Loading {book} {chapterNumber}…
          </Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.statusText, { color: colors.error }]}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Text style={[styles.statusText, { color: colors.textTertiary }]}>
          No verses found. The Bible database may not be populated yet.
        </Text>
      </View>
    );
  }, [isLoading, error, book, chapterNumber, colors]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerLeft}
        >
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {book} {chapterNumber}
          </Text>
        </View>

        <TouchableOpacity
          onPress={toggleTranslation}
          activeOpacity={0.7}
          style={[
            styles.translationBadge,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.translationText, { color: colors.textSecondary }]}>
            {translation}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chapter navigation strip */}
      <View
        style={[
          styles.chapterNav,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity
          onPress={handlePrevChapter}
          activeOpacity={0.6}
          style={styles.chapterNavButton}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.chapterNavText,
              { color: chapterNumber <= 1 ? colors.textTertiary : colors.accent },
            ]}
          >
            ← Prev
          </Text>
        </TouchableOpacity>

        <Text style={[styles.chapterNavLabel, { color: colors.textTertiary }]}>
          {chapterNumber} / {maxChapter}
        </Text>

        <TouchableOpacity
          onPress={handleNextChapter}
          activeOpacity={0.6}
          style={styles.chapterNavButton}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.chapterNavText,
              { color: chapterNumber >= maxChapter ? colors.textTertiary : colors.accent },
            ]}
          >
            Next →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Verse list */}
      {isLoading && verses.length === 0 ? (
        ListEmptyComponent
      ) : (
        <FlatList
          data={verses}
          keyExtractor={keyExtractor}
          renderItem={renderVerse}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmptyComponent}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}

      {/* Bottom navigation bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surfaceElevated,
            borderTopColor: colors.border,
            ...Shadow.sm,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePrevChapter}
          activeOpacity={0.6}
          style={styles.bottomNavButton}
          disabled={isLoading}
        >
          <Text style={[styles.bottomNavText, { color: colors.accent }]}>← Prev Chapter</Text>
        </TouchableOpacity>

        <View style={[styles.bottomDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          onPress={handleNextChapter}
          activeOpacity={0.6}
          style={styles.bottomNavButton}
          disabled={isLoading}
        >
          <Text style={[styles.bottomNavText, { color: colors.accent }]}>Next Chapter →</Text>
        </TouchableOpacity>
      </View>

      {/* Verse action tooltip */}
      <VerseActionTooltip
        visible={menuVisible}
        anchorY={menuAnchorY}
        isBookmarked={selectedVerse !== null && bookmarkedVerses.has(selectedVerse)}
        highlightColor={selectedVerse !== null ? highlightedVerses[selectedVerse] : undefined}
        onHighlight={handleHighlight}
        onBookmark={handleBookmark}
        onShare={handleShare}
        onCopy={handleCopy}
        onAskPastor={handleAskPastor}
        onDismiss={handleMenuDismiss}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.regular,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  translationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
  },
  translationText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  chapterNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chapterNavButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  chapterNavText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    fontWeight: '500',
  },
  chapterNavLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  bookmarkIndicator: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    lineHeight: Typography.size.lg * Typography.lineHeight.scripture,
  },
  verseNumber: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.lg * Typography.lineHeight.scripture,
  },
  verseBody: {
    flex: 1,
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.size.lg,
    lineHeight: Typography.size.lg * Typography.lineHeight.scripture,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
  },
  statusText: {
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? 0 : Spacing.sm,
  },
  bottomNavButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  bottomNavText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    fontWeight: '500',
  },
  bottomDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
});
