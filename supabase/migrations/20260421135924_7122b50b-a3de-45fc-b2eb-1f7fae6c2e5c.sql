-- Add updated_at column to offerings + auto-touch trigger.
ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill any existing rows so updated_at >= created_at
UPDATE public.offerings
SET updated_at = created_at
WHERE updated_at < created_at;

-- Auto-touch updated_at on row UPDATE
DO $$ BEGIN
  CREATE TRIGGER trg_offerings_set_updated_at
    BEFORE UPDATE ON public.offerings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;