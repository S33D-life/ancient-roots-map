
-- 1. Drop the overly permissive public SELECT policy that exposes GPS + reflections to anon
DROP POLICY IF EXISTS "Public check-ins are publicly readable" ON public.tree_checkins;

-- 2. Create a safe public view that strips sensitive fields (GPS, user_id, reflection, mood_score, health_notes)
CREATE OR REPLACE VIEW public.tree_checkins_public
WITH (security_invoker = on) AS
  SELECT
    id,
    tree_id,
    checked_in_at,
    season_stage,
    weather,
    canopy_proof,
    birdsong_heard,
    fungi_present,
    minted_status,
    privacy
  FROM public.tree_checkins
  WHERE privacy = 'public';

-- 3. Deny anon direct table access
CREATE POLICY "Anon cannot read tree_checkins directly"
  ON public.tree_checkins
  FOR SELECT
  TO anon
  USING (false);

-- 4. Grant anon and authenticated SELECT on the safe view
GRANT SELECT ON public.tree_checkins_public TO anon;
GRANT SELECT ON public.tree_checkins_public TO authenticated;
