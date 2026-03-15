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
const MAP_DEBUG_PREFIX = "[MapDebug]";

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
  hasMapPane: boolean;
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
  if (url.includes("preview--") || (url.includes("lovable.app") && url.includes("preview"))) return "preview";
  if (url.includes("localhost") || url.includes("127.0.0.1")) return "dev";
  return "prod";
}

function mapDebug(message: string, payload?: unknown) {
  if (payload === undefined) {
    console.info(`${MAP_DEBUG_PREFIX} ${message}`);
    return;
  }
  console.info(`${MAP_DEBUG_PREFIX} ${message}`, payload);
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
  hasMapPane: false,
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

function inspectParentChain(el: HTMLElement | null, levels = 3): string[] {
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
  const renderCountRef = useRef(0);
  const [diag, setDiag] = useState<DiagState>(INIT);

  renderCountRef.current += 1;
  if (renderCountRef.current <= 6) {
    mapDebug("UltraBareLeafletTest render", {
      renderCount: renderCountRef.current,
      route: window.location.pathname,
      env: detectEnv(),
      pageVisible: !document.hidden,
    });
  }

  useEffect(() => {
    mapDebug("UltraBareLeafletTest init effect start");

    const el = containerRef.current;
    if (!el) {
      mapDebug("early return: containerRef missing");
      return;
    }

    let cancelled = false;
    let mapCreatedAt: number | null = null;
    const timers: number[] = [];

    const logAndSet = (updates: Partial<DiagState>) => {
      mapDebug("diag update", updates);
      if (!cancelled) setDiag((d) => ({ ...d, ...updates }));
    };

    const logDomProbe = (stage: string) => {
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const hiddenAncestor = el.closest("[hidden], [aria-hidden='true']");
      const probe = {
        stage,
        route: window.location.pathname,
        container: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity,
          position: cs.position,
          zIndex: cs.zIndex,
          overflow: cs.overflow,
        },
        parentChain: inspectParentChain(el, 3),
        selectors: {
          leafletContainer: !!el.querySelector(".leaflet-container") || el.classList.contains("leaflet-container"),
          controlContainer: !!el.querySelector(".leaflet-control-container"),
          mapPane: !!el.querySelector(".leaflet-map-pane"),
          tilePane: !!el.querySelector(".leaflet-tile-pane"),
          tileImages: el.querySelectorAll(".leaflet-tile-pane img").length,
        },
        hiddenAncestor: hiddenAncestor ? `${hiddenAncestor.tagName}.${hiddenAncestor.className}` : null,
      };
      mapDebug("DOM probe", probe);

      logAndSet({
        hasLeafletContainer: probe.selectors.leafletContainer,
        hasControlContainer: probe.selectors.controlContainer,
        hasMapPane: probe.selectors.mapPane,
        hasTilePane: probe.selectors.tilePane,
      });
    };

    mapDebug("environment snapshot", {
      env: detectEnv(),
      currentUrl: window.location.href,
      isIframe: window.self !== window.top,
      userAgent: navigator.userAgent,
      dpr: window.devicePixelRatio,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pageVisible: !document.hidden,
      visibilityState: document.visibilityState,
    });

    const tryInit = (attempt: number) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const size = `${w}x${h}`;

      mapDebug("map init effect start", {
        attempt,
        containerRefExists: !!containerRef.current,
        containerSize: size,
        rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        position: cs.position,
        zIndex: cs.zIndex,
        overflow: cs.overflow,
      });

      const chain = inspectParentChain(el, 3);
      logAndSet({ containerSize: size, parentChain: chain, phase: "measured", mountAttempt: attempt });

      if (w === 0 || h === 0) {
        mapDebug("early return: container-zero-size", { attempt, size });
        logAndSet({ error: `Container is ${size} — cannot init Leaflet (attempt ${attempt})` });
        if (attempt < 2) {
          timers.push(window.setTimeout(() => {
            if (!cancelled) tryInit(attempt + 1);
          }, 500));
        }
        return;
      }

      if (mapRef.current) {
        mapDebug("cleanup previous map instance before retry", { attempt });
        mapRef.current.remove();
        mapRef.current = null;
      }

      try {
        mapDebug("calling L.map(...)", { attempt });
        const map = L.map(el, {
          center: HARDCODED_CENTER,
          zoom: HARDCODED_ZOOM,
          zoomControl: true,
          attributionControl: true,
        });

        mapCreatedAt = performance.now();
        mapRef.current = map;
        mapDebug("L.map(...) succeeded");
        logAndSet({ leafletInited: true, phase: "leaflet-created" });

        const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        });

        tileLayer.on("loading", () => mapDebug("tile event: loading"));
        tileLayer.on("tileloadstart", (event: any) => {
          mapDebug("tile event: tileloadstart", {
            src: event?.tile?.src || null,
            coords: event?.coords || null,
          });
        });
        tileLayer.on("tileload", (event: any) => {
          mapDebug("tile event: tileload", { src: event?.tile?.src || null });
        });
        tileLayer.on("load", () => mapDebug("tile event: load"));
        tileLayer.on("tileerror", (event: any) => {
          mapDebug("tile event: tileerror", {
            src: event?.tile?.src || null,
            error: event?.error || null,
          });
        });

        tileLayer.addTo(map);
        mapDebug("tile layer added");

        L.marker(HARDCODED_CENTER).addTo(map).bindPopup("🌿 Bare map is alive");

        map.whenReady(() => {
          if (cancelled) return;
          mapDebug("map.whenReady fired", {
            center: map.getCenter(),
            zoom: map.getZoom(),
          });
          logAndSet({ whenReadyFired: true, phase: "ready" });
          logDomProbe("whenReady");
        });

        requestAnimationFrame(() => logDomProbe("raf-post-init"));

        const countAt = (ms: number, key: keyof DiagState) => {
          const t = window.setTimeout(() => {
            if (cancelled) return;
            const count = countTileImages(el);
            mapDebug(`tile <img> count @${ms}ms`, { count });
            setDiag((d) => ({ ...d, [key]: count }));
          }, ms);
          timers.push(t);
        };

        countAt(0, "tileCount0");
        countAt(500, "tileCount500");
        countAt(1000, "tileCount1000");
        countAt(2000, "tileCount2000");

        requestAnimationFrame(() => map.invalidateSize());
        [100, 300, 500, 1000, 1500, 3000].forEach((ms) => {
          timers.push(window.setTimeout(() => {
            if (!cancelled && mapRef.current) {
              mapDebug("invalidateSize()", { atMs: ms });
              mapRef.current.invalidateSize();
            }
          }, ms));
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        mapDebug("L.map(...) failed", { error: msg });
        logAndSet({ error: msg, phase: "error" });
      }
    };

    const isPreview = detectEnv() === "preview" || window.self !== window.top;
    const initDelay = isPreview ? 300 : 0;

    const startTimer = window.setTimeout(() => {
      if (cancelled) return;

      let initDone = false;
      const ro = new ResizeObserver((entries) => {
        if (initDone || cancelled) return;
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          mapDebug("ResizeObserver tick", { width, height });
          if (width > 0 && height > 0) {
            initDone = true;
            ro.disconnect();
            tryInit(1);
            return;
          }
        }
      });
      ro.observe(el);

      const fallback = window.setTimeout(() => {
        if (initDone || cancelled) return;
        initDone = true;
        ro.disconnect();
        mapDebug("ResizeObserver timeout — forcing init");
        tryInit(1);
      }, 2000);
      timers.push(fallback);
    }, initDelay);
    timers.push(startTimer);

    const onVisChange = () => {
      const pageVisible = !document.hidden;
      logAndSet({ pageVisible });
      mapDebug("visibilitychange", { pageVisible, state: document.visibilityState });
      if (pageVisible && mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisChange);
      timers.forEach((t) => window.clearTimeout(t));

      const lifetimeMs = mapCreatedAt ? Math.round(performance.now() - mapCreatedAt) : null;
      mapDebug("cleanup", {
        ranImmediately: lifetimeMs !== null && lifetimeMs < 250,
        lifetimeMs,
        hadMap: !!mapRef.current,
      });

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
        background: "hsl(0 0% 10%)",
      }}
    >
      {/* Diagnostic badge */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 10001,
          background: "hsl(0 0% 0% / 0.9)",
          color: "hsl(120 100% 50%)",
          fontFamily: "monospace",
          fontSize: 10,
          lineHeight: 1.5,
          padding: "6px 10px",
          borderRadius: 6,
          border: "2px solid hsl(120 100% 50%)",
          maxWidth: "90vw",
          overflow: "auto",
          maxHeight: "45vh",
          pointerEvents: "none",
        }}
      >
        <div style={{ color: "hsl(60 100% 50%)", fontWeight: "bold", marginBottom: 2 }}>
          🗺️ UltraBareLeafletTest — DIAGNOSTIC
        </div>
        <div>ENV: <b style={{ color: diag.env === "preview" ? "hsl(30 100% 50%)" : "hsl(120 100% 50%)" }}>{diag.env}</b></div>
        <div>IFRAME: <b style={{ color: diag.isIframe ? "hsl(30 100% 50%)" : "hsl(120 100% 50%)" }}>{diag.isIframe ? "YES" : "NO"}</b></div>
        <div>PAGE VISIBLE: <b style={{ color: diag.pageVisible ? "hsl(120 100% 50%)" : "hsl(0 100% 65%)" }}>{diag.pageVisible ? "YES" : "NO"}</b></div>
        <div>VIEWPORT: {diag.viewportW}x{diag.viewportH} @{diag.dpr}x</div>
        <div>CONTAINER: <b>{diag.containerSize}</b></div>
        <div>MOUNT ATTEMPT: {diag.mountAttempt}</div>
        <div>PHASE: {diag.phase}</div>
        <hr style={{ borderColor: "hsl(0 0% 20%)", margin: "3px 0" }} />
        <div>LEAFLET INIT: {diag.leafletInited ? "✅" : "❌"}</div>
        <div>WHEN READY: {diag.whenReadyFired ? "✅" : "❌"}</div>
        <div>.leaflet-container: {diag.hasLeafletContainer ? "✅" : "❌"}</div>
        <div>.control-container: {diag.hasControlContainer ? "✅" : "❌"}</div>
        <div>.map-pane: {diag.hasMapPane ? "✅" : "❌"}</div>
        <div>.tile-pane: {diag.hasTilePane ? "✅" : "❌"}</div>
        <div>TILE IMGS: @0ms={diag.tileCount0} @500={diag.tileCount500} @1k={diag.tileCount1000} @2k={diag.tileCount2000}</div>
        <hr style={{ borderColor: "hsl(0 0% 20%)", margin: "3px 0" }} />
        <div style={{ color: "hsl(0 0% 55%)", fontSize: 9 }}>URL: {diag.currentUrl.slice(0, 72)}</div>
        <div style={{ color: "hsl(0 0% 55%)", fontSize: 9 }}>UA: {diag.userAgent}</div>
        {diag.parentChain.map((p, i) => (
          <div key={i} style={{ color: "hsl(0 0% 66%)", fontSize: 9 }}>{p}</div>
        ))}
        {diag.error && <div style={{ color: "hsl(0 100% 65%)", fontWeight: "bold" }}>ERROR: {diag.error}</div>}
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: "relative",
          minHeight: "60vh",
          width: "100%",
          background: "hsl(210 45% 40%)",
          border: "2px solid hsl(330 100% 50%)",
          zIndex: 1,
        }}
      />
    </div>
  );
};

export default UltraBareLeafletTest;
