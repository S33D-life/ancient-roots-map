
-- Trigger: auto-award hearts when a task submission is approved
CREATE OR REPLACE FUNCTION public.award_task_submission_hearts()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_hearts integer;
  v_task_title text;
BEGIN
  -- Only fire when status changes to 'approved'
  IF OLD.status = NEW.status OR NEW.status != 'approved' THEN
    RETURN NEW;
  END IF;

  -- Get reward amount from the task
  SELECT hearts_reward, title INTO v_hearts, v_task_title
  FROM agent_garden_tasks WHERE id = NEW.task_id;

  IF v_hearts IS NULL OR v_hearts <= 0 THEN
    v_hearts := 5; -- fallback
  END IF;

  -- Set hearts on the submission
  NEW.hearts_awarded := v_hearts;
  NEW.reviewed_at := now();

  -- Insert heart transaction for the contributor
  INSERT INTO heart_transactions (user_id, heart_type, amount)
  VALUES (NEW.submitted_by, 'task_completion', v_hearts);

  -- Update task submissions count
  UPDATE agent_garden_tasks
  SET submissions_count = submissions_count + 1,
      updated_at = now()
  WHERE id = NEW.task_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_task_submission_hearts
  BEFORE UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_task_submission_hearts();

-- Enable realtime for task_submissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_submissions;
