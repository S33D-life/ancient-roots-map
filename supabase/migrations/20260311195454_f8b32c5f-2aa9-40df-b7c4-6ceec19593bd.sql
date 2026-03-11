
-- ═══════════════════════════════════════════════════════════
-- GROWTH ENGINE TABLES
-- ═══════════════════════════════════════════════════════════

-- 1. Wanderer Streaks — tracks mapping streak data per user
CREATE TABLE public.wanderer_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_mapped_date DATE,
  streak_tier TEXT NOT NULL DEFAULT 'none',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wanderer_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streak" ON public.wanderer_streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can read others streaks" ON public.wanderer_streaks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System manages streaks" ON public.wanderer_streaks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Species Badges — tracks species discovery badges
CREATE TABLE public.species_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species_key TEXT NOT NULL,
  species_name TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  trees_mapped INTEGER NOT NULL DEFAULT 1,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, species_key)
);

ALTER TABLE public.species_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges" ON public.species_badges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System manages badges" ON public.species_badges
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Seasonal Quests — quest definitions per user per season
CREATE TABLE public.seasonal_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  year INTEGER NOT NULL,
  quest_type TEXT NOT NULL,
  quest_title TEXT NOT NULL,
  quest_description TEXT,
  target_count INTEGER NOT NULL DEFAULT 1,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  hearts_awarded INTEGER NOT NULL DEFAULT 0,
  species_hearts_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, season, year, quest_type)
);

ALTER TABLE public.seasonal_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quests" ON public.seasonal_quests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users manage own quests" ON public.seasonal_quests
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: Update streak when a tree is mapped
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_mapping_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_today DATE := CURRENT_DATE;
  v_last_date DATE;
  v_streak INTEGER;
  v_longest INTEGER;
  v_new_tier TEXT;
  v_old_tier TEXT;
  v_hearts_bonus INTEGER := 0;
BEGIN
  v_user_id := NEW.created_by;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  -- Get or create streak record
  SELECT last_mapped_date, current_streak, longest_streak, streak_tier
    INTO v_last_date, v_streak, v_longest, v_old_tier
    FROM wanderer_streaks WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    v_streak := 1;
    v_longest := 1;
    v_last_date := v_today;
    INSERT INTO wanderer_streaks (user_id, current_streak, longest_streak, last_mapped_date, streak_tier)
    VALUES (v_user_id, 1, 1, v_today, 'seedling');
  ELSE
    IF v_last_date = v_today THEN
      -- Already mapped today, no streak change
      RETURN NEW;
    ELSIF v_last_date = v_today - 1 THEN
      -- Consecutive day
      v_streak := v_streak + 1;
    ELSE
      -- Streak broken
      v_streak := 1;
    END IF;

    IF v_streak > v_longest THEN v_longest := v_streak; END IF;

    -- Determine tier
    IF v_streak >= 30 THEN v_new_tier := 'guardian';
    ELSIF v_streak >= 7 THEN v_new_tier := 'young_tree';
    ELSIF v_streak >= 3 THEN v_new_tier := 'sapling';
    ELSE v_new_tier := 'seedling';
    END IF;

    -- Award hearts on tier upgrade
    IF v_new_tier != COALESCE(v_old_tier, 'none') THEN
      CASE v_new_tier
        WHEN 'sapling' THEN v_hearts_bonus := 5;
        WHEN 'young_tree' THEN v_hearts_bonus := 15;
        WHEN 'guardian' THEN v_hearts_bonus := 33;
        ELSE v_hearts_bonus := 0;
      END CASE;

      IF v_hearts_bonus > 0 THEN
        INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
        VALUES (v_user_id, NEW.id, 'streak_bonus', v_hearts_bonus);
      END IF;
    END IF;

    UPDATE wanderer_streaks
    SET current_streak = v_streak,
        longest_streak = v_longest,
        last_mapped_date = v_today,
        streak_tier = v_new_tier,
        updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_mapping_streak
  AFTER INSERT ON public.trees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mapping_streak();

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: Award species badge when mapping a tree
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.award_species_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_species TEXT;
  v_badge_name TEXT;
  v_existing INTEGER;
BEGIN
  v_user_id := NEW.created_by;
  v_species := NEW.species;
  IF v_user_id IS NULL OR v_species IS NULL OR v_species = '' THEN RETURN NEW; END IF;

  -- Build badge name from species
  v_badge_name := v_species || ' Friend';

  -- Upsert badge: increment tree count
  INSERT INTO species_badges (user_id, species_key, species_name, badge_name, trees_mapped, earned_at)
  VALUES (v_user_id, lower(replace(v_species, ' ', '_')), v_species, v_badge_name, 1, now())
  ON CONFLICT (user_id, species_key) DO UPDATE
  SET trees_mapped = species_badges.trees_mapped + 1,
      updated_at = now();

  -- Award 1 species heart for new badge (first tree of this species)
  SELECT trees_mapped INTO v_existing FROM species_badges
  WHERE user_id = v_user_id AND species_key = lower(replace(v_species, ' ', '_'));

  IF v_existing = 1 THEN
    -- First tree of this species — bonus species heart
    INSERT INTO species_heart_transactions (user_id, species_family, amount, action_type, tree_id)
    VALUES (v_user_id, v_species, 1, 'species_discovery', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

ALTER TABLE public.species_badges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TRIGGER trg_award_species_badge
  AFTER INSERT ON public.trees
  FOR EACH ROW
  EXECUTE FUNCTION public.award_species_badge();

-- ═══════════════════════════════════════════════════════════
-- FUNCTION: Get hive monthly leaderboard
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_hive_leaderboard(p_family text, p_limit integer DEFAULT 10)
RETURNS TABLE(user_id uuid, trees_mapped bigint, offerings_count bigint, species_hearts bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH month_start AS (SELECT date_trunc('month', now()) AS ms)
  SELECT
    sht.user_id,
    COALESCE(tc.tree_count, 0) AS trees_mapped,
    COALESCE(oc.off_count, 0) AS offerings_count,
    SUM(sht.amount) AS species_hearts
  FROM species_heart_transactions sht
  CROSS JOIN month_start m
  LEFT JOIN (
    SELECT created_by, COUNT(*) AS tree_count
    FROM trees
    WHERE created_at >= (SELECT ms FROM month_start)
    GROUP BY created_by
  ) tc ON tc.created_by = sht.user_id
  LEFT JOIN (
    SELECT created_by, COUNT(*) AS off_count
    FROM offerings
    WHERE created_at >= (SELECT ms FROM month_start)
    GROUP BY created_by
  ) oc ON oc.created_by = sht.user_id
  WHERE sht.species_family = p_family
    AND sht.created_at >= m.ms
  GROUP BY sht.user_id, tc.tree_count, oc.off_count
  ORDER BY species_hearts DESC
  LIMIT p_limit;
$$;
