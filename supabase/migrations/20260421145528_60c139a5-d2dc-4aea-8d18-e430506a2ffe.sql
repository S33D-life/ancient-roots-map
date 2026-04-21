-- Step 1 of 2: add the new species_steward role in its own transaction
-- so it can be referenced by RLS policies in the next migration.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'species_steward';