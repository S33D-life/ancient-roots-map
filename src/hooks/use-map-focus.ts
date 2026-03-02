import { useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getEntryBySlug } from "@/config/countryRegistry";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** All recognized arrival origins — each produces a distinct camera profile */
export type ArrivalOrigin =
  | "tree"        // Living Being Descent — reverent multi-stage zoom
  | "country"     // Territory Sweep — fitBounds + area highlight
  | "region"      // Watershed Descent — fitBounds + border glow
  | "county"      // Watershed Descent (finer)
  | "hive"        // Seasonal Energy Flow — activate filter + fruit overlay
  | "clock"       // Time → Place — seasonal focus
  | "search"      // Seeking Line — direct, shorter duration
  | "nearby"      // Awakening — gentle outward ripple
  | "featured";   // Editorial highlight

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
  /** Arrival origin — shapes the camera journey and UI context */
  source?: ArrivalOrigin;
  /** Open detail panel after camera settles (default true for trees) */
  openPanel?: boolean;
  /** w3w address fallback for trees without lat/lng */
  w3w?: string;
  /** Enable ceremonial multi-stage journey (default true) */
  journey?: boolean;
  /** Hive slug — activates hive filter on arrival */
  hiveSlug?: string;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Provides a single `focusMap(opts)` function — the ONE entry point
 * for all card → map navigation. No component should call flyTo directly.
 *
 * 1. Serializes arrival intent into URL params
 * 2. Navigates to /map (or replaces if already there)
 * 3. Map reads params and executes origin-appropriate camera journey
 * 4. Guards against double-trigger (2.2s cooldown)
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
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 2200);

      const params = new URLSearchParams();

      // Always signal journey mode (callers can opt out with journey: false)
      if (opts.journey !== false) {
        params.set("journey", "1");
      }

      // Arrival origin — drives camera profile on the map side
      if (opts.source) {
        params.set("arrival", opts.source);
      }

      if (opts.type === "tree") {
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
          if (!opts.bbox) {
            const entry = getEntryBySlug(opts.countrySlug);
            if (entry?.bbox) {
              opts.bbox = entry.bbox;
            }
          }
        }
        if (opts.bbox) {
          const [south, west, north, east] = opts.bbox;
          const centerLat = (south + north) / 2;
          const centerLng = (west + east) / 2;
          params.set("lat", String(centerLat));
          params.set("lng", String(centerLng));
          params.set("bbox", opts.bbox.join(","));
        }
      }

      // Hive context — map will auto-activate hive species filter
      if (opts.hiveSlug) {
        params.set("hive", opts.hiveSlug);
      }

      const target = `/map?${params.toString()}`;

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
