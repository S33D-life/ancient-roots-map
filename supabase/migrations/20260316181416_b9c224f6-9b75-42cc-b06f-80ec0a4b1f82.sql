
CREATE TABLE public.dataset_watch_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.tree_data_sources(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES public.tree_datasets(id) ON DELETE SET NULL,
  watch_enabled BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  last_successful_check_at TIMESTAMPTZ,
  last_known_source_hash TEXT,
  last_known_record_count INTEGER,
  last_known_updated_label TEXT,
  last_known_file_url TEXT,
  last_known_file_size BIGINT,
  change_detected BOOLEAN NOT NULL DEFAULT false,
  change_confidence TEXT NOT NULL DEFAULT 'low',
  change_explanation TEXT,
  watch_status TEXT NOT NULL DEFAULT 'watching',
  refresh_recommendation TEXT NOT NULL DEFAULT 'no_action',
  watch_notes TEXT,
  check_count INTEGER NOT NULL DEFAULT 0,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id)
);

ALTER TABLE public.dataset_watch_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view watch state"
  ON public.dataset_watch_state FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert watch state"
  ON public.dataset_watch_state FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update watch state"
  ON public.dataset_watch_state FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_watch_state_source ON public.dataset_watch_state(source_id);
CREATE INDEX idx_watch_state_status ON public.dataset_watch_state(watch_status);
