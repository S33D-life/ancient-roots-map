-- ============================================================
-- MYCELIAL WHISPERS — channels, groups, recipients, RPCs
-- ============================================================

-- ── PART 1: extend tree_whispers ───────────────────────────
ALTER TABLE public.tree_whispers
  ADD COLUMN IF NOT EXISTS channel_type text NOT NULL DEFAULT 'tree'
    CHECK (channel_type IN ('tree', 'species', 'mycelium')),
  ADD COLUMN IF NOT EXISTS channel_id text,
  ADD COLUMN IF NOT EXISTS audience_type text NOT NULL DEFAULT 'individual'
    CHECK (audience_type IN ('individual', 'group')),
  ADD COLUMN IF NOT EXISTS group_id uuid,
  ADD COLUMN IF NOT EXISTS hearts_cost int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Generated column: is_mycelial (derived from channel_type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tree_whispers' AND column_name='is_mycelial'
  ) THEN
    ALTER TABLE public.tree_whispers
      ADD COLUMN is_mycelial boolean GENERATED ALWAYS AS (channel_type = 'mycelium') STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tree_whispers_channel
  ON public.tree_whispers (channel_type, channel_id);
CREATE INDEX IF NOT EXISTS idx_tree_whispers_group
  ON public.tree_whispers (group_id) WHERE group_id IS NOT NULL;

-- ── PART 2: whisper_groups ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whisper_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  group_type text NOT NULL DEFAULT 'custom'
    CHECK (group_type IN ('family', 'council', 'custom')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whisper_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.whisper_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.whisper_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_whisper_group_members_user ON public.whisper_group_members (user_id);
ALTER TABLE public.whisper_group_members ENABLE ROW LEVEL SECURITY;

-- security-definer helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_whisper_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.whisper_group_members
    WHERE group_id = _group_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.whisper_groups
    WHERE id = _group_id AND owner_id = _user_id
  );
$$;

-- whisper_groups RLS
DROP POLICY IF EXISTS "Owner can manage their groups" ON public.whisper_groups;
CREATE POLICY "Owner can manage their groups"
  ON public.whisper_groups
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Members can view their groups" ON public.whisper_groups;
CREATE POLICY "Members can view their groups"
  ON public.whisper_groups
  FOR SELECT
  USING (public.is_whisper_group_member(id, auth.uid()));

-- whisper_group_members RLS
DROP POLICY IF EXISTS "Members can view their membership rows" ON public.whisper_group_members;
CREATE POLICY "Members can view their membership rows"
  ON public.whisper_group_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.whisper_groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owners manage members" ON public.whisper_group_members;
CREATE POLICY "Owners manage members"
  ON public.whisper_group_members
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.whisper_groups g WHERE g.id = group_id AND g.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.whisper_groups g WHERE g.id = group_id AND g.owner_id = auth.uid()));

-- ── PART 3: whisper_group_recipients ────────────────────────
CREATE TABLE IF NOT EXISTS public.whisper_group_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whisper_id uuid NOT NULL REFERENCES public.tree_whispers(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL,
  opened_at timestamptz,
  opened_tree_id uuid REFERENCES public.trees(id),
  hearts_earned int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (whisper_id, recipient_user_id)
);
CREATE INDEX IF NOT EXISTS idx_wgr_recipient ON public.whisper_group_recipients (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_wgr_whisper ON public.whisper_group_recipients (whisper_id);
ALTER TABLE public.whisper_group_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recipient can view their row" ON public.whisper_group_recipients;
CREATE POLICY "Recipient can view their row"
  ON public.whisper_group_recipients
  FOR SELECT
  USING (
    recipient_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tree_whispers w
      WHERE w.id = whisper_id AND w.sender_user_id = auth.uid()
    )
  );

-- No direct INSERT/UPDATE policies — all writes go through RPCs.

-- ── PART 4: charge_whisper_send RPC ─────────────────────────
CREATE OR REPLACE FUNCTION public.charge_whisper_send(
  _channel_type text,
  _channel_id text,
  _audience_type text,
  _group_id uuid,
  _tree_anchor_id uuid,
  _message_content text,
  _recipient_user_id uuid DEFAULT NULL,
  _is_active boolean DEFAULT true,
  _expires_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender uuid := auth.uid();
  _cost int := 0;
  _balance int := 0;
  _whisper_id uuid;
  _delivery_scope text;
  _delivery_tree uuid;
  _delivery_species text;
  _recipient_scope text;
BEGIN
  IF _sender IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _channel_type NOT IN ('tree','species','mycelium') THEN
    RAISE EXCEPTION 'Invalid channel_type';
  END IF;
  IF _audience_type NOT IN ('individual','group') THEN
    RAISE EXCEPTION 'Invalid audience_type';
  END IF;
  IF _audience_type = 'group' AND _group_id IS NULL THEN
    RAISE EXCEPTION 'group_id required for group whispers';
  END IF;
  IF _audience_type = 'individual' AND _recipient_user_id IS NULL THEN
    -- individual w/ no recipient = public; allowed for back-compat
    NULL;
  END IF;

  -- Cost matrix (group only)
  IF _audience_type = 'group' THEN
    _cost := CASE _channel_type
      WHEN 'tree' THEN 3
      WHEN 'species' THEN 5
      WHEN 'mycelium' THEN 7
    END;

    -- Verify membership/ownership
    IF NOT public.is_whisper_group_member(_group_id, _sender) THEN
      RAISE EXCEPTION 'Not a member of this group';
    END IF;

    -- Check balance via materialized view
    SELECT COALESCE(s33d_hearts, 0) INTO _balance
    FROM public.user_heart_balances
    WHERE user_id = _sender;

    IF _balance < _cost THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'insufficient_hearts',
        'balance', _balance,
        'cost', _cost
      );
    END IF;
  END IF;

  -- Map channel_type -> existing delivery_* columns (back-compat)
  _delivery_scope := CASE _channel_type
    WHEN 'tree' THEN 'SPECIFIC_TREE'
    WHEN 'species' THEN 'SPECIES_MATCH'
    ELSE 'ANY_TREE'
  END;
  _delivery_tree := CASE WHEN _channel_type = 'tree' THEN _channel_id::uuid ELSE NULL END;
  _delivery_species := CASE WHEN _channel_type = 'species' THEN _channel_id ELSE NULL END;

  _recipient_scope := CASE
    WHEN _audience_type = 'group' THEN 'CIRCLE'
    WHEN _recipient_user_id IS NOT NULL THEN 'PRIVATE'
    ELSE 'PUBLIC'
  END;

  -- Insert whisper
  INSERT INTO public.tree_whispers (
    sender_user_id, recipient_scope, recipient_user_id,
    tree_anchor_id, message_content, expires_at,
    delivery_scope, delivery_tree_id, delivery_species_key,
    channel_type, channel_id, audience_type, group_id,
    hearts_cost, is_active, status
  ) VALUES (
    _sender, _recipient_scope, _recipient_user_id,
    _tree_anchor_id, _message_content, _expires_at,
    _delivery_scope, _delivery_tree, _delivery_species,
    _channel_type, _channel_id, _audience_type, _group_id,
    _cost, _is_active, 'sent'
  ) RETURNING id INTO _whisper_id;

  -- Deduct hearts (one negative tx)
  IF _cost > 0 THEN
    INSERT INTO public.heart_transactions (user_id, heart_type, amount, tree_id)
    VALUES (_sender, 'whisper_send', -_cost, _tree_anchor_id);
  END IF;

  -- Seed recipient rows for group whispers (excluding sender)
  IF _audience_type = 'group' THEN
    INSERT INTO public.whisper_group_recipients (whisper_id, recipient_user_id)
    SELECT _whisper_id, m.user_id
    FROM public.whisper_group_members m
    WHERE m.group_id = _group_id AND m.user_id <> _sender
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'whisper_id', _whisper_id,
    'cost', _cost
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.charge_whisper_send(text,text,text,uuid,uuid,text,uuid,boolean,timestamptz) TO authenticated;

-- ── PART 5: open_group_whisper RPC ──────────────────────────
CREATE OR REPLACE FUNCTION public.open_group_whisper(
  _whisper_id uuid,
  _current_tree_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _w record;
  _tree_species text;
  _matches boolean := false;
  _reward int := 0;
  _rewarded_today int := 0;
  _already_open timestamptz;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Fetch whisper
  SELECT * INTO _w FROM public.tree_whispers WHERE id = _whisper_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Whisper not found';
  END IF;

  -- Recipient row?
  SELECT opened_at INTO _already_open
  FROM public.whisper_group_recipients
  WHERE whisper_id = _whisper_id AND recipient_user_id = _user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not a recipient of this whisper';
  END IF;

  -- If already opened — just return content (no double-reward)
  IF _already_open IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'message', _w.message_content,
      'sender_user_id', _w.sender_user_id,
      'reward', 0,
      'already_opened', true
    );
  END IF;

  -- Lookup current tree species
  SELECT lower(regexp_replace(COALESCE(species,''), '\s+', '_', 'g'))
    INTO _tree_species
  FROM public.trees WHERE id = _current_tree_id;

  -- Validate channel match
  _matches := CASE _w.channel_type
    WHEN 'tree' THEN _w.channel_id::uuid = _current_tree_id
    WHEN 'species' THEN _w.channel_id = _tree_species
    WHEN 'mycelium' THEN true
    ELSE false
  END;

  IF NOT _matches THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'channel_mismatch',
      'channel_type', _w.channel_type
    );
  END IF;

  -- Reward amount
  _reward := CASE _w.channel_type
    WHEN 'tree' THEN 3
    WHEN 'species' THEN 5
    WHEN 'mycelium' THEN 7
  END;

  -- Anti-spam: max 5 rewarded opens per recipient per UTC day
  SELECT COUNT(*) INTO _rewarded_today
  FROM public.heart_transactions
  WHERE user_id = _user
    AND heart_type = 'whisper_open'
    AND created_at >= date_trunc('day', now());

  IF _rewarded_today >= 5 THEN
    _reward := 0;
  END IF;

  -- Mark opened
  UPDATE public.whisper_group_recipients
     SET opened_at = now(),
         opened_tree_id = _current_tree_id,
         hearts_earned = _reward
   WHERE whisper_id = _whisper_id AND recipient_user_id = _user;

  -- Award recipient
  IF _reward > 0 THEN
    INSERT INTO public.heart_transactions (user_id, heart_type, amount, tree_id)
    VALUES (_user, 'whisper_open', _reward, _current_tree_id);

    -- Echo to sender (+1)
    IF _w.sender_user_id IS NOT NULL AND _w.sender_user_id <> _user THEN
      INSERT INTO public.heart_transactions (user_id, heart_type, amount, tree_id)
      VALUES (_w.sender_user_id, 'whisper_echo', 1, _current_tree_id);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'message', _w.message_content,
    'sender_user_id', _w.sender_user_id,
    'reward', _reward,
    'channel_type', _w.channel_type,
    'capped', _rewarded_today >= 5
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.open_group_whisper(uuid, uuid) TO authenticated;

-- ── PART 6: trigger to keep updated_at fresh ────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whisper_groups_touch ON public.whisper_groups;
CREATE TRIGGER trg_whisper_groups_touch
  BEFORE UPDATE ON public.whisper_groups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();