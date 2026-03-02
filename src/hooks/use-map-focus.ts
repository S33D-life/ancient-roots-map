import { useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getEntryBySlug } from "@/config/countryRegistry";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FocusMapOptions {
  /** Target type */
  type: "tree" | "area";
  /** Tree or area ID */
  id: string;
  /** Coordinates (for tree focus) */
  lat?: number;
  lng?: number;
  /** Bounding box [south, west, north, east] (for area focus) */
  bbox?: [number, number, number, number];
  /** Target zoom (defaults: tree=17, area=fit-to-bounds) */
  zoom?: number;
  /** Country slug — used for area deep-linking and map context */
  countrySlug?: string;
  /** Origin breadcrumb (atlas, search, nearby, featured) */
  source?: "tree_card" | "atlas_card" | "search" | "nearby" | "featured";
  /** Open detail panel after camera settles (default true for trees) */
  openPanel?: boolean;
  /** w3w address fallback for trees without lat/lng */
  w3w?: string;
  /** Enable ceremonial multi-stage journey (default true) */
  journey?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Provides a single `focusMap(opts)` function that:
 *  1. Navigates to /map with the right query params (if not already there)
 *  2. The Map component handles multi-stage fly-to, highlight, bbox
 *  3. Guards against double-trigger with isAnimating flag
 */
export function useMapFocus() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAnimatingRef = useRef(false);

  const focusMap = useCallback(
    (opts: FocusMapOptions) => {
      // Guard — prevent double-trigger while a journey is in-flight
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      // Release after generous animation window
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 2200);

      const params = new URLSearchParams();

      // Signal ceremonial journey mode
      const useJourney = opts.journey !== false;
      if (useJourney) {
        params.set("journey", "1");
      }

      if (opts.type === "tree") {
        // Tree focus
        params.set("treeId", opts.id);
        if (opts.lat != null && opts.lng != null) {
          params.set("lat", String(opts.lat));
          params.set("lng", String(opts.lng));
        }
        if (opts.w3w) {
          params.set("w3w", opts.w3w);
        }
        params.set("zoom", String(opts.zoom ?? 17));
      } else {
        // Area focus
        if (opts.countrySlug) {
          params.set("country", opts.countrySlug);
          // If no bbox provided, try to resolve from registry
          if (!opts.bbox) {
            const entry = getEntryBySlug(opts.countrySlug);
            if (entry?.bbox) {
              opts.bbox = entry.bbox;
            }
          }
        }
        if (opts.bbox) {
          // Use lat/lng of center + appropriate zoom
          const [south, west, north, east] = opts.bbox;
          const centerLat = (south + north) / 2;
          const centerLng = (west + east) / 2;
          params.set("lat", String(centerLat));
          params.set("lng", String(centerLng));
          params.set("bbox", opts.bbox.join(","));
        }
      }

      if (opts.source) {
        params.set("origin", opts.source);
      }

      const target = `/map?${params.toString()}`;

      // If already on /map, replace to avoid duplicate history entries
      if (location.pathname === "/map") {
        navigate(target, { replace: true });
      } else {
        navigate(target);
      }
    },
    [navigate, location.pathname],
  );

  return { focusMap };
}
