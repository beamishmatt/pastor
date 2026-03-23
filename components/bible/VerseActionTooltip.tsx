import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Radius, Shadow } from '../ui/tokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get('window');
const TOOLTIP_W = Math.min(SW - 32, 280);
const TOOLTIP_H = 52;
const ARROW_H = 8;
const BG = '#1C1C1E'; // dark pill, readable on both light and dark backgrounds

export const HIGHLIGHT_COLORS = [
  { hex: '#FFF3A3', label: 'Yellow' },
  { hex: '#C6EEC6', label: 'Green' },
  { hex: '#BDD6F5', label: 'Blue' },
  { hex: '#FAC8C8', label: 'Pink' },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerseActionTooltipProps {
  visible: boolean;
  /** pageY of the long-press gesture, used to position the tooltip */
  anchorY: number;
  isBookmarked: boolean;
  highlightColor?: string;
  onHighlight: (color: string | null) => void;
  onBookmark: () => void;
  onShare: () => void;
  onCopy: () => void;
  onAskPastor: () => void;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VerseActionTooltip({
  visible,
  anchorY,
  isBookmarked,
  highlightColor,
  onHighlight,
  onBookmark,
  onShare,
  onCopy,
  onAskPastor,
  onDismiss,
}: VerseActionTooltipProps) {
  const scheme = useColorScheme() ?? 'light';
  const [showColors, setShowColors] = useState(false);

  // Position: above touch if in bottom half of screen, below if in top half
  const showAbove = anchorY > SH * 0.5;
  const tooltipTop = showAbove
    ? Math.max(60, anchorY - TOOLTIP_H - ARROW_H - 4)
    : Math.min(SH - TOOLTIP_H - 80, anchorY + ARROW_H + 4);
  const tooltipLeft = (SW - TOOLTIP_W) / 2;
  const arrowLeft = SW / 2 - 7;
  const arrowTop = showAbove ? tooltipTop + TOOLTIP_H - 1 : tooltipTop - ARROW_H + 1;

  const handleHighlightPress = () => setShowColors(true);

  const handleColorSelect = (color: string | null) => {
    onHighlight(color);
    setShowColors(false);
    onDismiss();
  };

  const handleDismiss = () => {
    setShowColors(false);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.backdrop}>
          {/* Arrow */}
          <View
            pointerEvents="none"
            style={[
              showAbove ? styles.arrowDown : styles.arrowUp,
              { position: 'absolute', top: arrowTop, left: arrowLeft },
            ]}
          />

          {/* Tooltip card */}
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.tooltip,
                Shadow.md,
                { top: tooltipTop, left: tooltipLeft, width: TOOLTIP_W },
              ]}
            >
              {showColors ? (
                <ColorRow
                  highlightColor={highlightColor}
                  onSelect={handleColorSelect}
                />
              ) : (
                <ActionRow
                  isBookmarked={isBookmarked}
                  hasHighlight={!!highlightColor}
                  scheme={scheme}
                  onHighlight={handleHighlightPress}
                  onBookmark={() => { onBookmark(); onDismiss(); }}
                  onCopy={() => { onCopy(); onDismiss(); }}
                  onShare={() => { onShare(); onDismiss(); }}
                  onAskPastor={() => { onAskPastor(); onDismiss(); }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── ActionRow ────────────────────────────────────────────────────────────────

interface ActionRowProps {
  isBookmarked: boolean;
  hasHighlight: boolean;
  scheme: 'light' | 'dark';
  onHighlight: () => void;
  onBookmark: () => void;
  onCopy: () => void;
  onShare: () => void;
  onAskPastor: () => void;
}

function ActionRow({
  isBookmarked,
  hasHighlight,
  onHighlight,
  onBookmark,
  onCopy,
  onShare,
  onAskPastor,
}: ActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <ActionBtn icon="edit-2"       label="Highlight"   onPress={onHighlight}   active={hasHighlight} />
      <Divider />
      <ActionBtn icon="bookmark"     label="Bookmark"    onPress={onBookmark}    active={isBookmarked} />
      <Divider />
      <ActionBtn icon="copy"         label="Copy"        onPress={onCopy} />
      <Divider />
      <ActionBtn icon="share-2"      label="Share"       onPress={onShare} />
      <Divider />
      <ActionBtn icon="message-circle" label="Ask Pastor" onPress={onAskPastor} accent />
    </View>
  );
}

// ─── ColorRow ─────────────────────────────────────────────────────────────────

function ColorRow({
  highlightColor,
  onSelect,
}: {
  highlightColor?: string;
  onSelect: (color: string | null) => void;
}) {
  return (
    <View style={styles.colorRow}>
      {HIGHLIGHT_COLORS.map((c) => (
        <TouchableOpacity
          key={c.hex}
          onPress={() => onSelect(c.hex)}
          activeOpacity={0.75}
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
        >
          <Feather name="x" size={14} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

const ICON_COLOR = 'rgba(255,255,255,0.9)';
const ACTIVE_COLOR = '#9CAF94'; // sage accent
const ACCENT_COLOR = '#8C7E6F'; // warm stone

function ActionBtn({
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.actionBtn} accessibilityLabel={label}>
      <Feather name={icon} size={22} color={color} />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  tooltip: {
    position: 'absolute',
    height: TOOLTIP_H,
    backgroundColor: BG,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  actionRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  colorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    paddingHorizontal: Spacing.xl,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#FFF',
  },
  removeBtn: {
    width: 30,
    height: 30,
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
    borderTopColor: BG,
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: ARROW_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: BG,
  },
});
