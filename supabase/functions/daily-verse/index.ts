import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface DailyVerseResponse {
  date: string
  translation: string
  book: string
  chapter: number
  verse: number
  text: string
  reflection: string | null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const openai = new OpenAI({ apiKey: openaiApiKey })

  // Get today's date in UTC (YYYY-MM-DD)
  const todayUtc = new Date().toISOString().slice(0, 10)

  try {
    // 1. Look up today's daily verse
    const { data: existing, error: lookupError } = await supabase
      .from('daily_verses')
      .select('*')
      .eq('date', todayUtc)
      .single()

    if (lookupError && lookupError.code !== 'PGRST116') {
      // PGRST116 = "no rows returned" — anything else is a real error
      throw new Error(`Database lookup failed: ${lookupError.message}`)
    }

    if (existing) {
      const response: DailyVerseResponse = {
        date: existing.date,
        translation: existing.translation,
        book: existing.book,
        chapter: existing.chapter,
        verse: existing.verse,
        text: existing.text,
        reflection: existing.reflection,
      }
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. No verse for today — pick a random KJV verse
    const { data: randomVerses, error: randomError } = await supabase
      .from('bible_verses')
      .select('book, chapter, verse, text')
      .eq('translation', 'KJV')
      .limit(1)
      // Supabase doesn't expose ORDER BY random() directly, so we use a count+offset approach
      // We'll use a workaround via rpc or just call a raw query with offset
      // For simplicity, select with a random offset computed client-side
      .range(Math.floor(Math.random() * 31000), Math.floor(Math.random() * 31000))

    if (randomError || !randomVerses?.length) {
      // Fallback: fetch the first verse if random fails
      const { data: fallback, error: fallbackError } = await supabase
        .from('bible_verses')
        .select('book, chapter, verse, text')
        .eq('translation', 'KJV')
        .limit(1)
        .single()

      if (fallbackError || !fallback) {
        throw new Error('No bible verses found in database')
      }

      return await generateAndInsertDailyVerse(supabase, openai, todayUtc, fallback)
    }

    return await generateAndInsertDailyVerse(supabase, openai, todayUtc, randomVerses[0])
  } catch (err) {
    console.error('Daily verse error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

async function generateAndInsertDailyVerse(
  supabase: ReturnType<typeof createClient>,
  openai: OpenAI,
  date: string,
  verse: { book: string; chapter: number; verse: number; text: string },
): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  // 3. Generate a brief reflection via GPT-4o
  let reflection: string | null = null
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
          content: `Write a brief daily reflection for this verse:\n\n${verse.book} ${verse.chapter}:${verse.verse} (KJV)\n"${verse.text}"`,
        },
      ],
      max_tokens: 200,
      temperature: 0.75,
    })
    reflection = completion.choices[0]?.message?.content?.trim() ?? null
  } catch (err) {
    console.error('Reflection generation failed:', err)
    // Non-fatal: proceed without reflection
  }

  // 4. Insert into daily_verses
  const newEntry = {
    date,
    translation: 'KJV',
    book: verse.book,
    chapter: verse.chapter,
    verse: verse.verse,
    text: verse.text,
    reflection,
  }

  const { data: inserted, error: insertError } = await supabase
    .from('daily_verses')
    .insert(newEntry)
    .select()
    .single()

  if (insertError) {
    // Race condition: another invocation may have inserted first — try fetching again
    if (insertError.code === '23505') {
      const { data: raceWinner } = await supabase
        .from('daily_verses')
        .select('*')
        .eq('date', date)
        .single()

      if (raceWinner) {
        const response: DailyVerseResponse = {
          date: raceWinner.date,
          translation: raceWinner.translation,
          book: raceWinner.book,
          chapter: raceWinner.chapter,
          verse: raceWinner.verse,
          text: raceWinner.text,
          reflection: raceWinner.reflection,
        }
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }
    throw new Error(`Failed to insert daily verse: ${insertError.message}`)
  }

  const response: DailyVerseResponse = {
    date: inserted.date,
    translation: inserted.translation,
    book: inserted.book,
    chapter: inserted.chapter,
    verse: inserted.verse,
    text: inserted.text,
    reflection: inserted.reflection,
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
