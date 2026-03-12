
-- Add environmental snapshot data to witness_sessions
ALTER TABLE public.witness_sessions
  ADD COLUMN IF NOT EXISTS env_snapshot jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS snapshot_quality text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.witness_sessions.env_snapshot IS 'Tree Health Snapshot: canopy light, ambient audio metadata, multi-angle photos, GPS confidence';
COMMENT ON COLUMN public.witness_sessions.snapshot_quality IS 'Computed quality tier: basic, standard, rich based on signals captured';
