
-- Add geo_validated column to tree_presence_completions
ALTER TABLE public.tree_presence_completions
  ADD COLUMN IF NOT EXISTS geo_validated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS streak_day INTEGER NOT NULL DEFAULT 0;

-- Presence streaks table (one row per user, updated on each presence)
CREATE TABLE IF NOT EXISTS public.presence_streaks (
  user_id UUID PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  last_presence_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.presence_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streak"
  ON public.presence_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own streak"
  ON public.presence_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON public.presence_streaks FOR UPDATE
  USING (auth.uid() = user_id);
