-- 1. Fix planted_seeds: restrict public reads to authenticated only
DROP POLICY IF EXISTS "Anyone can view seeds" ON public.planted_seeds;
CREATE POLICY "Authenticated users can view seeds"
  ON public.planted_seeds
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Fix phenology_observations: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can read observations" ON public.phenology_observations;
CREATE POLICY "Authenticated users can read observations"
  ON public.phenology_observations
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Fix shelf_templates: prevent any user from deleting system templates
DROP POLICY IF EXISTS "Users can manage own templates" ON public.shelf_templates;
CREATE POLICY "Users can manage own templates"
  ON public.shelf_templates
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
-- System templates remain readable via a separate SELECT policy
CREATE POLICY "Anyone can read system templates"
  ON public.shelf_templates
  FOR SELECT
  TO authenticated
  USING (is_system = true);

-- 4. Fix sky_stamps: users can only read their own
DROP POLICY IF EXISTS "Authenticated users can read sky stamps" ON public.sky_stamps;
CREATE POLICY "Users can read own sky stamps"
  ON public.sky_stamps
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Fix heart_transactions: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view heart transactions" ON public.heart_transactions;
CREATE POLICY "Authenticated users can view heart transactions"
  ON public.heart_transactions
  FOR SELECT
  TO authenticated
  USING (true);

-- 6. Fix species_heart_transactions: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view species transactions" ON public.species_heart_transactions;
CREATE POLICY "Authenticated users can view species transactions"
  ON public.species_heart_transactions
  FOR SELECT
  TO authenticated
  USING (true);

-- 7. Fix influence_transactions: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view influence transactions" ON public.influence_transactions;
CREATE POLICY "Authenticated users can view influence transactions"
  ON public.influence_transactions
  FOR SELECT
  TO authenticated
  USING (true);