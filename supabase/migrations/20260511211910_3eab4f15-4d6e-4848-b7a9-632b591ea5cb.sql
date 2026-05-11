
-- 1. OFFERINGS — drop overbroad tribe-visibility SELECT policy
DROP POLICY IF EXISTS "Offerings select by visibility" ON public.offerings;

-- 2. LIFE GROVE OFFERINGS
DROP POLICY IF EXISTS "Read offerings based on grove privacy" ON public.life_grove_offerings;

CREATE POLICY "Grove owner reads all offerings on their grove"
ON public.life_grove_offerings FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.life_groves g
    WHERE g.id = life_grove_offerings.life_grove_id
      AND g.created_by = auth.uid()
  )
);

CREATE POLICY "Public can read public offerings on public groves"
ON public.life_grove_offerings FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.life_groves g
    WHERE g.id = life_grove_offerings.life_grove_id
      AND g.privacy = 'public'
      AND life_grove_offerings.visibility = 'public'
  )
);

REVOKE SELECT (contributor_email) ON public.life_grove_offerings FROM anon, authenticated;
GRANT  SELECT (contributor_email) ON public.life_grove_offerings TO service_role;

-- 3. STORAGE BUCKETS — folder ownership on uploads
DROP POLICY IF EXISTS "Authenticated users can upload offering files" ON storage.objects;
CREATE POLICY "Authenticated users can upload offering files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'offerings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can upload birdsong audio" ON storage.objects;
CREATE POLICY "Users can upload birdsong audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'birdsong'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. GROVE TREES
DROP POLICY IF EXISTS "Authenticated can add grove trees" ON public.grove_trees;
CREATE POLICY "Grove guardians or curators can add grove trees"
ON public.grove_trees FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'curator')
  OR public.has_role(auth.uid(), 'keeper')
  OR EXISTS (
    SELECT 1 FROM public.grove_guardians gg
    WHERE gg.grove_id = grove_trees.grove_id
      AND gg.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.trees t
    WHERE t.id = grove_trees.tree_id
      AND t.created_by = auth.uid()
  )
);

-- 5. COUNCIL TREES + COUNCIL BIO REGIONS
DROP POLICY IF EXISTS "Auth users can link council trees" ON public.council_trees;
CREATE POLICY "Curators or keepers can link council trees"
ON public.council_trees FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'curator')
  OR public.has_role(auth.uid(), 'keeper')
);

DROP POLICY IF EXISTS "Auth users can link council bio_regions" ON public.council_bio_regions;
CREATE POLICY "Curators or keepers can link council bio_regions"
ON public.council_bio_regions FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'curator')
  OR public.has_role(auth.uid(), 'keeper')
);

-- 6. MYCELIAL PATHWAYS
DROP POLICY IF EXISTS "Authenticated can update pathways" ON public.mycelial_pathways;
CREATE POLICY "Curators or keepers can update pathways"
ON public.mycelial_pathways FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'curator')
  OR public.has_role(auth.uid(), 'keeper')
)
WITH CHECK (
  public.has_role(auth.uid(), 'curator')
  OR public.has_role(auth.uid(), 'keeper')
);

-- 7. VERIFICATION TASKS
DROP POLICY IF EXISTS "Authenticated users can claim tasks" ON public.verification_tasks;
CREATE POLICY "Authenticated users can claim tasks"
ON public.verification_tasks FOR UPDATE TO authenticated
USING (
  (claimed_by IS NULL AND status = 'open')
  OR claimed_by = auth.uid()
)
WITH CHECK (
  claimed_by = auth.uid()
  AND status IN ('open', 'claimed', 'in_progress', 'submitted', 'completed')
);

-- 8. AGENT REWARD LEDGER
DROP POLICY IF EXISTS "Anyone can view reward ledger" ON public.agent_reward_ledger;
CREATE POLICY "Authenticated users can view reward ledger"
ON public.agent_reward_ledger FOR SELECT TO authenticated
USING (true);

-- 9. NFTREE MINTS
REVOKE SELECT (authorization_signature, authorization_nonce, authorization_deadline)
  ON public.nftree_mints FROM anon, authenticated;
GRANT  SELECT (authorization_signature, authorization_nonce, authorization_deadline)
  ON public.nftree_mints TO service_role;

-- 10. MARKET FUNDS LEDGER
DROP POLICY IF EXISTS "System inserts fund ledger entries" ON public.market_funds_ledger;
CREATE POLICY "Curators or keepers can insert fund ledger entries"
ON public.market_funds_ledger FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'curator')
  OR public.has_role(auth.uid(), 'keeper')
);

-- 11. ROOT MAIL — restrict to author / discoverer / anchor tree creator / curators
DROP POLICY IF EXISTS "Visible mail readable by authenticated" ON public.root_mail;
CREATE POLICY "Restricted read for visible root mail"
ON public.root_mail FOR SELECT TO authenticated
USING (
  now() >= visible_after
  AND (
    author_id = auth.uid()
    OR discovered_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.trees t
      WHERE t.id = root_mail.tree_id
        AND t.created_by = auth.uid()
    )
    OR public.has_role(auth.uid(), 'curator')
    OR public.has_role(auth.uid(), 'keeper')
  )
);
