-- Curator-only staff steward assignment helpers
-- Returns a structured JSON result so the UI can surface the real failure reason.

CREATE OR REPLACE FUNCTION public.assign_staff_steward(
  p_staff_code text,
  p_new_owner_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_existing_owner uuid;
  v_profile_exists boolean;
  v_full_name text;
BEGIN
  -- 1. Auth check
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'not_authenticated',
      'message', 'You must be signed in to assign a steward.'
    );
  END IF;

  -- 2. Role check (curator OR keeper)
  IF NOT (
    public.has_role(v_caller, 'curator'::app_role)
    OR public.has_role(v_caller, 'keeper'::app_role)
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'forbidden',
      'message', 'Only curators or keepers can assign a steward.'
    );
  END IF;

  -- 3. Input validation
  IF p_staff_code IS NULL OR length(trim(p_staff_code)) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'missing_staff_code',
      'message', 'A staff code is required.'
    );
  END IF;

  IF p_new_owner_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'missing_owner',
      'message', 'A wanderer must be selected.'
    );
  END IF;

  -- 4. Confirm staff token exists
  SELECT owner_user_id INTO v_existing_owner
  FROM public.staffs
  WHERE id = p_staff_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'staff_not_found',
      'message', format('Staff token "%s" does not exist.', p_staff_code)
    );
  END IF;

  -- 5. Confirm profile exists
  SELECT true, full_name
    INTO v_profile_exists, v_full_name
  FROM public.profiles
  WHERE id = p_new_owner_id;

  IF NOT v_profile_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'profile_not_found',
      'message', 'The selected wanderer no longer has a profile.'
    );
  END IF;

  -- 6. No-op guard
  IF v_existing_owner IS NOT DISTINCT FROM p_new_owner_id THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'unchanged',
      'message', 'This wanderer is already the steward.',
      'staff_code', p_staff_code,
      'owner_user_id', p_new_owner_id,
      'owner_name', v_full_name
    );
  END IF;

  -- 7. Perform the update (trigger on_staff_claimed fires here)
  BEGIN
    UPDATE public.staffs
    SET owner_user_id = p_new_owner_id
    WHERE id = p_staff_code;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'update_failed',
      'message', format('The assignment could not be saved: %s', SQLERRM),
      'sqlstate', SQLSTATE
    );
  END;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'assigned',
    'message', format('Staff %s assigned to %s.', p_staff_code, COALESCE(v_full_name, 'wanderer')),
    'staff_code', p_staff_code,
    'owner_user_id', p_new_owner_id,
    'owner_name', v_full_name,
    'previous_owner_id', v_existing_owner
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unassign_staff_steward(
  p_staff_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_existing_owner uuid;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_authenticated',
      'message', 'You must be signed in to unassign a steward.');
  END IF;

  IF NOT (
    public.has_role(v_caller, 'curator'::app_role)
    OR public.has_role(v_caller, 'keeper'::app_role)
  ) THEN
    RETURN jsonb_build_object('success', false, 'code', 'forbidden',
      'message', 'Only curators or keepers can unassign a steward.');
  END IF;

  IF p_staff_code IS NULL OR length(trim(p_staff_code)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'code', 'missing_staff_code',
      'message', 'A staff code is required.');
  END IF;

  SELECT owner_user_id INTO v_existing_owner
  FROM public.staffs
  WHERE id = p_staff_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'staff_not_found',
      'message', format('Staff token "%s" does not exist.', p_staff_code));
  END IF;

  IF v_existing_owner IS NULL THEN
    RETURN jsonb_build_object('success', true, 'code', 'unchanged',
      'message', 'No steward was assigned.', 'staff_code', p_staff_code);
  END IF;

  BEGIN
    UPDATE public.staffs
    SET owner_user_id = NULL
    WHERE id = p_staff_code;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'code', 'update_failed',
      'message', format('Could not unassign: %s', SQLERRM),
      'sqlstate', SQLSTATE);
  END;

  RETURN jsonb_build_object('success', true, 'code', 'unassigned',
    'message', format('Staff %s unassigned.', p_staff_code),
    'staff_code', p_staff_code,
    'previous_owner_id', v_existing_owner);
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_staff_steward(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unassign_staff_steward(text) TO authenticated;