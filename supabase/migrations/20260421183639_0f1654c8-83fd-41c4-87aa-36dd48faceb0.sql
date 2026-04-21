-- ── Whisper presence enforcement: 12h grace + tree proximity ──
-- Server-side guarantee that a whisper can only be is_active=true if the sender
-- has a tree_checkins row for the same tree_anchor_id within the last 12 hours.
-- This trigger augments validate_tree_whisper and runs on every INSERT/UPDATE,
-- including writes via the charge_whisper_send RPC.

CREATE OR REPLACE FUNCTION public.enforce_whisper_presence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_recent_presence boolean := false;
BEGIN
  -- Only enforce when the row would become / remain active.
  IF COALESCE(NEW.is_active, true) IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  -- On UPDATE, only re-check when transitioning false→true OR when the
  -- tree_anchor_id changes while active. Stale active rows are left alone.
  IF TG_OP = 'UPDATE'
     AND COALESCE(OLD.is_active, false) = true
     AND OLD.tree_anchor_id = NEW.tree_anchor_id THEN
    RETURN NEW;
  END IF;

  -- Sender must have a check-in at this tree within the last 12 hours.
  SELECT EXISTS (
    SELECT 1
    FROM public.tree_checkins c
    WHERE c.user_id = NEW.sender_user_id
      AND c.tree_id = NEW.tree_anchor_id
      AND c.checked_in_at >= now() - interval '12 hours'
  ) INTO _has_recent_presence;

  IF NOT _has_recent_presence THEN
    RAISE EXCEPTION 'whisper_presence_required: cannot set is_active=true without a check-in at tree % in the last 12 hours', NEW.tree_anchor_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_whisper_presence ON public.tree_whispers;
CREATE TRIGGER trg_enforce_whisper_presence
  BEFORE INSERT OR UPDATE OF is_active, tree_anchor_id, sender_user_id
  ON public.tree_whispers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_whisper_presence();

-- ── Update charge_whisper_send to soft-coerce is_active ──
-- If the sender requests is_active=true but has no recent presence,
-- the RPC silently demotes to is_active=false instead of failing the send.
-- The trigger above remains the hard guarantee for any other write path.

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
  _has_presence boolean := false;
  _final_is_active boolean;
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

  -- Cost matrix (group only)
  IF _audience_type = 'group' THEN
    _cost := CASE _channel_type
      WHEN 'tree' THEN 3
      WHEN 'species' THEN 5
      WHEN 'mycelium' THEN 7
    END;

    IF NOT public.is_whisper_group_member(_group_id, _sender) THEN
      RAISE EXCEPTION 'Not a member of this group';
    END IF;

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

  -- Soft-coerce: if caller requested active but isn't present at the tree
  -- within the last 12 hours, silently store it as inactive.
  IF COALESCE(_is_active, true) THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.tree_checkins c
      WHERE c.user_id = _sender
        AND c.tree_id = _tree_anchor_id
        AND c.checked_in_at >= now() - interval '12 hours'
    ) INTO _has_presence;
    _final_is_active := _has_presence;
  ELSE
    _final_is_active := false;
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
    _cost, _final_is_active, 'sent'
  ) RETURNING id INTO _whisper_id;

  IF _cost > 0 THEN
    INSERT INTO public.heart_transactions (user_id, heart_type, amount, tree_id)
    VALUES (_sender, 'whisper_send', -_cost, _tree_anchor_id);
  END IF;

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
    'cost', _cost,
    'is_active', _final_is_active,
    'presence_required', NOT _has_presence AND COALESCE(_is_active, true)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.charge_whisper_send(text,text,text,uuid,uuid,text,uuid,boolean,timestamptz) TO authenticated;