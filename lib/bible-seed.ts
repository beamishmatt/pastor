import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBibleDb } from './bible-db';

const SEED_KEY = 'pastor_bible_seed_v1';
const BATCH_SIZE = 100; // 100 rows × 5 params = 500 params per INSERT, well within SQLite limits

// eslint-disable-next-line @typescript-eslint/no-var-requires
const KJV_VERSES: Array<{ book: string; chapter: number; verse: number; text: string }> =
  require('../data/kjv.json');

/**
 * Inserts KJV verses into the local SQLite database on first launch.
 * Subsequent calls return immediately (AsyncStorage guard).
 */
export async function seedBibleIfNeeded(): Promise<void> {
  const done = await AsyncStorage.getItem(SEED_KEY);
  if (done === '1') return;

  const db = await getBibleDb();

  for (let i = 0; i < KJV_VERSES.length; i += BATCH_SIZE) {
    const batch = KJV_VERSES.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map(() => '(?,?,?,?,?)').join(',');
    const values = batch.flatMap((v) => ['KJV', v.book, v.chapter, v.verse, v.text]);
    await db.runAsync(
      `INSERT OR IGNORE INTO verses (translation, book, chapter, verse, text) VALUES ${placeholders}`,
      values
    );
  }

  await AsyncStorage.setItem(SEED_KEY, '1');
}
