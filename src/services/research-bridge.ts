/**
 * Research Bridge — service layer for the crawl → candidate → research tree → Ancient Friend pipeline.
 * Handles normalization, dedup scoring, promotion, and verification task generation.
 */
import { supabase } from "@/integrations/supabase/client";
import { haversineKm, buildTreeInsertPayload } from "@/utils/researchConversion";
import type { Database } from "@/integrations/supabase/types";

type ResearchTreeRow = Database["public"]["Tables"]["research_trees"]["Row"];
type SourceCandidate = Database["public"]["Tables"]["source_tree_candidates"]["Row"];
type CrawlRun = Database["public"]["Tables"]["dataset_crawl_runs"]["Row"];
type VerificationTask = Database["public"]["Tables"]["verification_tasks"]["Row"];

/* ══════════════════════════════════════════════════════════
   CANDIDATE → RESEARCH TREE NORMALIZATION
   ══════════════════════════════════════════════════════════ */

export interface NormalizedCandidate {
  tree_name: string | null;
  species_scientific: string;
  species_common: string | null;
  latitude: number | null;
  longitude: number | null;
  country: string;
  province: string | null;
  locality_text: string;
  description: string | null;
  source_doc_title: string;
  source_doc_url: string;
  source_doc_year: number;
  source_program: string;
  source_row_ref: string | null;
  dataset_id: string | null;
  confidence_score: number;
  submitted_by_agent_id: string | null;
}

/** Normalize a raw candidate into research_trees field shape */
export function normalizeCandidate(candidate: SourceCandidate, sourceName: string, sourceUrl: string): NormalizedCandidate {
  const raw = candidate.raw_data as Record<string, any> || {};

  return {
    tree_name: candidate.raw_name || raw.name || null,
    species_scientific: candidate.raw_species || raw.species_scientific || raw.species || "Unknown",
    species_common: raw.species_common || raw.common_name || null,
    latitude: candidate.raw_latitude || null,
    longitude: candidate.raw_longitude || null,
    country: candidate.raw_country || raw.country || "Unknown",
    province: raw.province || raw.state || raw.region || null,
    locality_text: candidate.raw_location_text || raw.location || raw.locality || "Location from dataset",
    description: raw.description || raw.notes || null,
    source_doc_title: sourceName,
    source_doc_url: sourceUrl,
    source_doc_year: raw.year || new Date().getFullYear(),
    source_program: raw.program || "AI-Discovered",
    source_row_ref: raw.row_ref || candidate.id,
    dataset_id: null,
    confidence_score: Number(candidate.confidence_score) || 0,
    submitted_by_agent_id: null,
  };
}

/* ══════════════════════════════════════════════════════════
   DUPLICATE DETECTION
   ══════════════════════════════════════════════════════════ */

export interface DuplicateMatch {
  id: string;
  name: string | null;
  species: string;
  distance_km: number;
  score: number; // 0–100 similarity
  source: "research_tree" | "ancient_friend";
}

/** Check for likely duplicates in both research_trees and trees */
export async function findDuplicates(
  lat: number | null,
  lng: number | null,
  species: string,
  name: string | null,
  radiusKm = 0.5,
): Promise<DuplicateMatch[]> {
  if (!lat || !lng) return [];

  const matches: DuplicateMatch[] = [];

  // Check research_trees
  const { data: researchTrees } = await supabase
    .from("research_trees")
    .select("id, tree_name, species_scientific, species_common, latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (researchTrees) {
    for (const rt of researchTrees) {
      if (!rt.latitude || !rt.longitude) continue;
      const dist = haversineKm(lat, lng, rt.latitude, rt.longitude);
      if (dist > radiusKm) continue;

      const speciesMatch = species.toLowerCase() === rt.species_scientific?.toLowerCase() ||
        species.toLowerCase() === rt.species_common?.toLowerCase();
      const nameMatch = name && rt.tree_name &&
        name.toLowerCase().includes(rt.tree_name.toLowerCase());

      const score = Math.round(
        (dist < 0.05 ? 40 : dist < 0.1 ? 30 : 20) +
        (speciesMatch ? 40 : 0) +
        (nameMatch ? 20 : 0)
      );

      if (score >= 30) {
        matches.push({
          id: rt.id,
          name: rt.tree_name,
          species: rt.species_scientific,
          distance_km: dist,
          score,
          source: "research_tree",
        });
      }
    }
  }

  // Check confirmed trees
  const { data: trees } = await supabase
    .from("trees")
    .select("id, name, species, latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (trees) {
    for (const t of trees) {
      if (!t.latitude || !t.longitude) continue;
      const dist = haversineKm(lat, lng, t.latitude, t.longitude);
      if (dist > radiusKm) continue;

      const speciesMatch = species.toLowerCase() === t.species?.toLowerCase();
      const nameMatch = name && t.name &&
        name.toLowerCase().includes(t.name.toLowerCase());

      const score = Math.round(
        (dist < 0.05 ? 40 : dist < 0.1 ? 30 : 20) +
        (speciesMatch ? 40 : 0) +
        (nameMatch ? 20 : 0)
      );

      if (score >= 30) {
        matches.push({
          id: t.id,
          name: t.name,
          species: t.species || "Unknown",
          distance_km: dist,
          score,
          source: "ancient_friend",
        });
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

/* ══════════════════════════════════════════════════════════
   PROMOTION: CANDIDATE → RESEARCH TREE
   ══════════════════════════════════════════════════════════ */

export async function promoteCandidateToResearch(
  candidateId: string,
  sourceId: string,
): Promise<{ researchTreeId: string | null; error: string | null }> {
  // Fetch candidate + source
  const [candRes, srcRes] = await Promise.all([
    supabase.from("source_tree_candidates").select("*").eq("id", candidateId).single(),
    supabase.from("tree_data_sources").select("name, url").eq("id", sourceId).single(),
  ]);

  if (!candRes.data || !srcRes.data) {
    return { researchTreeId: null, error: "Candidate or source not found" };
  }

  const candidate = candRes.data;
  const normalized = normalizeCandidate(candidate, srcRes.data.name, srcRes.data.url || "");

  // Insert into research_trees
  const { data: rt, error: rtErr } = await supabase
    .from("research_trees")
    .insert({
      ...normalized,
      status: "pending",
      record_status: "active",
      record_kind: "individual",
      designation_type: "Notable Tree",
      geo_precision: normalized.latitude ? "approximate" : "unknown",
      conversion_status: "research_only",
    })
    .select("id")
    .single();

  if (rtErr || !rt) {
    return { researchTreeId: null, error: rtErr?.message || "Insert failed" };
  }

  // Update candidate status
  await supabase.from("source_tree_candidates").update({
    normalization_status: "promoted",
    promoted_research_tree_id: rt.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", candidateId);

  return { researchTreeId: rt.id, error: null };
}

/* ══════════════════════════════════════════════════════════
   PROMOTION: RESEARCH TREE → ANCIENT FRIEND
   ══════════════════════════════════════════════════════════ */

export async function promoteResearchToAncientFriend(
  researchTreeId: string,
  userId: string,
): Promise<{ treeId: string | null; error: string | null }> {
  const { data: rt } = await supabase
    .from("research_trees")
    .select("*")
    .eq("id", researchTreeId)
    .single();

  if (!rt) return { treeId: null, error: "Research tree not found" };

  // Must have coordinates
  if (!rt.latitude || !rt.longitude) {
    return { treeId: null, error: "Cannot promote without confirmed coordinates" };
  }

  // Must have species
  if (!rt.species_scientific || rt.species_scientific === "Unknown") {
    return { treeId: null, error: "Cannot promote without confirmed species" };
  }

  const payload = buildTreeInsertPayload(rt as ResearchTreeRow);

  const { data: tree, error: insertErr } = await supabase
    .from("trees")
    .insert(payload)
    .select("id")
    .single();

  if (insertErr || !tree) {
    return { treeId: null, error: insertErr?.message || "Tree insert failed" };
  }

  // Update research tree to mark conversion
  await supabase.from("research_trees").update({
    conversion_status: "converted",
    converted_tree_id: tree.id,
    converted_at: new Date().toISOString(),
    converted_by: userId,
    status: "verified",
  }).eq("id", researchTreeId);

  return { treeId: tree.id, error: null };
}

/* ══════════════════════════════════════════════════════════
   VERIFICATION TASK GENERATION
   ══════════════════════════════════════════════════════════ */

const VERIFICATION_TYPES = [
  { type: "confirm_location", title: "Confirm tree location", desc: "Visit or verify this tree's GPS coordinates are accurate.", hearts: 10 },
  { type: "confirm_species", title: "Confirm species identification", desc: "Verify the species identification matches the physical tree.", hearts: 8 },
  { type: "add_photo", title: "Add a photograph", desc: "Take and upload a clear photo of this tree.", hearts: 5 },
  { type: "visit_in_person", title: "Visit in person", desc: "Make a physical visit and confirm this tree exists at the recorded location.", hearts: 15 },
] as const;

export async function generateVerificationTasks(
  researchTreeId: string,
  createdBy: string,
): Promise<{ count: number; error: string | null }> {
  const { data: rt } = await supabase
    .from("research_trees")
    .select("id, tree_name, species_scientific, latitude, longitude, geo_precision")
    .eq("id", researchTreeId)
    .single();

  if (!rt) return { count: 0, error: "Research tree not found" };

  // Determine which tasks to create
  const tasks: Array<{ research_tree_id: string; task_type: string; title: string; description: string; hearts_reward: number; created_by: string }> = [];

  // Always create visit task
  for (const vt of VERIFICATION_TYPES) {
    // Skip location confirm if already exact
    if (vt.type === "confirm_location" && rt.geo_precision === "exact") continue;

    tasks.push({
      research_tree_id: researchTreeId,
      task_type: vt.type,
      title: `${vt.title}: ${rt.tree_name || rt.species_scientific}`,
      description: vt.desc,
      hearts_reward: vt.hearts,
      created_by: createdBy,
    });
  }

  if (tasks.length === 0) return { count: 0, error: null };

  const { error } = await supabase.from("verification_tasks").insert(tasks);
  return { count: tasks.length, error: error?.message || null };
}

/* ══════════════════════════════════════════════════════════
   PIPELINE STATS
   ══════════════════════════════════════════════════════════ */

export interface PipelineStats {
  totalCrawlRuns: number;
  activeCrawls: number;
  totalCandidates: number;
  rawCandidates: number;
  promotedCandidates: number;
  rejectedCandidates: number;
  openVerificationTasks: number;
  completedVerificationTasks: number;
}

export async function fetchPipelineStats(): Promise<PipelineStats> {
  const [crawlRes, candRes, verRes] = await Promise.all([
    supabase.from("dataset_crawl_runs").select("status"),
    supabase.from("source_tree_candidates").select("normalization_status"),
    supabase.from("verification_tasks").select("status"),
  ]);

  const crawls = crawlRes.data || [];
  const candidates = candRes.data || [];
  const tasks = verRes.data || [];

  return {
    totalCrawlRuns: crawls.length,
    activeCrawls: crawls.filter(c => c.status === "running").length,
    totalCandidates: candidates.length,
    rawCandidates: candidates.filter(c => c.normalization_status === "raw").length,
    promotedCandidates: candidates.filter(c => c.normalization_status === "promoted").length,
    rejectedCandidates: candidates.filter(c => c.normalization_status === "rejected").length,
    openVerificationTasks: tasks.filter(t => t.status === "open").length,
    completedVerificationTasks: tasks.filter(t => t.status === "completed").length,
  };
}

/* ══════════════════════════════════════════════════════════
   SOURCE PIPELINE STATS (per source)
   ══════════════════════════════════════════════════════════ */

export interface SourcePipelineInfo {
  sourceId: string;
  crawlRunCount: number;
  latestCrawlStatus: string | null;
  candidateCount: number;
  promotedCount: number;
  researchTreeCount: number;
}

export async function fetchSourcePipelineInfo(sourceId: string): Promise<SourcePipelineInfo> {
  const [crawlRes, candRes, rtRes] = await Promise.all([
    supabase.from("dataset_crawl_runs").select("status").eq("source_id", sourceId).order("created_at", { ascending: false }),
    supabase.from("source_tree_candidates").select("normalization_status").eq("source_id", sourceId),
    supabase.from("research_trees").select("id").eq("source_program", sourceId), // approximation
  ]);

  const crawls = crawlRes.data || [];
  const candidates = candRes.data || [];

  return {
    sourceId,
    crawlRunCount: crawls.length,
    latestCrawlStatus: crawls[0]?.status || null,
    candidateCount: candidates.length,
    promotedCount: candidates.filter(c => c.normalization_status === "promoted").length,
    researchTreeCount: rtRes.data?.length || 0,
  };
}
