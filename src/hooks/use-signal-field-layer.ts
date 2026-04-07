/**
 * useSignalFieldLayer — renders a soft canvas overlay beneath markers
 * showing signal density as radial color gradients.
 *
 * Approach: A fixed-position canvas that repaints on moveend/zoomend
 * using container-point coordinates. No transform inversion needed.
 *
 * Data source: existing heartPoolCounts + whisperCounts.
 * No new data fetching — purely visual.
 */
import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { isFeatureEnabled } from "@/lib/featureFlags";

interface Tree {
  id: string;
  latitude: number;
  longitude: number;
}

interface SignalFieldOptions {
  map: L.Map | null;
  trees: Tree[];
  heartPoolCounts: Record<string, number>;
  whisperCounts: Record<string, number>;
  enabled: boolean;
}

// Radius scales with zoom — subtle at low zoom, wider at high zoom
function getRadiusPx(zoom: number): number {
  if (zoom <= 6) return 16;
  if (zoom <= 10) return 24;
  if (zoom <= 14) return 40;
  return 56;
}

// Max intensity decreases at low zoom to avoid mud
function getMaxIntensity(zoom: number): number {
  if (zoom <= 8) return 0.06;
  if (zoom <= 12) return 0.09;
  return 0.12;
}

export function useSignalFieldLayer({
  map,
  trees,
  heartPoolCounts,
  whisperCounts,
  enabled,
}: SignalFieldOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  // Cache refs to avoid dependency churn
  const treesRef = useRef(trees);
  const heartsRef = useRef(heartPoolCounts);
  const whispersRef = useRef(whisperCounts);
  treesRef.current = trees;
  heartsRef.current = heartPoolCounts;
  whispersRef.current = whisperCounts;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    const active = isFeatureEnabled("signal-field") && enabled;
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!active) return;

    const zoom = map.getZoom();
    const radiusPx = getRadiusPx(zoom);
    const maxInt = getMaxIntensity(zoom);
    const bounds = map.getBounds();
    const currentTrees = treesRef.current;
    const currentHearts = heartsRef.current;
    const currentWhispers = whispersRef.current;

    // Limit to visible trees with signals — cap at 200 for perf
    let painted = 0;
    for (const tree of currentTrees) {
      if (painted >= 200) break;
      if (!bounds.contains([tree.latitude, tree.longitude])) continue;

      const hearts = currentHearts[tree.id] || 0;
      const whisps = currentWhispers[tree.id] || 0;
      if (hearts === 0 && whisps === 0) continue;

      const point = map.latLngToContainerPoint([tree.latitude, tree.longitude]);
      painted++;

      // Hearts — soft green radial
      if (hearts > 0) {
        const intensity = Math.min(maxInt, 0.02 + hearts * 0.004);
        const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radiusPx);
        grad.addColorStop(0, `hsla(140, 35%, 50%, ${intensity})`);
        grad.addColorStop(0.6, `hsla(140, 35%, 50%, ${intensity * 0.3})`);
        grad.addColorStop(1, `hsla(140, 35%, 50%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(point.x - radiusPx, point.y - radiusPx, radiusPx * 2, radiusPx * 2);
      }

      // Whispers — soft blue-violet radial
      if (whisps > 0) {
        const intensity = Math.min(maxInt * 0.8, 0.02 + whisps * 0.015);
        const r = radiusPx * 0.75;
        const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, r);
        grad.addColorStop(0, `hsla(230, 40%, 55%, ${intensity})`);
        grad.addColorStop(0.5, `hsla(230, 40%, 55%, ${intensity * 0.25})`);
        grad.addColorStop(1, `hsla(230, 40%, 55%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(point.x - r, point.y - r, r * 2, r * 2);
      }
    }
  }, [map, enabled]);

  // Create fixed canvas overlay
  useEffect(() => {
    if (!map) return;

    const container = map.getContainer();
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "250"; // Above tiles, below markers (400+)
    canvas.style.willChange = "auto";
    canvasRef.current = canvas;
    container.appendChild(canvas);

    const onMoveEnd = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(paint);
    };

    map.on("moveend zoomend resize", onMoveEnd);
    // Initial paint
    requestAnimationFrame(paint);

    return () => {
      map.off("moveend zoomend resize", onMoveEnd);
      cancelAnimationFrame(rafRef.current);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [map, paint]);

  // Repaint when enabled toggles or data updates
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(paint);
  }, [paint, enabled, heartPoolCounts, whisperCounts]);
}
