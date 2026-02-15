
-- Add identity & social fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_place text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS x_handle text,
  ADD COLUMN IF NOT EXISTS facebook_handle text,
  ADD COLUMN IF NOT EXISTS identity_bloomed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS inspired_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS inspired_by_tree_id uuid,
  ADD COLUMN IF NOT EXISTS inspiration_source text;

-- Add index for lineage queries
CREATE INDEX IF NOT EXISTS idx_profiles_inspired_by ON public.profiles (inspired_by_user_id) WHERE inspired_by_user_id IS NOT NULL;
