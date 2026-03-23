import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getBibleDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('bible.db');
    await initializeDb(db);
  }
  return db;
}

async function initializeDb(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      translation TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      UNIQUE(translation, book, chapter, verse)
    );
    CREATE INDEX IF NOT EXISTS idx_verses_lookup
      ON verses(translation, book, chapter, verse);
    CREATE INDEX IF NOT EXISTS idx_verses_book_chapter
      ON verses(translation, book, chapter);

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      translation TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      translation TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      color TEXT NOT NULL DEFAULT 'yellow',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts
      USING fts5(book, text, translation UNINDEXED, chapter UNINDEXED, verse UNINDEXED);
  `);
}

export interface Verse {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export async function getVerse(
  translation: string,
  book: string,
  chapter: number,
  verse: number
): Promise<Verse | null> {
  const db = await getBibleDb();
  const result = await db.getFirstAsync<Verse>(
    'SELECT * FROM verses WHERE translation = ? AND book = ? AND chapter = ? AND verse = ?',
    [translation, book, chapter, verse]
  );
  return result ?? null;
}

export async function getChapter(
  translation: string,
  book: string,
  chapter: number
): Promise<Verse[]> {
  const db = await getBibleDb();
  return db.getAllAsync<Verse>(
    'SELECT * FROM verses WHERE translation = ? AND book = ? AND chapter = ? ORDER BY verse',
    [translation, book, chapter]
  );
}

export async function getSurroundingVerses(
  translation: string,
  book: string,
  chapter: number,
  verse: number,
  context: number = 3
): Promise<Verse[]> {
  const db = await getBibleDb();
  return db.getAllAsync<Verse>(
    `SELECT * FROM verses
     WHERE translation = ? AND book = ? AND chapter = ?
       AND verse BETWEEN ? AND ?
     ORDER BY verse`,
    [translation, book, chapter, Math.max(1, verse - context), verse + context]
  );
}

export async function searchVerses(
  query: string,
  translation: string = 'KJV',
  limit: number = 50
): Promise<Verse[]> {
  const db = await getBibleDb();
  return db.getAllAsync<Verse>(
    `SELECT v.* FROM verses_fts fts
     JOIN verses v ON v.book = fts.book AND v.chapter = fts.chapter AND v.verse = fts.verse AND v.translation = fts.translation
     WHERE verses_fts MATCH ? AND fts.translation = ?
     LIMIT ?`,
    [query, translation, limit]
  );
}

export const BIBLE_BOOKS = {
  OT: [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
    'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
    'Haggai', 'Zechariah', 'Malachi',
  ],
  NT: [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
    'Ephesians', 'Philippians', 'Colossians',
    '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
    'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
    'Jude', 'Revelation',
  ],
};

export const ALL_BOOKS = [...BIBLE_BOOKS.OT, ...BIBLE_BOOKS.NT];

// ─── Bookmarks & Highlights ───────────────────────────────────────────────────

export interface Bookmark {
  id: string;
  user_id: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  note: string | null;
  created_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  color: string;
  created_at: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function getBookmarksForChapter(
  userId: string,
  translation: string,
  book: string,
  chapter: number
): Promise<Bookmark[]> {
  const db = await getBibleDb();
  return db.getAllAsync<Bookmark>(
    'SELECT * FROM bookmarks WHERE user_id = ? AND translation = ? AND book = ? AND chapter = ? ORDER BY verse',
    [userId, translation, book, chapter]
  );
}

/** Returns true if bookmark was added, false if removed. */
export async function toggleBookmark(
  userId: string,
  translation: string,
  book: string,
  chapter: number,
  verse: number
): Promise<boolean> {
  const db = await getBibleDb();
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM bookmarks WHERE user_id = ? AND translation = ? AND book = ? AND chapter = ? AND verse = ?',
    [userId, translation, book, chapter, verse]
  );
  if (existing) {
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?', [existing.id]);
    return false;
  }
  await db.runAsync(
    'INSERT INTO bookmarks (id, user_id, translation, book, chapter, verse) VALUES (?, ?, ?, ?, ?, ?)',
    [generateId(), userId, translation, book, chapter, verse]
  );
  return true;
}

export async function getHighlightsForChapter(
  userId: string,
  translation: string,
  book: string,
  chapter: number
): Promise<Highlight[]> {
  const db = await getBibleDb();
  return db.getAllAsync<Highlight>(
    'SELECT * FROM highlights WHERE user_id = ? AND translation = ? AND book = ? AND chapter = ? ORDER BY verse',
    [userId, translation, book, chapter]
  );
}

/** Pass color = null to remove the highlight. */
export async function upsertHighlight(
  userId: string,
  translation: string,
  book: string,
  chapter: number,
  verse: number,
  color: string | null
): Promise<void> {
  const db = await getBibleDb();
  if (color === null) {
    await db.runAsync(
      'DELETE FROM highlights WHERE user_id = ? AND translation = ? AND book = ? AND chapter = ? AND verse = ?',
      [userId, translation, book, chapter, verse]
    );
    return;
  }
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM highlights WHERE user_id = ? AND translation = ? AND book = ? AND chapter = ? AND verse = ?',
    [userId, translation, book, chapter, verse]
  );
  if (existing) {
    await db.runAsync('UPDATE highlights SET color = ? WHERE id = ?', [color, existing.id]);
  } else {
    await db.runAsync(
      'INSERT INTO highlights (id, user_id, translation, book, chapter, verse, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [generateId(), userId, translation, book, chapter, verse, color]
    );
  }
}

export async function getAllBookmarks(userId: string): Promise<Bookmark[]> {
  const db = await getBibleDb();
  return db.getAllAsync<Bookmark>(
    'SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

export const CHAPTER_COUNTS: Record<string, number> = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Proverbs: 31,
  Ecclesiastes: 12, 'Song of Solomon': 8, Isaiah: 66, Jeremiah: 52,
  Lamentations: 5, Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9,
  Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3, Zephaniah: 3,
  Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28,
  Romans: 16, '1 Corinthians': 16, '2 Corinthians': 13, Galatians: 6,
  Ephesians: 6, Philippians: 4, Colossians: 4,
  '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4,
  Titus: 3, Philemon: 1, Hebrews: 13, James: 5,
  '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
  Jude: 1, Revelation: 22,
};
