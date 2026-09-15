
CREATE OR REPLACE FUNCTION public.is_untrusted_heart_writer()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$ SELECT current_user IN ('authenticated', 'anon') $$;

REVOKE EXECUTE ON FUNCTION public.is_untrusted_heart_writer() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_heart_transaction_authority() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_heart_ledger_authority() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_fractal_token_authority() FROM anon, authenticated, PUBLIC;
