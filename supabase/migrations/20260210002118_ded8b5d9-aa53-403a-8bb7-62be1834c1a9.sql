
-- Add sealed_by_staff column to track which staff identity sealed each offering
ALTER TABLE public.offerings
ADD COLUMN sealed_by_staff text;

-- Add an index for filtering by staff
CREATE INDEX idx_offerings_sealed_by_staff ON public.offerings (sealed_by_staff);
