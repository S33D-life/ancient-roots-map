-- Rootstone research ingest staging queue
CREATE TABLE IF NOT EXISTS public.rootstones_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL DEFAULT 'unknown',
  payload_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_url TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  CONSTRAINT rootstones_staging_source_url_check CHECK (source_url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_rootstones_staging_status_created_at
  ON public.rootstones_staging(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rootstones_staging_country_created_at
  ON public.rootstones_staging(country, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rootstones_staging_source_url
  ON public.rootstones_staging(source_url);

ALTER TABLE public.rootstones_staging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Curators can read rootstone staging" ON public.rootstones_staging;
CREATE POLICY "Curators can read rootstone staging"
  ON public.rootstones_staging FOR SELECT
  USING (public.has_role(auth.uid(), 'curator'));

DROP POLICY IF EXISTS "Curators can insert rootstone staging" ON public.rootstones_staging;
CREATE POLICY "Curators can insert rootstone staging"
  ON public.rootstones_staging FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'curator'));

DROP POLICY IF EXISTS "Curators can update rootstone staging" ON public.rootstones_staging;
CREATE POLICY "Curators can update rootstone staging"
  ON public.rootstones_staging FOR UPDATE
  USING (public.has_role(auth.uid(), 'curator'))
  WITH CHECK (public.has_role(auth.uid(), 'curator'));
