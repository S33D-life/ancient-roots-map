-- Mycelial Intelligence Layer v0
-- Lightweight edge graph for whispers, offerings, visits, and seed-like flows.

CREATE TABLE IF NOT EXISTS public.mycelial_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  from_type TEXT NOT NULL CHECK (from_type IN ('tree', 'user', 'grove', 'country', 'staff')),
  from_id TEXT NOT NULL,
  to_type TEXT NOT NULL CHECK (to_type IN ('tree', 'user', 'grove', 'country', 'staff')),
  to_id TEXT NOT NULL,
  edge_kind TEXT NOT NULL CHECK (edge_kind IN ('whisper', 'offering', 'visit', 'seed', 'book', 'council', 'staff_mint')),
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight > 0),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mycelial_edges_unique
  ON public.mycelial_edges(from_type, from_id, to_type, to_id, edge_kind);

CREATE INDEX IF NOT EXISTS idx_mycelial_edges_last_seen
  ON public.mycelial_edges(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_mycelial_edges_kind_last_seen
  ON public.mycelial_edges(edge_kind, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_mycelial_edges_from
  ON public.mycelial_edges(from_type, from_id);

CREATE INDEX IF NOT EXISTS idx_mycelial_edges_to
  ON public.mycelial_edges(to_type, to_id);

ALTER TABLE public.mycelial_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read mycelial edges" ON public.mycelial_edges;
CREATE POLICY "Public can read mycelial edges"
  ON public.mycelial_edges
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert own mycelial edges" ON public.mycelial_edges;
CREATE POLICY "Authenticated can insert own mycelial edges"
  ON public.mycelial_edges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      (from_type = 'user' AND from_id = auth.uid()::text)
      OR COALESCE(metadata->>'actor_user_id', '') = auth.uid()::text
      OR public.has_role(auth.uid(), 'keeper')
      OR public.has_role(auth.uid(), 'curator')
    )
  );

DROP POLICY IF EXISTS "Authenticated can update own mycelial edges" ON public.mycelial_edges;
CREATE POLICY "Authenticated can update own mycelial edges"
  ON public.mycelial_edges
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      (from_type = 'user' AND from_id = auth.uid()::text)
      OR COALESCE(metadata->>'actor_user_id', '') = auth.uid()::text
      OR public.has_role(auth.uid(), 'keeper')
      OR public.has_role(auth.uid(), 'curator')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      (from_type = 'user' AND from_id = auth.uid()::text)
      OR COALESCE(metadata->>'actor_user_id', '') = auth.uid()::text
      OR public.has_role(auth.uid(), 'keeper')
      OR public.has_role(auth.uid(), 'curator')
    )
  );

-- Internal utility used by triggers and edge functions.
CREATE OR REPLACE FUNCTION public.upsert_mycelial_edge_internal(
  p_from_type TEXT,
  p_from_id TEXT,
  p_to_type TEXT,
  p_to_id TEXT,
  p_edge_kind TEXT,
  p_weight INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_last_seen_at TIMESTAMPTZ DEFAULT now()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_from_id IS NULL OR btrim(p_from_id) = '' OR p_to_id IS NULL OR btrim(p_to_id) = '' THEN
    RETURN;
  END IF;

  INSERT INTO public.mycelial_edges (
    from_type,
    from_id,
    to_type,
    to_id,
    edge_kind,
    weight,
    last_seen_at,
    metadata
  )
  VALUES (
    p_from_type,
    p_from_id,
    p_to_type,
    p_to_id,
    p_edge_kind,
    GREATEST(COALESCE(p_weight, 1), 1),
    COALESCE(p_last_seen_at, now()),
    COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (from_type, from_id, to_type, to_id, edge_kind)
  DO UPDATE
    SET
      weight = public.mycelial_edges.weight + GREATEST(COALESCE(p_weight, 1), 1),
      last_seen_at = GREATEST(public.mycelial_edges.last_seen_at, COALESCE(p_last_seen_at, now())),
      metadata = public.mycelial_edges.metadata || COALESCE(p_metadata, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_mycelial_edge_internal(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_mycelial_edge_internal(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_mycelial_edge_internal(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB, TIMESTAMPTZ) TO service_role;

-- Auth-checked RPC for client-side upserts.
CREATE OR REPLACE FUNCTION public.upsert_mycelial_edge(
  p_from_type TEXT,
  p_from_id TEXT,
  p_to_type TEXT,
  p_to_id TEXT,
  p_edge_kind TEXT,
  p_weight INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_last_seen_at TIMESTAMPTZ DEFAULT now()
)
RETURNS public.mycelial_edges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_is_admin BOOLEAN := false;
  v_row public.mycelial_edges;
  v_metadata JSONB := COALESCE(p_metadata, '{}'::jsonb);
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  v_is_admin := public.has_role(v_actor, 'keeper') OR public.has_role(v_actor, 'curator');

  IF NOT v_is_admin THEN
    IF p_from_type <> 'user' OR p_from_id <> v_actor::text THEN
      RAISE EXCEPTION 'forbidden_origin';
    END IF;
  END IF;

  v_metadata := v_metadata || jsonb_build_object('actor_user_id', v_actor::text);

  INSERT INTO public.mycelial_edges (
    from_type,
    from_id,
    to_type,
    to_id,
    edge_kind,
    weight,
    last_seen_at,
    metadata
  )
  VALUES (
    p_from_type,
    p_from_id,
    p_to_type,
    p_to_id,
    p_edge_kind,
    GREATEST(COALESCE(p_weight, 1), 1),
    COALESCE(p_last_seen_at, now()),
    v_metadata
  )
  ON CONFLICT (from_type, from_id, to_type, to_id, edge_kind)
  DO UPDATE
    SET
      weight = public.mycelial_edges.weight + GREATEST(COALESCE(p_weight, 1), 1),
      last_seen_at = GREATEST(public.mycelial_edges.last_seen_at, COALESCE(p_last_seen_at, now())),
      metadata = public.mycelial_edges.metadata || v_metadata
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_mycelial_edge(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_mycelial_edge(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_mycelial_edge(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB, TIMESTAMPTZ) TO service_role;

-- Automatic integrations for existing contribution flows.
CREATE OR REPLACE FUNCTION public.trg_mycelial_on_offering_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL OR NEW.tree_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.upsert_mycelial_edge_internal(
    'user',
    NEW.created_by::text,
    'tree',
    NEW.tree_id::text,
    'offering',
    1,
    jsonb_build_object(
      'offering_id', NEW.id::text,
      'actor_user_id', NEW.created_by::text
    ),
    COALESCE(NEW.created_at, now())
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mycelial_on_offering_insert ON public.offerings;
CREATE TRIGGER trg_mycelial_on_offering_insert
  AFTER INSERT ON public.offerings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_mycelial_on_offering_insert();

CREATE OR REPLACE FUNCTION public.trg_mycelial_on_checkin_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.tree_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.upsert_mycelial_edge_internal(
    'user',
    NEW.user_id::text,
    'tree',
    NEW.tree_id::text,
    'visit',
    1,
    jsonb_strip_nulls(
      jsonb_build_object(
        'checkin_id', NEW.id::text,
        'actor_user_id', NEW.user_id::text,
        'from_lat', NEW.latitude,
        'from_lng', NEW.longitude
      )
    ),
    COALESCE(NEW.checked_in_at, NEW.created_at, now())
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mycelial_on_checkin_insert ON public.tree_checkins;
CREATE TRIGGER trg_mycelial_on_checkin_insert
  AFTER INSERT ON public.tree_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_mycelial_on_checkin_insert();
