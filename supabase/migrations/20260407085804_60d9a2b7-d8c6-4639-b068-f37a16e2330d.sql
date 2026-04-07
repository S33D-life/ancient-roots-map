CREATE OR REPLACE FUNCTION public.enforce_daily_heart_cap()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_daily_total integer;
BEGIN
  -- Skip system/reward types that should not count toward daily cap
  IF NEW.heart_type IN (
    'windfall', 'windfall_pending', 'tree', 'bug_report',
    'patron_claim', 'task_completion', 'canopy_bonus'
  ) THEN
    RETURN NEW;
  END IF;
  
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM heart_transactions
  WHERE user_id = NEW.user_id
    AND amount > 0
    AND created_at::date = CURRENT_DATE;

  IF v_daily_total + NEW.amount > 100 THEN
    RAISE EXCEPTION 'Daily heart earning cap reached (100 hearts/day)';
  END IF;

  RETURN NEW;
END;
$function$;