/**
 * useMapDeepLinks — Handles deep-link context from URL params:
 * - Country/region zoom + highlight
 * - Hive species filter + fly-to
 * - Species auto-filter
 * - Rootstone focus
 * - BBox fitting
 * - Journey animations
 *
 * Extracted from LeafletFallbackMap to reduce the monolith.
 */
import { useEffect, useRef, useMemo, useCallback } from "react";
import L from "leaflet";
import { getEntryBySlug } from "@/config/countryRegistry";
import { getHiveBySlug } from "@/utils/hiveUtils";
import { getRootstoneById } from "@/data/rootstones";

interface DeepLinkOptions {
  mapRef: React.MutableRefObject<L.Map | null>;
  initialCountry?: string;
  initialHive?: string;
  initialOrigin?: string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  initialJourney?: boolean;
  initialBbox?: string;
  treesLength: number;
  trees: Array<{ id: string; species: string; latitude: number; longitude: number; nation?: string }>;
  onSpeciesChange: (species: string[]) => void;
  onContextLabel: (label: string | null) => void;
  onShowRootstones: (v: boolean) => void;
  onRootstoneCountryFilter: (v: string | null) => void;
  onRootstoneTagFilter: (v: string[]) => void;
  onShowRootstoneTrees: (v: boolean) => void;
  onShowRootstoneGroves: (v: boolean) => void;
  onJourneyEnd?: () => void;
}

export function useMapDeepLinks({
  mapRef,
  initialCountry,
  initialHive,
  initialOrigin,
  initialLat,
  initialLng,
  initialZoom,
  initialJourney,
  initialBbox,
  treesLength,
  trees,
  onSpeciesChange,
  onContextLabel,
  onShowRootstones,
  onRootstoneCountryFilter,
  onRootstoneTagFilter,
  onShowRootstoneTrees,
  onShowRootstoneGroves,
  onJourneyEnd,
}: DeepLinkOptions) {
  const appliedRef = useRef<string | null>(null);

  const signature = useMemo(
    () =>
      [
        initialCountry || "",
        initialHive || "",
        initialOrigin || "",
        initialLat ?? "",
        initialLng ?? "",
        initialZoom ?? "",
        initialBbox || "",
        initialJourney ? "1" : "0",
        typeof window !== "undefined" ? window.location.search : "",
      ].join("|"),
    [initialCountry, initialHive, initialOrigin, initialLat, initialLng, initialZoom, initialBbox, initialJourney]
  );

  useEffect(() => {
    if (appliedRef.current === signature) return;
    const map = mapRef.current;
    if (!map) return;

    const timer = setTimeout(() => {
      if (appliedRef.current === signature) return;
      appliedRef.current = signature;

      let label: string | null = null;

      // Country deep-link
      if (initialCountry) {
        const entry = getEntryBySlug(initialCountry);
        if (initialLat != null && initialLng != null) {
          map.flyTo(
            [initialLat, initialLng],
            initialZoom ?? 7,
            { animate: true, duration: initialJourney ? 1.8 : 1.2 }
          );
          label = `${entry?.flag || "🌍"} ${entry?.country || initialCountry}`;
          if (initialJourney) {
            setTimeout(() => onJourneyEnd?.(), 1800);
          } else {
            onJourneyEnd?.();
          }
        } else if (entry?.bbox) {
          const [south, west, north, east] = entry.bbox;
          const bounds: L.LatLngBoundsExpression = [[south, west], [north, east]];
          map.fitBounds(bounds, { padding: [20, 20], animate: true, duration: initialJourney ? 1.8 : 1.5 });
          label = `${entry.flag} ${entry.country}`;

          if (initialJourney) {
            const rect = L.rectangle(bounds, {
              color: "hsl(42, 80%, 55%)",
              weight: 1.5,
              fillColor: "hsl(42, 80%, 55%)",
              fillOpacity: 0.06,
              opacity: 0.5,
              interactive: false,
            }).addTo(map);
            setTimeout(() => {
              try { map.removeLayer(rect); } catch {}
              onJourneyEnd?.();
            }, 4000);
          } else {
            onJourneyEnd?.();
          }
        }
      } else if (initialBbox) {
        const parts = initialBbox.split(",").map(Number);
        if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
          const [south, west, north, east] = parts;
          map.fitBounds([[south, west], [north, east]], { padding: [20, 20], animate: true, duration: 1.5 });
          onJourneyEnd?.();
        }
      }

      // Hive deep-link
      if (initialHive) {
        const hive = getHiveBySlug(initialHive);
        if (hive) {
          const speciesNames = hive.representativeSpecies.slice(0, 10);
          if (speciesNames.length > 0) {
            onSpeciesChange(speciesNames);
          }
          label = label
            ? `${label} · ${hive.displayName}`
            : `${hive.icon} ${hive.displayName}`;

          if (initialOrigin === "hive" && !initialCountry && trees.length > 0) {
            const hiveTrees = trees.filter((t) =>
              speciesNames.some((s) =>
                t.species.toLowerCase().includes(s.toLowerCase())
              )
            );
            if (hiveTrees.length > 0) {
              const bounds = L.latLngBounds(
                hiveTrees.map((t) => [t.latitude, t.longitude] as [number, number])
              );
              map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8, animate: true, duration: 1.8 });
              setTimeout(() => onJourneyEnd?.(), 2000);
            }
          }
        }
      }

      // Species param
      const params = new URLSearchParams(window.location.search);
      if (!initialHive && trees.length > 0) {
        const speciesParam = params.get("species");
        if (speciesParam) {
          onSpeciesChange([speciesParam]);
          label = label || `🌿 ${speciesParam}`;
        }
      }

      // Rootstone params
      const rootstoneId = params.get("rootstoneId");
      const rootstoneCountry = params.get("rootstoneCountry");
      const rootstoneType = params.get("rootstoneType");
      const rootstoneTags = params.get("rootstoneTags");

      if (rootstoneId || rootstoneCountry || rootstoneType || rootstoneTags) {
        onShowRootstones(true);
        if (rootstoneCountry) onRootstoneCountryFilter(rootstoneCountry);
        if (rootstoneTags) onRootstoneTagFilter(rootstoneTags.split(",").filter(Boolean));
        if (rootstoneType === "tree") {
          onShowRootstoneTrees(true);
          onShowRootstoneGroves(false);
        } else if (rootstoneType === "grove") {
          onShowRootstoneTrees(false);
          onShowRootstoneGroves(true);
        }
      }

      if (rootstoneId) {
        const stone = getRootstoneById(rootstoneId);
        if (stone?.bounds) {
          map.fitBounds(
            [[stone.bounds.south, stone.bounds.west], [stone.bounds.north, stone.bounds.east]],
            { padding: [24, 24], animate: true, duration: 1.4 }
          );
        } else if (stone?.location.lat != null && stone.location.lng != null) {
          map.flyTo([stone.location.lat, stone.location.lng], 10, { duration: 1.2 });
        }
      }

      if (label) {
        onContextLabel(label);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    signature,
    initialCountry,
    initialHive,
    initialOrigin,
    trees.length,
    initialLat,
    initialLng,
    initialZoom,
    initialJourney,
    initialBbox,
    onJourneyEnd,
    onSpeciesChange,
    onContextLabel,
    onShowRootstones,
    onRootstoneCountryFilter,
    onRootstoneTagFilter,
    onShowRootstoneTrees,
    onShowRootstoneGroves,
    mapRef,
    trees,
  ]);

  return { deepLinkAppliedRef: appliedRef };
}
