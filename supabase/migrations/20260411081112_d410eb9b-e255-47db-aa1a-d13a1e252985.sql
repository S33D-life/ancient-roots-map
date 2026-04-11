
-- Prevent duplicate creation check-ins
CREATE UNIQUE INDEX IF NOT EXISTS idx_tree_checkins_creation_unique
ON public.tree_checkins (tree_id, user_id)
WHERE checkin_method = 'creation';

-- Trigger function: auto-create check-in on tree insert
CREATE OR REPLACE FUNCTION public.auto_checkin_on_tree_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month INTEGER;
  v_season TEXT;
BEGIN
  IF NEW.created_by IS NULL THEN
    RETURN NEW;
  END IF;

  v_month := EXTRACT(MONTH FROM now())::INTEGER;
  v_season := CASE
    WHEN v_month IN (1, 2, 11, 12) THEN 'bare'
    WHEN v_month IN (3, 4) THEN 'bud'
    WHEN v_month IN (5) THEN 'blossom'
    WHEN v_month IN (6, 7, 8) THEN 'leaf'
    WHEN v_month IN (9, 10) THEN 'fruit'
    ELSE 'other'
  END;

  INSERT INTO public.tree_checkins (
    tree_id, user_id, latitude, longitude,
    season_stage, checkin_method, privacy, canopy_proof,
    checked_in_at
  ) VALUES (
    NEW.id, NEW.created_by, NEW.latitude, NEW.longitude,
    v_season, 'creation', 'public', false,
    now()
  )
  ON CONFLICT (tree_id, user_id) WHERE checkin_method = 'creation'
  DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_auto_checkin_on_tree_create ON public.trees;
CREATE TRIGGER trg_auto_checkin_on_tree_create
AFTER INSERT ON public.trees
FOR EACH ROW
EXECUTE FUNCTION public.auto_checkin_on_tree_create();

-- Backfill: create check-ins for existing trees where creator has none
INSERT INTO public.tree_checkins (
  tree_id, user_id, latitude, longitude,
  season_stage, checkin_method, privacy, canopy_proof,
  checked_in_at
)
SELECT
  t.id, t.created_by, t.latitude, t.longitude,
  'other', 'creation', 'public', false,
  t.created_at
FROM public.trees t
WHERE t.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.tree_checkins tc
    WHERE tc.tree_id = t.id AND tc.user_id = t.created_by
  )
ON CONFLICT (tree_id, user_id) WHERE checkin_method = 'creation'
DO NOTHING;
