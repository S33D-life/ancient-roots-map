-- Harden canopy check-ins with confidence/proof fields and optional witness confirmations

ALTER TABLE public.tree_checkins
  ADD COLUMN IF NOT EXISTS accuracy_m numeric,
  ADD COLUMN IF NOT EXISTS proof_types text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS confidence_score integer NOT NULL DEFAULT 0;

ALTER TABLE public.tree_checkins
  DROP CONSTRAINT IF EXISTS tree_checkins_confidence_score_check;

ALTER TABLE public.tree_checkins
  ADD CONSTRAINT tree_checkins_confidence_score_check
  CHECK (confidence_score >= 0 AND confidence_score <= 100);

CREATE TABLE IF NOT EXISTS public.tree_checkin_witnesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES public.tree_checkins(id) ON DELETE CASCADE,
  witness_user_id uuid NOT NULL,
  latitude numeric,
  longitude numeric,
  accuracy_m numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (checkin_id, witness_user_id)
);

CREATE INDEX IF NOT EXISTS idx_tree_checkin_witnesses_checkin
  ON public.tree_checkin_witnesses(checkin_id);

CREATE INDEX IF NOT EXISTS idx_tree_checkin_witnesses_user
  ON public.tree_checkin_witnesses(witness_user_id);

ALTER TABLE public.tree_checkin_witnesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own witnesses" ON public.tree_checkin_witnesses;
CREATE POLICY "Users can read own witnesses"
  ON public.tree_checkin_witnesses FOR SELECT
  USING (auth.uid() = witness_user_id);

DROP POLICY IF EXISTS "Users can insert own witness" ON public.tree_checkin_witnesses;
CREATE POLICY "Users can insert own witness"
  ON public.tree_checkin_witnesses FOR INSERT
  WITH CHECK (auth.uid() = witness_user_id);
