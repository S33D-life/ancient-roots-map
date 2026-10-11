-- Prepared only: apply after permission-aware delivery is deployed and tested.
-- This does not change Offering audiences, ownership, RLS, or existing records.
CREATE OR REPLACE FUNCTION public.enforce_ordinary_offering_media_boundary()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  ref text;
  refs text[];
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.visibility IS NOT DISTINCT FROM OLD.visibility
       AND NEW.media_url IS NOT DISTINCT FROM OLD.media_url
       AND NEW.photos IS NOT DISTINCT FROM OLD.photos
       AND NEW.thumbnail_url IS NOT DISTINCT FROM OLD.thumbnail_url
       AND NEW.created_by IS NOT DISTINCT FROM OLD.created_by
       AND NEW.tree_id IS NOT DISTINCT FROM OLD.tree_id THEN
      RETURN NEW;
    END IF;
    IF OLD.visibility = 'public' AND NEW.visibility <> 'public' THEN
      FOREACH ref IN ARRAY array_remove(ARRAY[OLD.media_url, OLD.thumbnail_url] || coalesce(OLD.photos, ARRAY[]::text[]), NULL) LOOP
        IF ref ~* '(/storage/v1/|^https?://[^/]*\.supabase\.(co|in)/)' THEN
          RAISE EXCEPTION 'Changing the audience of published media requires protected-copy migration first' USING ERRCODE = '23514';
        END IF;
      END LOOP;
    END IF;
  END IF;

  refs := array_remove(ARRAY[NEW.media_url, NEW.thumbnail_url] || coalesce(NEW.photos, ARRAY[]::text[]), NULL);
  FOREACH ref IN ARRAY refs LOOP
    -- Ordinary external links are not a promise of private hosting. For managed
    -- Storage media, accept only canonical references, never signed/CDN aliases.
    IF ref ~* '(/storage/v1/|^https?://[^/]*\.supabase\.(co|in)/)' THEN
      IF NEW.visibility <> 'public' THEN
        IF NEW.created_by IS NULL OR ref !~ (
          '^https://[a-z0-9.-]+/storage/v1/object/public/offerings-private/' ||
          NEW.created_by::text || '/' || NEW.tree_id::text || '/[A-Za-z0-9._-]+$'
        ) THEN
          RAISE EXCEPTION 'Limited Offering media requires its own protected object reference' USING ERRCODE = '23514';
        END IF;
      ELSIF ref ~* '/offerings-private/' THEN
        RAISE EXCEPTION 'Publishing protected media requires an explicit public copy first' USING ERRCODE = '23514';
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ordinary_offering_media_boundary
BEFORE INSERT OR UPDATE OF visibility, media_url, photos, thumbnail_url, created_by, tree_id ON public.offerings
FOR EACH ROW EXECUTE FUNCTION public.enforce_ordinary_offering_media_boundary();
