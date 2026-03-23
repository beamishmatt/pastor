import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../../../components/ui/tokens';
import { CHAPTER_COUNTS } from '../../../../lib/bible-db';

const NUM_COLUMNS = 5;

export default function ChapterPickerScreen() {
  const { book: rawBook } = useLocalSearchParams<{ book: string }>();
  const book = decodeURIComponent(rawBook ?? 'Genesis');
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const maxChapter = CHAPTER_COUNTS[book] ?? 1;
  const chapters = useMemo(
    () => Array.from({ length: maxChapter }, (_, i) => i + 1),
    [maxChapter]
  );

  const handleChapterPress = useCallback(
    (chapter: number) => {
      router.push(`/bible/${encodeURIComponent(book)}/${chapter}`);
    },
    [book]
  );

  const renderItem = useCallback(
    ({ item }: { item: number }) => (
      <TouchableOpacity
        onPress={() => handleChapterPress(item)}
        activeOpacity={0.6}
        style={[
          styles.cell,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cellText, { color: colors.textPrimary }]}>{item}</Text>
      </TouchableOpacity>
    ),
    [colors, handleChapterPress]
  );

  const keyExtractor = useCallback((item: number) => String(item), []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{book}</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={chapters}
        numColumns={NUM_COLUMNS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
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
  grid: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  cell: {
    flex: 1,
    margin: Spacing.xs,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cellText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    fontWeight: '500',
  },
});
