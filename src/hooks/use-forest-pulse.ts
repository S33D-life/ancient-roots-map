/**
 * useForestPulse — queries existing ecosystem data and computes pulse signals
 * for trees, groves, regions, and species. Cached via React Query (5 min).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  computeTreePulse,
  computeGrovePulse,
  computeRegionPulse,
  computeSpeciesPulse,
  type PulseSignal,
  type TreeActivity,
  type GroveActivity,
  type RegionActivity,
  type SpeciesActivity,
} from "@/utils/forestPulse";

export type PulseTimeRange = "24h" | "7d" | "30d" | "seasonal";

function intervalForRange(range: PulseTimeRange): string {
  switch (range) {
    case "24h": return "1 day";
    case "7d": return "7 days";
    case "30d": return "30 days";
    case "seasonal": return "90 days";
  }
}

async function fetchPulseData(range: PulseTimeRange) {
  const interval = intervalForRange(range);
  const since = new Date(Date.now() - parseDays(range) * 86400000).toISOString();

  // Fetch recent activity in parallel
  const [
    { data: recentOfferings },
    { data: recentCheckins },
    { data: recentWhispers },
    { data: recentTrees },
    { data: groves },
    { data: allTrees },
  ] = await Promise.all([
    supabase.from("offerings").select("tree_id").gte("created_at", since).limit(500),
    supabase.from("tree_checkins").select("tree_id").gte("checked_in_at", since).limit(500),
    supabase.from("tree_whispers").select("origin_tree_id").gte("created_at", since).limit(500),
    supabase.from("trees").select("id, name, species, latitude, longitude, nation, created_at").gte("created_at", since).limit(200),
    supabase.from("groves").select("id, grove_name, grove_type, center_latitude, center_longitude, radius_m, tree_count, species_common, created_at").limit(200),
    supabase.from("trees").select("id, name, species, latitude, longitude, nation").not("latitude", "is", null).limit(1000),
  ]);

  // Count activity per tree
  const treeOfferingCount = new Map<string, number>();
  const treeVisitCount = new Map<string, number>();
  const treeWhisperCount = new Map<string, number>();

  recentOfferings?.forEach(o => treeOfferingCount.set(o.tree_id, (treeOfferingCount.get(o.tree_id) || 0) + 1));
  recentCheckins?.forEach(c => treeVisitCount.set(c.tree_id, (treeVisitCount.get(c.tree_id) || 0) + 1));
  recentWhispers?.forEach(w => {
    if (w.origin_tree_id) treeWhisperCount.set(w.origin_tree_id, (treeWhisperCount.get(w.origin_tree_id) || 0) + 1);
  });

  // Tree pulses (only active trees)
  const activeTreeIds = new Set([
    ...treeOfferingCount.keys(),
    ...treeVisitCount.keys(),
    ...treeWhisperCount.keys(),
  ]);

  const treeLookup = new Map(allTrees?.map(t => [t.id, t]) || []);
  const treePulses: PulseSignal[] = [];
  
  activeTreeIds.forEach(treeId => {
    const tree = treeLookup.get(treeId);
    if (!tree || !tree.latitude || !tree.longitude) return;
    
    const activity: TreeActivity = {
      tree_id: treeId,
      name: tree.name || "Unnamed Tree",
      species: tree.species || undefined,
      lat: Number(tree.latitude),
      lng: Number(tree.longitude),
      nation: tree.nation || undefined,
      visit_count_7d: treeVisitCount.get(treeId) || 0,
      offering_count_7d: treeOfferingCount.get(treeId) || 0,
      whisper_count_7d: treeWhisperCount.get(treeId) || 0,
    };
    
    const pulse = computeTreePulse(activity);
    if (pulse.score > 0) treePulses.push(pulse);
  });

  // Grove pulses
  const grovePulses: PulseSignal[] = (groves || []).map(g => {
    // Aggregate activity for grove member trees (simplified — use grove center proximity)
    let visits = 0, offerings = 0, whispers = 0, newTrees = 0;
    
    allTrees?.forEach(t => {
      if (!t.latitude || !t.longitude) return;
      const dist = roughDistance(Number(t.latitude), Number(t.longitude), Number(g.center_latitude), Number(g.center_longitude));
      if (dist < (g.radius_m || 2000)) {
        visits += treeVisitCount.get(t.id) || 0;
        offerings += treeOfferingCount.get(t.id) || 0;
        whispers += treeWhisperCount.get(t.id) || 0;
      }
    });
    
    newTrees = recentTrees?.filter(t => {
      if (!t.latitude || !t.longitude) return false;
      return roughDistance(Number(t.latitude), Number(t.longitude), Number(g.center_latitude), Number(g.center_longitude)) < (g.radius_m || 2000);
    }).length || 0;

    const activity: GroveActivity = {
      grove_id: g.id,
      name: g.grove_name || "Unnamed Grove",
      grove_type: g.grove_type,
      center_lat: Number(g.center_latitude),
      center_lng: Number(g.center_longitude),
      radius_m: g.radius_m || 1000,
      tree_count: g.tree_count || 0,
      visit_count_7d: visits,
      offering_count_7d: offerings,
      whisper_count_7d: whispers,
      new_trees_7d: newTrees,
      species: g.species_common || undefined,
    };
    return computeGrovePulse(activity);
  }).filter(p => p.score > 0);

  // Region pulses
  const regionMap = new Map<string, RegionActivity>();
  allTrees?.forEach(t => {
    if (!t.nation) return;
    if (!regionMap.has(t.nation)) {
      regionMap.set(t.nation, {
        region: t.nation,
        center_lat: Number(t.latitude),
        center_lng: Number(t.longitude),
        tree_count: 0,
        new_trees_7d: 0,
        visit_count_7d: 0,
        offering_count_7d: 0,
        grove_count: 0,
        new_groves_7d: 0,
      });
    }
    const r = regionMap.get(t.nation)!;
    r.tree_count++;
    r.visit_count_7d += treeVisitCount.get(t.id) || 0;
    r.offering_count_7d += treeOfferingCount.get(t.id) || 0;
  });
  
  recentTrees?.forEach(t => {
    if (!t.nation) return;
    const r = regionMap.get(t.nation);
    if (r) r.new_trees_7d++;
  });
  
  groves?.forEach(g => {
    // Approximate region — find nearest nation
    const nearestTree = allTrees?.find(t => 
      t.latitude && t.longitude && 
      roughDistance(Number(t.latitude), Number(t.longitude), Number(g.center_latitude), Number(g.center_longitude)) < 50000
    );
    if (nearestTree?.nation) {
      const r = regionMap.get(nearestTree.nation);
      if (r) {
        r.grove_count++;
        if (g.created_at && new Date(g.created_at) > new Date(since)) r.new_groves_7d++;
      }
    }
  });

  const regionPulses = Array.from(regionMap.values())
    .map(computeRegionPulse)
    .filter(p => p.score > 0);

  // Species pulses
  const speciesMap = new Map<string, SpeciesActivity>();
  allTrees?.forEach(t => {
    if (!t.species || !t.latitude || !t.longitude) return;
    const key = t.species;
    if (!speciesMap.has(key)) {
      speciesMap.set(key, {
        species: key,
        tree_count: 0,
        new_trees_7d: 0,
        grove_count: 0,
        visit_count_7d: 0,
        center_lat: Number(t.latitude),
        center_lng: Number(t.longitude),
      });
    }
    const s = speciesMap.get(key)!;
    s.tree_count++;
    s.visit_count_7d += treeVisitCount.get(t.id) || 0;
  });
  
  recentTrees?.forEach(t => {
    if (!t.species) return;
    const s = speciesMap.get(t.species);
    if (s) s.new_trees_7d++;
  });

  const speciesPulses = Array.from(speciesMap.values())
    .map(computeSpeciesPulse)
    .filter(p => p.score > 0);

  return {
    trees: treePulses.sort((a, b) => b.score - a.score),
    groves: grovePulses.sort((a, b) => b.score - a.score),
    regions: regionPulses.sort((a, b) => b.score - a.score),
    species: speciesPulses.sort((a, b) => b.score - a.score),
    all: [...treePulses, ...grovePulses, ...regionPulses, ...speciesPulses].sort((a, b) => b.score - a.score),
  };
}

function parseDays(range: PulseTimeRange): number {
  switch (range) {
    case "24h": return 1;
    case "7d": return 7;
    case "30d": return 30;
    case "seasonal": return 90;
  }
}

/** Rough distance in meters using equirectangular approximation */
function roughDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180 * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
  return R * Math.sqrt(dLat * dLat + dLng * dLng);
}

export function useForestPulse(range: PulseTimeRange = "7d") {
  return useQuery({
    queryKey: ["forest-pulse", range],
    queryFn: () => fetchPulseData(range),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

/** Single tree pulse — lightweight */
export function useTreePulse(treeId: string) {
  return useQuery({
    queryKey: ["tree-pulse", treeId],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [
        { data: tree },
        { count: visits },
        { count: offerings },
        { count: whispers },
      ] = await Promise.all([
        supabase.from("trees").select("name, species, latitude, longitude, nation").eq("id", treeId).single(),
        supabase.from("tree_checkins").select("*", { count: "exact", head: true }).eq("tree_id", treeId).gte("checked_in_at", since),
        supabase.from("offerings").select("*", { count: "exact", head: true }).eq("tree_id", treeId).gte("created_at", since),
        supabase.from("tree_whispers").select("*", { count: "exact", head: true }).eq("origin_tree_id", treeId).gte("created_at", since),
      ]);
      
      if (!tree) return null;
      
      return computeTreePulse({
        tree_id: treeId,
        name: tree.name || "Tree",
        species: tree.species || undefined,
        lat: Number(tree.latitude),
        lng: Number(tree.longitude),
        nation: tree.nation || undefined,
        visit_count_7d: visits || 0,
        offering_count_7d: offerings || 0,
        whisper_count_7d: whispers || 0,
      });
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!treeId,
  });
}
