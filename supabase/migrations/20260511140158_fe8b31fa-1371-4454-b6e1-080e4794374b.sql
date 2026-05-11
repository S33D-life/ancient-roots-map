DROP FUNCTION IF EXISTS public.validate_invite_code(text);

CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text)
RETURNS TABLE(id uuid, created_by uuid, expires_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT il.id, il.created_by, il.expires_at
  FROM public.invite_links il
  WHERE il.code = p_code
    AND (il.expires_at IS NULL OR il.expires_at > now())
    AND (il.max_uses IS NULL OR il.uses_count < il.max_uses)
  LIMIT 1;
$function$;

CREATE TABLE IF NOT EXISTS public.invite_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  invite_code_hash text,
  source text,
  user_id uuid,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_analytics_events_created_at
  ON public.invite_analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invite_analytics_events_event_name
  ON public.invite_analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_invite_analytics_events_hash
  ON public.invite_analytics_events (invite_code_hash);

ALTER TABLE public.invite_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone may insert invite analytics"
ON public.invite_analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Curators may read invite analytics"
ON public.invite_analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'curator'::app_role));
