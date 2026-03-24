import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string
  conversation_id: string | null
  user_id: string
  is_prayer_mode?: boolean
  chat_scope?: string
}

interface JourneyEntity {
  entity_type: string
  entity_key: string
  mention_count: number
  relevance_score: number
}

interface BiblePassage {
  book: string
  chapter: number
  start_verse: number
  end_verse: number
  chunk_text: string
}

const READING_PLAN_DISCOVERY_PROMPT = `
READING PLAN DISCOVERY MODE:
You are in a focused pastoral intake conversation. Your purpose is to understand this person well enough to recommend a truly personal reading plan, then create it only once they say yes.

YOUR APPROACH — three phases:

OPENING: When the user first enters this mode, open with "Let's get started building your reading plan" (or a warm natural variation), then immediately move into Phase 1.

PHASE 1 — GATHER (2–3 turns):
1. Ask what has been on their heart lately — what they are walking through or hoping to find in Scripture.
2. Follow up to understand their spiritual goal: go deeper on a theme, work through something specific, build a daily habit, or encounter God freshly.
3. Ask how much time they can give each day: 5–10 min (7 days), 10–20 min (14 days), 20+ min (21 days).

PHASE 2 — PROPOSE (one turn, after you have enough context):
Present the plan you would build for them in warm, personal language. Include:
- The title you'd give it (evocative, naming their season)
- A brief arc of the journey (e.g. "We'd begin in lament, move through hope, and arrive at trust")
- The length (7, 14, or 21 days)
End with a clear, simple question: "Would you like me to save this plan for you?"
Do NOT emit the [GENERATE_PLAN] marker in this response.

PHASE 3 — CREATE (only after the user confirms — e.g. "yes", "save it", "let's go", "sounds good"):
Give a warm closing line (1–2 sentences), then append this marker on its own line at the very end, with no explanation:

[GENERATE_PLAN:{"title":"Personal Evocative Title","description":"1–2 sentence description written to them","duration":14,"themes":["theme1","theme2","theme3"],"life_context":"what they are walking through","focus":"anchor books or passages"}]

RULES:
- Duration must be 7, 14, or 21 only
- Themes: 2–5 lowercase strings (e.g. "anxiety", "grief", "hope", "forgiveness", "trust")
- Title must feel personal — name their season (e.g. "Through the Valley — Psalms for Hard Times", "Anchored in Grace: 14 Days in Romans")
- NEVER emit the marker until the user has explicitly confirmed they want the plan saved
- NEVER mention or explain the marker to the user`

function buildSystemPrompt(
  isPrayerMode: boolean,
  translation: string,
  journeyContext: string,
  burdens: string,
  passages: string,
  chatScope?: string,
): string {
  return `You are Pastor, a warm and wise AI Bible companion. You provide scripture-grounded guidance with the tone of a thoughtful, caring pastor.

CONSTRAINTS:
- ONLY discuss faith, scripture, spirituality, and life guidance through a biblical lens
- ALWAYS cite specific verses using this exact format: [VERSE:Book Chapter:Verse] (e.g., [VERSE:Romans 8:28])
- When the user asks about a specific passage, ALWAYS cite that primary passage first using [VERSE:] format before citing any related passages
- NEVER invent scripture not in the provided passages
- Decline off-topic requests gracefully
${isPrayerMode ? "- You are in PRAYER MODE: respond as a guided prayer, addressing God, incorporating the user's situation and scripture" : ''}

USER CONTEXT (recurring spiritual themes and books):
${journeyContext || 'No prior context — this may be a new user.'}
${burdens ? `\nCURRENT BURDENS (life circumstances and active prayer requests — tie scripture directly to these):\n${burdens}` : ''}

PERSONALIZATION INSTRUCTIONS:
${journeyContext || burdens
  ? `- This is a returning user. You have specific knowledge of their life and spiritual history above — use it actively.
- CURRENT BURDENS are your highest-priority context. When a retrieved passage connects to a named burden, make that connection explicit and concrete — e.g. "Given that you're walking through [X], this verse speaks directly to that because..." A generic application when a specific one is possible is a missed opportunity.
- For prayer topics, treat them as ongoing intercessions you are already carrying with this person. Reference them by name when the passage speaks to them.
- When a theme has a high mention_count, acknowledge the continuity naturally — e.g. "This is something you've been sitting with for a while..." — without listing their data back at them clinically.
- If they ask what you know about them, summarize their journey warmly and offer to go deeper on any of it.`
  : `- This appears to be a new user. Welcome them warmly and invite them to share what is on their heart.`}

RETRIEVED BIBLE PASSAGES:
${passages || 'No specific passages retrieved for this query.'}

TRANSLATION: ${translation}
${chatScope === 'reading_plan' ? READING_PLAN_DISCOVERY_PROMPT : ''}`
}

function formatJourneyContext(entities: JourneyEntity[]): string {
  const grouped: Record<string, string[]> = {}
  for (const entity of entities) {
    // life_context and prayer_topic surface separately in CURRENT BURDENS
    if (entity.entity_type === 'life_context' || entity.entity_type === 'prayer_topic') continue
    if (!grouped[entity.entity_type]) grouped[entity.entity_type] = []
    grouped[entity.entity_type].push(
      `${entity.entity_key} (mentioned ${entity.mention_count}x)`,
    )
  }

  const entries = Object.entries(grouped)
  if (!entries.length) return ''
  return entries
    .map(([type, items]) => `${type.toUpperCase()}: ${items.join(', ')}`)
    .join('\n')
}

function formatBurdens(entities: JourneyEntity[]): string {
  const burdens = entities.filter(
    (e) => e.entity_type === 'life_context' || e.entity_type === 'prayer_topic',
  )
  if (!burdens.length) return ''
  return burdens
    .map((e) =>
      `- ${e.entity_key} (${e.entity_type === 'prayer_topic' ? 'prayer request' : 'life circumstance'}, mentioned ${e.mention_count}x)`,
    )
    .join('\n')
}

function formatPassages(passages: BiblePassage[]): string {
  return passages
    .map(
      (p) =>
        `[${p.book} ${p.chapter}:${p.start_verse}-${p.end_verse}]\n${p.chunk_text}`,
    )
    .join('\n\n')
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: ChatRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { message, conversation_id, user_id, is_prayer_mode = false, chat_scope } = body

  if (!message || !user_id) {
    return new Response(
      JSON.stringify({ error: 'message and user_id are required' }),
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
    // 1. Fetch profile, journey entities, and conversation history in parallel
    const [{ data: profile }, { data: journeyEntities }, { data: historyMessages }] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('translation_preference')
        .eq('id', user_id)
        .single(),
      supabase
        .from('user_journey')
        .select('entity_type, entity_key, mention_count, relevance_score')
        .eq('user_id', user_id)
        .order('relevance_score', { ascending: false })
        .order('last_seen', { ascending: false })
        .limit(10),
      conversation_id
        ? supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', conversation_id)
            .order('created_at', { ascending: true })
            .limit(20)
        : Promise.resolve({ data: [] as { role: string; content: string }[] }),
    ])

    const translation = profile?.translation_preference ?? 'KJV'

    // 2. Embed the user message, augmented with the user's top recurring themes
    //    and life context so the vector search surfaces personally relevant passages.
    const topPersonalContext = (journeyEntities ?? [])
      .filter((e) => e.entity_type === 'theme' || e.entity_type === 'life_context')
      .slice(0, 3)
      .map((e) => e.entity_key)
      .join(', ')
    const embeddingInput = topPersonalContext
      ? `${message} (user context: ${topPersonalContext})`
      : message

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: embeddingInput,
    })
    const queryEmbedding = embeddingResponse.data[0].embedding

    // 3. Vector similarity search on bible_embeddings
    const { data: rawPassages, error: passageError } = await supabase.rpc(
      'match_bible_embeddings',
      {
        query_embedding: queryEmbedding,
        translation_filter: translation,
        match_count: 7,
      },
    )

    if (passageError) {
      console.error('Passage search error:', passageError)
    }

    // 3a. If this is an "Ask Pastor" query (message ends with "— Book Ch:V"),
    //     fetch the source verse directly and prepend it so GPT-4o always cites it.
    let passages: BiblePassage[] = rawPassages ?? []
    const sourceVerseMatch = message.match(/—\s*(.+?\s\d+:\d+)\s*$/)
    if (sourceVerseMatch) {
      const ref = sourceVerseMatch[1].trim()
      const refParts = ref.match(/^(.+?)\s+(\d+):(\d+)$/)
      if (refParts) {
        const [, svBook, svChapter, svVerse] = refParts
        const { data: svData } = await supabase
          .from('bible_verses')
          .select('text')
          .eq('translation', translation)
          .eq('book', svBook)
          .eq('chapter', parseInt(svChapter))
          .eq('verse', parseInt(svVerse))
          .single()
        if (svData) {
          passages = [
            {
              book: svBook,
              chapter: parseInt(svChapter),
              start_verse: parseInt(svVerse),
              end_verse: parseInt(svVerse),
              chunk_text: svData.text,
            },
            ...passages,
          ]
        }
      }
    }

    // 4. Build system prompt
    const journeyContext = formatJourneyContext(journeyEntities ?? [])
    const burdens = formatBurdens(journeyEntities ?? [])
    const passagesText = formatPassages(passages)
    const systemPrompt = buildSystemPrompt(
      is_prayer_mode,
      translation,
      journeyContext,
      burdens,
      passagesText,
      chat_scope,
    )

    // 6. Ensure conversation exists
    let activeConversationId = conversation_id
    if (!activeConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id,
          title: message.slice(0, 80),
          is_prayer_mode,
        })
        .select('id')
        .single()

      if (convError || !newConversation) {
        throw new Error(`Failed to create conversation: ${convError?.message}`)
      }
      activeConversationId = newConversation.id
    }

    // 7. Call GPT-4o with streaming
    const priorMessages = (historyMessages ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...priorMessages,
        { role: 'user', content: message },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    })

    // 8. Stream SSE response, accumulate full response for post-processing
    let fullAssistantResponse = ''
    const encoder = new TextEncoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send the conversation_id first so the client can track it
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ conversation_id: activeConversationId })}\n\n`,
            ),
          )

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? ''
            if (delta) {
              fullAssistantResponse += delta
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`),
              )
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          // 9. After streaming: save messages to DB
          await Promise.all([
            supabase.from('messages').insert({
              conversation_id: activeConversationId!,
              role: 'user',
              content: message,
              cited_verses: [],
            }),
            supabase.from('messages').insert({
              conversation_id: activeConversationId!,
              role: 'assistant',
              content: fullAssistantResponse,
              cited_verses: extractCitedVerses(fullAssistantResponse),
            }),
          ])

          // 10. Trigger entity extraction — awaited before close so the Deno
          //     isolate doesn't terminate before the fetch completes
          await fetch(`${supabaseUrl}/functions/v1/extract-entities`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              user_id,
              conversation_id: activeConversationId,
              user_message: message,
              assistant_response: fullAssistantResponse,
            }),
          }).catch((err) => console.error('Entity extraction failed:', err))

          controller.close()
        } catch (err) {
          console.error('Streaming error:', err)
          controller.error(err)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Chat function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

/**
 * Parse [VERSE:Book Chapter:Verse] citations from assistant response.
 * Returns an array of citation strings.
 */
function extractCitedVerses(text: string): string[] {
  const regex = /\[VERSE:([^\]]+)\]/g
  const verses: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    verses.push(match[1].trim())
  }
  return [...new Set(verses)]
}
