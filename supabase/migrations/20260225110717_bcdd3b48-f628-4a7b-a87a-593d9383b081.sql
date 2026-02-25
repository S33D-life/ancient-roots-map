
ALTER TABLE research_trees DROP CONSTRAINT IF EXISTS research_trees_designation_type_check;
ALTER TABLE research_trees ADD CONSTRAINT research_trees_designation_type_check
CHECK (designation_type = ANY (ARRAY[
  'Champion Tree', 'Heritage Tree', 'Ancient Tree', 'Monumental Tree', 'Iconic Tree',
  'Tallest Tree', 'Ecological Tree', 'Street Tree'
]));
