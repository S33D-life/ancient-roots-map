
-- Bloom offerings table
CREATE TABLE public.bloom_offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID NOT NULL,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  note TEXT,
  species_guess TEXT,
  season TEXT NOT NULL,
  year INT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  hearts_rewarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bloom_offerings_tree ON public.bloom_offerings(tree_id);
CREATE INDEX idx_bloom_offerings_tree_season_year ON public.bloom_offerings(tree_id, year, season);
CREATE INDEX idx_bloom_offerings_user ON public.bloom_offerings(user_id);

ALTER TABLE public.bloom_offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bloom offerings are viewable by everyone"
  ON public.bloom_offerings FOR SELECT USING (true);

CREATE POLICY "Users can create their own bloom offerings"
  ON public.bloom_offerings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bloom offerings"
  ON public.bloom_offerings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bloom offerings"
  ON public.bloom_offerings FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('bloom-offerings', 'bloom-offerings', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Bloom photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bloom-offerings');

CREATE POLICY "Users can upload bloom photos to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'bloom-offerings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own bloom photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'bloom-offerings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own bloom photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'bloom-offerings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
