/**
 * seed-daily-verses.ts
 *
 * Pre-generates daily verses for the next 365 days.
 * For each date without an entry, selects from the curated verse list (cycling)
 * and generates a brief GPT-4o reflection.
 *
 * Run with: npx ts-node scripts/seed-daily-verses.ts
 *
 * Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { Database } from '../types/database'

// ---------------------------------------------------------------------------
// Curated seed verses
// ---------------------------------------------------------------------------

interface SeedVerse {
  book: string
  chapter: number
  verse: number
  translation: string
  text: string
}

/**
 * A curated collection of well-known, encouraging Bible verses.
 * Spans Psalms, John, Romans, Matthew, Isaiah, Philippians, Jeremiah, Proverbs,
 * and other beloved books.
 */
const SEED_VERSES: SeedVerse[] = [
  // Psalms
  {
    book: 'Psalms', chapter: 23, verse: 1, translation: 'KJV',
    text: 'The LORD is my shepherd; I shall not want.',
  },
  {
    book: 'Psalms', chapter: 46, verse: 10, translation: 'KJV',
    text: 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.',
  },
  {
    book: 'Psalms', chapter: 119, verse: 105, translation: 'KJV',
    text: 'Thy word is a lamp unto my feet, and a light unto my path.',
  },
  {
    book: 'Psalms', chapter: 34, verse: 18, translation: 'KJV',
    text: 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
  },
  {
    book: 'Psalms', chapter: 91, verse: 1, translation: 'KJV',
    text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.',
  },
  {
    book: 'Psalms', chapter: 27, verse: 1, translation: 'KJV',
    text: 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?',
  },
  {
    book: 'Psalms', chapter: 37, verse: 4, translation: 'KJV',
    text: 'Delight thyself also in the LORD; and he shall give thee the desires of thine heart.',
  },

  // John
  {
    book: 'John', chapter: 3, verse: 16, translation: 'KJV',
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  },
  {
    book: 'John', chapter: 14, verse: 6, translation: 'KJV',
    text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.',
  },
  {
    book: 'John', chapter: 11, verse: 25, translation: 'KJV',
    text: 'Jesus said unto her, I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live.',
  },
  {
    book: 'John', chapter: 16, verse: 33, translation: 'KJV',
    text: 'These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.',
  },

  // Romans
  {
    book: 'Romans', chapter: 8, verse: 28, translation: 'KJV',
    text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
  },
  {
    book: 'Romans', chapter: 8, verse: 38, translation: 'KJV',
    text: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.',
  },
  {
    book: 'Romans', chapter: 12, verse: 2, translation: 'KJV',
    text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.',
  },
  {
    book: 'Romans', chapter: 5, verse: 1, translation: 'KJV',
    text: 'Therefore being justified by faith, we have peace with God through our Lord Jesus Christ.',
  },

  // Matthew
  {
    book: 'Matthew', chapter: 11, verse: 28, translation: 'KJV',
    text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
  },
  {
    book: 'Matthew', chapter: 6, verse: 33, translation: 'KJV',
    text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
  },
  {
    book: 'Matthew', chapter: 5, verse: 16, translation: 'KJV',
    text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.',
  },

  // Isaiah
  {
    book: 'Isaiah', chapter: 40, verse: 31, translation: 'KJV',
    text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
  },
  {
    book: 'Isaiah', chapter: 41, verse: 10, translation: 'KJV',
    text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.',
  },
  {
    book: 'Isaiah', chapter: 26, verse: 3, translation: 'KJV',
    text: 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.',
  },

  // Philippians
  {
    book: 'Philippians', chapter: 4, verse: 13, translation: 'KJV',
    text: 'I can do all things through Christ which strengtheneth me.',
  },
  {
    book: 'Philippians', chapter: 4, verse: 6, translation: 'KJV',
    text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
  },
  {
    book: 'Philippians', chapter: 4, verse: 7, translation: 'KJV',
    text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
  },

  // Jeremiah
  {
    book: 'Jeremiah', chapter: 29, verse: 11, translation: 'KJV',
    text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
  },
  {
    book: 'Jeremiah', chapter: 31, verse: 3, translation: 'KJV',
    text: 'The LORD hath appeared of old unto me, saying, Yea, I have loved thee with an everlasting love: therefore with lovingkindness have I drawn thee.',
  },

  // Proverbs
  {
    book: 'Proverbs', chapter: 3, verse: 5, translation: 'KJV',
    text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  },
  {
    book: 'Proverbs', chapter: 3, verse: 6, translation: 'KJV',
    text: 'In all thy ways acknowledge him, and he shall direct thy paths.',
  },
  {
    book: 'Proverbs', chapter: 16, verse: 3, translation: 'KJV',
    text: 'Commit thy works unto the LORD, and thy thoughts shall be established.',
  },

  // 2 Timothy
  {
    book: '2 Timothy', chapter: 1, verse: 7, translation: 'KJV',
    text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
  },

  // Ephesians
  {
    book: 'Ephesians', chapter: 2, verse: 8, translation: 'KJV',
    text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.',
  },
  {
    book: 'Ephesians', chapter: 3, verse: 20, translation: 'KJV',
    text: 'Now unto him that is able to do exceeding abundantly above all that we ask or think, according to the power that worketh in us.',
  },

  // Galatians
  {
    book: 'Galatians', chapter: 5, verse: 22, translation: 'KJV',
    text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.',
  },

  // 1 John
  {
    book: '1 John', chapter: 4, verse: 8, translation: 'KJV',
    text: 'He that loveth not knoweth not God; for God is love.',
  },

  // Hebrews
  {
    book: 'Hebrews', chapter: 11, verse: 1, translation: 'KJV',
    text: 'Now faith is the substance of things hoped for, the evidence of things not seen.',
  },
  {
    book: 'Hebrews', chapter: 4, verse: 16, translation: 'KJV',
    text: 'Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.',
  },

  // James
  {
    book: 'James', chapter: 1, verse: 5, translation: 'KJV',
    text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.',
  },

  // Luke
  {
    book: 'Luke', chapter: 1, verse: 37, translation: 'KJV',
    text: 'For with God nothing shall be impossible.',
  },

  // Genesis
  {
    book: 'Genesis', chapter: 1, verse: 1, translation: 'KJV',
    text: 'In the beginning God created the heaven and the earth.',
  },

  // 1 Peter
  {
    book: '1 Peter', chapter: 5, verse: 7, translation: 'KJV',
    text: 'Casting all your care upon him; for he careth for you.',
  },

  // Micah
  {
    book: 'Micah', chapter: 6, verse: 8, translation: 'KJV',
    text: 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',
  },

  // Lamentations
  {
    book: 'Lamentations', chapter: 3, verse: 22, translation: 'KJV',
    text: "It is of the LORD'S mercies that we are not consumed, because his compassions fail not.",
  },
  {
    book: 'Lamentations', chapter: 3, verse: 23, translation: 'KJV',
    text: 'They are new every morning: great is thy faithfulness.',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function generateReflection(
  openai: OpenAI,
  verse: SeedVerse,
  retries = 3,
): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are Pastor, a warm AI Bible companion. Write a brief, encouraging daily reflection on the given verse. Keep it to 2-3 sentences. Be pastoral, personal, and scripture-focused. Do not add greetings or sign-offs.',
          },
          {
            role: 'user',
            content: `Write a brief daily reflection for this verse:\n\n${verse.book} ${verse.chapter}:${verse.verse} (${verse.translation})\n"${verse.text}"`,
          },
        ],
        max_tokens: 200,
        temperature: 0.75,
      })
      return completion.choices[0]?.message?.content?.trim() ?? null
    } catch (err: any) {
      if (err?.status === 429 && attempt < retries) {
        const wait = 2000 * attempt
        console.warn(`    Rate limited, waiting ${wait}ms...`)
        await sleep(wait)
      } else {
        console.error(`    Reflection generation failed: ${err.message ?? err}`)
        return null
      }
    }
  }
  return null
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

  // Build date range: today through 365 days out
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const dates: string[] = []
  for (let i = 0; i < 365; i++) {
    dates.push(toDateString(addDays(today, i)))
  }

  console.log(
    `Seeding daily verses from ${dates[0]} to ${dates[dates.length - 1]} (${dates.length} days)`,
  )

  // Fetch already-seeded dates to skip them
  const { data: existing, error: fetchError } = await supabase
    .from('daily_verses')
    .select('date')
    .gte('date', dates[0])
    .lte('date', dates[dates.length - 1])

  if (fetchError) {
    throw new Error(`Failed to fetch existing daily verses: ${fetchError.message}`)
  }

  const existingDates = new Set((existing ?? []).map((r) => r.date))
  const pendingDates = dates.filter((d) => !existingDates.has(d))

  console.log(
    `Already seeded: ${existingDates.size} days. Pending: ${pendingDates.length} days.`,
  )

  if (pendingDates.length === 0) {
    console.log('All dates already seeded. Done!')
    return
  }

  // Process dates sequentially to avoid hammering the API
  let processed = 0
  for (const date of pendingDates) {
    // Cycle through seed verses
    const verseIndex =
      dates.indexOf(date) % SEED_VERSES.length
    const verse = SEED_VERSES[verseIndex]

    console.log(
      `[${processed + 1}/${pendingDates.length}] ${date}: ${verse.book} ${verse.chapter}:${verse.verse}`,
    )

    // Generate reflection
    process.stdout.write('  Generating reflection...')
    const reflection = await generateReflection(openai, verse)
    console.log(reflection ? ' done.' : ' skipped (failed).')

    // Insert into daily_verses
    const { error: insertError } = await supabase.from('daily_verses').insert({
      date,
      translation: verse.translation,
      book: verse.book,
      chapter: verse.chapter,
      verse: verse.verse,
      text: verse.text,
      reflection,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        console.log(`  Skipped (already exists — race condition)`)
      } else {
        console.error(`  INSERT ERROR: ${insertError.message}`)
      }
    }

    processed++

    // Brief pause between API calls to stay within rate limits
    if (processed < pendingDates.length) {
      await sleep(200)
    }
  }

  console.log(`\nSeeding complete! Processed ${processed} dates.`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
