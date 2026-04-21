-- Pin search_path on the two new Treeasurus helper functions
ALTER FUNCTION public.species_make_slug(TEXT) SET search_path = public;
ALTER FUNCTION public.species_index_set_slug() SET search_path = public;