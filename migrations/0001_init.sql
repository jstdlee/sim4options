CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  step INTEGER NOT NULL DEFAULT 0,
  choice TEXT NOT NULL,
  correct INTEGER NOT NULL,
  rationale TEXT,
  clef_score REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id, created_at);
CREATE TABLE IF NOT EXISTS mastery (
  user_id TEXT NOT NULL,
  term_id TEXT NOT NULL,
  seen INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  due_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, term_id)
);
