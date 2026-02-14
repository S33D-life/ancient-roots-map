
-- Add girth measurement to trees (in centimeters for precision)
ALTER TABLE public.trees
ADD COLUMN girth_cm integer DEFAULT NULL;

-- Add an index for girth-based filtering
CREATE INDEX idx_trees_girth_cm ON public.trees (girth_cm) WHERE girth_cm IS NOT NULL;

-- Add an index for estimated_age filtering (not yet indexed)
CREATE INDEX idx_trees_estimated_age ON public.trees (estimated_age) WHERE estimated_age IS NOT NULL;
