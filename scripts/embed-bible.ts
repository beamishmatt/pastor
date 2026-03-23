/**
 * embed-bible.ts
 *
 * Chunks Bible passages with a sliding window and creates OpenAI embeddings,
 * storing results in the bible_embeddings table.
 *
 * Run with: npx ts-node scripts/embed-bible.ts
 *
 * Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { Database } from '../types/database'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const WINDOW_SIZE = 5   // verses per chunk
const OVERLAP = 2       // verse overlap between consecutive chunks
const STEP = WINDOW_SIZE - OVERLAP
const BATCH_CONCURRENT = 10  // max concurrent embedding requests
const RATE_LIMIT_RPS = 60    // target max requests per second
const MIN_INTERVAL_MS = Math.ceil(1000 / RATE_LIMIT_RPS)
const MAX_RETRIES = 5
const EMBED_MODEL = 'text-embedding-3-small'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DbVerse {
  id: number
  translation: string
  book: string
  chapter: number
  verse: number
  text: string
  testament: 'OT' | 'NT'
  genre: string
}

interface Chunk {
  translation: string
  book: string
  chapter: number
  start_verse: number
  end_verse: number
  chunk_text: string
  testament: 'OT' | 'NT'
  genre: string
}

type EmbeddingInsert = Database['public']['Tables']['bible_embeddings']['Insert']

// ---------------------------------------------------------------------------
// Rate limiter — simple token bucket with FIFO queue
// ---------------------------------------------------------------------------

class RateLimiter {
  private queue: Array<() => void> = []
  private lastCallTime = 0
  private inFlight = 0
  private readonly maxConcurrent: number
  private readonly minIntervalMs: number

  constructor(maxConcurrent: number, minIntervalMs: number) {
    this.maxConcurrent = maxConcurrent
    this.minIntervalMs = minIntervalMs
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve)
      this.drain()
    })
  }

  release(): void {
    this.inFlight--
    this.drain()
  }

  private drain() {
    while (this.queue.length > 0 && this.inFlight < this.maxConcurrent) {
      const now = Date.now()
      const elapsed = now - this.lastCallTime
      const wait = Math.max(0, this.minIntervalMs - elapsed)

      if (wait > 0) {
        setTimeout(() => this.drain(), wait)
        return
      }

      const resolve = this.queue.shift()!
      this.inFlight++
      this.lastCallTime = Date.now()
      resolve()
    }
  }
}

// ---------------------------------------------------------------------------
// Exponential backoff retry
// ---------------------------------------------------------------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = MAX_RETRIES,
): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (err: any) {
      attempt++
      const isRateLimit =
        err?.status === 429 ||
        (err?.message && err.message.toLowerCase().includes('rate limit'))

      if (!isRateLimit || attempt >= maxRetries) {
        throw err
      }

      const backoffMs = Math.min(1000 * 2 ** attempt + Math.random() * 500, 30000)
      console.warn(
        `  Rate limited (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(backoffMs)}ms...`,
      )
      await sleep(backoffMs)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

/**
 * Groups a flat list of verses (already sorted) by translation > book > chapter,
 * then creates sliding window chunks within each chapter.
 */
function buildChunks(verses: DbVerse[]): Chunk[] {
  // Group: translation -> book -> chapter -> verses[]
  const grouped = new Map<string, Map<string, Map<number, DbVerse[]>>>()

  for (const v of verses) {
    if (!grouped.has(v.translation)) grouped.set(v.translation, new Map())
    const byBook = grouped.get(v.translation)!
    if (!byBook.has(v.book)) byBook.set(v.book, new Map())
    const byChapter = byBook.get(v.book)!
    if (!byChapter.has(v.chapter)) byChapter.set(v.chapter, [])
    byChapter.get(v.chapter)!.push(v)
  }

  const chunks: Chunk[] = []

  for (const [translation, byBook] of grouped) {
    for (const [book, byChapter] of byBook) {
      for (const [_chapter, chapterVerses] of byChapter) {
        // Sort by verse number
        chapterVerses.sort((a, b) => a.verse - b.verse)

        // Sliding window
        for (let i = 0; i < chapterVerses.length; i += STEP) {
          const window = chapterVerses.slice(i, i + WINDOW_SIZE)
          if (window.length === 0) break

          const start_verse = window[0].verse
          const end_verse = window[window.length - 1].verse
          const chunk_text = window.map((v) => `${v.verse} ${v.text}`).join(' ')
          const firstVerse = window[0]

          chunks.push({
            translation,
            book,
            chapter: firstVerse.chapter,
            start_verse,
            end_verse,
            chunk_text,
            testament: firstVerse.testament,
            genre: firstVerse.genre,
          })
        }
      }
    }
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    console.error(
      'Error: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY must be set.',
    )
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
  const openai = new OpenAI({ apiKey: openaiApiKey })
  const limiter = new RateLimiter(BATCH_CONCURRENT, MIN_INTERVAL_MS)

  // 1. Fetch all verses
  console.log('Fetching bible verses...')
  const allVerses: DbVerse[] = []
  let rangeStart = 0
  const PAGE_SIZE = 1000  // Supabase REST API max

  while (true) {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('id, translation, book, chapter, verse, text, testament, genre')
      .order('translation')
      .order('book')
      .order('chapter')
      .order('verse')
      .range(rangeStart, rangeStart + PAGE_SIZE - 1)

    if (error) throw new Error(`Failed to fetch verses: ${error.message}`)
    if (!data || data.length === 0) break

    allVerses.push(...(data as DbVerse[]))
    console.log(`  Fetched ${allVerses.length} verses so far...`)

    if (data.length < PAGE_SIZE) break
    rangeStart += PAGE_SIZE
  }

  console.log(`Total verses: ${allVerses.length}`)

  // 2. Build chunks
  console.log('Building chunks...')
  const allChunks = buildChunks(allVerses)
  console.log(`Total chunks: ${allChunks.length}`)

  // 3. Fetch already-embedded chunk keys to skip them
  console.log('Checking existing embeddings...')
  const { data: existing, error: existingError } = await supabase
    .from('bible_embeddings')
    .select('translation, book, chapter, start_verse')

  if (existingError) {
    console.warn('Could not fetch existing embeddings, will process all chunks.')
  }

  const embeddedKeys = new Set(
    (existing ?? []).map(
      (e) => `${e.translation}|${e.book}|${e.chapter}|${e.start_verse}`,
    ),
  )

  const pendingChunks = allChunks.filter(
    (c) =>
      !embeddedKeys.has(`${c.translation}|${c.book}|${c.chapter}|${c.start_verse}`),
  )

  console.log(
    `Chunks to embed: ${pendingChunks.length} (skipping ${allChunks.length - pendingChunks.length} already embedded)`,
  )

  if (pendingChunks.length === 0) {
    console.log('Nothing to embed. Done!')
    return
  }

  // 4. Embed chunks with concurrency + rate limiting
  let completed = 0
  const total = pendingChunks.length
  const errors: Array<{ chunk: Chunk; error: string }> = []

  // Group by translation for nicer progress logs
  const byTranslation = new Map<string, Chunk[]>()
  for (const chunk of pendingChunks) {
    if (!byTranslation.has(chunk.translation)) byTranslation.set(chunk.translation, [])
    byTranslation.get(chunk.translation)!.push(chunk)
  }

  const tasks = pendingChunks.map((chunk) => async () => {
    await limiter.acquire()
    try {
      const embeddingResponse = await withRetry(() =>
        openai.embeddings.create({
          model: EMBED_MODEL,
          input: chunk.chunk_text,
        }),
      )

      const embedding = embeddingResponse.data[0].embedding

      const row: EmbeddingInsert = {
        translation: chunk.translation,
        book: chunk.book,
        chapter: chunk.chapter,
        start_verse: chunk.start_verse,
        end_verse: chunk.end_verse,
        chunk_text: chunk.chunk_text,
        testament: chunk.testament,
        genre: chunk.genre,
        embedding: embedding as any,
      }

      const { error: upsertError } = await supabase
        .from('bible_embeddings')
        .upsert(row as any, {
          onConflict: 'translation,book,chapter,start_verse',
          ignoreDuplicates: false,
        })

      if (upsertError) {
        errors.push({ chunk, error: upsertError.message })
        console.error(
          `  UPSERT ERROR: ${chunk.translation} ${chunk.book} ${chunk.chapter}:${chunk.start_verse} — ${upsertError.message}`,
        )
      } else {
        completed++
        if (completed % 100 === 0 || completed === total) {
          const translation = chunk.translation
          const transTotal = byTranslation.get(translation)?.length ?? '?'
          console.log(
            `  Embedded ${completed}/${total} chunks (${translation}: ${chunk.book} ${chunk.chapter})`,
          )
        }
      }
    } catch (err: any) {
      errors.push({ chunk, error: String(err) })
      console.error(
        `  ERROR: ${chunk.translation} ${chunk.book} ${chunk.chapter}:${chunk.start_verse} — ${err.message ?? err}`,
      )
    } finally {
      limiter.release()
    }
  })

  // Execute all tasks (limiter controls concurrency)
  await Promise.all(tasks.map((t) => t()))

  console.log(`\nEmbedding complete!`)
  console.log(`  Successful: ${completed}/${total}`)
  if (errors.length > 0) {
    console.warn(`  Failed: ${errors.length} chunks`)
    console.warn('  Failed chunks:')
    for (const { chunk, error } of errors.slice(0, 20)) {
      console.warn(
        `    ${chunk.translation} ${chunk.book} ${chunk.chapter}:${chunk.start_verse} — ${error}`,
      )
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
