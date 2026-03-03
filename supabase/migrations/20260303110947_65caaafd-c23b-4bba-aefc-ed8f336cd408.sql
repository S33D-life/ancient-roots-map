
-- Add lore and identity fields to trees table
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS lore_text text;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS elemental_signature text[];
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS archetype text;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS seasonal_tone text;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS radio_theme text;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS is_anchor_node boolean DEFAULT false;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS wish_tags text[];

COMMENT ON COLUMN public.trees.lore_text IS 'Poetic/grounded lore text for the tree';
COMMENT ON COLUMN public.trees.elemental_signature IS 'Array of elemental affinities e.g. Water, Earth, Heartwood';
COMMENT ON COLUMN public.trees.archetype IS 'Tree archetype e.g. The Gathering Mother';
COMMENT ON COLUMN public.trees.seasonal_tone IS 'Seasonal description e.g. Summer canopy expansion';
COMMENT ON COLUMN public.trees.radio_theme IS 'Name of the tree radio channel theme';
COMMENT ON COLUMN public.trees.is_anchor_node IS 'Whether this tree is a Wishing Tree Anchor Node';
COMMENT ON COLUMN public.trees.wish_tags IS 'Default wish tags for this tree e.g. Healing, Unity';
