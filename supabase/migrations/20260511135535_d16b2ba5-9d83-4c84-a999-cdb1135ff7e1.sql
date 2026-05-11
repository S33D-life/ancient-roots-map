CREATE OR REPLACE FUNCTION public.admin_invite_status(p_code text)
RETURNS TABLE (
  code text,
  created_at timestamptz,
  is_used boolean,
  used_at timestamptz,
  uses_count integer,
  max_uses integer,
  expires_at timestamptz,
  creator_id uuid,
  creator_name text,
  recipient_id uuid,
  recipient_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'curator') THEN
    RAISE EXCEPTION 'forbidden: curator role required';
  END IF;

  RETURN QUERY
  SELECT
    il.code,
    il.created_at,
    il.is_used,
    il.used_at,
    il.uses_count,
    il.max_uses,
    il.expires_at,
    il.created_by AS creator_id,
    creator.full_name AS creator_name,
    il.used_by_user_id AS recipient_id,
    recipient.full_name AS recipient_name
  FROM public.invite_links il
  LEFT JOIN public.profiles creator   ON creator.id   = il.created_by
  LEFT JOIN public.profiles recipient ON recipient.id = il.used_by_user_id
  WHERE il.code = p_code
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_invite_status(text) TO authenticated;
