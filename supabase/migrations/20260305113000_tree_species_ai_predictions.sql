ALTER TABLE public.trees
  ADD COLUMN IF NOT EXISTS species_ai_predictions jsonb,
  ADD COLUMN IF NOT EXISTS species_ai_selected jsonb,
  ADD COLUMN IF NOT EXISTS species_ai_provider text,
  ADD COLUMN IF NOT EXISTS species_ai_confidence double precision,
  ADD COLUMN IF NOT EXISTS species_ai_confirmed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.trees.species_ai_predictions IS
  'Top AI species predictions captured at tree submission time.';
COMMENT ON COLUMN public.trees.species_ai_selected IS
  'Prediction confirmed by user before saving, or null if manually overridden.';
COMMENT ON COLUMN public.trees.species_ai_provider IS
  'Provider used for final suggestions (inaturalist or plantnet).';
COMMENT ON COLUMN public.trees.species_ai_confidence IS
  'Confidence score (0..1) for the selected or top AI prediction.';
COMMENT ON COLUMN public.trees.species_ai_confirmed IS
  'True when user confirmed an AI suggestion or explicitly overrode after AI suggestions.';
