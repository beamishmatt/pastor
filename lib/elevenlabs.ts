const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB'; // "Adam" — warm, measured

export interface TTSOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
}

export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer> {
  const voiceId = options.voiceId ?? ELEVENLABS_VOICE_ID;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS error: ${response.status}`);
  }

  return response.arrayBuffer();
}

export const AVAILABLE_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Warm, measured' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Deep, authoritative' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', description: 'Calm, pastoral' },
];
