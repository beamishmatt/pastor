import OpenAI from 'openai';

// Note: This client is used only in Supabase Edge Functions (Deno) and Node.js scripts.
// The React Native app communicates with OpenAI exclusively through Supabase Edge Functions.
// Never expose OPENAI_API_KEY to the client bundle.

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export const OPENAI_MODELS = {
  chat: 'gpt-4o',
  embedding: 'text-embedding-3-small',
  stt: 'whisper-1',
} as const;

export const EMBEDDING_DIMENSIONS = 1536;
