
-- Step 1: Drop old function
DROP FUNCTION IF EXISTS public.get_safe_profiles(uuid[]);

-- Step 2: Add visibility column
ALTER TABLE public.profiles
ADD COLUMN visible_fields jsonb NOT NULL DEFAULT '{"bio": true, "home_place": false, "instagram_handle": false, "x_handle": false, "facebook_handle": false}'::jsonb;

-- Step 3: Recreate with visibility-aware columns
CREATE FUNCTION public.get_safe_profiles(p_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text, bio text, is_discoverable boolean, home_place text, instagram_handle text, x_handle text, facebook_handle text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    CASE WHEN p.id = auth.uid() OR COALESCE((p.visible_fields->>'bio')::boolean, true) THEN p.bio ELSE NULL END,
    p.is_discoverable,
    CASE WHEN p.id = auth.uid() OR COALESCE((p.visible_fields->>'home_place')::boolean, false) THEN p.home_place ELSE NULL END,
    CASE WHEN p.id = auth.uid() OR COALESCE((p.visible_fields->>'instagram_handle')::boolean, false) THEN p.instagram_handle ELSE NULL END,
    CASE WHEN p.id = auth.uid() OR COALESCE((p.visible_fields->>'x_handle')::boolean, false) THEN p.x_handle ELSE NULL END,
    CASE WHEN p.id = auth.uid() OR COALESCE((p.visible_fields->>'facebook_handle')::boolean, false) THEN p.facebook_handle ELSE NULL END
  FROM public.profiles p
  WHERE p.id = ANY(p_ids)
    AND (p.is_discoverable = true OR p.id = auth.uid());
$$;

-- Step 4: Update search to respect bio visibility
CREATE OR REPLACE FUNCTION public.search_discoverable_profiles(search_query text DEFAULT '', result_limit integer DEFAULT 20)
RETURNS TABLE(id uuid, full_name text, avatar_url text, bio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    CASE WHEN COALESCE((p.visible_fields->>'bio')::boolean, true) THEN p.bio ELSE NULL END
  FROM public.profiles p
  WHERE p.is_discoverable = true
    AND (search_query = '' OR p.full_name ILIKE '%' || search_query || '%')
  ORDER BY p.full_name
  LIMIT result_limit;
$$;
