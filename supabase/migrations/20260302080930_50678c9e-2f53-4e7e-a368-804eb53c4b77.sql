
-- ═══════════════════════════════════════════════════════════
-- SECURITY & PERFORMANCE HARDENING MIGRATION
-- ═══════════════════════════════════════════════════════════

-- 1. INDEXES for scale (10k+ users)
-- Heart transactions: queried by user_id constantly
CREATE INDEX IF NOT EXISTS idx_heart_transactions_user_id ON public.heart_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_heart_transactions_tree_id ON public.heart_transactions(tree_id);
CREATE INDEX IF NOT EXISTS idx_heart_transactions_created_at ON public.heart_transactions(created_at DESC);

-- Offerings: queried by tree_id and created_by
CREATE INDEX IF NOT EXISTS idx_offerings_tree_id ON public.offerings(tree_id);
CREATE INDEX IF NOT EXISTS idx_offerings_created_by ON public.offerings(created_by);
CREATE INDEX IF NOT EXISTS idx_offerings_created_at ON public.offerings(created_at DESC);

-- Trees: queried by created_by, species, nation
CREATE INDEX IF NOT EXISTS idx_trees_created_by ON public.trees(created_by);
CREATE INDEX IF NOT EXISTS idx_trees_species ON public.trees(species);
CREATE INDEX IF NOT EXISTS idx_trees_nation ON public.trees(nation);

-- Planted seeds: queried by planter_id and tree_id
CREATE INDEX IF NOT EXISTS idx_planted_seeds_planter_id ON public.planted_seeds(planter_id);
CREATE INDEX IF NOT EXISTS idx_planted_seeds_tree_id ON public.planted_seeds(tree_id);
CREATE INDEX IF NOT EXISTS idx_planted_seeds_blooms_at ON public.planted_seeds(blooms_at);

-- Tree checkins: queried by user_id and tree_id
CREATE INDEX IF NOT EXISTS idx_tree_checkins_user_id ON public.tree_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_tree_checkins_tree_id ON public.tree_checkins(tree_id);

-- Influence votes: queried by offering_id
CREATE INDEX IF NOT EXISTS idx_influence_votes_offering_id ON public.influence_votes(offering_id);
CREATE INDEX IF NOT EXISTS idx_influence_votes_user_id ON public.influence_votes(user_id);

-- Bookshelf entries: queried by user_id
CREATE INDEX IF NOT EXISTS idx_bookshelf_entries_user_id ON public.bookshelf_entries(user_id);

-- Notifications: queried by user_id, unread
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, read_at);

-- Whispers
CREATE INDEX IF NOT EXISTS idx_tree_whispers_sender ON public.tree_whispers(sender_user_id);

-- Time tree entries: queried by user_id for daily limit
CREATE INDEX IF NOT EXISTS idx_time_tree_user_date ON public.time_tree_entries(user_id, created_at DESC);

-- Gift seeds
CREATE INDEX IF NOT EXISTS idx_gift_seeds_invite_code ON public.gift_seeds(invite_code);

-- 2. SERVER-SIDE RATE LIMITING: gift seed claim protection
-- Prevent claiming same gift seed twice via RLS tightening
-- (Already has recipient_id IS NULL check, but add a function to atomically claim)

CREATE OR REPLACE FUNCTION public.claim_gift_seed(p_invite_code text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_gift RECORD;
  v_result json;
BEGIN
  -- Atomically find and claim unclaimed gift
  SELECT id, seeds_count, sender_id INTO v_gift
  FROM gift_seeds
  WHERE invite_code = p_invite_code
    AND recipient_id IS NULL
    AND activated_at IS NULL
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_gift IS NULL THEN
    RETURN json_build_object('success', false, 'reason', 'Gift not found or already claimed');
  END IF;

  -- Prevent self-claiming
  IF v_gift.sender_id = p_user_id THEN
    RETURN json_build_object('success', false, 'reason', 'Cannot claim your own gift');
  END IF;

  -- Claim it
  UPDATE gift_seeds
  SET recipient_id = p_user_id,
      activated_at = now(),
      hearts_earned = v_gift.seeds_count
  WHERE id = v_gift.id;

  -- Issue hearts via transaction (triggers balance update)
  INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
  VALUES (p_user_id, '00000000-0000-0000-0000-000000000000'::uuid, 'gift', v_gift.seeds_count);

  RETURN json_build_object('success', true, 'hearts', v_gift.seeds_count);
END;
$$;

-- 3. SERVER-SIDE SEED PLANTING RATE LIMIT
CREATE OR REPLACE FUNCTION public.check_seed_plant_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM planted_seeds
  WHERE planter_id = NEW.planter_id
    AND planted_at::date = CURRENT_DATE;

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Daily seed planting limit reached (max 3 per day)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_seed_plant_limit ON public.planted_seeds;
CREATE TRIGGER enforce_seed_plant_limit
  BEFORE INSERT ON public.planted_seeds
  FOR EACH ROW
  EXECUTE FUNCTION public.check_seed_plant_limit();

-- 4. SERVER-SIDE TIME TREE DAILY LIMIT (backup enforcement)
-- Already has reward check in time_tree_heart_reward(), but add hard limit on inserts
CREATE OR REPLACE FUNCTION public.check_time_tree_daily_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM time_tree_entries
  WHERE user_id = NEW.user_id
    AND created_at::date = CURRENT_DATE;

  IF v_count >= 2 THEN
    RAISE EXCEPTION 'Daily Time Tree limit reached (max 2 entries per day)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_time_tree_daily_limit ON public.time_tree_entries;
CREATE TRIGGER enforce_time_tree_daily_limit
  BEFORE INSERT ON public.time_tree_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.check_time_tree_daily_limit();

-- 5. PREVENT DOUBLE-COLLECTION of seeds
CREATE OR REPLACE FUNCTION public.check_seed_collection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow collection update if not already collected
  IF OLD.collected_by IS NOT NULL AND NEW.collected_by IS NOT NULL THEN
    RAISE EXCEPTION 'Seed already collected';
  END IF;
  
  -- Prevent collecting your own seed
  IF NEW.collected_by = OLD.planter_id THEN
    RAISE EXCEPTION 'Cannot collect your own seed';
  END IF;

  -- Ensure seed has bloomed
  IF OLD.blooms_at > now() THEN
    RAISE EXCEPTION 'Seed has not bloomed yet';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_seed_collection ON public.planted_seeds;
CREATE TRIGGER enforce_seed_collection
  BEFORE UPDATE ON public.planted_seeds
  FOR EACH ROW
  WHEN (NEW.collected_by IS DISTINCT FROM OLD.collected_by)
  EXECUTE FUNCTION public.check_seed_collection();
