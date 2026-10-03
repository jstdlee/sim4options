-- Tutor and explanation answer cache. Vectors live in Vectorize (sim4options-qa); text lives here.
CREATE TABLE IF NOT EXISTS qa_cache (
  id TEXT PRIMARY KEY,               -- also the Vectorize vector id
  kind TEXT NOT NULL,                -- 'tutor' | 'explain'
  key_hash TEXT NOT NULL,            -- sha256(kind + screen + normalized question): exact hits
  ctx_hash TEXT NOT NULL,            -- sha256(screen): similar questions only match on the same screen
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources TEXT,                      -- JSON [{title,url}] when web search was used
  model TEXT,
  hits INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_qa_key ON qa_cache(key_hash);
