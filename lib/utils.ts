/**
 * Parse [VERSE:Book Chapter:Verse] tokens from AI response content.
 * Returns the content with tokens replaced by a placeholder, plus an array of cited verses.
 */
export function parseVerseTokens(content: string): {
  cleanContent: string;
  citedVerses: Array<{ reference: string; book: string; chapter: number; verse: number }>;
} {
  const verseRegex = /\[VERSE:([^\]]+)\]/g;
  const citedVerses: Array<{ reference: string; book: string; chapter: number; verse: number }> = [];
  const seen = new Set<string>();

  const cleanContent = content.replace(verseRegex, (_, ref) => {
    if (!seen.has(ref)) {
      seen.add(ref);
      const parsed = parseVerseReference(ref);
      if (parsed) {
        citedVerses.push({ reference: ref, ...parsed });
      }
    }
    return `**${ref}**`;
  });

  return { cleanContent, citedVerses };
}

/**
 * Parse a verse reference string like "Romans 8:28" or "1 Corinthians 13:4"
 */
export function parseVerseReference(
  ref: string
): { book: string; chapter: number; verse: number } | null {
  // Handle books with numeric prefixes: "1 Corinthians 13:4"
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;

  const [, book, chapter, verse] = match;
  return {
    book: book.trim(),
    chapter: parseInt(chapter, 10),
    verse: parseInt(verse, 10),
  };
}

/**
 * Format a Date as a relative label for conversation history grouping.
 */
export function getConversationDateGroup(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last 7 days';
  if (diffDays <= 30) return 'Last 30 days';
  return 'Older';
}

/**
 * Truncate a string to maxLength, appending ellipsis if needed.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Format a date as "March 17, 2026"
 */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date as "YYYY-MM-DD" for database queries
 */
export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}
