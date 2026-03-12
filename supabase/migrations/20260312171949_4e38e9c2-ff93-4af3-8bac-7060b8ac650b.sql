
-- Fix market_stakes: restrict SELECT to stake owner only
DROP POLICY IF EXISTS "Anyone can view market stakes" ON public.market_stakes;
DROP POLICY IF EXISTS "Public can view stakes" ON public.market_stakes;
DROP POLICY IF EXISTS "market_stakes_select" ON public.market_stakes;

-- Find and drop any SELECT policy with USING(true)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'market_stakes' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.market_stakes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can view own stakes"
  ON public.market_stakes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix market_seed_stakes: restrict SELECT to stake owner only
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'market_seed_stakes' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.market_seed_stakes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can view own seed stakes"
  ON public.market_seed_stakes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
