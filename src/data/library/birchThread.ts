/** Review projection only. Not a Circle runtime manifest or a canonical Library edition. */
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/routes";
import { contextualReturnTarget, type ContextualAppearance, type ReturnContext } from "@/lib/library/contextualReturn";
import { sameIdentity, type IdentityRef, type IdentitySources } from "@/lib/library/recordIdentity";
import { isQaSeedTree } from "@/lib/library/relatedTrees";

export const BIRCH_REVIEW_ENABLED = import.meta.env.DEV || import.meta.env.VITE_BIRCH_REVIEW === "true";
export const BIRCH_REF = { source: "notion", id: "3f315b58-480d-814c-a056-cb6c7b4f7f33" } as const satisfies IdentityRef;
export const SILVER_BIRCH_REF = { source: "species-index", id: "496f464d-7f8e-4501-8313-f638a8498550", speciesKey: "betula-pendula" } as const satisfies IdentityRef;
export const BIRCH_PREPARATION_SOURCE = "https://app.notion.com/p/3f315b58480d81df9016f42bb3d803ef";
export const BIRCH_SEED_SOURCE = "https://app.notion.com/p/3f315b58480d814ca056cb6c7b4f7f33";
export const BIRCH_ARTIFACT = "/review-artifacts/birch-presence.svg";
export const THREAD_PATTERNS = { CIRCLE: "/review/council/:circleNumber", IDENTITY: "/review/library/:source/:id" };
export const THREAD_ROUTES = {
  circle: (number: number) => `/review/council/${number}`,
  identity: (ref: IdentityRef) => `/review/library/${encodeURIComponent(ref.source)}/${encodeURIComponent(ref.id)}`,
};

export function birchAppearance(mode: "2d" | "spatial"): ContextualAppearance {
  return {
    id: "birch-companion", contextId: "council-of-life/circle-236", identity: BIRCH_REF,
    contextNote: "Birch is a confirmed companion in Circle 236 preparation.", artifactRef: BIRCH_ARTIFACT,
    returnContext: { route: "council", realm: "canopy", contextId: "council-of-life/circle-236", appearanceId: "birch-companion", mode, focusTarget: "birch-companion" },
  };
}

/** Fixed, reviewed projection of the existing source reference. No Notion draft prose copied. */
export const birchThreadSources: IdentitySources = {
  notion: async ref => BIRCH_REVIEW_ENABLED && sameIdentity(ref, BIRCH_REF)
    ? { ref: BIRCH_REF, scope: "genus", label: "Birch", scientificName: "Betula" } : null,
  "species-index": async ref => {
    if (ref.source !== "species-index") return null;
    const { data, error } = await supabase.from("species_index")
      .select("id,species_key,scientific_name,common_name,rank,genus")
      .eq("id", ref.id).eq("species_key", ref.speciesKey).maybeSingle();
    if (error) throw error;
    if (!data || data.id !== ref.id || data.rank !== "species" || data.species_key !== ref.speciesKey || data.genus !== "Betula") return null;
    return { ref, scope: "species", label: data.common_name, scientificName: data.scientific_name ?? undefined };
  },
  trees: async ref => {
    if (ref.source !== "trees") return null;
    const tree = await publicThreadTree(ref.id);
    return tree ? { ref, scope: "individual", label: tree.name } : null;
  },
};

/** Existing anonymous RLS plus explicit public-access projection; no promotion or writes. */
export async function publicThreadTree(id: string) {
  const { data, error } = await supabase.from("trees")
    .select("id,name,species_key,latitude,longitude,nation,what3words,accessibility_tier,access_notes")
    .eq("id", id).eq("accessibility_tier", "public").maybeSingle();
  if (error) throw error;
  return data && data.id === id && data.species_key === SILVER_BIRCH_REF.speciesKey && !isQaSeedTree(data) ? data : null;
}

export async function publicBirchRecords() {
  const { data, error } = await supabase.from("trees")
    .select("id,name,species_key,what3words")
    .eq("species_key", SILVER_BIRCH_REF.speciesKey).eq("accessibility_tier", "public").limit(24);
  if (error) throw error;
  return (data ?? []).filter(tree => !isQaSeedTree(tree));
}

/** Known review route binding after the foundation validates the appearance; never a supplied URL. */
export function threadReturn(context: ReturnContext | null) {
  const target = contextualReturnTarget(context, {
    treeAvailable: () => false,
    councilAppearance: (contextId, appearanceId) => {
      if (!BIRCH_REVIEW_ENABLED || context?.route !== "council" || contextId !== "council-of-life/circle-236" || appearanceId !== "birch-companion") return null;
      return birchAppearance(context.mode);
    },
  });
  if (!target.state) return { pathname: ROUTES.LIBRARY, search: "", state: undefined };
  const mode = target.state.libraryReturn.mode;
  return { pathname: THREAD_ROUTES.circle(236), search: `?mode=${mode}&returned=1`, state: target.state };
}
