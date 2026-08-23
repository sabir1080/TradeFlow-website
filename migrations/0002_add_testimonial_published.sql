-- Approved-testimonials feature: a feedback row (response='yes' with a
-- comment) only appears in the public testimonials list once an admin
-- explicitly publishes it. Defaults to 0 (unpublished) for every row,
-- including all existing ones - nothing becomes public automatically.
ALTER TABLE feedback ADD COLUMN published INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_feedback_published ON feedback(published);
