-- Feedback system: one row per submission (never aggregated on write),
-- so daily/weekly/monthly/custom-range and per-page reporting can all be
-- computed later from the raw records.
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  response TEXT NOT NULL CHECK (response IN ('yes','no')),
  comment TEXT,
  email TEXT,
  page TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_page ON feedback(page);
CREATE INDEX IF NOT EXISTS idx_feedback_response ON feedback(response);
