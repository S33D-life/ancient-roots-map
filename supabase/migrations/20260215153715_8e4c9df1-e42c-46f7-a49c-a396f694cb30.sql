
-- Drop the overly permissive public SELECT policy for shared plants
DROP POLICY IF EXISTS "Anyone can view shared plants" ON public.greenhouse_plants;

-- Create a secure RPC that returns only non-identifying fields for shared plants
CREATE OR REPLACE FUNCTION public.get_shared_plants(result_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, name text, species text, photo_url text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gp.id, gp.name, gp.species, gp.photo_url, gp.created_at
  FROM public.greenhouse_plants gp
  WHERE gp.is_shared = true
  ORDER BY gp.created_at DESC
  LIMIT result_limit;
$$;
