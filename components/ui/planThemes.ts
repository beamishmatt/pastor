/**
 * Plan hero themes — maps plan slugs/keywords to a hero image + gradient fallback.
 *
 * ## Adding images
 * 1. Drop files into assets/images/plan-heroes/ (e.g. wisdom.png, peace.png)
 * 2. Add `image: require('../../assets/images/plan-heroes/wisdom.png')` to the theme
 * 3. PlanHero will automatically prefer the image over the gradient fallback
 *
 * ## Sourcing images
 * Generate with Midjourney using this locked base prompt (swap the scene per theme):
 *   "misty [SCENE] landscape, soft sage greens and warm cream tones, layered atmospheric haze,
 *    pine silhouettes, gentle sun glow, single bird in sky, serene and contemplative,
 *    flat illustration style --ar 3:2 --style raw --v 6"
 *
 * Suggested scenes per theme:
 *   wisdom  → mountain valley forest
 *   peace   → still lake at dawn
 *   faith   → desert dunes golden hour
 *   psalms  → starry night over hills
 *   hope    → wildflower meadow sunrise
 *   prayer  → misty river valley
 *   gospel  → ancient olive grove
 *   journey → autumn forest path
 *   strength → coastal cliffs at dawn
 *   renewal → snowy mountain peaks
 */

export type PlanHeroTheme = {
  image?: number;                             // require() result — preferred if present
  colors: readonly [string, string, string];  // gradient fallback
  locations: readonly [number, number, number];
  orbColor: string;
};

const THEMES: Record<string, PlanHeroTheme> = {
  wisdom: {
    // image: require('../../assets/images/plan-heroes/wisdom.png'),
    colors:    ['#3D5A4C', '#6B8C6E', '#A8B89A'],
    locations: [0, 0.55, 1],
    orbColor:  'rgba(255,255,240,0.18)',
  },
  peace: {
    // image: require('../../assets/images/plan-heroes/peace.png'),
    colors:    ['#2E5266', '#6B9BAD', '#B8D4DC'],
    locations: [0, 0.5, 1],
    orbColor:  'rgba(255,255,255,0.20)',
  },
  faith: {
    // image: require('../../assets/images/plan-heroes/faith.png'),
    colors:    ['#5C3D2E', '#A0714F', '#D4A574'],
    locations: [0, 0.5, 1],
    orbColor:  'rgba(255,240,200,0.22)',
  },
  psalms: {
    // image: require('../../assets/images/plan-heroes/psalms.png'),
    colors:    ['#2D2B55', '#4A4880', '#7B78B0'],
    locations: [0, 0.55, 1],
    orbColor:  'rgba(255,255,255,0.15)',
  },
  hope: {
    // image: require('../../assets/images/plan-heroes/hope.png'),
    colors:    ['#7A4419', '#C47B3A', '#E8B97A'],
    locations: [0, 0.45, 1],
    orbColor:  'rgba(255,245,200,0.25)',
  },
  prayer: {
    // image: require('../../assets/images/plan-heroes/prayer.png'),
    colors:    ['#2E2040', '#5C4A7A', '#9C84B4'],
    locations: [0, 0.5, 1],
    orbColor:  'rgba(255,255,255,0.14)',
  },
  gospel: {
    // image: require('../../assets/images/plan-heroes/gospel.png'),
    colors:    ['#2E3D20', '#5C7040', '#8EA870'],
    locations: [0, 0.5, 1],
    orbColor:  'rgba(255,255,220,0.18)',
  },
  default: {
    image: require('../../assets/images/plan-heroes/hero01.png'),
    colors:    ['#3D5A4C', '#6B8C6E', '#A8B89A'],
    locations: [0, 0.55, 1],
    orbColor:  'rgba(255,255,240,0.18)',
  },
};

const KEYWORDS: Array<{ words: string[]; key: string }> = [
  { words: ['wisdom', 'proverb', 'solomon'], key: 'wisdom' },
  { words: ['peace', 'rest', 'still', 'calm', 'sabbath'], key: 'peace' },
  { words: ['faith', 'trust', 'believe', 'obedien'], key: 'faith' },
  { words: ['psalm', 'praise', 'worship', 'sing'], key: 'psalms' },
  { words: ['hope', 'light', 'new', 'resurrect', 'dawn'], key: 'hope' },
  { words: ['prayer', 'devot', 'spirit', 'fast'], key: 'prayer' },
  { words: ['gospel', 'grace', 'salvat', 'redeem', 'cross'], key: 'gospel' },
];

export function getPlanTheme(title: string, slug: string): PlanHeroTheme {
  const haystack = `${title} ${slug}`.toLowerCase();
  for (const { words, key } of KEYWORDS) {
    if (words.some(w => haystack.includes(w))) return THEMES[key];
  }
  return THEMES.default;
}
