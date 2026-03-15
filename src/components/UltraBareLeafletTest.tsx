/**
 * UltraBareLeafletTest — absolute minimum Leaflet map.
 * Zero app contexts, zero S33D logic, zero overlays.
 * Exists solely to prove Leaflet can mount and render tiles inside this route.
 * Includes environment diagnostics to distinguish preview vs production issues.
 */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const HARDCODED_CENTER: [number, number] = [51.5074, -0.1278];
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
  // Environment diagnostics
  env: string;
  currentUrl: string;
  isIframe: boolean;
  userAgent: string;
  dpr: number;
  viewportW: number;
  viewportH: number;
  pageVisible: boolean;
  mountAttempt: number;
}

function detectEnv(): string {
  const url = window.location.href;
  if (url.includes("preview--") || url.includes("lovable.app") && url.includes("preview")) return "preview";
  if (url.includes("localhost") || url.includes("127.0.0.1")) return "dev";
  return "prod";
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
  env: detectEnv(),
  currentUrl: window.location.href,
  isIframe: window.self !== window.top,
  userAgent: navigator.userAgent.slice(0, 80),
  dpr: window.devicePixelRatio,
  viewportW: window.innerWidth,
  viewportH: window.innerHeight,
  pageVisible: !document.hidden,
  mountAttempt: 0,
};

function inspectParentChain(el: HTMLElement | null, levels = 4): string[] {
  const info: string[] = [];
  let current = el?.parentElement ?? null;
  for (let i = 0; i < levels && current; i++) {
    const s = window.getComputedStyle(current);
    const r = current.getBoundingClientRect();
    info.push(
      `L${i}: ${current.tagName}#${current.id || "?"} ${Math.round(r.width)}x${Math.round(r.height)} ` +
      `d=${s.display} v=${s.visibility} o=${s.opacity} p=${s.position} z=${s.zIndex} ov=${s.overflow}` +
      (s.transform !== "none" ? ` transform=${s.transform}` : "")
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
    let mountAttempt = 0;

    const logAndSet = (updates: Partial<DiagState>) => {
      console.info("[UltraBare]", updates);
      if (!cancelled) setDiag((d) => ({ ...d, ...updates }));
    };

    // Log full environment at mount
    console.info("[UltraBare] === ENVIRONMENT ===", {
      env: detectEnv(),
      url: window.location.href,
      iframe: window.self !== window.top,
      ua: navigator.userAgent,
      dpr: window.devicePixelRatio,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      hidden: document.hidden,
      visibilityState: document.visibilityState,
    });

    const tryInit = (attempt: number) => {
      mountAttempt = attempt;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const size = `${w}x${h}`;

      console.info("[UltraBare] container check (attempt " + attempt + "):", {
        size, rect: { w: rect.width, h: rect.height, t: rect.top, l: rect.left },
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
        position: cs.position, zIndex: cs.zIndex, overflow: cs.overflow,
        transform: cs.transform,
      });

      const chain = inspectParentChain(el, 4);
      logAndSet({ containerSize: size, parentChain: chain, phase: "measured", mountAttempt: attempt });

      if (w === 0 || h === 0) {
        logAndSet({ error: `Container is ${size} — cannot init Leaflet (attempt ${attempt})` });
        // Retry once after delay if first attempt
        if (attempt < 2) {
          timers.push(window.setTimeout(() => {
            if (!cancelled) tryInit(attempt + 1);
          }, 500));
        }
        return;
      }

      // Clean up previous map if retrying
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      try {
        const map = L.map(el, {
          center: HARDCODED_CENTER,
          zoom: HARDCODED_ZOOM,
          zoomControl: true,
          attributionControl: true,
        });

        mapRef.current = map;
        logAndSet({ leafletInited: true, phase: "leaflet-created" });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        L.marker(HARDCODED_CENTER).addTo(map).bindPopup("🌿 Bare map is alive");

        map.whenReady(() => {
          if (cancelled) return;
          logAndSet({ whenReadyFired: true, phase: "ready" });
        });

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

        // invalidateSize bursts — critical for iframe/preview environments
        requestAnimationFrame(() => map.invalidateSize());
        [100, 300, 500, 1000, 1500, 3000].forEach((ms) => {
          timers.push(window.setTimeout(() => {
            if (!cancelled && mapRef.current) mapRef.current.invalidateSize();
          }, ms));
        });

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[UltraBare] init failed:", msg, err);
        logAndSet({ error: msg, phase: "error" });
      }
    };

    // Preview-safe: delay 300ms before even observing, to let iframe settle
    const isPreview = detectEnv() === "preview" || window.self !== window.top;
    const initDelay = isPreview ? 300 : 0;

    const startTimer = window.setTimeout(() => {
      if (cancelled) return;

      let initDone = false;
      const ro = new ResizeObserver((entries) => {
        if (initDone || cancelled) return;
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            initDone = true;
            ro.disconnect();
            tryInit(1);
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
        tryInit(1);
      }, 2000);
      timers.push(fallback);
    }, initDelay);
    timers.push(startTimer);

    // Listen for visibility changes (tab switching in preview)
    const onVisChange = () => {
      logAndSet({ pageVisible: !document.hidden });
      if (!document.hidden && mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisChange);
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
      {/* Diagnostic badge */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 10001,
          background: "rgba(0,0,0,0.9)",
          color: "#0f0",
          fontFamily: "monospace",
          fontSize: 10,
          lineHeight: 1.5,
          padding: "6px 10px",
          borderRadius: 6,
          border: "2px solid #0f0",
          maxWidth: "90vw",
          overflow: "auto",
          maxHeight: "45vh",
          pointerEvents: "none",
        }}
      >
        <div style={{ color: "#ff0", fontWeight: "bold", marginBottom: 2 }}>
          🗺️ UltraBareLeafletTest — DIAGNOSTIC
        </div>
        <div>ENV: <b style={{ color: diag.env === "preview" ? "#f90" : "#0f0" }}>{diag.env}</b></div>
        <div>IFRAME: <b style={{ color: diag.isIframe ? "#f90" : "#0f0" }}>{diag.isIframe ? "YES" : "NO"}</b></div>
        <div>PAGE VISIBLE: <b style={{ color: diag.pageVisible ? "#0f0" : "#f55" }}>{diag.pageVisible ? "YES" : "NO"}</b></div>
        <div>VIEWPORT: {diag.viewportW}x{diag.viewportH} @{diag.dpr}x</div>
        <div>CONTAINER: <b>{diag.containerSize}</b></div>
        <div>MOUNT ATTEMPT: {diag.mountAttempt}</div>
        <div>PHASE: {diag.phase}</div>
        <hr style={{ borderColor: "#333", margin: "3px 0" }} />
        <div>LEAFLET INIT: {diag.leafletInited ? "✅" : "❌"}</div>
        <div>WHEN READY: {diag.whenReadyFired ? "✅" : "❌"}</div>
        <div>.leaflet-container: {diag.hasLeafletContainer ? "✅" : "❌"}</div>
        <div>.control-container: {diag.hasControlContainer ? "✅" : "❌"}</div>
        <div>.tile-pane: {diag.hasTilePane ? "✅" : "❌"}</div>
        <div>TILE IMGS: @0ms={diag.tileCount0} @500={diag.tileCount500} @1k={diag.tileCount1000} @2k={diag.tileCount2000}</div>
        <hr style={{ borderColor: "#333", margin: "3px 0" }} />
        <div style={{ color: "#888", fontSize: 9 }}>URL: {diag.currentUrl.slice(0, 60)}</div>
        <div style={{ color: "#888", fontSize: 9 }}>UA: {diag.userAgent}</div>
        {diag.parentChain.map((p, i) => (
          <div key={i} style={{ color: "#aaa", fontSize: 9 }}>{p}</div>
        ))}
        {diag.error && <div style={{ color: "#f55", fontWeight: "bold" }}>ERROR: {diag.error}</div>}
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: "relative",
          minHeight: "60vh",
          width: "100%",
          background: "#336699",
          border: "3px solid #ff00ff",
          zIndex: 1,
        }}
      />
    </div>
  );
};

export default UltraBareLeafletTest;
