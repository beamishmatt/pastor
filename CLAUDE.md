# Pastor — CLAUDE.md

AI Bible companion for iOS. Built by EMBE LABS LLC.

## Tech stack
- **Mobile**: React Native / Expo SDK 52, TypeScript, Expo Router (file-based)
- **Backend**: Supabase (auth, Postgres, pgvector, Edge Functions)
- **AI**: OpenAI GPT-4o (chat), text-embedding-3-small (embeddings), Whisper (STT)
- **Voice TTS**: ElevenLabs
- **IAP**: RevenueCat — single `pro` entitlement
- **Offline Bible**: expo-sqlite, KJV + WEB (public domain)

## Key decisions
- GPT-4o only (no model routing)
- Verse citations format: `[VERSE:Book Chapter:Verse]` parsed client-side into VerseChip components
- Free tier = full Bible reader; AI = paywall
- Voice mode in MVP (Whisper STT → RAG pipeline → ElevenLabs TTS)
- Broadly evangelical default tone; denomination selector post-launch

## Environment setup
1. Copy `.env.example` → `.env.local`, fill in all keys
2. `npx supabase start` for local development
3. `npx supabase db reset` to apply migrations
4. Run `npm run import-kjv` then `npm run embed-bible` to seed Bible data
5. `npx expo start` to run the app

## Running scripts
All scripts in `scripts/` require env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`
```bash
npm run import-kjv          # Seed bible_verses table from data/kjv.json + data/web.json
npm run embed-bible         # Create embeddings (run after import-kjv, takes ~20 min)
npm run seed-daily-verses   # Pre-generate 365 daily verses
```

## Architecture notes
- OpenAI is never called directly from the mobile client — all AI calls go through Supabase Edge Functions
- Supabase Edge Functions live in `supabase/functions/` (Deno runtime)
- Bible text lives in two places: Supabase `bible_verses` table (for RAG) + local SQLite in `assets/` (for offline Bible reader)
- Streaming: Edge Function `chat` returns SSE; client parses with `EventSource`-style fetch streaming
- Knowledge graph: `user_journey` table updated async after each conversation turn by `extract-entities` function

## Testing checklist (from plan)
- Bible pipeline: `SELECT count(*) FROM bible_embeddings` — should be ~12,400
- RAG: call `chat` function via `supabase functions serve`
- Apple Sign-In: physical device only (not simulator)
- IAP: RevenueCat sandbox + StoreKit Configuration file in Xcode
- Offline: Airplane mode → Bible reader works, AI shows "Requires internet"
- Voice: physical device only
- Knowledge graph: 3+ turns on theme → check `user_journey` upserts

## Pricing (RevenueCat product IDs)
- `pastor_pro_weekly`: $5.99/wk
- `pastor_pro_monthly`: $18.99/mo
- `pastor_pro_annual`: $199/yr (7-day free trial)
