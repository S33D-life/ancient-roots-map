/**
 * treeRepository — Typed data-access layer for tree records.
 *
 * Centralises common tree queries that were previously duplicated across
 * components and hooks. All methods return typed results and handle errors
 * consistently. This is the first repository in the codebase — it
 * establishes a pattern for future services (offerings, rewards, agents).
 */
import { supabase } from "@/integrations/supabase/client";

/* ── Shared types ── */

export interface TreeSummary {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  nation: string | null;
  estimated_age: number | null;
  what3words: string;
  created_by: string | null;
}

export interface TreeDetail extends TreeSummary {
  description: string | null;
  heritage_status: string | null;
  girth_cm: number | null;
  height_m: number | null;
  lineage: string | null;
  project_name: string | null;
  source: string | null;
  created_at: string;
}

/* ── Column projections (single source of truth) ── */

const SUMMARY_COLUMNS =
  "id,name,species,latitude,longitude,nation,estimated_age,what3words,created_by" as const;

const DETAIL_COLUMNS =
  "id,name,species,latitude,longitude,nation,estimated_age,what3words,created_by,description,heritage_status,girth_cm,height_m,lineage,project_name,source,created_at" as const;

/* ── Repository ── */

export const treeRepository = {
  /**
   * Fetch a single tree by ID with full detail.
   */
  async getById(treeId: string): Promise<TreeDetail | null> {
    const { data, error } = await supabase
      .from("trees")
      .select(DETAIL_COLUMNS)
      .eq("id", treeId)
      .single();

    if (error || !data) return null;
    return data as unknown as TreeDetail;
  },

  /**
   * Fetch trees by nation (country slug / name).
   * Returns summaries only — for map and list views.
   */
  async getByNation(nation: string, limit = 500): Promise<TreeSummary[]> {
    const { data, error } = await supabase
      .from("trees")
      .select(SUMMARY_COLUMNS)
      .ilike("nation", nation)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(limit);

    if (error) {
      console.error("[treeRepository] getByNation error:", error.message);
      return [];
    }
    return (data ?? []) as unknown as TreeSummary[];
  },

  /**
   * Fetch trees by species (case-insensitive partial match).
   */
  async getBySpecies(species: string, limit = 200): Promise<TreeSummary[]> {
    const { data, error } = await supabase
      .from("trees")
      .select(SUMMARY_COLUMNS)
      .ilike("species", `%${species}%`)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(limit);

    if (error) {
      console.error("[treeRepository] getBySpecies error:", error.message);
      return [];
    }
    return (data ?? []) as unknown as TreeSummary[];
  },

  /**
   * Fetch trees created by a specific user.
   */
  async getByUser(userId: string, limit = 200): Promise<TreeSummary[]> {
    const { data, error } = await supabase
      .from("trees")
      .select(SUMMARY_COLUMNS)
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[treeRepository] getByUser error:", error.message);
      return [];
    }
    return (data ?? []) as unknown as TreeSummary[];
  },

  /**
   * Count trees, optionally filtered by nation.
   */
  async count(nation?: string): Promise<number> {
    let query = supabase
      .from("trees")
      .select("id", { count: "exact", head: true });

    if (nation) query = query.ilike("nation", nation);

    const { count, error } = await query;
    if (error) {
      console.error("[treeRepository] count error:", error.message);
      return 0;
    }
    return count ?? 0;
  },

  /**
   * Fetch recent trees (newest first).
   */
  async getRecent(limit = 20): Promise<TreeSummary[]> {
    const { data, error } = await supabase
      .from("trees")
      .select(SUMMARY_COLUMNS)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[treeRepository] getRecent error:", error.message);
      return [];
    }
    return (data ?? []) as unknown as TreeSummary[];
  },
};
