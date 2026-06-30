ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS art_origin text,
  ADD COLUMN IF NOT EXISTS art_metadata jsonb;

-- Backfill: existing art offerings are personal artwork by the user
UPDATE public.offerings
SET art_origin = 'created_by_user'
WHERE type = 'art' AND art_origin IS NULL;