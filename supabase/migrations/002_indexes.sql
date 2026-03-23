-- IVFFlat index for vector similarity search (cosine distance)
-- lists=100 is appropriate for datasets up to ~1M vectors
CREATE INDEX bible_embeddings_embedding_idx ON bible_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Indexes for common query patterns

-- user_journey: primary lookup by user, sorted by relevance
CREATE INDEX user_journey_user_id_idx ON user_journey(user_id);
CREATE INDEX user_journey_relevance_idx ON user_journey(user_id, relevance_score DESC, last_seen DESC);

-- conversations: user's recent conversations
CREATE INDEX conversations_user_id_idx ON conversations(user_id, updated_at DESC);

-- messages: chronological fetch within a conversation
CREATE INDEX messages_conversation_id_idx ON messages(conversation_id, created_at ASC);

-- bible_verses: point lookup and chapter-level scan
CREATE INDEX bible_verses_lookup_idx ON bible_verses(translation, book, chapter, verse);
CREATE INDEX bible_verses_chapter_idx ON bible_verses(translation, book, chapter);

-- daily_verses: date lookup
CREATE INDEX daily_verses_date_idx ON daily_verses(date);

-- Full text search on bible verse text
CREATE INDEX bible_verses_fts_idx ON bible_verses
  USING gin(to_tsvector('english', text));
