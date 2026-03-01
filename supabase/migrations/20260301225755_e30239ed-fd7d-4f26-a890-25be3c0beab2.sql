
-- Quote likes table for lightweight community engagement
CREATE TABLE public.quote_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(offering_id, user_id)
);

-- Enable RLS
ALTER TABLE public.quote_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read likes
CREATE POLICY "Anyone can read quote likes" ON public.quote_likes
  FOR SELECT USING (true);

-- Authenticated users can like
CREATE POLICY "Authenticated users can like quotes" ON public.quote_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unlike their own
CREATE POLICY "Users can remove own likes" ON public.quote_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast counts
CREATE INDEX idx_quote_likes_offering ON public.quote_likes(offering_id);
CREATE INDEX idx_quote_likes_user ON public.quote_likes(user_id);

-- Cached external wisdom quotes
CREATE TABLE public.external_wisdom_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'quotable',
  quote_text TEXT NOT NULL,
  author_name TEXT,
  source_title TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.external_wisdom_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached wisdom" ON public.external_wisdom_cache
  FOR SELECT USING (true);

-- RPC: Get top grove quotes (offerings with quote_text, ranked by likes + influence + recency)
CREATE OR REPLACE FUNCTION public.get_top_grove_quotes(
  p_timeframe TEXT DEFAULT 'moon_cycle',
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  offering_id UUID,
  quote_text TEXT,
  quote_author TEXT,
  quote_source TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  tree_id UUID,
  like_count BIGINT,
  influence_score NUMERIC,
  computed_score NUMERIC,
  creator_name TEXT,
  creator_avatar TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH time_filter AS (
    SELECT CASE
      WHEN p_timeframe = '7d' THEN now() - interval '7 days'
      WHEN p_timeframe = 'moon_cycle' THEN now() - interval '29.5 days'
      WHEN p_timeframe = 'all_time' THEN '1970-01-01'::timestamptz
      ELSE now() - interval '29.5 days'
    END AS cutoff
  ),
  scored AS (
    SELECT
      o.id AS offering_id,
      o.quote_text,
      o.quote_author,
      o.quote_source,
      o.created_by,
      o.created_at,
      o.tree_id,
      COALESCE(ql.cnt, 0) AS like_count,
      COALESCE(o.influence_score, 0) AS influence_score,
      -- Score: likes*1 + influence*3 + recency boost (decays over 30 days)
      (COALESCE(ql.cnt, 0) * 1.0)
        + (COALESCE(o.influence_score, 0) * 3.0)
        + GREATEST(0, 10.0 * (1.0 - EXTRACT(EPOCH FROM (now() - o.created_at)) / (30.0 * 86400.0)))
      AS computed_score,
      p.full_name AS creator_name,
      p.avatar_url AS creator_avatar
    FROM offerings o
    CROSS JOIN time_filter tf
    LEFT JOIN (
      SELECT offering_id, COUNT(*) AS cnt FROM quote_likes GROUP BY offering_id
    ) ql ON ql.offering_id = o.id
    LEFT JOIN profiles p ON p.id = o.created_by
    WHERE o.quote_text IS NOT NULL
      AND trim(o.quote_text) != ''
      AND o.visibility = 'public'
      AND o.created_at >= tf.cutoff
  )
  SELECT * FROM scored
  ORDER BY computed_score DESC
  LIMIT p_limit;
$$;
