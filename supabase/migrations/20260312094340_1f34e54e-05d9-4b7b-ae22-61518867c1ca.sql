-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit support signups" ON public.support_signups;

-- Re-create with input validation in policy
CREATE POLICY "Anyone can submit support signups"
ON public.support_signups FOR INSERT
WITH CHECK (
  length(trim(name)) > 0
  AND length(name) <= 200
  AND (email IS NULL OR length(email) <= 320)
  AND (message IS NULL OR length(message) <= 5000)
  AND (telegram_handle IS NULL OR length(telegram_handle) <= 100)
);

-- Add a validation trigger for additional safety
CREATE OR REPLACE FUNCTION public.validate_support_signup()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.name IS NULL OR length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Name too long (max 200 chars)';
  END IF;
  IF NEW.email IS NOT NULL AND length(NEW.email) > 320 THEN
    RAISE EXCEPTION 'Email too long';
  END IF;
  IF NEW.message IS NOT NULL AND length(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'Message too long (max 5000 chars)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_support_signup ON public.support_signups;
CREATE TRIGGER trg_validate_support_signup
  BEFORE INSERT ON public.support_signups
  FOR EACH ROW EXECUTE FUNCTION public.validate_support_signup();