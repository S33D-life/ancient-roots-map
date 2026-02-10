
-- 1. Fix what3words unique constraint: allow multiple nulls/empty values
ALTER TABLE public.trees DROP CONSTRAINT IF EXISTS trees_what3words_key;
CREATE UNIQUE INDEX trees_what3words_unique ON public.trees (what3words) WHERE what3words IS NOT NULL AND what3words != '';

-- 2. Remove email column from profiles (no code references it, reduces attack surface)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- 3. Update handle_new_user trigger to stop inserting email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;
