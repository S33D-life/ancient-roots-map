
-- Tree presence completions table
CREATE TABLE public.tree_presence_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tree_id UUID NOT NULL REFERENCES public.trees(id),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 333,
  reflection TEXT,
  hearts_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for anti-farm lookups
CREATE INDEX idx_presence_user_tree_date ON public.tree_presence_completions (user_id, tree_id, completed_at);

-- RLS
ALTER TABLE public.tree_presence_completions ENABLE ROW LEVEL SECURITY;

-- Users can read their own completions
CREATE POLICY "Users can read own presence completions"
  ON public.tree_presence_completions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert own presence completions"
  ON public.tree_presence_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
