import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../components/ui/tokens';
import MessageList from '../../components/chat/MessageList';
import ChatInput from '../../components/chat/ChatInput';
import PlanReadyCard from '../../components/chat/PlanReadyCard';
import { SideSheet, SHEET_WIDTH } from '../../components/sheets/SideSheet';
import { VerseBottomSheet } from '../../components/sheets/VerseBottomSheet';
import PaywallModal from '../../components/paywall/PaywallModal';
import { useConversation, CHAT_MODES } from '../../hooks/useConversation';
import { useConversationHistory } from '../../hooks/useConversationHistory';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import { getOfferings, purchasePackage, ENTITLEMENT_PRO } from '../../lib/revenuecat';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Translation = 'KJV' | 'WEB';

interface SelectedVerse {
  reference: string;
  book: string;
  chapter: number;
  verse: number;
}

// ---------------------------------------------------------------------------
// Translation options
// ---------------------------------------------------------------------------

const TRANSLATIONS: Translation[] = ['KJV', 'WEB'];

const SUGGESTED_PROMPTS: Array<{ title: string; subtitle: string; prompt: string }> = [
  { title: 'Anxiety & worry',         subtitle: 'What does the Bible say?',   prompt: 'What does the Bible say about anxiety?' },
  { title: 'Romans 8',                subtitle: 'Help me understand it',       prompt: 'Help me understand Romans 8' },
  { title: 'Pray with me',            subtitle: 'Guided prayer',               prompt: 'Pray with me' },
  { title: 'Reading plan',            subtitle: 'Where should I start?',       prompt: 'Start a reading plan' },
  { title: 'Sermon on the Mount',     subtitle: 'Explain the passage',         prompt: 'Explain the Sermon on the Mount' },
  { title: 'The gospel',              subtitle: 'What is it exactly?',         prompt: 'What is the gospel?' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  // --- Core state ---
  const [translation, setTranslation] = useState<Translation>('KJV');
  const [sideSheetVisible, setSideSheetVisible] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const [translationPickerVisible, setTranslationPickerVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [isPaywallLoading, setIsPaywallLoading] = useState(false);
  const [modePickerVisible, setModePickerVisible] = useState(false);

  // --- Verse sheet ---
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [verseSheetVisible, setVerseSheetVisible] = useState(false);

  // --- Ask Pastor bridge (set by Bible reader via AsyncStorage) ---
  const [askVerseText, setAskVerseText] = useState('');

  // --- Scope context (set by bookmarks/highlights "Chat" action) ---
  const { verse: verseParam, plans: plansParam } = useLocalSearchParams<{ verse?: string; plans?: string }>();
  const [scopeLabel, setScopeLabel] = useState(verseParam ?? '');

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('pastor_ask_verse').then((raw) => {
        if (!raw) return;
        AsyncStorage.removeItem('pastor_ask_verse');
        const { ref, text } = JSON.parse(raw) as { ref: string; text: string };
        setAskVerseText(`What does this passage mean?\n\n"${text}"\n— ${ref}`);
        setScopeLabel(ref);
      });
    }, [])
  );

  // Sync scope label when arriving from bookmarks/highlights via ?verse= param
  useEffect(() => {
    if (verseParam) setScopeLabel(verseParam);
  }, [verseParam]);

  // --- Hooks ---
  const { isPro, refresh: refreshSubscription } = useSubscription();
  const {
    messages,
    conversationId,
    isLoading,
    chatMode,
    setChatMode,
    sendMessage,
    startNewConversation,
    loadConversation,
    generatedPlan,
    isPlanGenerating,
    clearGeneratedPlan,
  } = useConversation(translation);

  // Wrap sendMessage to inject chat_scope when a scope is active
  const handleSend = useCallback(
    (text: string, options?: { hidden?: boolean; chat_scope?: string }) => {
      const chatScope = scopeLabel === 'Reading plan' ? 'reading_plan' : options?.chat_scope;
      return sendMessage(text, { ...options, chat_scope: chatScope });
    },
    [sendMessage, scopeLabel]
  );

  const { conversations } = useConversationHistory(conversationId);

  const isPrayerMode = chatMode === 'prayer';

  // Auto-initiate a reading plan conversation when arriving from the plans screen
  const planAutoStarted = useRef(false);
  useEffect(() => {
    if (plansParam !== 'true' || planAutoStarted.current) return;
    planAutoStarted.current = true;
    setScopeLabel('Reading plan');
    // Delay to allow getSession() to resolve after mount/login before sendMessage checks sessionRef
    const t = setTimeout(() => {
      handleSend('Start a reading plan', { chat_scope: 'reading_plan' });
    }, 400);
    return () => clearTimeout(t);
  }, [plansParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate main content push when drawer opens/closes
  useEffect(() => {
    Animated.spring(drawerAnim, {
      toValue: sideSheetVisible ? 1 : 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [sideSheetVisible, drawerAnim]);

  const mainTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.round(SHEET_WIDTH * 0.88)],
  });

  const mainCornerRadius = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 32],
  });



  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleNewChat = useCallback(() => {
    startNewConversation();
    setSideSheetVisible(false);
    setScopeLabel('');
  }, [startNewConversation]);

  const handleVersePress = useCallback((reference: string) => {
    // Parse "Book Chapter:Verse" — e.g. "John 3:16" or "1 Corinthians 13:4"
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (match) {
      setSelectedVerse({
        reference,
        book: match[1],
        chapter: parseInt(match[2], 10),
        verse: parseInt(match[3], 10),
      });
      setVerseSheetVisible(true);
    }
  }, []);

  const handleReadFullChapter = useCallback(
    (book: string, chapter: number, _verse: number) => {
      router.push(`/bible/${encodeURIComponent(book)}/${chapter}`);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Paywall purchase
  // ---------------------------------------------------------------------------

  const handlePaywallPurchase = useCallback(
    async (productId: string) => {
      setIsPaywallLoading(true);
      try {
        const offerings = await getOfferings();
        if (!offerings?.current) {
          Alert.alert('Unavailable', 'No offerings found. Please try again.');
          return;
        }
        const pkg = offerings.current.availablePackages.find(
          (p) => p.product.identifier === productId
        );
        if (!pkg) {
          Alert.alert('Unavailable', 'That option is not available right now.');
          return;
        }
        const { customerInfo } = await purchasePackage(pkg);
        if (customerInfo.entitlements.active[ENTITLEMENT_PRO]) {
          await refreshSubscription();
          setPaywallVisible(false);
        }
      } catch (e: any) {
        if (e?.code !== 1) {
          Alert.alert('Purchase failed', e?.message ?? 'Please try again.');
        }
      } finally {
        setIsPaywallLoading(false);
      }
    },
    [refreshSubscription]
  );

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const hasMessages = messages.length > 0;
  const hasUserMessages = messages.some((m) => m.role === 'user');
  const backgroundColor = isPrayerMode
    ? colors.prayerTint
    : colors.background;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.root}>

      {/* Drawer — renders behind main content */}
      <SideSheet
        isVisible={sideSheetVisible}
        onClose={() => setSideSheetVisible(false)}
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectConversation={(id) => {
          loadConversation(id);
          setSideSheetVisible(false);
        }}
        onBiblePress={() => router.push('/bible')}
        onBookmarksPress={() => router.push('/bookmarks')}
        onPlansPress={() => router.push('/plans')}
        onSettingsPress={() =>
          Alert.alert('Settings', 'What would you like to do?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign out',
              style: 'destructive',
              onPress: () => supabase.auth.signOut(),
            },
          ])
        }
        isPro={isPro}
      />

      {/* Main content — slides right when drawer opens */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX: mainTranslateX }],
            borderTopLeftRadius: mainCornerRadius,
            borderTopRightRadius: mainCornerRadius,
            borderBottomLeftRadius: mainCornerRadius,
            overflow: 'hidden',
          },
        ]}
        pointerEvents="box-none"
      >
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Top navigation rail                                                  */}
      {/* ------------------------------------------------------------------ */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            backgroundColor,
          },
        ]}
      >
        {/* Left — hamburger + translation picker */}
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setSideSheetVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="menu" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Translation picker button */}
          <TouchableOpacity
            style={styles.translationChip}
            onPress={() => setTranslationPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Current translation: ${translation}. Tap to change.`}
          >
            <Text style={[styles.translationChipText, { color: colors.textSecondary }]}>
              {translation}
            </Text>
            <Feather name="chevron-down" size={12} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Center — wordmark */}
        <Text style={[styles.wordmark, { color: colors.textPrimary }]}>
        </Text>

        {/* Right — new chat + overflow */}
        <View style={styles.headerRightGroup}>
          {/* New chat */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleNewChat}
            accessibilityRole="button"
            accessibilityLabel="New conversation"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="plus-square" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Overflow */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              Alert.alert('Menu', 'More options coming soon.')
            }
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="more-horizontal" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Message area                                                         */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.messageArea}>
        {hasMessages && (
          <MessageList
            messages={messages}
            onVersePress={handleVersePress}
            isStreaming={isLoading}
          />
        )}
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom section: prompts strip + chat input                           */}
      {/* ------------------------------------------------------------------ */}
      <View>
        {!hasUserMessages && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promptsStrip}
            keyboardShouldPersistTaps="handled"
          >
            {SUGGESTED_PROMPTS.map((item) => (
              <TouchableOpacity
                key={item.prompt}
                onPress={() => {
                  if (item.prompt === 'Start a reading plan') {
                    setScopeLabel('Reading plan');
                    handleSend(item.prompt, { chat_scope: 'reading_plan' });
                  } else {
                    handleSend(item.prompt);
                  }
                }}
                activeOpacity={0.7}
                style={[styles.promptChip, { backgroundColor: colors.surfaceContainerHigh }]}
              >
                <Text style={[styles.promptTitle, { color: colors.textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.promptSubtitle, { color: colors.textTertiary }]}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <PlanReadyCard
          plan={generatedPlan}
          isGenerating={isPlanGenerating}
          onViewPlan={(slug) => {
            clearGeneratedPlan();
            router.push(`/plans/${slug}`);
          }}
          onDismiss={clearGeneratedPlan}
        />

        <ChatInput
          onSend={handleSend}
          isPro={isPro}
          onPaywallPress={() => setPaywallVisible(true)}
          disabled={isLoading}
          activeMode={chatMode}
          onModeMenuPress={() => setModePickerVisible(true)}
          onModeReset={() => setChatMode('standard')}
          externalText={askVerseText}
          onExternalTextConsumed={() => setAskVerseText('')}
          scopeLabel={scopeLabel || undefined}
          onScopeReset={() => setScopeLabel('')}
        />
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Translation picker modal                                             */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        visible={translationPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTranslationPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setTranslationPickerVisible(false)}
          accessibilityLabel="Close translation picker"
        >
          <View
            style={[
              styles.pickerSheet,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: colors.textSecondary }]}>
              Bible translation
            </Text>
            {TRANSLATIONS.map((t) => {
              const isSelected = t === translation;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.pickerOption,
                    { borderTopColor: colors.border },
                    isSelected && { backgroundColor: colors.surface },
                  ]}
                  onPress={() => {
                    setTranslation(t);
                    setTranslationPickerVisible(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={t}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      {
                        color: isSelected ? colors.accent : colors.textPrimary,
                        fontFamily: isSelected
                          ? Typography.fontFamily.medium
                          : Typography.fontFamily.regular,
                      },
                    ]}
                  >
                    {t}
                  </Text>
                  {isSelected && (
                    <Feather name="check" size={16} color={colors.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Mode picker modal                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        visible={modePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modePickerBackdrop}
          activeOpacity={1}
          onPress={() => setModePickerVisible(false)}
          accessibilityLabel="Close mode picker"
        >
          <View
            style={[
              styles.modePickerSheet,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modePickerTitle, { color: colors.textSecondary }]}>
              Chat mode
            </Text>
            {CHAT_MODES.map((mode, index) => {
              const isSelected = chatMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modePickerOption,
                    { borderTopColor: colors.border },
                    index === 0 && { borderTopWidth: 0 },
                    isSelected && { backgroundColor: colors.surface },
                  ]}
                  onPress={() => {
                    setChatMode(mode.id);
                    setModePickerVisible(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={mode.label}
                >
                  <View style={styles.modePickerOptionIcon}>
                    <Feather
                      name={mode.icon as any}
                      size={16}
                      color={isSelected ? colors.accent : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.modePickerOptionText}>
                    <Text
                      style={[
                        styles.modePickerLabel,
                        {
                          color: isSelected ? colors.accent : colors.textPrimary,
                          fontFamily: isSelected
                            ? Typography.fontFamily.medium
                            : Typography.fontFamily.regular,
                        },
                      ]}
                    >
                      {mode.label}
                    </Text>
                    <Text style={[styles.modePickerDescription, { color: colors.textTertiary }]}>
                      {mode.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Feather name="check" size={16} color={colors.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Verse bottom sheet                                                   */}
      {/* ------------------------------------------------------------------ */}
      <VerseBottomSheet
        isVisible={verseSheetVisible}
        onClose={() => setVerseSheetVisible(false)}
        reference={selectedVerse?.reference ?? ''}
        book={selectedVerse?.book ?? ''}
        chapter={selectedVerse?.chapter ?? 0}
        verse={selectedVerse?.verse ?? 0}
        translation={translation}
        onReadFullChapter={handleReadFullChapter}
        onAskPastor={(ref, text) => {
          setVerseSheetVisible(false);
          setAskVerseText(`What does this passage mean?\n\n"${text}"\n— ${ref}`);
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Paywall modal                                                         */}
      {/* ------------------------------------------------------------------ */}
      <PaywallModal
        isVisible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onPurchase={handlePaywallPurchase}
        isLoading={isPaywallLoading}
      />
    </SafeAreaView>

        {/* Tap the visible sliver to close the drawer */}
        {sideSheetVisible && (
          <TouchableWithoutFeedback onPress={() => setSideSheetVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        )}
      </Animated.View>

    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  safe: {
    flex: 1,
  },

  // Header rail
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  wordmark: {
    flex: 1,
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.size.lg,
    textAlign: 'center',
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  translationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    padding: Spacing.xs,
  },
  translationChipText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    letterSpacing: 0.3,
  },

  // Message area
  messageArea: {
    flex: 1,
  },

  // Translation picker modal
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 56, // clear the header
    paddingLeft: Spacing.base,
  },
  pickerSheet: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    minWidth: 140,
  },
  pickerTitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  pickerOptionText: {
    fontSize: Typography.size.base,
  },

  // Suggested prompts strip
  promptsStrip: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  promptChip: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    maxWidth: 180,
  },
  promptTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  promptSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    lineHeight: Typography.size.xs * Typography.lineHeight.normal,
  },

  // Mode picker modal
  modePickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingBottom: 92,
    paddingLeft: Spacing.base,
  },
  modePickerSheet: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    minWidth: 220,
    shadowColor: '#1C1C18',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 32,
    elevation: 8,
  },
  modePickerTitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  modePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  modePickerOptionIcon: {
    width: 24,
    alignItems: 'center',
  },
  modePickerOptionText: {
    flex: 1,
    gap: 2,
  },
  modePickerLabel: {
    fontSize: Typography.size.base,
  },
  modePickerDescription: {
    fontSize: Typography.size.xs,
  },
});
