import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../ui/Typography';
import { Colors, Spacing, Radius, Shadow, Typography as T } from '../ui/tokens';
import {
  getSurroundingVerses,
  getBookmarksForChapter,
  getHighlightsForChapter,
  toggleBookmark,
  upsertHighlight,
  type Verse,
} from '../../lib/bible-db';
import { HIGHLIGHT_COLORS } from '../bible/VerseActionTooltip';
import { supabase } from '../../lib/supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SW, height: SH } = Dimensions.get('window');
const TOOLTIP_W = Math.min(SW - 32, 260);
const TOOLTIP_H = 48;
const ARROW_H = 8;
const TOOLTIP_BG = '#1C1C1E';
const ICON_COLOR = 'rgba(255,255,255,0.9)';
const ACTIVE_COLOR = '#9CAF94';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VerseBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  translation?: string;
  onReadFullChapter: (book: string, chapter: number, verse: number) => void;
  onAskPastor?: (ref: string, text: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VerseBottomSheet({
  isVisible,
  onClose,
  reference,
  book,
  chapter,
  verse,
  translation = 'KJV',
  onReadFullChapter,
  onAskPastor,
}: VerseBottomSheetProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [surroundingVerses, setSurroundingVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Per-verse annotation state (keyed by verse number)
  const [highlightedVerses, setHighlightedVerses] = useState<Record<number, string>>({});
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<number>>(new Set());

  // Floating tooltip state
  const [tooltipVerseNum, setTooltipVerseNum] = useState<number | null>(null);
  const [tooltipAnchorY, setTooltipAnchorY] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isVisible || !book) return;

    let cancelled = false;
    setLoading(true);
    setTooltipVisible(false);
    setShowColorPicker(false);

    const loadData = async () => {
      // Load surrounding verses — SQLite first, then Supabase
      let localVerses: Verse[] = [];
      try {
        const local = await getSurroundingVerses(translation, book, chapter, verse, 3);
        if (!cancelled && local.length > 0) {
          localVerses = local;
          setSurroundingVerses(local);
        }
      } catch {
        // fall through
      }

      if (!cancelled && localVerses.length === 0) {
        try {
          const { data } = await supabase
            .from('bible_verses')
            .select('translation, book, chapter, verse, text')
            .eq('translation', translation)
            .eq('book', book)
            .eq('chapter', chapter)
            .gte('verse', Math.max(1, verse - 3))
            .lte('verse', verse + 3)
            .order('verse');
          if (!cancelled) setSurroundingVerses((data as Verse[]) ?? []);
        } catch {
          if (!cancelled) setSurroundingVerses([]);
        }
      }

      // Load user session + annotations
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      if (!cancelled) setUserId(uid);

      if (uid) {
        const [bms, hls] = await Promise.all([
          getBookmarksForChapter(uid, translation, book, chapter),
          getHighlightsForChapter(uid, translation, book, chapter),
        ]);
        if (!cancelled) {
          setBookmarkedVerses(new Set(bms.map((b) => b.verse)));
          setHighlightedVerses(Object.fromEntries(hls.map((h) => [h.verse, h.color])));
        }
      }
    };

    loadData().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isVisible, book, chapter, verse, translation]);

  // ---------------------------------------------------------------------------
  // Tooltip handlers
  // ---------------------------------------------------------------------------

  const dismissTooltip = useCallback(() => {
    setTooltipVisible(false);
    setShowColorPicker(false);
    setTooltipVerseNum(null);
  }, []);

  const handleLongPress = useCallback((verseNum: number, pageY: number) => {
    setTooltipVerseNum(verseNum);
    setTooltipAnchorY(pageY);
    setShowColorPicker(false);
    setTooltipVisible(true);
  }, []);

  const handleHighlight = useCallback(async (color: string | null) => {
    if (tooltipVerseNum === null) return;
    if (userId) {
      await upsertHighlight(userId, translation, book, chapter, tooltipVerseNum, color);
    }
    if (color === null) {
      setHighlightedVerses((prev) => {
        const n = { ...prev };
        delete n[tooltipVerseNum];
        return n;
      });
    } else {
      setHighlightedVerses((prev) => ({ ...prev, [tooltipVerseNum]: color }));
    }
    dismissTooltip();
  }, [tooltipVerseNum, userId, translation, book, chapter, dismissTooltip]);

  const handleBookmark = useCallback(async () => {
    if (tooltipVerseNum === null) return;
    if (userId) {
      const added = await toggleBookmark(userId, translation, book, chapter, tooltipVerseNum);
      setBookmarkedVerses((prev) => {
        const n = new Set(prev);
        added ? n.add(tooltipVerseNum) : n.delete(tooltipVerseNum);
        return n;
      });
    } else {
      setBookmarkedVerses((prev) => {
        const n = new Set(prev);
        n.has(tooltipVerseNum) ? n.delete(tooltipVerseNum) : n.add(tooltipVerseNum);
        return n;
      });
    }
    dismissTooltip();
  }, [tooltipVerseNum, userId, translation, book, chapter, dismissTooltip]);

  const handleShare = useCallback(() => {
    if (tooltipVerseNum === null) return;
    const v = surroundingVerses.find((sv) => sv.verse === tooltipVerseNum);
    if (v) {
      Share.share({ message: `"${v.text}" — ${book} ${chapter}:${tooltipVerseNum}` });
    }
    dismissTooltip();
  }, [tooltipVerseNum, surroundingVerses, book, chapter, dismissTooltip]);

  const handleAskPastor = useCallback(() => {
    if (tooltipVerseNum === null || !onAskPastor) return;
    const v = surroundingVerses.find((sv) => sv.verse === tooltipVerseNum);
    if (v) {
      onAskPastor(`${book} ${chapter}:${tooltipVerseNum}`, v.text);
    }
    dismissTooltip();
    onClose();
  }, [tooltipVerseNum, surroundingVerses, book, chapter, onAskPastor, dismissTooltip, onClose]);

  // ---------------------------------------------------------------------------
  // Tooltip positioning (same logic as VerseActionTooltip)
  // ---------------------------------------------------------------------------

  const showAbove = tooltipAnchorY > SH * 0.5;
  const tooltipTop = showAbove
    ? Math.max(60, tooltipAnchorY - TOOLTIP_H - ARROW_H - 4)
    : Math.min(SH - TOOLTIP_H - 80, tooltipAnchorY + ARROW_H + 4);
  const tooltipLeft = (SW - TOOLTIP_W) / 2;
  const arrowLeft = SW / 2 - 7;
  const arrowTop = showAbove ? tooltipTop + TOOLTIP_H - 1 : tooltipTop - ARROW_H + 1;

  const handleReadFullChapter = () => {
    onReadFullChapter(book, chapter, verse);
    onClose();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop — tap to dismiss tooltip or close sheet */}
        <TouchableWithoutFeedback
          onPress={() => { tooltipVisible ? dismissTooltip() : onClose(); }}
          accessibilityLabel="Close"
        >
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Platform.OS === 'ios' ? Spacing['2xl'] : Spacing.base,
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.textTertiary }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <ThemedText serif weight="bold" size="md" style={styles.referenceText}>
              {reference}
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.closeButton, { backgroundColor: colors.userBubble }]}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Feather name="x" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Verse body */}
          <ScrollView
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ThemedText variant="tertiary" size="sm" style={styles.loadingText}>
                Loading…
              </ThemedText>
            ) : (
              surroundingVerses.map((v) => {
                const isCited = v.verse === verse;
                const hlColor = highlightedVerses[v.verse];
                return (
                  <TouchableOpacity
                    key={v.verse}
                    activeOpacity={0.7}
                    delayLongPress={400}
                    onLongPress={(e) => handleLongPress(v.verse, e.nativeEvent.pageY)}
                    style={[
                      styles.verseRow,
                      isCited && {
                        borderLeftWidth: 3,
                        borderLeftColor: colors.accent,
                      },
                      hlColor
                        ? { backgroundColor: hlColor + 'BB' }
                        : isCited
                        ? { backgroundColor: colors.verseChipFill }
                        : undefined,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Verse ${v.verse}, long press for actions`}
                    accessibilityHint="Long press to highlight, bookmark, or share"
                  >
                    <ThemedText variant="tertiary" size="xs" style={styles.verseNumber}>
                      {v.verse}
                    </ThemedText>
                    <ThemedText
                      serif
                      size="sm"
                      style={[
                        styles.verseText,
                        isCited ? { color: colors.textPrimary } : { color: colors.textSecondary },
                      ]}
                    >
                      {v.text}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })
            )}
            <View style={styles.bodyFooterSpacer} />
          </ScrollView>

          {/* Full Chapter button */}
          <TouchableOpacity
            onPress={handleReadFullChapter}
            style={[styles.fullChapterBtn, { borderTopColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Read full chapter"
          >
            <Feather name="book-open" size={16} color={colors.accent} />
            <ThemedText size="sm" weight="semibold" style={{ color: colors.accent }}>
              Read Full Chapter
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Floating tooltip — rendered AFTER the sheet so it paints on top */}
        {tooltipVisible && (
          <>
            <View
              pointerEvents="none"
              style={[
                showAbove ? styles.arrowDown : styles.arrowUp,
                { position: 'absolute', top: arrowTop, left: arrowLeft },
              ]}
            />
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.tooltipCard,
                  Shadow.md,
                  { top: tooltipTop, left: tooltipLeft, width: TOOLTIP_W },
                ]}
              >
                {showColorPicker ? (
                  <ColorRow
                    highlightColor={tooltipVerseNum !== null ? highlightedVerses[tooltipVerseNum] : undefined}
                    onSelect={handleHighlight}
                    onCancel={() => setShowColorPicker(false)}
                  />
                ) : (
                  <TooltipActionRow
                    isBookmarked={tooltipVerseNum !== null && bookmarkedVerses.has(tooltipVerseNum)}
                    hasHighlight={tooltipVerseNum !== null && !!highlightedVerses[tooltipVerseNum]}
                    onHighlight={() => setShowColorPicker(true)}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    onAskPastor={onAskPastor ? handleAskPastor : undefined}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </>
        )}
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// TooltipActionRow
// ---------------------------------------------------------------------------

function TooltipActionRow({
  isBookmarked,
  hasHighlight,
  onHighlight,
  onBookmark,
  onShare,
  onAskPastor,
}: {
  isBookmarked: boolean;
  hasHighlight: boolean;
  onHighlight: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onAskPastor?: () => void;
}) {
  return (
    <View style={styles.tooltipActionRow}>
      <TooltipBtn icon="edit-2"         label="Highlight"    onPress={onHighlight}  active={hasHighlight} />
      <TooltipDivider />
      <TooltipBtn icon="bookmark"       label="Bookmark"     onPress={onBookmark}   active={isBookmarked} />
      <TooltipDivider />
      <TooltipBtn icon="share-2"        label="Share"        onPress={onShare} />
      {onAskPastor && (
        <>
          <TooltipDivider />
          <TooltipBtn icon="message-circle" label="Ask Pastor" onPress={onAskPastor} accent />
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ColorRow
// ---------------------------------------------------------------------------

function ColorRow({
  highlightColor,
  onSelect,
  onCancel,
}: {
  highlightColor?: string;
  onSelect: (color: string | null) => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.colorRow}>
      <TouchableOpacity onPress={onCancel} style={styles.colorBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Feather name="chevron-left" size={20} color={ICON_COLOR} />
      </TouchableOpacity>
      {HIGHLIGHT_COLORS.map((c) => (
        <TouchableOpacity
          key={c.hex}
          onPress={() => onSelect(c.hex)}
          activeOpacity={0.75}
          accessibilityLabel={c.label}
          style={[
            styles.colorSwatch,
            { backgroundColor: c.hex },
            highlightColor === c.hex && styles.colorSwatchActive,
          ]}
        />
      ))}
      {highlightColor && (
        <TouchableOpacity
          onPress={() => onSelect(null)}
          activeOpacity={0.75}
          style={styles.removeBtn}
          accessibilityLabel="Remove highlight"
        >
          <Feather name="x" size={14} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// TooltipBtn / TooltipDivider
// ---------------------------------------------------------------------------

const ACCENT_COLOR = '#8C7E6F';

function TooltipBtn({
  icon,
  label,
  onPress,
  active,
  accent,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
  accent?: boolean;
}) {
  const color = accent ? ACCENT_COLOR : active ? ACTIVE_COLOR : ICON_COLOR;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.tooltipBtn} accessibilityLabel={label}>
      <Feather name={icon} size={20} color={color} />
    </TouchableOpacity>
  );
}

function TooltipDivider() {
  return <View style={styles.tooltipDivider} />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  referenceText: {
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  bodyContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  verseNumber: {
    width: 24,
    marginTop: 4,
    flexShrink: 0,
  },
  verseText: {
    flex: 1,
    lineHeight: T.size.sm * T.lineHeight.scripture,
  },
  bodyFooterSpacer: {
    height: Spacing.xl,
  },
  fullChapterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  // Floating tooltip
  tooltipCard: {
    position: 'absolute',
    height: TOOLTIP_H,
    backgroundColor: TOOLTIP_BG,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  tooltipActionRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  colorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  colorBack: {
    paddingRight: Spacing.xs,
  },
  colorSwatch: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#FFF',
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Arrows
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: ARROW_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: TOOLTIP_BG,
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: ARROW_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: TOOLTIP_BG,
  },
});
