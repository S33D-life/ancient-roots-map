/**
 * useSignalFieldLayer — renders a soft canvas overlay beneath markers
 * showing signal density as radial color gradients.
 *
 * Data source: existing heartPoolCounts + whisperCounts refs.
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

// Render radius in pixels at current zoom
function getRadiusPx(zoom: number): number {
  return Math.max(20, Math.min(80, zoom * 4));
}

export function useSignalFieldLayer({
  map,
  trees,
  heartPoolCounts,
  whisperCounts,
  enabled,
}: SignalFieldOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<L.Layer | null>(null);
  const rafRef = useRef<number>(0);

  const paint = useCallback(() => {
    if (!map || !canvasRef.current) return;
    if (!isFeatureEnabled("signal-field") || !enabled) return;

    const canvas = canvasRef.current;
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const zoom = map.getZoom();
    const radiusPx = getRadiusPx(zoom);
    const bounds = map.getBounds();

    // Only process visible trees with signals
    for (const tree of trees) {
      if (!bounds.contains([tree.latitude, tree.longitude])) continue;

      const hearts = heartPoolCounts[tree.id] || 0;
      const whispers = whisperCounts[tree.id] || 0;
      if (hearts === 0 && whispers === 0) continue;

      const point = map.latLngToContainerPoint([tree.latitude, tree.longitude]);

      // Hearts — green radial
      if (hearts > 0) {
        const intensity = Math.min(0.12, 0.03 + hearts * 0.005);
        const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radiusPx);
        grad.addColorStop(0, `hsla(140, 40%, 50%, ${intensity})`);
        grad.addColorStop(1, `hsla(140, 40%, 50%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(point.x - radiusPx, point.y - radiusPx, radiusPx * 2, radiusPx * 2);
      }

      // Whispers — blue radial
      if (whispers > 0) {
        const intensity = Math.min(0.1, 0.03 + whispers * 0.02);
        const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radiusPx * 0.8);
        grad.addColorStop(0, `hsla(220, 50%, 55%, ${intensity})`);
        grad.addColorStop(1, `hsla(220, 50%, 55%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(point.x - radiusPx, point.y - radiusPx, radiusPx * 2, radiusPx * 2);
      }
    }
  }, [map, trees, heartPoolCounts, whisperCounts, enabled]);

  // Create canvas overlay
  useEffect(() => {
    if (!map) return;

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "200"; // Below markers (400+)
    canvas.style.opacity = "0.8";
    canvasRef.current = canvas;

    const pane = map.getPane("overlayPane");
    if (pane) pane.appendChild(canvas);

    const onMove = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Sync canvas position with map transform
        const mapPane = map.getPane("mapPane");
        if (mapPane && canvas) {
          const transform = mapPane.style.transform;
          // Invert the map pane transform so canvas stays fixed
          if (transform) {
            const match = transform.match(/translate3d\(([^,]+),\s*([^,]+)/);
            if (match) {
              const x = -parseFloat(match[1]);
              const y = -parseFloat(match[2]);
              canvas.style.transform = `translate(${x}px, ${y}px)`;
            }
          }
        }
        paint();
      });
    };

    map.on("moveend zoomend", onMove);
    paint();

    return () => {
      map.off("moveend zoomend", onMove);
      cancelAnimationFrame(rafRef.current);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [map, paint]);

  // Repaint when data changes
  useEffect(() => {
    paint();
  }, [paint, enabled]);
}
