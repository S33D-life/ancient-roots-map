import { supabase } from "@/integrations/supabase/client";
import type { AppearanceReader } from "./councilAppearance";

/** Same exact key/family relationships as existing S33D records, SELECT only.
 * maybeSingle rejects ambiguous matches; no fuzzy matching or synthetic Hive.
 */
export const councilAppearanceReader: AppearanceReader = {
  tree: async id => await supabase.from("trees")
    .select("id, name, species_key").eq("id", id).maybeSingle(),
  species: async key => await supabase.from("species_index")
    .select("id, species_key, slug, scientific_name, family").eq("species_key", key).maybeSingle(),
  hive: async family => await supabase.from("species_hives")
    .select("id, slug, display_name, family_name").eq("family_name", family).maybeSingle(),
};
