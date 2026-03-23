import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ExtractRequest {
  user_id: string
  conversation_id: string
  user_message: string
  assistant_response: string
}

interface ExtractedEntities {
  themes: string[]
  books: string[]
  passages: string[]
  life_context: string[]
  prayer_topics: string[]
}

const EXTRACTION_PROMPT = `You are a precise entity extractor for a Bible companion app. Analyze the conversation turn and extract relevant entities.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "themes": ["string"],
  "books": ["string"],
  "passages": ["string"],
  "life_context": ["string"],
  "prayer_topics": ["string"]
}

Definitions:
- themes: spiritual/emotional themes (e.g., "anxiety", "forgiveness", "grace", "hope", "salvation")
- books: Bible books explicitly mentioned or clearly referenced (e.g., "Romans", "Psalms", "John")
- passages: specific verse references (e.g., "Romans 8:28", "John 3:16")
- life_context: user's personal situation or life circumstances (e.g., "going through grief", "new job", "relationship trouble")
- prayer_topics: specific prayer requests or intercession needs (e.g., "healing for family member", "job search", "peace of mind")

Guidelines:
- Only include entities clearly present or strongly implied in the text
- Keep strings concise (2-5 words for life_context and prayer_topics)
- Return empty arrays [] for categories with no matches
- Do not duplicate across categories (a passage like "Romans 8:28" goes in passages, not books)`

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

  let body: ExtractRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { user_id, conversation_id, user_message, assistant_response } = body

  if (!user_id || !conversation_id || !user_message || !assistant_response) {
    return new Response(
      JSON.stringify({ error: 'user_id, conversation_id, user_message, and assistant_response are required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const openai = new OpenAI({ apiKey: openaiApiKey })

  try {
    // 1. Call GPT-4o to extract entities
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        {
          role: 'user',
          content: `USER MESSAGE:\n${user_message}\n\nASSISTANT RESPONSE:\n${assistant_response}`,
        },
      ],
      max_tokens: 512,
      temperature: 0.1, // Low temperature for deterministic extraction
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content ?? '{}'

    // 2. Parse JSON response
    let entities: ExtractedEntities
    try {
      entities = JSON.parse(rawContent)
    } catch {
      console.error('Failed to parse entity extraction response:', rawContent)
      return new Response(
        JSON.stringify({ error: 'Failed to parse GPT response' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Normalise: ensure all arrays exist
    const normalised: ExtractedEntities = {
      themes: Array.isArray(entities.themes) ? entities.themes : [],
      books: Array.isArray(entities.books) ? entities.books : [],
      passages: Array.isArray(entities.passages) ? entities.passages : [],
      life_context: Array.isArray(entities.life_context) ? entities.life_context : [],
      prayer_topics: Array.isArray(entities.prayer_topics) ? entities.prayer_topics : [],
    }

    // 3. Build upsert rows
    const now = new Date().toISOString()
    const upsertRows = [
      ...normalised.themes.map((key) => ({
        user_id,
        entity_type: 'theme' as const,
        entity_key: key.toLowerCase().trim(),
      })),
      ...normalised.books.map((key) => ({
        user_id,
        entity_type: 'book' as const,
        entity_key: key.trim(),
      })),
      ...normalised.passages.map((key) => ({
        user_id,
        entity_type: 'passage' as const,
        entity_key: key.trim(),
      })),
      ...normalised.life_context.map((key) => ({
        user_id,
        entity_type: 'life_context' as const,
        entity_key: key.toLowerCase().trim(),
      })),
      ...normalised.prayer_topics.map((key) => ({
        user_id,
        entity_type: 'prayer_topic' as const,
        entity_key: key.toLowerCase().trim(),
      })),
    ].filter((row) => row.entity_key.length > 0)

    if (upsertRows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, upserted: 0, entities: normalised }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 4. Upsert into user_journey, properly incrementing mention_count.
    // Supabase's client-side upsert cannot increment a column — it only overwrites.
    // Instead: fetch existing rows, then insert new ones / update existing ones.
    const { data: existing } = await supabase
      .from('user_journey')
      .select('id, entity_type, entity_key, mention_count')
      .eq('user_id', user_id)
      .in('entity_key', upsertRows.map((r) => r.entity_key))

    const existingMap = new Map(
      (existing ?? []).map((e) => [`${e.entity_type}:${e.entity_key}`, e]),
    )

    const toInsert: typeof upsertRows = []
    const toUpdate: { id: string; mention_count: number }[] = []

    for (const row of upsertRows) {
      const key = `${row.entity_type}:${row.entity_key}`
      const found = existingMap.get(key)
      if (found) {
        toUpdate.push({ id: found.id, mention_count: found.mention_count + 1 })
      } else {
        toInsert.push(row)
      }
    }

    await Promise.all([
      toInsert.length > 0
        ? supabase.from('user_journey').insert(
            toInsert.map((row) => ({
              ...row,
              relevance_score: 1.0,
              last_seen: now,
              metadata: {},
            })),
          )
        : Promise.resolve(),
      ...toUpdate.map((u) =>
        supabase
          .from('user_journey')
          .update({ mention_count: u.mention_count, last_seen: now, relevance_score: 1.0 })
          .eq('id', u.id),
      ),
    ])

    return new Response(
      JSON.stringify({
        success: true,
        upserted: upsertRows.length,
        entities: normalised,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('Extract entities error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
