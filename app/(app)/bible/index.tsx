import React, { useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../../components/ui/tokens';
import { BIBLE_BOOKS, CHAPTER_COUNTS } from '../../../lib/bible-db';

interface BookItem {
  name: string;
  chapters: number;
}

interface Section {
  title: string;
  data: BookItem[];
}

const SECTIONS: Section[] = [
  {
    title: 'Old Testament',
    data: BIBLE_BOOKS.OT.map((name) => ({ name, chapters: CHAPTER_COUNTS[name] ?? 0 })),
  },
  {
    title: 'New Testament',
    data: BIBLE_BOOKS.NT.map((name) => ({ name, chapters: CHAPTER_COUNTS[name] ?? 0 })),
  },
];

export default function BibleIndexScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const handleBookPress = useCallback((book: string, chapters: number) => {
    if (chapters === 1) {
      router.push(`/bible/${encodeURIComponent(book)}/1`);
    } else {
      router.push(`/bible/${encodeURIComponent(book)}`);
    }
  }, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View
        style={[
          styles.sectionHeader,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {section.title.toUpperCase()}
        </Text>
      </View>
    ),
    [colors]
  );

  const renderItem = useCallback(
    ({ item, index, section }: { item: BookItem; index: number; section: Section }) => {
      const isLast = index === section.data.length - 1;
      return (
        <TouchableOpacity
          onPress={() => handleBookPress(item.name, item.chapters)}
          activeOpacity={0.6}
          style={[
            styles.bookRow,
            {
              backgroundColor: colors.surfaceElevated,
              borderBottomColor: isLast ? 'transparent' : colors.border,
            },
          ]}
        >
          <Text style={[styles.bookName, { color: colors.textPrimary }]}>
            {item.name}
          </Text>
          <Text style={[styles.chapterCount, { color: colors.textTertiary }]}>
            {item.chapters} {item.chapters === 1 ? 'chapter' : 'chapters'}
          </Text>
        </TouchableOpacity>
      );
    },
    [colors, handleBookPress]
  );

  const keyExtractor = useCallback((item: BookItem) => item.name, []);

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
          style={styles.backButton}
        >
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bible</Text>
        <View style={styles.headerRight} />
      </View>

      <SectionList
        sections={SECTIONS}
        keyExtractor={keyExtractor}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        SectionSeparatorComponent={() => (
          <View style={[styles.sectionSeparator, { backgroundColor: colors.background }]} />
        )}
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
  backButton: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.regular,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    paddingBottom: Spacing['3xl'],
  },
  sectionHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    fontWeight: '500',
    letterSpacing: 0.8,
  },
  sectionSeparator: {
    height: Spacing.lg,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookName: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.4,
    flex: 1,
  },
  chapterCount: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },
});
