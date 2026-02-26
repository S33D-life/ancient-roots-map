-- Species attestation table
CREATE TABLE public.species_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  attested_species text NOT NULL,
  confidence text NOT NULL DEFAULT 'medium',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_attestation_user_tree ON public.species_attestations(user_id, tree_id);

ALTER TABLE public.species_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attestations are publicly readable"
  ON public.species_attestations FOR SELECT USING (true);

CREATE POLICY "Authenticated users can attest"
  ON public.species_attestations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attestations"
  ON public.species_attestations FOR UPDATE
  USING (auth.uid() = user_id);

-- Grove companion quests table
CREATE TABLE public.grove_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid NOT NULL REFERENCES public.grove_companions(id) ON DELETE CASCADE,
  quest_type text NOT NULL DEFAULT 'species_visit',
  target_species text,
  target_count int NOT NULL DEFAULT 5,
  progress_a int NOT NULL DEFAULT 0,
  progress_b int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.grove_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quest participants can view"
  ON public.grove_quests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM grove_companions gc
      WHERE gc.id = grove_quests.companion_id
      AND (gc.requester_id = auth.uid() OR gc.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Quest participants can create"
  ON public.grove_quests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grove_companions gc
      WHERE gc.id = grove_quests.companion_id
      AND gc.status = 'accepted'
      AND (gc.requester_id = auth.uid() OR gc.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Quest participants can update"
  ON public.grove_quests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM grove_companions gc
      WHERE gc.id = grove_quests.companion_id
      AND (gc.requester_id = auth.uid() OR gc.recipient_id = auth.uid())
    )
  );