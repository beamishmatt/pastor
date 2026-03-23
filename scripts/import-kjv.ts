/**
 * import-kjv.ts
 *
 * Imports KJV and WEB Bible translations from local JSON files into Supabase.
 * Run with: npx ts-node scripts/import-kjv.ts
 *
 * Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Required data files: ./data/kjv.json, ./data/web.json
 *
 * JSON format: [{ book: string, chapter: number, verse: number, text: string }]
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// ---------------------------------------------------------------------------
// Book metadata map — all 66 canonical books
// ---------------------------------------------------------------------------

type Testament = 'OT' | 'NT'
type Genre =
  | 'law'
  | 'history'
  | 'wisdom'
  | 'prophecy'
  | 'major_prophecy'
  | 'gospel'
  | 'epistle'
  | 'apocalyptic'

interface BookMeta {
  testament: Testament
  genre: Genre
}

const BOOK_META: Record<string, BookMeta> = {
  // Old Testament — Law (Torah / Pentateuch)
  Genesis: { testament: 'OT', genre: 'law' },
  Exodus: { testament: 'OT', genre: 'law' },
  Leviticus: { testament: 'OT', genre: 'law' },
  Numbers: { testament: 'OT', genre: 'law' },
  Deuteronomy: { testament: 'OT', genre: 'law' },

  // Old Testament — History
  Joshua: { testament: 'OT', genre: 'history' },
  Judges: { testament: 'OT', genre: 'history' },
  Ruth: { testament: 'OT', genre: 'history' },
  '1 Samuel': { testament: 'OT', genre: 'history' },
  '2 Samuel': { testament: 'OT', genre: 'history' },
  '1 Kings': { testament: 'OT', genre: 'history' },
  '2 Kings': { testament: 'OT', genre: 'history' },
  '1 Chronicles': { testament: 'OT', genre: 'history' },
  '2 Chronicles': { testament: 'OT', genre: 'history' },
  Ezra: { testament: 'OT', genre: 'history' },
  Nehemiah: { testament: 'OT', genre: 'history' },
  Esther: { testament: 'OT', genre: 'history' },

  // Old Testament — Wisdom / Poetry
  Job: { testament: 'OT', genre: 'wisdom' },
  Psalms: { testament: 'OT', genre: 'wisdom' },
  Proverbs: { testament: 'OT', genre: 'wisdom' },
  Ecclesiastes: { testament: 'OT', genre: 'wisdom' },
  'Song of Solomon': { testament: 'OT', genre: 'wisdom' },

  // Old Testament — Major Prophets
  Isaiah: { testament: 'OT', genre: 'major_prophecy' },
  Jeremiah: { testament: 'OT', genre: 'major_prophecy' },
  Lamentations: { testament: 'OT', genre: 'major_prophecy' },
  Ezekiel: { testament: 'OT', genre: 'major_prophecy' },
  Daniel: { testament: 'OT', genre: 'major_prophecy' },

  // Old Testament — Minor Prophets
  Hosea: { testament: 'OT', genre: 'prophecy' },
  Joel: { testament: 'OT', genre: 'prophecy' },
  Amos: { testament: 'OT', genre: 'prophecy' },
  Obadiah: { testament: 'OT', genre: 'prophecy' },
  Jonah: { testament: 'OT', genre: 'prophecy' },
  Micah: { testament: 'OT', genre: 'prophecy' },
  Nahum: { testament: 'OT', genre: 'prophecy' },
  Habakkuk: { testament: 'OT', genre: 'prophecy' },
  Zephaniah: { testament: 'OT', genre: 'prophecy' },
  Haggai: { testament: 'OT', genre: 'prophecy' },
  Zechariah: { testament: 'OT', genre: 'prophecy' },
  Malachi: { testament: 'OT', genre: 'prophecy' },

  // New Testament — Gospels
  Matthew: { testament: 'NT', genre: 'gospel' },
  Mark: { testament: 'NT', genre: 'gospel' },
  Luke: { testament: 'NT', genre: 'gospel' },
  John: { testament: 'NT', genre: 'gospel' },

  // New Testament — History
  Acts: { testament: 'NT', genre: 'history' },

  // New Testament — Epistles (Paul)
  Romans: { testament: 'NT', genre: 'epistle' },
  '1 Corinthians': { testament: 'NT', genre: 'epistle' },
  '2 Corinthians': { testament: 'NT', genre: 'epistle' },
  Galatians: { testament: 'NT', genre: 'epistle' },
  Ephesians: { testament: 'NT', genre: 'epistle' },
  Philippians: { testament: 'NT', genre: 'epistle' },
  Colossians: { testament: 'NT', genre: 'epistle' },
  '1 Thessalonians': { testament: 'NT', genre: 'epistle' },
  '2 Thessalonians': { testament: 'NT', genre: 'epistle' },
  '1 Timothy': { testament: 'NT', genre: 'epistle' },
  '2 Timothy': { testament: 'NT', genre: 'epistle' },
  Titus: { testament: 'NT', genre: 'epistle' },
  Philemon: { testament: 'NT', genre: 'epistle' },
  Hebrews: { testament: 'NT', genre: 'epistle' },

  // New Testament — General Epistles
  James: { testament: 'NT', genre: 'epistle' },
  '1 Peter': { testament: 'NT', genre: 'epistle' },
  '2 Peter': { testament: 'NT', genre: 'epistle' },
  '1 John': { testament: 'NT', genre: 'epistle' },
  '2 John': { testament: 'NT', genre: 'epistle' },
  '3 John': { testament: 'NT', genre: 'epistle' },
  Jude: { testament: 'NT', genre: 'epistle' },

  // New Testament — Apocalyptic
  Revelation: { testament: 'NT', genre: 'apocalyptic' },
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawVerse {
  book: string
  chapter: number
  verse: number
  text: string
}

type VerseInsert = Database['public']['Tables']['bible_verses']['Insert'] & {
  testament: 'OT' | 'NT'
  genre: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BATCH_SIZE = 500

async function importTranslation(
  supabase: ReturnType<typeof createClient<Database>>,
  filePath: string,
  translation: string,
): Promise<void> {
  console.log(`\n--- Importing ${translation} from ${filePath} ---`)

  if (!fs.existsSync(filePath)) {
    console.warn(`  File not found, skipping: ${filePath}`)
    return
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const verses: RawVerse[] = JSON.parse(raw)

  console.log(`  Loaded ${verses.length} verses`)

  // Build rows
  const rows: VerseInsert[] = []
  const unknownBooks = new Set<string>()

  for (const v of verses) {
    const meta = BOOK_META[v.book]
    if (!meta) {
      unknownBooks.add(v.book)
      continue
    }
    rows.push({
      translation,
      book: v.book,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text,
      testament: meta.testament,
      genre: meta.genre,
    })
  }

  if (unknownBooks.size > 0) {
    console.warn(`  Unknown books skipped: ${[...unknownBooks].join(', ')}`)
  }

  // Batch upsert
  let inserted = 0
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE)

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    const { error } = await supabase
      .from('bible_verses')
      .upsert(batch as any, { onConflict: 'translation,book,chapter,verse' })

    if (error) {
      console.error(`  Batch ${batchNum}/${totalBatches} FAILED: ${error.message}`)
      throw error
    }

    inserted += batch.length
    console.log(
      `  Progress: ${inserted}/${rows.length} verses (batch ${batchNum}/${totalBatches})`,
    )
  }

  console.log(`  Done! Upserted ${inserted} ${translation} verses.`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      'Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.',
    )
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

  const dataDir = path.resolve(__dirname, '..', 'data')

  await importTranslation(supabase, path.join(dataDir, 'kjv.json'), 'KJV')
  await importTranslation(supabase, path.join(dataDir, 'web.json'), 'WEB')

  console.log('\nAll imports complete.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
