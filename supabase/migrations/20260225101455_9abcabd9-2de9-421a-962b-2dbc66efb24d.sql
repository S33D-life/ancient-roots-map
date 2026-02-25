CREATE UNIQUE INDEX IF NOT EXISTS research_trees_source_unique 
ON public.research_trees (source_row_ref, source_program) 
WHERE source_row_ref IS NOT NULL;