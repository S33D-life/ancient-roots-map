ALTER TABLE public.life_groves
  ADD COLUMN IF NOT EXISTS tree_link_type text NOT NULL DEFAULT 'symbolic_only',
  ADD COLUMN IF NOT EXISTS linked_tree_id uuid,
  ADD COLUMN IF NOT EXISTS planted_tree_location_text text,
  ADD COLUMN IF NOT EXISTS planted_tree_latitude double precision,
  ADD COLUMN IF NOT EXISTS planted_tree_longitude double precision,
  ADD COLUMN IF NOT EXISTS planting_notes text,
  ADD COLUMN IF NOT EXISTS planting_status text NOT NULL DEFAULT 'symbolic';

ALTER TABLE public.life_groves
  DROP CONSTRAINT IF EXISTS life_groves_tree_link_type_check;
ALTER TABLE public.life_groves
  ADD CONSTRAINT life_groves_tree_link_type_check
  CHECK (tree_link_type IN ('symbolic_only','plant_new_tree','link_existing_planted_tree','link_ancient_friend'));

ALTER TABLE public.life_groves
  DROP CONSTRAINT IF EXISTS life_groves_planting_status_check;
ALTER TABLE public.life_groves
  ADD CONSTRAINT life_groves_planting_status_check
  CHECK (planting_status IN ('symbolic','requested','planted','verified','needs_visit'));

CREATE INDEX IF NOT EXISTS idx_life_groves_linked_tree_id ON public.life_groves(linked_tree_id);