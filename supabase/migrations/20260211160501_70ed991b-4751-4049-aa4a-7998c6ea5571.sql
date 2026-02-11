
-- Record every visit as a digital connection with an Ancient Friend
CREATE TABLE public.site_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_number bigint NOT NULL,
  ancient_friend_index smallint NOT NULL,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_hash text
);

-- Sequence for globally incrementing visitor number
CREATE SEQUENCE public.site_visits_visitor_seq;

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a visit (including anonymous visitors)
CREATE POLICY "Anyone can record a visit"
  ON public.site_visits FOR INSERT
  WITH CHECK (true);

-- Anyone can read visit count
CREATE POLICY "Anyone can read visits"
  ON public.site_visits FOR SELECT
  USING (true);

-- Function to record a visit and return the visitor number + friend index
CREATE OR REPLACE FUNCTION public.record_visit(p_user_id uuid DEFAULT NULL)
RETURNS TABLE(visitor_number bigint, ancient_friend_index smallint, total_visits bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num bigint;
  v_friend smallint;
  v_total bigint;
BEGIN
  v_num := nextval('public.site_visits_visitor_seq');
  v_friend := (v_num % 5)::smallint;  -- 5 Ancient Friends in gallery
  
  INSERT INTO public.site_visits (visitor_number, ancient_friend_index, user_id)
  VALUES (v_num, v_friend, p_user_id);
  
  v_total := v_num;
  
  RETURN QUERY SELECT v_num, v_friend, v_total;
END;
$$;
