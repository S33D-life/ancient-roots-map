ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
  ADD COLUMN IF NOT EXISTS youtube_embed_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;