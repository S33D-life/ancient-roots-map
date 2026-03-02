
-- Habitat Pool placeholder table for future real-world insect habitat funding
CREATE TABLE IF NOT EXISTS public.habitat_pool_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL DEFAULT 'council_spark',
  source_id uuid,
  hearts_contributed integer NOT NULL DEFAULT 0,
  allocation_pct numeric(5,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.habitat_pool_ledger ENABLE ROW LEVEL SECURITY;

-- Public read, admin write
CREATE POLICY "Anyone can read habitat pool" ON public.habitat_pool_ledger
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Curators can insert habitat pool entries" ON public.habitat_pool_ledger
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'curator'));
