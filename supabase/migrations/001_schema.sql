-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- user_profiles table (extends auth.users)
-- Column names match types/database.ts
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  translation_preference TEXT DEFAULT 'KJV',
  faith_background TEXT,
  heart_note TEXT,
  voice_id TEXT,
  prayer_reminder_time TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  revenuecat_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_journey (knowledge graph)
CREATE TABLE user_journey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('theme', 'book', 'life_context', 'prayer_topic', 'passage')),
  entity_key TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  relevance_score FLOAT DEFAULT 1.0,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  mention_count INT DEFAULT 1,
  UNIQUE(user_id, entity_type, entity_key)
);

-- conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  is_prayer_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  cited_verses JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- bible_verses (local storage backup + server-side lookup)
CREATE TABLE bible_verses (
  id SERIAL PRIMARY KEY,
  translation TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  text TEXT NOT NULL,
  testament TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
  genre TEXT,
  UNIQUE(translation, book, chapter, verse)
);

-- bible_embeddings (vector store)
CREATE TABLE bible_embeddings (
  id SERIAL PRIMARY KEY,
  translation TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INT NOT NULL,
  start_verse INT NOT NULL,
  end_verse INT NOT NULL,
  chunk_text TEXT NOT NULL,
  testament TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
  genre TEXT NOT NULL,
  embedding vector(1536)
);

-- daily_verses
CREATE TABLE daily_verses (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  translation TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  text TEXT NOT NULL,
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "users_own_profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "users_own_journey" ON user_journey
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_messages" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Public read for bible and daily verses (no auth required)
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_bible_read" ON bible_verses FOR SELECT USING (true);

ALTER TABLE bible_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_embeddings_read" ON bible_embeddings FOR SELECT USING (true);

ALTER TABLE daily_verses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_daily_verses_read" ON daily_verses FOR SELECT USING (true);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: maintain updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
