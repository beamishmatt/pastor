import { useState, useCallback } from 'react';
import { getChapter, getVerse, Verse, ALL_BOOKS, CHAPTER_COUNTS } from '../lib/bible-db';

interface BibleReaderState {
  translation: string;
  book: string;
  chapter: number;
  verses: Verse[];
  isLoading: boolean;
  error: string | null;
  setTranslation: (t: string) => void;
  navigateTo: (book: string, chapter: number) => Promise<void>;
  nextChapter: () => Promise<void>;
  prevChapter: () => Promise<void>;
}

export function useBibleReader(
  initialTranslation = 'KJV',
  initialBook = 'John',
  initialChapter = 1
): BibleReaderState {
  const [translation, setTranslation] = useState(initialTranslation);
  const [book, setBook] = useState(initialBook);
  const [chapter, setChapter] = useState(initialChapter);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigateTo = useCallback(
    async (newBook: string, newChapter: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getChapter(translation, newBook, newChapter);
        setVerses(result);
        setBook(newBook);
        setChapter(newChapter);
      } catch (e) {
        setError('Failed to load chapter');
      } finally {
        setIsLoading(false);
      }
    },
    [translation]
  );

  const nextChapter = useCallback(async () => {
    const maxChapter = CHAPTER_COUNTS[book] ?? 1;
    if (chapter < maxChapter) {
      await navigateTo(book, chapter + 1);
    } else {
      const bookIndex = ALL_BOOKS.indexOf(book);
      if (bookIndex < ALL_BOOKS.length - 1) {
        await navigateTo(ALL_BOOKS[bookIndex + 1], 1);
      }
    }
  }, [book, chapter, navigateTo]);

  const prevChapter = useCallback(async () => {
    if (chapter > 1) {
      await navigateTo(book, chapter - 1);
    } else {
      const bookIndex = ALL_BOOKS.indexOf(book);
      if (bookIndex > 0) {
        const prevBook = ALL_BOOKS[bookIndex - 1];
        await navigateTo(prevBook, CHAPTER_COUNTS[prevBook] ?? 1);
      }
    }
  }, [book, chapter, navigateTo]);

  return {
    translation,
    book,
    chapter,
    verses,
    isLoading,
    error,
    setTranslation,
    navigateTo,
    nextChapter,
    prevChapter,
  };
}
