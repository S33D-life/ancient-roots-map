
ALTER TABLE public.tree_checkins 
  ADD COLUMN IF NOT EXISTS accuracy_m double precision,
  ADD COLUMN IF NOT EXISTS proof_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS confidence_score integer DEFAULT 0;

-- Also create the tree_checkin_witnesses table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tree_checkin_witnesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid REFERENCES public.tree_checkins(id) ON DELETE CASCADE NOT NULL,
  witness_user_id uuid NOT NULL,
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(checkin_id, witness_user_id)
);

ALTER TABLE public.tree_checkin_witnesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view witnesses on their checkins"
  ON public.tree_checkin_witnesses FOR SELECT
  TO authenticated
  USING (
    witness_user_id = auth.uid() 
    OR checkin_id IN (SELECT id FROM public.tree_checkins WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can insert witnesses"
  ON public.tree_checkin_witnesses FOR INSERT
  TO authenticated
  WITH CHECK (witness_user_id = auth.uid());
