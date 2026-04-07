
CREATE OR REPLACE FUNCTION public.plant_hearts_at_tree(
  p_user_id UUID,
  p_tree_id UUID,
  p_amount INTEGER,
  p_species_key TEXT DEFAULT NULL,
  p_asset_type TEXT DEFAULT 's33d_heart'
)
RETURNS SETOF public.tree_value_roots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Upsert with atomic increment
  RETURN QUERY
  INSERT INTO public.tree_value_roots (user_id, tree_id, asset_type, amount, species_key, last_accrual_at, last_visit_at)
  VALUES (p_user_id, p_tree_id, p_asset_type, p_amount, p_species_key, now(), now())
  ON CONFLICT (user_id, tree_id, asset_type)
  DO UPDATE SET
    amount = tree_value_roots.amount + p_amount,
    species_key = COALESCE(p_species_key, tree_value_roots.species_key),
    last_visit_at = now()
  RETURNING *;
END;
$$;
