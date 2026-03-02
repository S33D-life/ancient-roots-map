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
  /** Target zoom (defaults: tree=16, area=fit-to-bounds) */
  zoom?: number;
  /** Country slug — used for area deep-linking and map context */
  countrySlug?: string;
  /** Origin breadcrumb (atlas, search, nearby, featured) */
  source?: "tree_card" | "atlas_card" | "search" | "nearby" | "featured";
  /** Open detail panel after camera settles (default true for trees) */
  openPanel?: boolean;
  /** w3w address fallback for trees without lat/lng */
  w3w?: string;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Provides a single `focusMap(opts)` function that:
 *  1. Navigates to /map with the right query params (if not already there)
 *  2. The Map component handles fly-to, highlight, bbox via existing deep-link logic
 *  3. Debounces rapid taps (800ms cooldown while camera would be animating)
 */
export function useMapFocus() {
  const navigate = useNavigate();
  const location = useLocation();
  const cooldownRef = useRef(false);

  const focusMap = useCallback(
    (opts: FocusMapOptions) => {
      // Debounce — ignore if a focus is already in-flight
      if (cooldownRef.current) return;
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 800);

      const params = new URLSearchParams();

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
        params.set("zoom", String(opts.zoom ?? 16));
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
