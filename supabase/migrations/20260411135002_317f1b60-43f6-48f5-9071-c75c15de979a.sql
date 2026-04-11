
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.trees.metadata IS 'Structured metadata including resolution_type for species classification';
