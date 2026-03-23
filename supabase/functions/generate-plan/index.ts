import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PlanSpec {
  title: string
  description: string
  duration: number
  themes: string[]
  life_context: string
  focus: string
}

interface GeneratePlanRequest {
  user_id: string
  plan_spec: PlanSpec
  conversation_id: string | null
}

interface GeneratedReading {
  day_number: number
  title: string
  passage_ref: string
  book: string
  chapter: number
  verse_start: number | null
  verse_end: number | null
  reflection_prompt: string
}

const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
  'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
]

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40) +
    '-' +
    Math.random().toString(36).slice(2, 7)
  )
}

function buildGenerationPrompt(spec: PlanSpec): string {
  return `You are a biblical scholar and pastoral counselor building a personalized ${spec.duration}-day reading plan.

PERSON'S CONTEXT:
- What they are walking through: ${spec.life_context}
- Spiritual themes: ${spec.themes.join(', ')}
- Focus area: ${spec.focus}
- Plan title: "${spec.title}"

Generate exactly ${spec.duration} daily readings that form a cohesive, pastoral journey addressing this person's specific situation. Each reading should:
- Use a REAL Bible chapter with meaningful content for their context
- Have a title that names what that day's reading offers (not just the passage name)
- Have a reflection prompt written personally to them — specific, not generic
- Progress meaningfully across the ${spec.duration} days (e.g. lament → hope → trust → action)

RETURN ONLY valid JSON in this exact format:
{
  "readings": [
    {
      "day_number": 1,
      "title": "Day title (e.g. 'When God Feels Far')",
      "passage_ref": "Display reference (e.g. 'Psalm 22' or 'Romans 8:18–39')",
      "book": "Exact book name from the approved list",
      "chapter": 22,
      "verse_start": null,
      "verse_end": null,
      "reflection_prompt": "A personal, specific question for them"
    }
  ]
}

APPROVED BOOK NAMES (use exactly these):
${BIBLE_BOOKS.join(', ')}

verse_start and verse_end should be integers when citing a partial chapter, or null for a full chapter.
Do not include the same chapter twice. Make every day feel purposeful and distinct.`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: GeneratePlanRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { user_id, plan_spec, conversation_id } = body

  if (!user_id || !plan_spec) {
    return new Response(JSON.stringify({ error: 'user_id and plan_spec are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Validate duration
  const duration = [7, 14, 21].includes(plan_spec.duration) ? plan_spec.duration : 14

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const openai = new OpenAI({ apiKey: openaiApiKey })

  try {
    // 1. Generate the readings via GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: buildGenerationPrompt({ ...plan_spec, duration }),
        },
      ],
      max_tokens: 4096,
      temperature: 0.6,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    let parsed: { readings: GeneratedReading[] }

    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error('Failed to parse GPT response:', raw)
      return new Response(JSON.stringify({ error: 'Failed to parse plan from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const readings: GeneratedReading[] = (parsed.readings ?? [])
      .filter((r) => BIBLE_BOOKS.includes(r.book))
      .slice(0, duration)
      .map((r, i) => ({ ...r, day_number: i + 1 }))

    if (readings.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid readings generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Save the plan
    const slug = slugify(plan_spec.title)
    const { data: planRow, error: planErr } = await supabase
      .from('reading_plans')
      .insert({
        slug,
        title: plan_spec.title,
        description: plan_spec.description,
        duration_days: readings.length,
        themes: plan_spec.themes,
        books: [...new Set(readings.map((r) => r.book))],
        tags: plan_spec.themes,
        is_pro: false,
        is_ai_generated: true,
        created_by: user_id,
      })
      .select('id')
      .single()

    if (planErr || !planRow) {
      console.error('Plan insert error:', planErr)
      return new Response(JSON.stringify({ error: 'Failed to save plan' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const planId = planRow.id

    // 3. Save all readings
    const { error: readingsErr } = await supabase.from('plan_readings').insert(
      readings.map((r) => ({
        plan_id: planId,
        day_number: r.day_number,
        title: r.title,
        passage_ref: r.passage_ref,
        book: r.book,
        chapter: r.chapter,
        verse_start: r.verse_start ?? null,
        verse_end: r.verse_end ?? null,
        reflection_prompt: r.reflection_prompt,
      }))
    )

    if (readingsErr) {
      console.error('Readings insert error:', readingsErr)
    }

    // 4. Enroll the user (ignore conflict if already enrolled somehow)
    await supabase
      .from('plan_enrollments')
      .upsert(
        { user_id, plan_id: planId, current_day: 1 },
        { onConflict: 'user_id,plan_id' }
      )

    return new Response(
      JSON.stringify({
        slug,
        title: plan_spec.title,
        duration_days: readings.length,
        plan_id: planId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('generate-plan error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
