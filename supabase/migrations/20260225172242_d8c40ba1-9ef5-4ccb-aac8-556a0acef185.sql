-- Function to increment proposal support with influence weight
CREATE OR REPLACE FUNCTION public.increment_proposal_support(p_id uuid, p_weight integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE value_proposals
  SET support_count = support_count + p_weight,
      updated_at = now()
  WHERE id = p_id
    AND status = 'pending';
END;
$$;