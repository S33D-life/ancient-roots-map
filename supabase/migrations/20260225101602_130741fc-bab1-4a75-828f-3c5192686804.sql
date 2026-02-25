ALTER TABLE public.research_trees DROP CONSTRAINT research_trees_designation_type_check;
ALTER TABLE public.research_trees ADD CONSTRAINT research_trees_designation_type_check 
  CHECK (designation_type = ANY (ARRAY['Champion Tree', 'Protected Tree Species Context', 'Street Tree', 'Heritage Tree', 'Notable Tree', 'Natural Monument']));