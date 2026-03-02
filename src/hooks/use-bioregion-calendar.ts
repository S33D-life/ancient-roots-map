/**
 * useBioregionCalendar — Fetches bioregion data, seasonal markers,
 * seed windows, and linked trees for calendar display.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BioregionData {
  id: string;
  name: string;
  type: string;
  countries: string[];
  climate_band: string | null;
  elevation_range: string | null;
  dominant_species: string[];
  biome_description: string | null;
  center_lat: number | null;
  center_lon: number | null;
  hemisphere: string;
  short_description: string | null;
  flagship_species_keys: string[];
}

export interface SeasonalMarker {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  typical_month_start: number;
  typical_month_end: number;
  marker_type: string;
  species_keys: string[];
  elevation_band: string | null;
  confidence: string;
  sort_order: number;
}

export interface SeedWindow {
  id: string;
  species_key: string;
  species_name: string;
  sow_month_start: number | null;
  sow_month_end: number | null;
  harvest_month_start: number | null;
  harvest_month_end: number | null;
  dormant_month_start: number | null;
  dormant_month_end: number | null;
  notes: string | null;
}

export interface LinkedTree {
  id: string;
  name: string;
  species: string | null;
  latitude: number | null;
  longitude: number | null;
  nation: string | null;
}

export function useBioregionCalendar(bioregionId: string | undefined) {
  const [region, setRegion] = useState<BioregionData | null>(null);
  const [markers, setMarkers] = useState<SeasonalMarker[]>([]);
  const [seedWindows, setSeedWindows] = useState<SeedWindow[]>([]);
  const [linkedTrees, setLinkedTrees] = useState<LinkedTree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bioregionId) return;
    const load = async () => {
      setLoading(true);

      const [regionRes, markersRes, seedsRes, treeLinkRes] = await Promise.all([
        supabase.from("bio_regions").select("*").eq("id", bioregionId).maybeSingle(),
        supabase.from("bioregion_seasonal_markers").select("*").eq("bioregion_id", bioregionId).order("sort_order"),
        supabase.from("bioregion_seed_windows").select("*").eq("bioregion_id", bioregionId),
        supabase.from("bio_region_trees").select("tree_id").eq("bio_region_id", bioregionId).limit(50),
      ]);

      if (regionRes.data) {
        setRegion(regionRes.data as unknown as BioregionData);
      }
      if (markersRes.data) setMarkers(markersRes.data as unknown as SeasonalMarker[]);
      if (seedsRes.data) setSeedWindows(seedsRes.data as unknown as SeedWindow[]);

      // Fetch tree details
      if (treeLinkRes.data && treeLinkRes.data.length > 0) {
        const treeIds = treeLinkRes.data.map(t => t.tree_id);
        const { data: trees } = await supabase
          .from("trees")
          .select("id, name, species, latitude, longitude, nation")
          .in("id", treeIds)
          .limit(50);
        if (trees) setLinkedTrees(trees as LinkedTree[]);
      }

      setLoading(false);
    };
    load();
  }, [bioregionId]);

  // Markers active in a given month
  const getMarkersForMonth = useMemo(() => {
    return (month: number) => {
      return markers.filter(m => {
        if (m.typical_month_start <= m.typical_month_end) {
          return month >= m.typical_month_start && month <= m.typical_month_end;
        }
        // Wraps around year (e.g. Nov-Feb)
        return month >= m.typical_month_start || month <= m.typical_month_end;
      });
    };
  }, [markers]);

  // Seed windows active in a given month
  const getSeedWindowsForMonth = useMemo(() => {
    return (month: number) => {
      return seedWindows.filter(sw => {
        const sowActive = sw.sow_month_start && sw.sow_month_end &&
          isMonthInRange(month, sw.sow_month_start, sw.sow_month_end);
        const harvestActive = sw.harvest_month_start && sw.harvest_month_end &&
          isMonthInRange(month, sw.harvest_month_start, sw.harvest_month_end);
        return sowActive || harvestActive;
      });
    };
  }, [seedWindows]);

  return { region, markers, seedWindows, linkedTrees, loading, getMarkersForMonth, getSeedWindowsForMonth };
}

function isMonthInRange(month: number, start: number, end: number): boolean {
  if (start <= end) return month >= start && month <= end;
  return month >= start || month <= end;
}
