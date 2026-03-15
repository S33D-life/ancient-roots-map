/**
 * UltraBareLeafletTest — absolute minimum Leaflet map.
 * Zero app contexts, zero S33D logic, zero overlays.
 * Exists solely to prove Leaflet can mount and render tiles inside this route.
 */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const HARDCODED_CENTER: [number, number] = [51.5074, -0.1278]; // London
const HARDCODED_ZOOM = 5;

interface DiagState {
  phase: string;
  containerSize: string;
  parentChain: string[];
  leafletInited: boolean;
  whenReadyFired: boolean;
  tileCount0: number;
  tileCount500: number;
  tileCount1000: number;
  tileCount2000: number;
  hasLeafletContainer: boolean;
  hasControlContainer: boolean;
  hasTilePane: boolean;
  error: string;
}

const INIT: DiagState = {
  phase: "waiting",
  containerSize: "?",
  parentChain: [],
  leafletInited: false,
  whenReadyFired: false,
  tileCount0: -1,
  tileCount500: -1,
  tileCount1000: -1,
  tileCount2000: -1,
  hasLeafletContainer: false,
  hasControlContainer: false,
  hasTilePane: false,
  error: "",
};

function inspectParentChain(el: HTMLElement | null, levels = 3): string[] {
  const info: string[] = [];
  let current = el?.parentElement ?? null;
  for (let i = 0; i < levels && current; i++) {
    const s = window.getComputedStyle(current);
    const r = current.getBoundingClientRect();
    info.push(
      `L${i}: ${Math.round(r.width)}x${Math.round(r.height)} ` +
      `d=${s.display} v=${s.visibility} o=${s.opacity} p=${s.position} z=${s.zIndex} ov=${s.overflow}`
    );
    current = current.parentElement;
  }
  return info;
}

function countTileImages(container: HTMLElement): number {
  return container.querySelectorAll(".leaflet-tile-pane img").length;
}

const UltraBareLeafletTest = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [diag, setDiag] = useState<DiagState>(INIT);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    const timers: number[] = [];

    const logAndSet = (updates: Partial<DiagState>) => {
      console.info("[UltraBare]", updates);
      if (!cancelled) setDiag((d) => ({ ...d, ...updates }));
    };

    // Phase 1: Wait for measurable container via ResizeObserver
    const tryInit = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const size = `${w}x${h}`;

      console.info("[UltraBare] container check:", {
        size, rect: { w: rect.width, h: rect.height, t: rect.top, l: rect.left },
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
        position: cs.position, zIndex: cs.zIndex, overflow: cs.overflow,
      });

      const chain = inspectParentChain(el, 3);
      logAndSet({ containerSize: size, parentChain: chain, phase: "measured" });

      if (w === 0 || h === 0) {
        logAndSet({ error: `Container is ${size} — cannot init Leaflet` });
        return;
      }

      // Phase 2: Init Leaflet
      try {
        const map = L.map(el, {
          center: HARDCODED_CENTER,
          zoom: HARDCODED_ZOOM,
          zoomControl: true,
          attributionControl: true,
        });

        mapRef.current = map;
        logAndSet({ leafletInited: true, phase: "leaflet-created" });

        // Phase 3: Add tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        // Phase 4: Add proof-of-life marker
        L.marker(HARDCODED_CENTER).addTo(map).bindPopup("🌿 Bare map is alive");

        // Phase 5: Listen for ready
        map.whenReady(() => {
          if (cancelled) return;
          logAndSet({ whenReadyFired: true, phase: "ready" });
        });

        // Phase 6: Check DOM nodes at intervals
        const checkDom = () => {
          logAndSet({
            hasLeafletContainer: !!el.querySelector(".leaflet-container") || el.classList.contains("leaflet-container"),
            hasControlContainer: !!el.querySelector(".leaflet-control-container"),
            hasTilePane: !!el.querySelector(".leaflet-tile-pane"),
          });
        };
        requestAnimationFrame(checkDom);

        const countAt = (ms: number, key: keyof DiagState) => {
          const t = window.setTimeout(() => {
            if (cancelled) return;
            const count = countTileImages(el);
            console.info(`[UltraBare] tile <img> count @${ms}ms:`, count);
            setDiag((d) => ({ ...d, [key]: count }));
          }, ms);
          timers.push(t);
        };

        countAt(0, "tileCount0");
        countAt(500, "tileCount500");
        countAt(1000, "tileCount1000");
        countAt(2000, "tileCount2000");

        // Phase 7: invalidateSize bursts
        requestAnimationFrame(() => map.invalidateSize());
        timers.push(window.setTimeout(() => map.invalidateSize(), 100));
        timers.push(window.setTimeout(() => map.invalidateSize(), 500));
        timers.push(window.setTimeout(() => map.invalidateSize(), 1500));

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[UltraBare] init failed:", msg, err);
        logAndSet({ error: msg, phase: "error" });
      }
    };

    // Use ResizeObserver to wait for non-zero size, with 2s timeout
    let initDone = false;
    const ro = new ResizeObserver((entries) => {
      if (initDone || cancelled) return;
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          initDone = true;
          ro.disconnect();
          tryInit();
          return;
        }
      }
    });
    ro.observe(el);

    // Fallback: try anyway after 2s
    const fallback = window.setTimeout(() => {
      if (initDone || cancelled) return;
      initDone = true;
      ro.disconnect();
      console.warn("[UltraBare] ResizeObserver timeout — forcing init");
      tryInit();
    }, 2000);
    timers.push(fallback);

    return () => {
      cancelled = true;
      ro.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        background: "#1a1a1a",
      }}
    >
      {/* Diagnostic badge — always visible */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 10001,
          background: "rgba(0,0,0,0.85)",
          color: "#0f0",
          fontFamily: "monospace",
          fontSize: 10,
          lineHeight: 1.5,
          padding: "6px 10px",
          borderRadius: 6,
          border: "2px solid #0f0",
          maxWidth: "90vw",
          overflow: "auto",
          maxHeight: "40vh",
          pointerEvents: "none",
        }}
      >
        <div style={{ color: "#ff0", fontWeight: "bold", marginBottom: 2 }}>
          MAP CONTAINER LIVE — UltraBareLeafletTest
        </div>
        <div>phase: {diag.phase}</div>
        <div>container: {diag.containerSize}</div>
        <div>leaflet init: {diag.leafletInited ? "✓" : "✗"}</div>
        <div>whenReady: {diag.whenReadyFired ? "✓" : "✗"}</div>
        <div>.leaflet-container: {diag.hasLeafletContainer ? "✓" : "✗"}</div>
        <div>.leaflet-control-container: {diag.hasControlContainer ? "✓" : "✗"}</div>
        <div>.leaflet-tile-pane: {diag.hasTilePane ? "✓" : "✗"}</div>
        <div>tile imgs @0ms: {diag.tileCount0}</div>
        <div>tile imgs @500ms: {diag.tileCount500}</div>
        <div>tile imgs @1k: {diag.tileCount1000}</div>
        <div>tile imgs @2k: {diag.tileCount2000}</div>
        {diag.parentChain.map((p, i) => (
          <div key={i} style={{ color: "#aaa" }}>{p}</div>
        ))}
        {diag.error && <div style={{ color: "#f55" }}>ERROR: {diag.error}</div>}
      </div>

      {/* Map container — explicit sizing, debug border, contrasting background */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: "relative",
          minHeight: "60vh",
          width: "100%",
          background: "#336699",
          border: "2px solid #ff00ff",
          zIndex: 1,
        }}
      />
    </div>
  );
};

export default UltraBareLeafletTest;
