
-- Fix the permission helper to use correct enum values
CREATE OR REPLACE FUNCTION public.can_edit_tree(_user_id uuid, _tree_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trees WHERE id = _tree_id AND created_by = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('curator'::app_role, 'keeper'::app_role)
  )
$$;
