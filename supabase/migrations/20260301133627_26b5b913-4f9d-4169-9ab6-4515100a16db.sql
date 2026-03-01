
-- Sky Stamps table for capturing weather + sky position moments
CREATE TABLE public.sky_stamps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_tree_id UUID REFERENCES public.trees(id),
  source_offering_id UUID,
  source_whisper_id UUID,
  source_checkin_id UUID,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  timezone TEXT,
  weather JSONB,
  sky_core JSONB,
  sky_planets JSONB,
  seal JSONB,
  cache_key TEXT,
  user_id UUID NOT NULL
);

-- Indexes
CREATE INDEX idx_sky_stamps_offering ON public.sky_stamps(source_offering_id) WHERE source_offering_id IS NOT NULL;
CREATE INDEX idx_sky_stamps_whisper ON public.sky_stamps(source_whisper_id) WHERE source_whisper_id IS NOT NULL;
CREATE INDEX idx_sky_stamps_checkin ON public.sky_stamps(source_checkin_id) WHERE source_checkin_id IS NOT NULL;
CREATE INDEX idx_sky_stamps_tree_time ON public.sky_stamps(source_tree_id, created_at DESC);
CREATE INDEX idx_sky_stamps_cache ON public.sky_stamps(cache_key);

-- Add sky_stamp_id to offerings
ALTER TABLE public.offerings ADD COLUMN sky_stamp_id UUID REFERENCES public.sky_stamps(id);

-- Add sky_stamp_id to tree_whispers
ALTER TABLE public.tree_whispers ADD COLUMN sky_stamp_id UUID REFERENCES public.sky_stamps(id);

-- Add sky_stamp_id to tree_checkins
ALTER TABLE public.tree_checkins ADD COLUMN sky_stamp_id UUID REFERENCES public.sky_stamps(id);

-- RLS
ALTER TABLE public.sky_stamps ENABLE ROW LEVEL SECURITY;

-- Anyone can read sky stamps (they contain only weather/sky data, no personal info)
CREATE POLICY "Anyone can read sky stamps" ON public.sky_stamps
  FOR SELECT USING (true);

-- Authenticated users can insert their own stamps
CREATE POLICY "Users can create their own sky stamps" ON public.sky_stamps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for sky_stamps
ALTER PUBLICATION supabase_realtime ADD TABLE public.sky_stamps;
