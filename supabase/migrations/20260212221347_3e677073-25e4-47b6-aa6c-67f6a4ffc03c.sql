
-- Heart transactions ledger: every heart earned
CREATE TABLE public.heart_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- null for tree-pool hearts
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  seed_id UUID REFERENCES public.planted_seeds(id) ON DELETE SET NULL,
  heart_type TEXT NOT NULL, -- 'wanderer', 'sower', 'tree', 'windfall'
  amount INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tree heart pools: accumulated tree hearts
CREATE TABLE public.tree_heart_pools (
  tree_id UUID NOT NULL PRIMARY KEY REFERENCES public.trees(id) ON DELETE CASCADE,
  total_hearts INTEGER NOT NULL DEFAULT 0,
  windfall_count INTEGER NOT NULL DEFAULT 0,
  last_windfall_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: heart_transactions
ALTER TABLE public.heart_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view heart transactions"
  ON public.heart_transactions FOR SELECT
  USING (true);

CREATE POLICY "System inserts hearts via trigger"
  ON public.heart_transactions FOR INSERT
  WITH CHECK (true);

-- RLS: tree_heart_pools
ALTER TABLE public.tree_heart_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tree heart pools"
  ON public.tree_heart_pools FOR SELECT
  USING (true);

CREATE POLICY "System updates tree heart pools"
  ON public.tree_heart_pools FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update tree heart pools"
  ON public.tree_heart_pools FOR UPDATE
  USING (true);

-- Indexes
CREATE INDEX idx_heart_transactions_user ON public.heart_transactions(user_id);
CREATE INDEX idx_heart_transactions_tree ON public.heart_transactions(tree_id);
CREATE INDEX idx_heart_transactions_type ON public.heart_transactions(heart_type);

-- Function: distribute hearts on seed collection
CREATE OR REPLACE FUNCTION public.distribute_seed_hearts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_planter_id UUID;
  v_tree_id UUID;
  v_pool_total INTEGER;
  v_windfalls_done INTEGER;
  v_next_threshold INTEGER;
  -- windfall recipients
  v_next_visitor UUID;
  v_top_year UUID;
  v_top_month UUID;
  v_random_visitor UUID;
BEGIN
  -- Only fire when collected_by is newly set
  IF OLD.collected_by IS NOT NULL OR NEW.collected_by IS NULL THEN
    RETURN NEW;
  END IF;

  v_planter_id := NEW.planter_id;
  v_tree_id := NEW.tree_id;

  -- 1. Wanderer Heart → collector
  INSERT INTO heart_transactions (user_id, tree_id, seed_id, heart_type, amount)
  VALUES (NEW.collected_by, v_tree_id, NEW.id, 'wanderer', 1);

  -- 2. Sower Heart → planter
  INSERT INTO heart_transactions (user_id, tree_id, seed_id, heart_type, amount)
  VALUES (v_planter_id, v_tree_id, NEW.id, 'sower', 1);

  -- 3. Tree Heart → pool
  INSERT INTO heart_transactions (user_id, tree_id, seed_id, heart_type, amount)
  VALUES (NULL, v_tree_id, NEW.id, 'tree', 1);

  -- Update tree pool
  INSERT INTO tree_heart_pools (tree_id, total_hearts, windfall_count, updated_at)
  VALUES (v_tree_id, 1, 0, now())
  ON CONFLICT (tree_id) DO UPDATE
  SET total_hearts = tree_heart_pools.total_hearts + 1,
      updated_at = now();

  -- Check windfall threshold (every 144 tree hearts → 12 bonus)
  SELECT total_hearts, windfall_count INTO v_pool_total, v_windfalls_done
  FROM tree_heart_pools WHERE tree_id = v_tree_id;

  v_next_threshold := (v_windfalls_done + 1) * 144;

  IF v_pool_total >= v_next_threshold THEN
    -- 3 hearts to most frequent visitor this year
    SELECT sv.user_id INTO v_top_year
    FROM site_visits sv
    WHERE sv.user_id IS NOT NULL
      AND sv.created_at >= (now() - interval '1 year')
    GROUP BY sv.user_id
    ORDER BY count(*) DESC
    LIMIT 1;

    -- 3 hearts to most frequent visitor this month
    SELECT sv.user_id INTO v_top_month
    FROM site_visits sv
    WHERE sv.user_id IS NOT NULL
      AND sv.created_at >= date_trunc('month', now())
    GROUP BY sv.user_id
    ORDER BY count(*) DESC
    LIMIT 1;

    -- 3 hearts to random visitor this year
    SELECT sv.user_id INTO v_random_visitor
    FROM site_visits sv
    WHERE sv.user_id IS NOT NULL
      AND sv.created_at >= (now() - interval '1 year')
    ORDER BY random()
    LIMIT 1;

    -- 3 hearts to the next visitor (stored as special pending windfall)
    -- We use user_id = NULL and heart_type = 'windfall_pending' for next-visitor
    INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
    VALUES (NULL, v_tree_id, 'windfall_pending', 3);

    -- Distribute to top year visitor
    IF v_top_year IS NOT NULL THEN
      INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
      VALUES (v_top_year, v_tree_id, 'windfall', 3);
    END IF;

    -- Distribute to top month visitor
    IF v_top_month IS NOT NULL THEN
      INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
      VALUES (v_top_month, v_tree_id, 'windfall', 3);
    END IF;

    -- Distribute to random visitor
    IF v_random_visitor IS NOT NULL THEN
      INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
      VALUES (v_random_visitor, v_tree_id, 'windfall', 3);
    END IF;

    -- Mark windfall as distributed
    UPDATE tree_heart_pools
    SET windfall_count = v_windfalls_done + 1,
        last_windfall_at = now(),
        updated_at = now()
    WHERE tree_id = v_tree_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on planted_seeds UPDATE
CREATE TRIGGER on_seed_collected
  AFTER UPDATE ON public.planted_seeds
  FOR EACH ROW
  EXECUTE FUNCTION public.distribute_seed_hearts();

-- Function to claim pending windfall when visiting a tree
CREATE OR REPLACE FUNCTION public.claim_windfall_hearts(p_tree_id UUID, p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending_id UUID;
  v_amount INTEGER;
BEGIN
  -- Find oldest unclaimed windfall_pending for this tree
  SELECT id, amount INTO v_pending_id, v_amount
  FROM heart_transactions
  WHERE tree_id = p_tree_id
    AND heart_type = 'windfall_pending'
    AND user_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_pending_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Claim it
  UPDATE heart_transactions
  SET user_id = p_user_id, heart_type = 'windfall'
  WHERE id = v_pending_id;

  RETURN v_amount;
END;
$$;

-- Allow system to update heart_transactions for windfall claims
CREATE POLICY "System can update heart transactions"
  ON public.heart_transactions FOR UPDATE
  USING (true);
