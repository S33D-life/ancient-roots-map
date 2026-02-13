
-- Create birdsong_offerings table
CREATE TABLE public.birdsong_offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  audio_url TEXT NOT NULL,
  audio_cid TEXT,
  metadata_cid TEXT,
  species_common TEXT,
  species_scientific TEXT,
  ebird_code TEXT,
  confidence REAL,
  predictions JSONB DEFAULT '[]'::jsonb,
  model_version TEXT,
  chain_tx_hash TEXT,
  duration_seconds REAL,
  season TEXT
);

-- Enable RLS
ALTER TABLE public.birdsong_offerings ENABLE ROW LEVEL SECURITY;

-- Anyone can view birdsong offerings
CREATE POLICY "Birdsong offerings are publicly readable"
  ON public.birdsong_offerings FOR SELECT
  USING (true);

-- Authenticated users can create offerings
CREATE POLICY "Users can create birdsong offerings"
  ON public.birdsong_offerings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own offerings (for adding CID, chain hash)
CREATE POLICY "Users can update own birdsong offerings"
  ON public.birdsong_offerings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own offerings
CREATE POLICY "Users can delete own birdsong offerings"
  ON public.birdsong_offerings FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for tree lookups
CREATE INDEX idx_birdsong_tree_id ON public.birdsong_offerings(tree_id);
CREATE INDEX idx_birdsong_species ON public.birdsong_offerings(species_common);
CREATE INDEX idx_birdsong_created ON public.birdsong_offerings(created_at DESC);

-- Create storage bucket for birdsong audio
INSERT INTO storage.buckets (id, name, public) VALUES ('birdsong', 'birdsong', true);

-- Storage policies
CREATE POLICY "Birdsong audio is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'birdsong');

CREATE POLICY "Users can upload birdsong audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'birdsong' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own birdsong audio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'birdsong' AND auth.uid()::text = (storage.foldername(name))[1]);
