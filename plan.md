# Pastor

**AI Bible companion — scripture-grounded, journey-aware, beautifully constrained.**

Pastor is a mobile-first AI Bible companion that differentiates from ChatGPT and Claude through three pillars: grounded scripture citation (RAG over a Bible vector store — no hallucinated verses), persistent spiritual context (a knowledge graph that remembers your journey), and a sacred UX that stays in its lane. The free tier is a best-in-class Bible reader. AI is the paywall.

---

## Product principles

1. **Scripture-grounded, always.** Every AI response cites exact verses from the vector store. Users can tap to verify. Trust is the product.
2. **Constrained by design.** Pastor won't help with Python scripts, recipes, or emails. The refusal to leave its lane *is* the feature.
3. **Journey-aware.** Pastor remembers what you've been studying, struggling with, and praying about. It gets better the more you use it.
4. **Beautiful silence.** The app opens with a daily verse and a chat input, not a wall of features. Space to think. Space to pray.
5. **Conversion through experience.** Free users get a genuinely good Bible reader. The AI input is visible but locked — every reading moment is a potential conversion.

---

## Business entity

**EMBE LABS LLC**

---

## Feature map

### Free tier — Bible reader (no AI)

| Feature | Description |
|---|---|
| Full offline Bible text | Complete KJV + WEB, downloadable. Fast local rendering. |
| Daily verse | Curated verse on app open. Beautiful typography, shareable. |
| Bookmarks & highlights | Save, annotate, organize verses with personal notes. |
| Keyword search | Basic text search across all books. Local, no network. |
| Share cards | Branded verse cards for social. Subtle Pastor watermark. |
| iOS home screen widget | Daily verse at a glance, tappable into the app. |
| Reading plans (browse only) | Can see structured multi-week plans. Progress tracking requires Pro. |

### Pastor Pro — AI companion ($5.99/wk, $18.99/mo, or $199/yr)

| Feature | Description |
|---|---|
| **Grounded conversation** | |
| Bible vector store (RAG) | KJV + WEB chunked by passage, embedded, semantic retrieval on every query. |
| Inline verse citations | Every response shows exact scripture it drew from. Tappable to expand full passage in bottom sheet. |
| Semantic Bible search | "Verses about feeling abandoned" — meaning-based vector search. Dramatically better than keyword. |
| Multi-translation support | ESV, NIV, NASB alongside KJV/WEB. User picks preferred. Licensed per translation. |
| Cross-reference mapping | Surfaces related passages across books automatically within responses. |
| Guardrailed scope | Declines non-biblical requests gracefully. Stays in lane. |
| **Sacred UX** | |
| Pastoral voice | System prompt tuned for warmth, wisdom, scriptural grounding. Not a chatbot tone. |
| "Pray with me" mode | Guided prayer — responds to what you're going through with scripture-led prayer. |
| Personalized devotionals | AI-generated daily devotional based on recent themes, questions, and struggles. |
| Voice conversation | Real-time voice mode for hands-free study and prayer. |
| **Persistent journey** | |
| Conversation history | Saved threads, searchable, organized by topic and date. |
| Spiritual knowledge graph | Tracks themes, struggles, books studied. Persistent model of your faith journey. |
| Contextual responses | "You've been in Romans 8 — here's how this connects to your question about grace." |
| Reading plan progress | Track structured study plans, pick up where you left off. AI adapts to pace. |
| Milestone reflections | Periodic AI summaries of spiritual growth, recurring themes, patterns. |

---

## Monetization

| Plan | Price | Includes |
|---|---|---|
| Free | $0 | Bible reader, daily verse, bookmarks, highlights, share cards, widget, keyword search. No AI. |
| Pastor Pro (weekly) | $5.99/wk | All AI features, knowledge graph, voice, devotionals, unlimited conversations. Low-commitment entry point. |
| Pastor Pro (monthly) | $18.99/mo | Same features. ~21% savings vs. weekly. |
| Pastor Pro (annual) | $199/yr ($3.83/wk) | Same features. Best value — 36% savings vs. weekly. 7-day free trial. |

**Pricing strategy:** Weekly plan is the high-margin impulse tier — captures users who want to try before committing but aren't ready for annual. Annual is the anchor, highlighted as "Best value" on the paywall. Monthly is the middle option that makes annual look compelling. Weekly billing also reduces churn friction for on-the-fence users.

**Paywall UX:** Free users see the chat input field grayed out with "Unlock Pastor Pro" label. The AI interface is always visible — never hidden behind tabs — so every session reminds them what's available. Tapping the locked input triggers the paywall modal.

---

## Onboarding flow

Optimized for conversion. Every screen earns the next tap.

### Screen 1 — Welcome

- Full-bleed background: subtle gradient or muted texture.
- Pastor logo mark centered.
- Headline: "Your personal guide through scripture."
- Subtext: "Grounded in the Bible. Remembers your journey."
- Single CTA button: **"Get started"**
- Small "Already have an account? Sign in" link below.

### Screen 2 — Value prop carousel (3 slides, swipeable + auto-advance)

**Slide A: "Ask anything. Get scripture."**
- Mockup showing a chat message with inline verse citations.
- Emphasizes grounded answers, not AI hallucinations.

**Slide B: "It remembers your journey."**
- Mockup showing a contextual response referencing past conversations.
- Emphasizes persistent spiritual knowledge graph.

**Slide C: "Pray together."**
- Mockup showing "Pray with me" mode.
- Emphasizes the sacred UX — this isn't ChatGPT.

- Dot indicators at bottom.
- CTA: **"Continue"**

### Screen 3 — Personalization (1 screen, not a multi-step wizard)

- "Help Pastor understand you."
- Select your preferred Bible translation (KJV, ESV, NIV, NASB, WEB). Default: KJV.
- Select your faith background (dropdown or chips): New to faith / Growing Christian / Lifelong believer / Exploring / Prefer not to say.
- Optional: "What's on your heart right now?" — free text field. Seeds the knowledge graph from the first interaction.
- CTA: **"Continue"**

### Screen 4 — Signup

- "Create your free account"
- **Sign in with Apple** (primary, full-width button — iOS-native, minimal friction)
- **Sign in with Google** (secondary option)
- **Email signup** (tertiary — expand to show email + password fields)
- Terms of service + privacy policy links.
- Note: Account is required even for free tier — enables bookmark sync, knowledge graph persistence, and future cross-device support.

### Screen 5 — Paywall (soft, conversion-optimized)

- Shown immediately after signup, before first app experience.
- Headline: "Unlock your personal pastor"
- Feature comparison:

  | | Free | Pro |
  |---|---|---|
  | Full Bible text | ✓ | ✓ |
  | Daily verse | ✓ | ✓ |
  | Bookmarks & highlights | ✓ | ✓ |
  | AI conversation | — | ✓ |
  | Voice prayer & study | — | ✓ |
  | Spiritual journey memory | — | ✓ |
  | Personalized devotionals | — | ✓ |

- Annual plan highlighted as "Best value" with weekly price breakdown ($3.83/wk).
- **Primary CTA: "Start 7-day free trial"** (annual plan, auto-renew disclosed)
- **Secondary CTA: "$18.99/month"**
- **Tertiary CTA: "$5.99/week"**
- **Dismiss link: "Continue with free Bible reader"** — small, below the fold, but not hidden. Don't be predatory.
- Apple subscription terms disclosure.

### Screen 6 — App (first session)

- If Pro: Chat interface is live. First message from Pastor is contextual based on personalization input ("You mentioned you're going through a hard time. Let's start there. Here's what scripture says about finding peace in difficulty..." with cited verses).
- If Free: Daily verse displayed beautifully. Chat input visible but locked with "Unlock Pastor Pro" label. Full Bible reader accessible via side sheet menu.

---

## UI architecture

Modeled after the ChatGPT iOS app pattern — proven, familiar, minimal. Single-screen chat interface. No bottom tab bar.

### Layout structure

```
┌─────────────────────────────────┐
│ ☰  Pastor    [v KJV ▾]  [+] [⋯]│  ← Top rail / header
├─────────────────────────────────┤
│                                 │
│  AI message (no bubble)         │
│    cited verse [tap→sheet]      │
│                                 │
│            ┌──────────────────┐ │
│            │ User message     │ │  ← Only user has bubble
│            └──────────────────┘ │
│                                 │
│  AI message (no bubble)         │
│    cited verse [tap→sheet]      │
│    cited verse [tap→sheet]      │
│                                 │
├─────────────────────────────────┤
│ [  Ask about scripture... ] [▶][🎤]│  ← Chat input + send + mic
└─────────────────────────────────┘
```

### Top rail (header)

- **Left:** Hamburger menu icon (☰) — opens left side sheet.
- **Center-left:** "Pastor" wordmark.
- **Center-right:** Translation dropdown (KJV ▾) — tappable, opens picker. Stored in user preferences.
- **Right:** New chat icon (+), overflow menu (⋯).
- **Overflow menu items:** Settings, Manage subscription, Share Pastor, Help & feedback, About.
- Fixed at top. Subtle bottom border or shadow on scroll.

### Left side sheet (hamburger menu)

Opens as a slide-over from the left edge (iOS standard pattern).

**Contents (top to bottom):**
- User avatar + name (tappable → account settings)
- "New chat" button (prominent)
- **Conversation history** — grouped by date (Today, Yesterday, Last 7 days, Last 30 days). Each item shows first line of conversation + timestamp. Tappable to load thread.
- **Divider**
- **Bible reader** — opens full Bible reading interface (book → chapter → verse navigation). Available to free and Pro users.
- **Reading plans** — browse and track structured study plans.
- **Devotional** — today's personalized devotional (Pro only, locked for free).
- **Divider**
- **Settings**
- **Divider**
- Small "Pastor Pro" badge/upgrade CTA at bottom for free users.

### Message container

- Full-height scrollable area between header and input.
- **Empty state (new chat):** Daily verse displayed centered with beautiful typography. Below it, 3-4 suggested prompts as tappable chips: "What does the Bible say about anxiety?", "Help me understand Romans 8", "Pray with me", "Start a reading plan".
- **User messages:** Right-aligned bubble with soft neutral tint. Only element in the chat with a bubble treatment — creates clear visual hierarchy between user input and AI response.
- **AI messages:** Left-aligned, **no bubble** — text renders directly on the background with no container, card, or tint. Clean and editorial. Identical to the ChatGPT iOS pattern. Includes:
  - Response text with warm pastoral tone.
  - **Cited verses** rendered as tappable inline chips/pills (e.g., `Romans 8:28` styled as a small labeled element). Tapping opens the source bottom sheet.
  - Markdown rendering for structure (headers, bold, lists) when appropriate.
- **Streaming:** Responses stream token-by-token with a subtle cursor indicator.

### Source bottom sheet

Triggered by tapping a cited verse in an AI response.

- iOS-standard bottom sheet (half-height, draggable to full).
- **Header:** Verse reference (e.g., "Romans 8:28 — KJV") with close button.
- **Body:** Full verse text, beautifully typeset. If multiple verses were cited in context, show the surrounding passage (±3 verses) with the cited verse highlighted.
- **Actions:** Bookmark, Highlight, Share card, "Read full chapter" (opens Bible reader to that location).
- **Cross-references:** If the knowledge graph has related passages, show them as tappable chips below the verse.

### Chat input bar

- Fixed at bottom, above safe area.
- **Text input:** Expanding text field with placeholder "Ask about scripture..." (free users: grayed out, "Unlock Pastor Pro" label, tappable → paywall).
- **Send button:** Right of input, circular, appears when text is entered. Purple accent.
- **Mic button:** Right of input (replaces send when input is empty). Tappable to start voice conversation mode.

### Voice conversation mode

Triggered by mic button tap.

- Full-screen overlay (like ChatGPT voice mode).
- Animated waveform or subtle breathing visualization centered.
- "Pastor is listening..." state → "Pastor is thinking..." → "Pastor is speaking..."
- Tap to interrupt. Swipe down to exit back to text chat.
- Voice responses use a warm, measured TTS voice. Configurable in settings.
- Transcript of voice conversation is saved to chat history.

### "Pray with me" mode

Activated via suggested prompt chip, direct request ("pray with me"), or dedicated button in overflow.

- Same chat interface, but:
  - Subtle visual shift — slightly warmer background tint or a thin accent border at top.
  - AI responses shift to prayer tone — first person, addressing God, incorporating the user's situation and relevant scripture.
  - Ends when user naturally moves on or says "amen" / closes the prayer thread.

---

## Technical architecture

### Platform

- **Framework:** React Native (Expo) — iOS first, Android fast-follow.
- **Why Expo:** Fastest path to App Store. OTA updates. Handles push notifications, in-app purchases, and offline storage. Single codebase for eventual Android.

### Backend

- **Supabase** — auth, Postgres database, pgvector for embeddings, Edge Functions for API routes, real-time subscriptions for streaming.
- **Why Supabase:** Auth (Apple Sign-In, Google, email) out of the box. pgvector means the Bible vector store lives alongside relational data in one database. Edge Functions handle the RAG pipeline. Row-level security for user data isolation.

### AI layer

- **LLM provider:** OpenAI (GPT-4o) — primary. Consistent ecosystem with embeddings (same provider for both retrieval and generation reduces latency and simplifies billing).
- **Embeddings:** OpenAI `text-embedding-3-small` (1536 dimensions, cost-effective, excellent quality for semantic search).
- **RAG pipeline:**
  1. User sends message.
  2. Message is embedded via OpenAI embeddings API.
  3. Top-k similar Bible passages retrieved from pgvector (k=5-10, with metadata filters for translation preference).
  4. Retrieved passages injected into system prompt as context.
  5. GPT-4o generates response, constrained to cite only from provided passages.
  6. Response streamed back to client via OpenAI streaming API.
  7. Cited verses extracted and rendered as tappable chips.

### Bible vector store

- **Source texts:** KJV (public domain), WEB (public domain). ESV/NIV/NASB require licensing agreements — phase in post-launch.
- **Chunking strategy:**
  - Primary chunks: 5-verse sliding windows with 2-verse overlap.
  - Metadata per chunk: book, chapter, start_verse, end_verse, translation, testament (OT/NT), genre (gospel, epistle, prophecy, wisdom, law, history).
  - Secondary index: full chapter embeddings for broader context retrieval.
- **Storage:** Supabase pgvector. ~31,000 verses in the Bible → ~6,200 chunks at 5-verse windows. Small enough to fit in a single Postgres instance easily.
- **Retrieval:** Cosine similarity search with metadata filtering (translation, testament, genre).

### Spiritual knowledge graph

Persistent model of each user's spiritual journey. Stored in Supabase Postgres (JSONB + relational).

**Entity types:**
- **Themes:** Topics the user frequently asks about (e.g., "anxiety", "forgiveness", "marriage"). Extracted via LLM after each conversation.
- **Books/passages studied:** Which parts of the Bible the user has engaged with deeply.
- **Life context:** What the user has shared about their situation (grief, new job, relationship struggles). Extracted with user consent.
- **Prayer topics:** Recurring prayer requests and themes.
- **Reading plan progress:** Where they are in structured study plans.

**Schema:**

```sql
-- Core user journey table
CREATE TABLE user_journey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_key TEXT NOT NULL,
  metadata JSONB,
  relevance_score FLOAT DEFAULT 1.0,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  mention_count INT DEFAULT 1
);

-- Conversation history
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  cited_verses JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bible text storage
CREATE TABLE bible_verses (
  id SERIAL PRIMARY KEY,
  translation TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  text TEXT NOT NULL,
  UNIQUE(translation, book, chapter, verse)
);

-- Bible embeddings for vector search
CREATE TABLE bible_embeddings (
  id SERIAL PRIMARY KEY,
  translation TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INT NOT NULL,
  start_verse INT NOT NULL,
  end_verse INT NOT NULL,
  chunk_text TEXT NOT NULL,
  testament TEXT NOT NULL,
  genre TEXT NOT NULL,
  embedding VECTOR(1536)
);

CREATE INDEX ON bible_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Knowledge graph update flow:**
1. After each AI response, an async Edge Function extracts entities from the conversation turn.
2. Entities are upserted into `user_journey` — new ones created, existing ones get `mention_count` incremented and `last_seen` updated.
3. On each new conversation, the top-k most relevant journey entities are injected into the system prompt as user context.
4. `relevance_score` decays weekly for untouched entities (exponential decay, configurable).

### System prompt architecture

```
ROLE:
You are Pastor, a warm and wise AI Bible companion. You provide
scripture-grounded guidance, never hallucinating verses. You speak
with the tone of a thoughtful, caring pastor — not a chatbot.

CONSTRAINTS:
- ONLY discuss topics related to faith, scripture, spirituality,
  and life guidance through a biblical lens.
- ALWAYS cite specific verses from the provided context passages.
- NEVER invent or paraphrase scripture that isn't in the provided passages.
- If you don't have a relevant passage, say so honestly.
- Decline non-biblical requests gracefully: "I'm here to help with
  scripture and faith. For [topic], you might try..."

USER CONTEXT (from knowledge graph):
{injected journey entities — themes, life context, recent studies}

RETRIEVED PASSAGES (from vector store):
{injected Bible passages from RAG retrieval}

TRANSLATION PREFERENCE: {user's preferred translation}

CONVERSATION HISTORY:
{recent messages for context continuity}
```

### Voice architecture

- **Option A (modular):** Whisper API for STT → GPT-4o RAG pipeline → ElevenLabs TTS. More control over voice quality and persona.
- **Option B (integrated):** OpenAI Realtime API — single WebSocket for STT + LLM + TTS. Lower latency, simpler architecture, but less control over TTS voice character.
- **Recommended:** Start with Option A for voice quality control. ElevenLabs voices are warmer and more configurable. Evaluate Realtime API as latency optimization later.
- **Flow:** Audio captured on device → STT → same RAG pipeline as text → LLM response → TTS → streamed audio playback.
- **Latency target:** < 2s from end of user speech to start of AI audio response.

### Offline architecture

- **Bible text:** Full KJV + WEB stored in local SQLite (via expo-sqlite) on device. Downloaded on first launch.
- **Bookmarks & highlights:** Stored locally + synced to Supabase when online.
- **AI features:** Require network (LLM + vector search are server-side).
- **Daily verse:** Pre-fetched batch of 7 days' verses cached locally.
- **Graceful degradation:** When offline, app functions as Bible reader. AI input shows "Requires internet connection" instead of paywall message.

### In-app purchases

- **RevenueCat** for subscription management — handles Apple IAP, receipt validation, entitlement checking, analytics, and paywall A/B testing.
- **Products:** Weekly ($5.99), Monthly ($18.99), Annual ($199 with 7-day free trial).
- **Entitlement:** Single "pro" entitlement gates all AI features. All three plans unlock the same entitlement.
- **Paywall presentation:** RevenueCat Paywalls SDK for native paywall rendering, or custom UI matching Pastor's design language. RevenueCat handles offer management, introductory pricing, and promotional offers.
- **Analytics:** RevenueCat dashboard for MRR, trial conversion, churn, LTV by acquisition source.

### Push notifications

- **Expo Notifications** + Supabase Edge Function for scheduling.
- **Daily verse reminder:** Configurable time, delivers the day's verse as a rich notification.
- **Devotional ready:** Morning notification when personalized devotional is generated.
- **Reading plan nudge:** Gentle reminder if user falls behind on a plan.
- **Re-engagement:** After 3 days of inactivity, "We missed you. Here's what scripture says about [recent theme]..."

---

## App Store compliance

### Checklist

- [ ] Privacy policy URL — hosted on pastor.app, linked in App Store Connect and in-app settings.
- [ ] AI data disclosure modal — shown before first AI interaction. Explains messages are processed by OpenAI. Explicit opt-in consent.
- [ ] App Privacy nutrition labels — declare: user ID, usage data, diagnostics. Declare third-party AI sharing.
- [ ] Age rating — 4+ (content is biblical; guardrails prevent inappropriate generation).
- [ ] Subscription terms — Apple-required disclosure language on paywall screen. Auto-renewal terms, cancellation instructions.
- [ ] Account deletion — settings menu includes "Delete account" per Apple requirement. Wipes all user data from Supabase.
- [ ] Sign in with Apple — required since we offer third-party sign-in (Google).

### Translation licensing

| Translation | Status | License |
|---|---|---|
| KJV | Public domain | No license needed |
| WEB | Public domain | No license needed |
| ESV | Copyright (Crossway) | Requires API license. Commercial use requires written permission. |
| NIV | Copyright (Biblica) | Requires license via Biblica. Commercial apps require agreement. |
| NASB | Copyright (Lockman Foundation) | Requires license. Commercial use requires written permission. |

**Launch with KJV + WEB.** Apply for ESV/NIV/NASB licenses in parallel. Add post-launch.

---

## Design language

### Aesthetic

Warm minimalism. Neutral earth tones — stone, taupe, sage. The UI recedes so scripture speaks. Light mode default with dark mode support. Influenced by: ChatGPT iOS app (layout patterns, bubbleless AI messages), Headspace (warmth and calm), Kinfolk magazine (restrained editorial beauty). No saturated accent colors. The palette should feel like linen, not LCD.

### Typography

- **Primary:** SF Pro (iOS system font) — clean, native feel, no licensing.
- **Scripture display:** Serif font for verse text in bottom sheet and daily verse (New York system serif or Source Serif Pro).

### Color palette

Neutral, warm, and soft. No saturated accents — the content (scripture) is the color. The UI disappears.

- **Primary accent:** Warm stone (#8C7E6F) — grounded, organic, unhurried. Used sparingly for interactive elements.
- **Secondary accent:** Soft sage (#9CAF94) — for positive states, success, active reading plans.
- **Background:** #FAFAF8 (light — warm off-white, not sterile), #1A1A18 (dark — warm near-black).
- **Surface:** #F2F0EC (light — cards, side sheet), #242422 (dark).
- **User message bubble:** Warm taupe (#EDEAE5 light, #2E2C28 dark). Soft, not attention-grabbing.
- **AI message:** No bubble. Text renders on background. Color is `--text-primary`.
- **Verse citation chips:** Muted stone outline (#C4BAB0), subtle fill on hover (#F5F2EE).
- **Text primary:** #2C2A26 (light), #E8E5E0 (dark).
- **Text secondary:** #7A756D (light), #9B958C (dark).
- **Text tertiary:** #ADA69D (light), #5E5A54 (dark).
- **Success:** Soft sage (#7A9E6F).
- **Warning:** Warm sand (#C4A265).
- **Error:** Dusty rose (#B5716D).
- **Free tier lock state:** #ADA69D — muted, communicates "not yet" without harshness.
- **Borders:** #E8E4DE (light), #333330 (dark). Barely there.
- **Send button (active):** #2C2A26 (light), #E8E5E0 (dark) — matches text primary. Confident but not loud.

### Iconography

- SF Symbols (iOS native) throughout.
- Custom Pastor logo mark for app icon and splash screen.

---

## Launch plan

### Phase 1 — Build (weeks 1-6)

- **Week 1-2:** Bible data pipeline (chunk, embed, store in pgvector). Supabase setup (auth, database, edge functions). Expo project scaffold.
- **Week 3-4:** Core chat UI (message container, input, streaming). RAG pipeline (embed query → retrieve → generate → stream). Citation extraction and rendering.
- **Week 5:** Side sheet menu, conversation history, Bible reader. Onboarding flow (5 screens). Paywall + RevenueCat integration.
- **Week 6:** Voice mode (STT + TTS). Knowledge graph extraction. Daily verse + widget. Polish, animation, haptics.

### Phase 2 — Test (week 7)

- TestFlight beta with 20-30 users (mix of devout Christians, casual believers, and faith-curious).
- Focus on: theological accuracy, citation correctness, onboarding conversion rate, voice quality.

### Phase 3 — Submit (week 8)

- App Store submission.
- Marketing site at pastor.app.
- Social content (verse cards as organic reach).

### Phase 4 — Iterate (weeks 9+)

- Monitor conversion funnel: onboarding → signup → trial → paid.
- Add licensed translations (ESV, NIV, NASB).
- Reading plan library buildout.
- Android launch via same Expo codebase.

---

## Success metrics

| Metric | Target (90 days) |
|---|---|
| App Store rating | 4.7+ |
| Free → trial conversion | 25%+ |
| Trial → paid conversion | 50%+ |
| Day 7 retention (free) | 30%+ |
| Day 7 retention (Pro) | 60%+ |
| Monthly recurring revenue | $10K+ |
| Average revenue per user | $12+/mo (blended across weekly/monthly/annual) |
| Average session length (Pro) | 8+ minutes |

---

## Open questions

- [ ] Voice: Adds 1-2 weeks and ElevenLabs cost. Strong differentiator but could be a fast-follow instead of MVP. Alternative: OpenAI Realtime API for integrated STT+LLM+TTS in one stream.
- [ ] Knowledge graph extraction: Conservative (explicit mentions only) vs. liberal (inferred themes)? Affects accuracy and user trust.
- [ ] Denomination sensitivity: Broadly evangelical default, or adapt to user's stated denomination? Affects system prompt complexity.
- [ ] "Pray with me" UX: Subtle visual shift (warm tint) vs. distinct mode? Former is simpler, latter is more intentional.
- [ ] Weekly pricing psychology: $5.99/wk is highest revenue per user but may trigger churn. Monitor weekly-to-monthly upgrade path.
- [ ] App name: Verify "Pastor" availability on App Store. Backups: "Pastor AI", "Pastor App".
- [ ] OpenAI model selection: GPT-4o for quality, GPT-4o-mini for cost. Could use mini for simple queries and full 4o for complex theological discussion. Router logic adds complexity.
