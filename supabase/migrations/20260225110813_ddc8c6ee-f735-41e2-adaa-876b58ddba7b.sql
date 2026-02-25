
ALTER TABLE research_trees DROP CONSTRAINT IF EXISTS research_trees_status_check;
ALTER TABLE research_trees ADD CONSTRAINT research_trees_status_check
CHECK (status = ANY (ARRAY['research', 'verified_linked', 'featured', 'candidate', 'verified']));
