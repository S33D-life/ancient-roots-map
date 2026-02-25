
-- 1. Attach distribute_seed_hearts as trigger on planted_seeds
CREATE TRIGGER trg_distribute_seed_hearts
  AFTER UPDATE ON public.planted_seeds
  FOR EACH ROW
  EXECUTE FUNCTION public.distribute_seed_hearts();

-- 2. Phenology pipeline: species-level season aggregation table
CREATE TABLE public.species_phenology (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species text NOT NULL,
  season_stage text NOT NULL,
  region text,
  month smallint NOT NULL,
  year smallint NOT NULL,
  observation_count integer NOT NULL DEFAULT 0,
  avg_mood numeric(3,1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(species, season_stage, region, month, year)
);

ALTER TABLE public.species_phenology ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Phenology data is publicly readable"
  ON public.species_phenology FOR SELECT
  USING (true);

-- Function to aggregate phenology from tree_checkins
CREATE OR REPLACE FUNCTION public.aggregate_phenology()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO species_phenology (species, season_stage, region, month, year, observation_count, avg_mood, updated_at)
  SELECT
    t.species,
    tc.season_stage,
    t.nation AS region,
    EXTRACT(MONTH FROM tc.checked_in_at)::smallint AS month,
    EXTRACT(YEAR FROM tc.checked_in_at)::smallint AS year,
    COUNT(*)::integer AS observation_count,
    ROUND(AVG(tc.mood_score), 1) AS avg_mood,
    now()
  FROM tree_checkins tc
  JOIN trees t ON t.id = tc.tree_id
  WHERE tc.season_stage != 'other'
  GROUP BY t.species, tc.season_stage, t.nation,
    EXTRACT(MONTH FROM tc.checked_in_at),
    EXTRACT(YEAR FROM tc.checked_in_at)
  ON CONFLICT (species, season_stage, region, month, year)
  DO UPDATE SET
    observation_count = EXCLUDED.observation_count,
    avg_mood = EXCLUDED.avg_mood,
    updated_at = now();
END;
$$;

-- 3. Canopy proof bonus trigger: +1 heart when canopy_proof = true on check-in
CREATE OR REPLACE FUNCTION public.canopy_proof_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.canopy_proof = true AND (OLD.canopy_proof IS NULL OR OLD.canopy_proof = false) THEN
    INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
    VALUES (NEW.user_id, NEW.tree_id, 'canopy_bonus', 1);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_canopy_proof_bonus
  AFTER INSERT OR UPDATE ON public.tree_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.canopy_proof_bonus();

-- 4. Stewardship leaderboard function
CREATE OR REPLACE FUNCTION public.get_stewardship_leaderboard(p_tree_id uuid, result_limit integer DEFAULT 10)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, offering_count bigint, total_impact numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    o.created_by AS user_id,
    COALESCE(p.full_name, 'Ancient Friend') AS display_name,
    p.avatar_url,
    COUNT(o.id) AS offering_count,
    SUM(o.impact_weight) AS total_impact
  FROM offerings o
  LEFT JOIN profiles p ON p.id = o.created_by
  WHERE o.tree_id = p_tree_id
    AND o.tree_role = 'stewardship'
    AND o.created_by IS NOT NULL
  GROUP BY o.created_by, p.full_name, p.avatar_url
  ORDER BY total_impact DESC, offering_count DESC
  LIMIT result_limit;
$$;

-- 5. Gift seed activation trigger: auto-create referral when invite-code gift is activated
CREATE OR REPLACE FUNCTION public.gift_seed_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite_link_id uuid;
BEGIN
  -- Only on activation (activated_at changes from NULL to value)
  IF OLD.activated_at IS NOT NULL OR NEW.activated_at IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- If there's an invite code, try to link to invite_links
  IF NEW.invite_code IS NOT NULL THEN
    SELECT id INTO v_invite_link_id
    FROM invite_links
    WHERE code = NEW.invite_code
    LIMIT 1;
  END IF;

  -- Create referral record if we have both sender and recipient
  IF NEW.recipient_id IS NOT NULL AND NEW.sender_id IS NOT NULL THEN
    INSERT INTO referrals (inviter_id, invitee_id, invite_link_id)
    VALUES (NEW.sender_id, NEW.recipient_id, v_invite_link_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gift_seed_referral
  AFTER UPDATE ON public.gift_seeds
  FOR EACH ROW
  EXECUTE FUNCTION public.gift_seed_referral();

-- Enable realtime for phenology
ALTER PUBLICATION supabase_realtime ADD TABLE public.species_phenology;
