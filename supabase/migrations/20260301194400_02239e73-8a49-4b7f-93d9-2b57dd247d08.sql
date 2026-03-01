
-- 1) Add influence scoring columns to offerings
ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS influence_score NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS influence_votes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS influence_score_by_scope JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hot_score NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ranked_at TIMESTAMPTZ;

-- Index for ranking queries
CREATE INDEX IF NOT EXISTS idx_offerings_influence_score ON public.offerings (influence_score DESC);
CREATE INDEX IF NOT EXISTS idx_offerings_hot_score ON public.offerings (hot_score DESC);

-- 2) Create influence_votes table
CREATE TABLE IF NOT EXISTS public.influence_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scope_type TEXT NOT NULL, -- 'tree', 'species', 'place'
  scope_key TEXT NOT NULL,  -- tree UUID, species family, or place key
  weight_applied NUMERIC NOT NULL DEFAULT 0,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: one active vote per user per offering per scope_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_influence_votes_unique_active
  ON public.influence_votes (offering_id, user_id, scope_key)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_influence_votes_offering ON public.influence_votes (offering_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_influence_votes_user ON public.influence_votes (user_id);
CREATE INDEX IF NOT EXISTS idx_influence_votes_scope ON public.influence_votes (scope_type, scope_key);

-- 3) Daily budget tracking
CREATE TABLE IF NOT EXISTS public.influence_vote_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  spent NUMERIC NOT NULL DEFAULT 0,
  UNIQUE (user_id, vote_date)
);

-- 4) RLS policies for influence_votes
ALTER TABLE public.influence_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view influence votes"
  ON public.influence_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own votes"
  ON public.influence_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON public.influence_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5) RLS for budgets
ALTER TABLE public.influence_vote_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own budgets"
  ON public.influence_vote_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own budgets"
  ON public.influence_vote_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own budgets"
  ON public.influence_vote_budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6) Validation trigger for influence_votes
CREATE OR REPLACE FUNCTION public.validate_influence_vote()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $func$
BEGIN
  IF NEW.scope_type NOT IN ('tree', 'species', 'place') THEN
    RAISE EXCEPTION 'Invalid scope_type: %', NEW.scope_type;
  END IF;
  IF NEW.weight_applied <= 0 OR NEW.weight_applied > 10 THEN
    RAISE EXCEPTION 'weight_applied must be between 0 and 10';
  END IF;
  IF length(NEW.scope_key) > 200 THEN
    RAISE EXCEPTION 'scope_key too long (max 200 chars)';
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_validate_influence_vote
  BEFORE INSERT OR UPDATE ON public.influence_votes
  FOR EACH ROW EXECUTE FUNCTION public.validate_influence_vote();

-- 7) Function to compute hot score (Reddit-style)
CREATE OR REPLACE FUNCTION public.compute_hot_score(p_influence NUMERIC, p_created_at TIMESTAMPTZ)
  RETURNS NUMERIC
  LANGUAGE sql
  IMMUTABLE
  SET search_path TO 'public'
AS $func$
  SELECT round(
    log(greatest(1, p_influence)) + (extract(epoch FROM p_created_at) / 45000.0)
  , 4);
$func$;

-- 8) Trigger to update offering scores after vote insert/update
CREATE OR REPLACE FUNCTION public.sync_offering_influence_score()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $func$
DECLARE
  v_offering_id UUID;
  v_total NUMERIC;
  v_count INTEGER;
  v_by_scope JSONB;
  v_created_at TIMESTAMPTZ;
BEGIN
  v_offering_id := COALESCE(NEW.offering_id, OLD.offering_id);

  SELECT COALESCE(SUM(weight_applied), 0), COUNT(*)
    INTO v_total, v_count
    FROM influence_votes
    WHERE offering_id = v_offering_id AND revoked_at IS NULL;

  SELECT COALESCE(
    jsonb_object_agg(scope_type || ':' || scope_key, scope_total), '{}'
  ) INTO v_by_scope
  FROM (
    SELECT scope_type, scope_key, SUM(weight_applied) AS scope_total
    FROM influence_votes
    WHERE offering_id = v_offering_id AND revoked_at IS NULL
    GROUP BY scope_type, scope_key
  ) sub;

  SELECT created_at INTO v_created_at FROM offerings WHERE id = v_offering_id;

  UPDATE offerings SET
    influence_score = v_total,
    influence_votes_count = v_count,
    influence_score_by_scope = v_by_scope,
    hot_score = compute_hot_score(v_total, v_created_at),
    ranked_at = now()
  WHERE id = v_offering_id;

  RETURN COALESCE(NEW, OLD);
END;
$func$;

CREATE TRIGGER trg_sync_influence_score
  AFTER INSERT OR UPDATE ON public.influence_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_offering_influence_score();
