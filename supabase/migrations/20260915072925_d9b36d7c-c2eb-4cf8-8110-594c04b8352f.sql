
-- ── Agent Garden tasks: cap the reward a non-curator may attach ──
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.agent_garden_tasks;
CREATE POLICY "Authenticated users can insert tasks"
ON public.agent_garden_tasks FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'curator'::app_role)
    OR COALESCE(hearts_reward, 0) <= 25
  )
);

-- ── Task submissions: authors may edit, only curators may approve ──
DROP POLICY IF EXISTS "Users can update own pending submissions" ON public.task_submissions;
CREATE POLICY "Users can update own pending submissions"
ON public.task_submissions FOR UPDATE TO authenticated
USING (submitted_by = auth.uid() AND status = 'submitted')
WITH CHECK (submitted_by = auth.uid() AND status = 'submitted');

DROP POLICY IF EXISTS "Curators can review submissions" ON public.task_submissions;
CREATE POLICY "Curators can review submissions"
ON public.task_submissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'curator'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'curator'::app_role));

-- Belt and braces: clamp the reward the approval trigger can mint.
CREATE OR REPLACE FUNCTION public.award_task_submission_hearts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_hearts integer;
  v_task_title text;
BEGIN
  IF OLD.status = NEW.status OR NEW.status != 'approved' THEN
    RETURN NEW;
  END IF;

  SELECT hearts_reward, title INTO v_hearts, v_task_title
  FROM agent_garden_tasks WHERE id = NEW.task_id;

  IF v_hearts IS NULL OR v_hearts <= 0 THEN
    v_hearts := 5;
  END IF;
  v_hearts := LEAST(v_hearts, 100);

  NEW.hearts_awarded := v_hearts;
  NEW.reviewed_at := now();

  INSERT INTO heart_transactions (user_id, heart_type, amount)
  VALUES (NEW.submitted_by, 'task_completion', v_hearts);

  UPDATE agent_garden_tasks
  SET submissions_count = submissions_count + 1,
      updated_at = now()
  WHERE id = NEW.task_id;

  RETURN NEW;
END;
$function$;

-- ── Staffs: a synced Staff must belong to its creator ──
DROP POLICY IF EXISTS "Authenticated users can sync staffs" ON public.staffs;
CREATE POLICY "Authenticated users can sync staffs"
ON public.staffs FOR INSERT TO authenticated
WITH CHECK (
  owner_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'curator'::app_role)
);

DROP POLICY IF EXISTS "Owner can update their staff" ON public.staffs;
CREATE POLICY "Owner can update their staff"
ON public.staffs FOR UPDATE TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Curators can update any staff" ON public.staffs;
CREATE POLICY "Curators can update any staff"
ON public.staffs FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'curator'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'curator'::app_role));
