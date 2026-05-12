-- Cloak stage history: a poetic ledger of when the wanderer's mantle thickened
-- and which signals carried them across the threshold.
CREATE TABLE public.cloak_stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stage_label TEXT NOT NULL,
  stage_min INTEGER NOT NULL,
  score INTEGER NOT NULL,
  species_count INTEGER NOT NULL DEFAULT 0,
  visits INTEGER NOT NULL DEFAULT 0,
  affinity_depth INTEGER NOT NULL DEFAULT 0,
  -- Which axis tipped the ascension (informational, computed client-side).
  primary_signal TEXT,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prevent duplicate ledger entries for the same stage per wanderer.
CREATE UNIQUE INDEX cloak_stage_history_user_stage_unique
  ON public.cloak_stage_history (user_id, stage_label);

CREATE INDEX cloak_stage_history_user_time_idx
  ON public.cloak_stage_history (user_id, achieved_at DESC);

ALTER TABLE public.cloak_stage_history ENABLE ROW LEVEL SECURITY;

-- A wanderer may read their own mantle history.
CREATE POLICY "Wanderers read own cloak history"
  ON public.cloak_stage_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- A wanderer may inscribe their own ascensions.
CREATE POLICY "Wanderers inscribe own cloak ascensions"
  ON public.cloak_stage_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
