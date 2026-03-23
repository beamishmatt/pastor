ALTER TABLE bible_embeddings
  ADD CONSTRAINT bible_embeddings_unique
  UNIQUE (translation, book, chapter, start_verse);
