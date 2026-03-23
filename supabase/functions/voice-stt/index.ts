import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!
  const openai = new OpenAI({ apiKey: openaiApiKey })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Request must be multipart/form-data' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  const audioField = formData.get('audio')
  if (!audioField || !(audioField instanceof File)) {
    return new Response(
      JSON.stringify({ error: 'Form field "audio" is required and must be a file' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  const audioFile = audioField as File

  // Validate file size (OpenAI Whisper limit: 25 MB)
  const MAX_BYTES = 25 * 1024 * 1024
  if (audioFile.size > MAX_BYTES) {
    return new Response(
      JSON.stringify({ error: 'Audio file exceeds 25 MB limit' }),
      {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  try {
    // Forward to OpenAI Whisper API
    // The OpenAI SDK accepts a File object directly
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      response_format: 'text',
    })

    // response_format: 'text' returns a plain string
    const transcript =
      typeof transcription === 'string' ? transcription : (transcription as { text: string }).text

    return new Response(JSON.stringify({ transcript: transcript.trim() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Whisper transcription error:', err)

    // Surface OpenAI API errors to the caller with appropriate status codes
    if (err instanceof OpenAI.APIError) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API error',
          detail: err.message,
          status: err.status,
        }),
        {
          status: err.status ?? 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
