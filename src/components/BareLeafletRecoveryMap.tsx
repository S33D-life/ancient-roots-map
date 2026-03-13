import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface BareLeafletRecoveryMapProps {
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

type TileStatus = "idle" | "loading" | "loaded" | "failed";

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;

const BareLeafletRecoveryMap = ({ initialLat, initialLng, initialZoom }: BareLeafletRecoveryMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  const [debug, setDebug] = useState<{
    mounted: boolean;
    tileStatus: TileStatus;
    container: string;
    error: string;
  }>({
    mounted: false,
    tileStatus: "idle",
    container: "0x0",
    error: "",
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let cancelled = false;

    const updateContainerDebug = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      const rect = container.getBoundingClientRect();
      const size = `${w}x${h}`;

      const styles = window.getComputedStyle(container);
      console.info("[BareMap] container", {
        size,
        rect: {
          width: Number(rect.width.toFixed(1)),
          height: Number(rect.height.toFixed(1)),
          top: Number(rect.top.toFixed(1)),
          left: Number(rect.left.toFixed(1)),
        },
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        position: styles.position,
        overflow: styles.overflow,
      });

      setDebug((prev) => ({ ...prev, container: size }));
      return { w, h };
    };

    const initMap = () => {
      try {
        const hasInitialCenter = Number.isFinite(initialLat) && Number.isFinite(initialLng);
        const center: [number, number] = hasInitialCenter
          ? [initialLat as number, initialLng as number]
          : DEFAULT_CENTER;

        const zoom = Number.isFinite(initialZoom)
          ? Math.min(19, Math.max(2, initialZoom as number))
          : DEFAULT_ZOOM;

        const map = L.map(container, {
          center,
          zoom,
          zoomControl: true,
          attributionControl: true,
        });

        mapRef.current = map;

        map.whenReady(() => {
          if (cancelled) return;
          console.info("[BareMap] map ready", {
            center: map.getCenter(),
            zoom: map.getZoom(),
            bounds: map.getBounds().toBBoxString(),
          });
          setDebug((prev) => ({ ...prev, mounted: true }));
        });

        const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        });

        tiles.on("loading", () => {
          console.info("[BareMap] tiles loading");
          setDebug((prev) => ({ ...prev, tileStatus: "loading" }));
        });
        tiles.on("load", () => {
          console.info("[BareMap] tiles loaded");
          setDebug((prev) => ({ ...prev, tileStatus: "loaded" }));
        });
        tiles.on("tileerror", (event: L.TileErrorEvent) => {
          const failingUrl = (event.tile as HTMLImageElement | undefined)?.src;
          console.error("[BareMap] tileerror", failingUrl || "unknown");
          setDebug((prev) => ({ ...prev, tileStatus: "failed" }));
        });

        tiles.addTo(map);

        L.marker(center).addTo(map).bindPopup("Map recovery marker");

        requestAnimationFrame(() => map.invalidateSize());
        window.setTimeout(() => map.invalidateSize(), 120);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[BareMap] init failed", error);
        setDebug((prev) => ({ ...prev, error: message }));
      }
    };

    const tryInit = (attempt: number) => {
      if (cancelled) return;
      const { w, h } = updateContainerDebug();

      if (w > 0 && h > 0) {
        initMap();
        return;
      }

      if (attempt === 0) {
        console.warn("[BareMap] container not ready, retrying once in 250ms");
        retryTimerRef.current = window.setTimeout(() => tryInit(1), 250);
        return;
      }

      const message = "Container size remained 0x0 after retry";
      console.error("[BareMap]", message);
      setDebug((prev) => ({ ...prev, error: message }));
    };

    tryInit(0);

    return () => {
      cancelled = true;
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialLat, initialLng, initialZoom]);

  const isDebugMode = import.meta.env.DEV;

  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        className="absolute inset-0 bg-background"
        data-bare-map="true"
      />

      {isDebugMode && (
        <div className="absolute top-2 left-2 z-[1000] rounded-md border border-border bg-card/90 px-2 py-1 font-mono text-[10px] text-foreground shadow-sm">
          <div>mounted: {debug.mounted ? "yes" : "no"}</div>
          <div>tiles: {debug.tileStatus}</div>
          <div>container: {debug.container}</div>
          {debug.error ? <div>error: {debug.error}</div> : null}
        </div>
      )}
    </div>
  );
};

export default BareLeafletRecoveryMap;
