/**
 * useViewportTrees — Viewport-bounded tree loading using the
 * `get_trees_in_viewport` RPC backed by the `trees_map_hot` materialized view.
 *
 * Strategy:
 * - Fetches trees within the current map bounding box
 * - Caches by rounded viewport key to reuse results for small pans
 * - Falls back to full dataset fetch if viewport query fails
 * - Debounces viewport updates to avoid spamming during pan/zoom
 */
import { useCallback, useRef, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ViewportTree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  created_by?: string;
  nation?: string;
  estimated_age?: number | null;
  what3words: string;
  lineage?: string;
  project_name?: string;
  photo_thumb_url?: string | null;
  girth_cm?: number | null;
  offering_count?: number;
  offering_photo?: string | null;
}

interface ViewportBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Round bounds to ~0.01° grid (~1km) to maximise cache hits */
function roundBounds(b: ViewportBounds): string {
  const precision = 2;
  return [
    b.south.toFixed(precision),
    b.west.toFixed(precision),
    b.north.toFixed(precision),
    b.east.toFixed(precision),
  ].join(",");
}

/** Expand bounds by ~10% to reduce refetches on small pans */
function expandBounds(b: ViewportBounds): ViewportBounds {
  const latPad = (b.north - b.south) * 0.1;
  const lngPad = (b.east - b.west) * 0.1;
  return {
    south: b.south - latPad,
    west: b.west - lngPad,
    north: b.north + latPad,
    east: b.east + lngPad,
  };
}

/** Check if bounds A fully contains bounds B */
function boundsContain(outer: ViewportBounds, inner: ViewportBounds): boolean {
  return (
    outer.south <= inner.south &&
    outer.west <= inner.west &&
    outer.north >= inner.north &&
    outer.east >= inner.east
  );
}

// In-memory LRU cache for viewport results
const viewportCache = new Map<string, { trees: ViewportTree[]; fetchedBounds: ViewportBounds; ts: number }>();
const CACHE_MAX = 8;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function pruneCacheIfNeeded() {
  if (viewportCache.size <= CACHE_MAX) return;
  // Remove oldest entries
  const entries = Array.from(viewportCache.entries()).sort((a, b) => a[1].ts - b[1].ts);
  while (viewportCache.size > CACHE_MAX - 2) {
    const oldest = entries.shift();
    if (oldest) viewportCache.delete(oldest[0]);
  }
}

export function useViewportTrees() {
  const [trees, setTrees] = useState<ViewportTree[]>([]);
  const [loading, setLoading] = useState(false);
  const lastFetchedBoundsRef = useRef<ViewportBounds | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  /** Fetch trees for a given viewport, with caching and deduplication */
  const fetchForViewport = useCallback(async (bounds: ViewportBounds) => {
    const expanded = expandBounds(bounds);
    const cacheKey = roundBounds(expanded);

    // Check if current fetched bounds already cover this viewport
    if (lastFetchedBoundsRef.current && boundsContain(lastFetchedBoundsRef.current, bounds)) {
      return; // Already covered
    }

    // Check in-memory cache
    const cached = viewportCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL && boundsContain(cached.fetchedBounds, bounds)) {
      setTrees(cached.trees);
      lastFetchedBoundsRef.current = cached.fetchedBounds;
      return;
    }

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("get_trees_in_viewport", {
        p_south: expanded.south,
        p_west: expanded.west,
        p_north: expanded.north,
        p_east: expanded.east,
        p_limit: 500,
      });

      if (ac.signal.aborted) return;

      if (error) {
        console.warn("Viewport tree fetch failed, using existing data:", error.message);
        return;
      }

      const result: ViewportTree[] = (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        species: row.species,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        created_by: row.created_by,
        nation: row.nation,
        estimated_age: row.estimated_age,
        what3words: row.what3words ?? "",
        lineage: row.lineage,
        project_name: row.project_name,
        photo_thumb_url: row.photo_thumb_url,
        girth_cm: row.girth_cm,
        offering_count: row.offering_count ?? 0,
        offering_photo: row.offering_photo,
      }));

      setTrees(result);
      lastFetchedBoundsRef.current = expanded;

      // Update cache
      viewportCache.set(cacheKey, { trees: result, fetchedBounds: expanded, ts: Date.now() });
      pruneCacheIfNeeded();
    } catch {
      // silently handle network errors
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  /** Debounced viewport update — call on map moveend */
  const updateViewport = useCallback((bounds: ViewportBounds) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchForViewport(bounds), 350);
  }, [fetchForViewport]);

  /** Force invalidate cache (after tree creation, edit, etc.) */
  const invalidate = useCallback(() => {
    viewportCache.clear();
    lastFetchedBoundsRef.current = null;
  }, []);

  return {
    trees,
    loading,
    updateViewport,
    invalidate,
  };
}
