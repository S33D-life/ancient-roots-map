-- Tree age refinement: support both estimate (range + confidence) and known/exact age + source
ALTER TABLE public.trees
  ADD COLUMN IF NOT EXISTS age_min INTEGER,
  ADD COLUMN IF NOT EXISTS age_max INTEGER,
  ADD COLUMN IF NOT EXISTS age_confidence TEXT,
  ADD COLUMN IF NOT EXISTS age_exact INTEGER,
  ADD COLUMN IF NOT EXISTS age_source TEXT;

-- Constrain confidence to the 3-tier set (allow NULL for legacy rows)
ALTER TABLE public.trees
  DROP CONSTRAINT IF EXISTS trees_age_confidence_check;
ALTER TABLE public.trees
  ADD CONSTRAINT trees_age_confidence_check
  CHECK (age_confidence IS NULL OR age_confidence IN ('guess', 'informed', 'verified'));

-- Sanity bounds (guard against typos / negatives)
ALTER TABLE public.trees
  DROP CONSTRAINT IF EXISTS trees_age_min_bounds_check;
ALTER TABLE public.trees
  ADD CONSTRAINT trees_age_min_bounds_check
  CHECK (age_min IS NULL OR (age_min >= 0 AND age_min <= 10000));

ALTER TABLE public.trees
  DROP CONSTRAINT IF EXISTS trees_age_max_bounds_check;
ALTER TABLE public.trees
  ADD CONSTRAINT trees_age_max_bounds_check
  CHECK (age_max IS NULL OR (age_max >= 0 AND age_max <= 10000));

ALTER TABLE public.trees
  DROP CONSTRAINT IF EXISTS trees_age_exact_bounds_check;
ALTER TABLE public.trees
  ADD CONSTRAINT trees_age_exact_bounds_check
  CHECK (age_exact IS NULL OR (age_exact >= 0 AND age_exact <= 10000));

-- If a range is provided, min must not exceed max
ALTER TABLE public.trees
  DROP CONSTRAINT IF EXISTS trees_age_range_order_check;
ALTER TABLE public.trees
  ADD CONSTRAINT trees_age_range_order_check
  CHECK (age_min IS NULL OR age_max IS NULL OR age_min <= age_max);

COMMENT ON COLUMN public.trees.age_min IS 'Lower bound of estimated age range (years).';
COMMENT ON COLUMN public.trees.age_max IS 'Upper bound of estimated age range (years).';
COMMENT ON COLUMN public.trees.age_confidence IS 'guess | informed | verified — auto-set to verified when age_exact is present.';
COMMENT ON COLUMN public.trees.age_exact IS 'Known exact age in years, when documented (plaque, records, research).';
COMMENT ON COLUMN public.trees.age_source IS 'Optional free-text source for an exact age (e.g. plaque, local records).';