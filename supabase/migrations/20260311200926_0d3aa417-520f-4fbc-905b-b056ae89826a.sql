
-- ═══════════════════════════════════════════════════════════
-- STEWARDSHIP ACTIONS & GUARDIAN ROLES
-- ═══════════════════════════════════════════════════════════

-- 1. Stewardship actions logged by users on trees
CREATE TABLE public.stewardship_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  season TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stewardship_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stewardship actions" ON public.stewardship_actions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own actions" ON public.stewardship_actions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own actions" ON public.stewardship_actions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_stewardship_action()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.action_type NOT IN ('pruning', 'mulching', 'watering', 'seed_gathering', 'soil_care', 'planting_sapling', 'monitoring', 'cleaning', 'fencing', 'documenting', 'other') THEN
    RAISE EXCEPTION 'Invalid action_type: %', NEW.action_type;
  END IF;
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 1000 THEN
    RAISE EXCEPTION 'notes too long (max 1000 chars)';
  END IF;
  IF NEW.season IS NOT NULL AND NEW.season NOT IN ('spring', 'summer', 'autumn', 'winter') THEN
    RAISE EXCEPTION 'Invalid season: %', NEW.season;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_stewardship_action
  BEFORE INSERT OR UPDATE ON public.stewardship_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_stewardship_action();

-- Award hearts for stewardship actions
CREATE OR REPLACE FUNCTION public.reward_stewardship_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
  VALUES (NEW.user_id, NEW.tree_id, 'stewardship', 3);

  -- Also award 1 species heart
  DECLARE v_species TEXT;
  BEGIN
    SELECT species INTO v_species FROM trees WHERE id = NEW.tree_id;
    IF v_species IS NOT NULL AND v_species != '' THEN
      INSERT INTO species_heart_transactions (user_id, species_family, amount, reason)
      VALUES (NEW.user_id, v_species, 1, 'stewardship_action');
    END IF;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reward_stewardship_action
  AFTER INSERT ON public.stewardship_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.reward_stewardship_action();

-- 2. Tree guardian roles — earned through contributions
CREATE TABLE public.tree_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'tree_guardian',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contribution_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(tree_id, user_id, role)
);

ALTER TABLE public.tree_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read guardians" ON public.tree_guardians
  FOR SELECT TO authenticated USING (true);

-- System-managed: guardians inserted by trigger only
CREATE POLICY "System inserts guardians" ON public.tree_guardians
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Validation
CREATE OR REPLACE FUNCTION public.validate_tree_guardian()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role NOT IN ('tree_guardian', 'seasonal_observer', 'seed_keeper', 'harvest_steward') THEN
    RAISE EXCEPTION 'Invalid guardian role: %', NEW.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_tree_guardian
  BEFORE INSERT OR UPDATE ON public.tree_guardians
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tree_guardian();

-- Auto-assign guardian roles based on contribution thresholds
CREATE OR REPLACE FUNCTION public.check_guardian_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action_count INTEGER;
  v_offering_count INTEGER;
  v_checkin_count INTEGER;
BEGIN
  -- Count stewardship actions
  SELECT COUNT(*) INTO v_action_count
  FROM stewardship_actions WHERE tree_id = NEW.tree_id AND user_id = NEW.user_id;

  -- Tree Guardian: 3+ stewardship actions
  IF v_action_count >= 3 THEN
    INSERT INTO tree_guardians (tree_id, user_id, role, contribution_count)
    VALUES (NEW.tree_id, NEW.user_id, 'tree_guardian', v_action_count)
    ON CONFLICT (tree_id, user_id, role) DO UPDATE SET contribution_count = v_action_count;
  END IF;

  -- Seed Keeper: 2+ seed gathering actions
  SELECT COUNT(*) INTO v_action_count
  FROM stewardship_actions WHERE tree_id = NEW.tree_id AND user_id = NEW.user_id AND action_type = 'seed_gathering';
  IF v_action_count >= 2 THEN
    INSERT INTO tree_guardians (tree_id, user_id, role, contribution_count)
    VALUES (NEW.tree_id, NEW.user_id, 'seed_keeper', v_action_count)
    ON CONFLICT (tree_id, user_id, role) DO UPDATE SET contribution_count = v_action_count;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_guardian_eligibility
  AFTER INSERT ON public.stewardship_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_guardian_eligibility();
