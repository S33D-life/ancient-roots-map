
-- Seed ingest logs for tracking parse attempts and errors
CREATE TABLE public.seed_ingest_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  raw_payload TEXT NOT NULL,
  parsed_url TEXT,
  parsed_track_id TEXT,
  parsed_title TEXT,
  parsed_artist TEXT,
  confidence TEXT NOT NULL DEFAULT 'low',
  errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seed_ingest_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ingest logs" ON public.seed_ingest_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create ingest logs" ON public.seed_ingest_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bug reports for test lab
CREATE TABLE public.bug_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  steps TEXT NOT NULL,
  expected TEXT NOT NULL,
  actual TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bug reports" ON public.bug_reports
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create bug reports" ON public.bug_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bug reports" ON public.bug_reports
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Draft seeds for the incoming share flow
CREATE TABLE public.draft_seeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_url TEXT,
  track_id TEXT,
  title TEXT,
  artist TEXT,
  note TEXT,
  raw_payload TEXT,
  confidence TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'draft',
  tree_id UUID REFERENCES public.trees(id),
  offering_id UUID REFERENCES public.offerings(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.draft_seeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts" ON public.draft_seeds
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create drafts" ON public.draft_seeds
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own drafts" ON public.draft_seeds
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own drafts" ON public.draft_seeds
  FOR DELETE USING (auth.uid() = user_id);
