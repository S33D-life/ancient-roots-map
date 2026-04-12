-- Allow heart_transactions without a tree (e.g. patron_claim, task_completion)
ALTER TABLE public.heart_transactions ALTER COLUMN tree_id DROP NOT NULL;

-- Same for species_heart_transactions (patron species bonus has no tree)
ALTER TABLE public.species_heart_transactions ALTER COLUMN tree_id DROP NOT NULL;