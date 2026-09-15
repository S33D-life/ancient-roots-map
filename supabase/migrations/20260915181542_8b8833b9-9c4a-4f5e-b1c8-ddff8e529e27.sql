
CREATE OR REPLACE FUNCTION public.fold_grove_roots_on_merge(
  _keep_id uuid, _drop_id uuid, _actor uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; keeper record; n_moved int := 0; n_folded int := 0;
BEGIN
  FOR r IN SELECT * FROM public.grove_roots
            WHERE tree_id = _drop_id AND status IN ('pending','active')
            ORDER BY created_at ASC LOOP
    SELECT * INTO keeper FROM public.grove_roots
      WHERE tree_id = _keep_id AND life_grove_id = r.life_grove_id
        AND status IN ('pending','active')
      ORDER BY created_at ASC LIMIT 1;

    IF keeper IS NULL THEN
      UPDATE public.grove_roots SET tree_id = _keep_id, updated_at = now() WHERE id = r.id;
      INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, detail)
      VALUES (r.id, _actor, 'moved_on_merge',
              jsonb_build_object('from_tree', _drop_id, 'to_tree', _keep_id));
      n_moved := n_moved + 1;
    ELSIF keeper.created_at <= r.created_at THEN
      -- the survivor already carries the earlier relationship: fold into it
      UPDATE public.grove_roots SET status = 'removed', updated_at = now() WHERE id = r.id;
      INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, detail)
      VALUES (r.id, _actor, 'folded_on_merge',
              jsonb_build_object('from_tree', _drop_id, 'into_root', keeper.id,
                                 'inscription_text', r.inscription_text,
                                 'dedication', r.dedication));
      INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, detail)
      VALUES (keeper.id, _actor, 'received_folded_root',
              jsonb_build_object('from_root', r.id, 'from_tree', _drop_id,
                                 'inscription_text', r.inscription_text));
      n_folded := n_folded + 1;
    ELSE
      -- the superseded record holds the earlier relationship: it becomes canonical
      UPDATE public.grove_roots SET status = 'removed', updated_at = now() WHERE id = keeper.id;
      UPDATE public.grove_roots SET tree_id = _keep_id, updated_at = now() WHERE id = r.id;
      INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, detail)
      VALUES (keeper.id, _actor, 'folded_on_merge',
              jsonb_build_object('into_root', r.id, 'reason', 'earlier_relationship_kept',
                                 'inscription_text', keeper.inscription_text));
      INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, detail)
      VALUES (r.id, _actor, 'moved_on_merge',
              jsonb_build_object('from_tree', _drop_id, 'to_tree', _keep_id,
                                 'absorbed_root', keeper.id));
      n_moved := n_moved + 1; n_folded := n_folded + 1;
    END IF;
  END LOOP;

  -- closed roots simply follow the survivor so provenance stays reachable
  UPDATE public.grove_roots SET tree_id = _keep_id
   WHERE tree_id = _drop_id AND status IN ('declined','removed');

  RETURN jsonb_build_object('grove_roots_moved', n_moved, 'grove_roots_folded', n_folded);
END $$;

REVOKE EXECUTE ON FUNCTION public.fold_grove_roots_on_merge(uuid,uuid,uuid) FROM anon, authenticated;
