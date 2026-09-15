
REVOKE EXECUTE ON FUNCTION public.join_life_grove_with_token(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_grove_steward(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_grove_steward(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.tend_grove_field(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_grove_rooted_tree(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_grove_proposal(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_life_grove_contributors(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_grove_primary_steward(uuid, uuid) FROM anon;
