/**
 * useRoadmapPulse — fetches real-time counts for the Living Roadmap pulse layer.
 * Reuses patterns from StewardConsole queries, memoized and lightweight.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RoadmapPulse {
  // Research Bridge
  rawCandidates: number;
  promotedCandidates: number;
  duplicateCandidates: number;
  researchTreesTotal: number;
  researchTreesReady: number; // have coords + species + not converted
  convertedTrees: number;

  // Verification
  openVerifications: number;
  completedVerifications: number;

  // Wanderer / Bug Garden
  pendingFindings: number;
  recurringPatternCount: number;

  // Agent Garden
  totalContributionEvents: number;
  pendingContributions: number;

  // Sources
  crawlRuns: number;
  activeSources: number;

  // Loading
  loading: boolean;
}

const EMPTY: RoadmapPulse = {
  rawCandidates: 0, promotedCandidates: 0, duplicateCandidates: 0,
  researchTreesTotal: 0, researchTreesReady: 0, convertedTrees: 0,
  openVerifications: 0, completedVerifications: 0,
  pendingFindings: 0, recurringPatternCount: 0,
  totalContributionEvents: 0, pendingContributions: 0,
  crawlRuns: 0, activeSources: 0,
  loading: true,
};

export function useRoadmapPulse(): RoadmapPulse {
  const [data, setData] = useState<RoadmapPulse>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [
        candRes,
        rtRes,
        verifRes,
        findingsRes,
        contribRes,
        crawlRes,
        sourcesRes,
      ] = await Promise.all([
        supabase.from("source_tree_candidates").select("normalization_status"),
        supabase.from("research_trees").select("conversion_status, latitude, longitude, species_scientific"),
        supabase.from("verification_tasks").select("status"),
        supabase.from("agent_findings").select("review_status"),
        supabase.from("agent_contribution_events").select("validation_status"),
        supabase.from("dataset_crawl_runs").select("id", { count: "exact", head: true }),
        supabase.from("tree_data_sources").select("id", { count: "exact", head: true }),
      ]);

      if (cancelled) return;

      const cands = candRes.data || [];
      const rts = rtRes.data || [];
      const verifs = verifRes.data || [];
      const findings = findingsRes.data || [];
      const contribs = contribRes.data || [];

      const readyTrees = rts.filter(
        rt => rt.conversion_status !== "converted" &&
              rt.latitude != null && rt.longitude != null &&
              rt.species_scientific && rt.species_scientific !== "Unknown"
      );

      setData({
        rawCandidates: cands.filter(c => c.normalization_status === "raw").length,
        promotedCandidates: cands.filter(c => c.normalization_status === "promoted").length,
        duplicateCandidates: cands.filter(c => c.normalization_status === "duplicate").length,
        researchTreesTotal: rts.filter(rt => rt.conversion_status !== "converted").length,
        researchTreesReady: readyTrees.length,
        convertedTrees: rts.filter(rt => rt.conversion_status === "converted").length,
        openVerifications: verifs.filter(v => v.status === "open").length,
        completedVerifications: verifs.filter(v => v.status === "completed").length,
        pendingFindings: findings.filter(f => f.review_status === "pending").length,
        recurringPatternCount: 0, // derived client-side, keep lightweight
        totalContributionEvents: contribs.length,
        pendingContributions: contribs.filter(c => c.validation_status === "pending").length,
        crawlRuns: crawlRes.count ?? 0,
        activeSources: sourcesRes.count ?? 0,
        loading: false,
      });
    })();

    return () => { cancelled = true; };
  }, []);

  return data;
}

/** Per-feature pulse signal config */
export interface PulseConfig {
  featureId: string;
  primary: { label: string; count: number; route?: string } | null;
  secondary: { label: string; count: number } | null;
  needsAttention: boolean;
  invitation: string | null;
  invitationRoute: string | null;
}

export function buildPulseConfigs(pulse: RoadmapPulse): Map<string, PulseConfig> {
  const map = new Map<string, PulseConfig>();

  // Research Bridge / Map features
  map.set("map", {
    featureId: "map",
    primary: pulse.researchTreesReady > 0
      ? { label: "trees ready for promotion", count: pulse.researchTreesReady, route: "/agent-garden?tab=bridge" }
      : { label: "research trees in grove", count: pulse.researchTreesTotal },
    secondary: pulse.convertedTrees > 0 ? { label: "promoted to Ancient Friends", count: pulse.convertedTrees } : null,
    needsAttention: pulse.researchTreesReady >= 3,
    invitation: pulse.researchTreesReady > 0
      ? `${pulse.researchTreesReady} research tree${pulse.researchTreesReady !== 1 ? "s" : ""} ready for promotion`
      : null,
    invitationRoute: "/agent-garden?tab=bridge",
  });

  // Add tree / expansion
  map.set("add-tree", {
    featureId: "add-tree",
    primary: pulse.rawCandidates > 0
      ? { label: "candidates awaiting review", count: pulse.rawCandidates, route: "/agent-garden?tab=bridge" }
      : null,
    secondary: pulse.promotedCandidates > 0 ? { label: "promoted", count: pulse.promotedCandidates } : null,
    needsAttention: pulse.rawCandidates >= 5,
    invitation: pulse.rawCandidates > 0
      ? `${pulse.rawCandidates} tree candidate${pulse.rawCandidates !== 1 ? "s" : ""} awaiting review`
      : null,
    invitationRoute: "/agent-garden?tab=bridge",
  });

  // Bio-regions
  map.set("bio-regions", {
    featureId: "bio-regions",
    primary: pulse.activeSources > 0 ? { label: "active data sources", count: pulse.activeSources, route: "/tree-data-commons" } : null,
    secondary: pulse.crawlRuns > 0 ? { label: "crawl runs", count: pulse.crawlRuns } : null,
    needsAttention: false,
    invitation: null,
    invitationRoute: null,
  });

  // Global map expansion
  map.set("global-map", {
    featureId: "global-map",
    primary: pulse.researchTreesTotal > 0 ? { label: "research trees discovered", count: pulse.researchTreesTotal } : null,
    secondary: null,
    needsAttention: false,
    invitation: pulse.researchTreesTotal > 0
      ? `${pulse.researchTreesTotal} trees in the Research Forest`
      : null,
    invitationRoute: "/agent-garden?tab=bridge",
  });

  // Hearts
  map.set("hearts", {
    featureId: "hearts",
    primary: pulse.totalContributionEvents > 0
      ? { label: "contribution events", count: pulse.totalContributionEvents, route: "/agent-garden?tab=contributions" }
      : null,
    secondary: pulse.pendingContributions > 0 ? { label: "pending review", count: pulse.pendingContributions } : null,
    needsAttention: pulse.pendingContributions >= 5,
    invitation: pulse.pendingContributions > 0
      ? `${pulse.pendingContributions} contribution${pulse.pendingContributions !== 1 ? "s" : ""} pending review`
      : null,
    invitationRoute: "/agent-garden?tab=contributions",
  });

  // Offerings — verification tasks as a proxy
  map.set("offerings", {
    featureId: "offerings",
    primary: pulse.openVerifications > 0
      ? { label: "verification missions open", count: pulse.openVerifications, route: "/agent-garden?tab=bridge" }
      : null,
    secondary: pulse.completedVerifications > 0 ? { label: "completed", count: pulse.completedVerifications } : null,
    needsAttention: pulse.openVerifications >= 3,
    invitation: pulse.openVerifications > 0
      ? `${pulse.openVerifications} tree${pulse.openVerifications !== 1 ? "s" : ""} awaiting verification`
      : null,
    invitationRoute: "/agent-garden?tab=bridge",
  });

  // Library — pending findings as dev room signal
  map.set("library", {
    featureId: "library",
    primary: pulse.pendingFindings > 0
      ? { label: "findings pending review", count: pulse.pendingFindings, route: "/agent-garden?tab=wanderers" }
      : null,
    secondary: null,
    needsAttention: pulse.pendingFindings >= 5,
    invitation: pulse.pendingFindings > 0
      ? `${pulse.pendingFindings} finding${pulse.pendingFindings !== 1 ? "s" : ""} need tending`
      : null,
    invitationRoute: "/agent-garden?tab=wanderers",
  });

  return map;
}
