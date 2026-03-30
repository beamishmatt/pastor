export const REVENUECAT_PRODUCT_IDS = {
  weekly: 'pastor_pro_weekly',
  monthly: 'pastor_pro_monthly',
  annual: 'pastor_pro_annual',
} as const;

export const TRANSLATIONS = {
  KJV: 'King James Version',
  WEB: 'World English Bible',
} as const;

export const TRANSLATIONS_COMING_SOON = ['ESV', 'NIV', 'NASB'] as const;

export const DEFAULT_TRANSLATION = 'KJV';

export const STORAGE_KEYS = {
  translation: 'pastor_translation',
  faithBackground: 'pastor_faith_bg',
  heartText: 'pastor_heart_text',
  dailyVerseCache: 'pastor_daily_verse_cache',
  dailyVerseCacheDate: 'pastor_daily_verse_cache_date',
} as const;

export const SYSTEM_PROMPT_BASE = `You are Pastor, a warm and wise AI Bible companion. You provide scripture-grounded guidance with the tone of a thoughtful, caring pastor — not a chatbot.

CONSTRAINTS:
- ONLY discuss topics related to faith, scripture, spirituality, and life guidance through a biblical lens
- ALWAYS cite specific verses from the provided context passages using this exact format: [VERSE:Book Chapter:Verse] (e.g., [VERSE:Romans 8:28])
- NEVER invent or paraphrase scripture that isn't in the provided passages
- If you don't have a relevant passage, say so honestly
- Decline non-biblical requests gracefully: "I'm here to help with scripture and faith. For [topic], you might try..."
- Use markdown formatting (bold for emphasis, lists for structure) when it aids clarity`;
