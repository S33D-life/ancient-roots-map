import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompanion } from "@/contexts/CompanionContext";
import type { CompanionRoom } from "@/lib/companion-types";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";
import { captureAndExport } from "@/lib/capture-view";

/**
 * useCompanionBridge — desktop-side handler that maps companion commands
 * to actual desktop actions including map-specific pan/zoom/locate.
 */

const ROOM_ROUTES: Record<CompanionRoom, string> = {
  map: ROUTES.MAP,
  staff: ROUTES.STAFF_ROOM,
  gallery: ROUTES.LIBRARY,
  ledger: "/ledger",
  tree: ROUTES.MAP,
  card: ROUTES.LIBRARY,
  unknown: ROUTES.HOME,
};

function detectRoom(pathname: string): CompanionRoom {
  if (pathname.startsWith("/map") || pathname.startsWith("/tree/")) return "map";
  if (pathname.includes("staff")) return "staff";
  if (pathname.startsWith("/ledger")) return "ledger";
  if (pathname.startsWith("/library")) return "gallery";
  return "unknown";
}

interface PointerAccumulator {
  x: number;
  y: number;
}

export function useCompanionBridge() {
  const { paired, registerHandlers, broadcastRoomState, session } = useCompanion();
  const navigate = useNavigate();
  const location = useLocation();
  const lastToastRef = useRef(0);
  const pointerRef = useRef<PointerAccumulator>({ x: 0.5, y: 0.5 });
  const dragActiveRef = useRef(false);
  const [debugInfo, setDebugInfo] = useState({
    lastEvent: "",
    pointerX: 0.5,
    pointerY: 0.5,
    scrollDx: 0,
    scrollDy: 0,
  });

  useEffect(() => {
    if (!paired) return;
    const room = detectRoom(location.pathname);
    broadcastRoomState({
      room,
      isFullscreen: !!document.fullscreenElement,
      activeItemLabel: document.title,
    });
  }, [paired, location.pathname, broadcastRoomState]);

  const showCommandFeedback = useCallback((label: string) => {
    const now = Date.now();
    if (now - lastToastRef.current < 800) return;
    lastToastRef.current = now;
    toast("📱 " + label, { duration: 1500, position: "bottom-right" });
  }, []);

  const dispatchMouseAt = useCallback((type: string, p: PointerAccumulator) => {
    const absX = p.x * window.innerWidth;
    const absY = p.y * window.innerHeight;
    const el = document.elementFromPoint(absX, absY);
    if (el) {
      el.dispatchEvent(new MouseEvent(type, {
        clientX: absX,
        clientY: absY,
        bubbles: true,
        cancelable: true,
        view: window,
      }));
    }
  }, []);

  useEffect(() => {
    if (!paired) return;

    registerHandlers({
      onNavigateRoom: (room: string) => {
        const route = ROOM_ROUTES[room as CompanionRoom] ?? "/";
        navigate(route);
        showCommandFeedback(`Navigating to ${room}`);
      },
      onZoomIn: () => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "zoom_in" } }));
        showCommandFeedback("Zoom in");
      },
      onZoomOut: () => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "zoom_out" } }));
        showCommandFeedback("Zoom out");
      },
      onZoomReset: () => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "zoom_reset" } }));
        showCommandFeedback("View reset");
      },
      onPan: (dx: number, dy: number) => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "pan", dx, dy } }));
      },

      // Map-specific pan — dispatches to Leaflet via the same event system
      onMapPan: (dx: number, dy: number) => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "map_pan", dx, dy } }));
      },

      // Map-specific zoom — continuous zoom delta
      onMapZoom: (delta: number) => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "map_zoom", delta } }));
      },

      // Locate me — triggers geolocation on desktop
      onLocateMe: () => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "locate_me" } }));
        showCommandFeedback("Locating…");
      },

      onFocusTree: (treeId: string) => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "focus_tree", treeId } }));
        showCommandFeedback("Focusing tree");
      },
      onNext: () => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "next" } }));
        showCommandFeedback("Next");
      },
      onPrevious: () => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "previous" } }));
        showCommandFeedback("Previous");
      },
      onToggleFullscreen: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
          showCommandFeedback("Exiting fullscreen");
        } else {
          document.documentElement.requestFullscreen?.();
          showCommandFeedback("Entering fullscreen");
        }
      },
      onEnterFullscreen: () => {
        document.documentElement.requestFullscreen?.();
        showCommandFeedback("Entering fullscreen");
      },
      onExitFullscreen: () => {
        document.exitFullscreen?.();
        showCommandFeedback("Exiting fullscreen");
      },

      // Relative pointer delta
      onPointerDelta: (dx: number, dy: number) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const p = pointerRef.current;
        p.x = Math.max(0, Math.min(1, p.x + dx / vw));
        p.y = Math.max(0, Math.min(1, p.y + dy / vh));

        window.dispatchEvent(
          new CustomEvent("s33d-companion-cmd", {
            detail: { type: "pointer_move", x: p.x, y: p.y },
          }),
        );

        if (dragActiveRef.current) {
          dispatchMouseAt("mousemove", p);
        }

        setDebugInfo(d => ({
          ...d,
          lastEvent: dragActiveRef.current ? "drag_move" : "pointer_delta",
          pointerX: Math.round(p.x * 100) / 100,
          pointerY: Math.round(p.y * 100) / 100,
        }));
      },

      // Click — uses current pointer position (from pointerRef), not payload coords.
      // Searches a wider area to find interactive elements reliably.
      onPointerClick: (_x: number, _y: number) => {
        const p = pointerRef.current;
        const absX = p.x * window.innerWidth;
        const absY = p.y * window.innerHeight;

        window.dispatchEvent(
          new CustomEvent("s33d-companion-cmd", { detail: { type: "pointer_click" } }),
        );

        // Search in expanding radius for interactive elements
        let bestEl: HTMLElement | null = null;
        let bestPriority = 0;
        const radii = [0, 6, 12, 18, 24];
        const angles = [0, 45, 90, 135, 180, 225, 270, 315];

        const classify = (el: Element | null): number => {
          if (!el || !(el instanceof HTMLElement)) return 0;
          // Priority 4: tree markers (highest)
          if (el.closest(".leaflet-marker-icon, .tree-marker, [data-tree-id], .leaflet-interactive")) return 4;
          // Priority 3: buttons and links
          if (el.closest("button, a, [role='button'], [role='tab'], [role='menuitem']")) return 3;
          // Priority 2: inputs and interactive controls
          if (el.closest("input, select, textarea, [role='checkbox'], [role='switch'], [role='slider']")) return 2;
          // Priority 1: any clickable-looking element
          if (el.closest("[onclick], [data-state], [role='dialog'] *, .cursor-pointer")) return 1;
          return 0;
        };

        // Check exact center first
        const centerEl = document.elementFromPoint(absX, absY);
        const centerPri = classify(centerEl);
        if (centerPri > 0) {
          bestEl = (centerEl as HTMLElement).closest(
            ".leaflet-marker-icon, .tree-marker, [data-tree-id], button, a, [role='button'], [role='tab'], [role='menuitem'], input, select, textarea, [role='checkbox'], [role='switch'], [role='slider'], [onclick], [data-state], .cursor-pointer"
          ) as HTMLElement || centerEl as HTMLElement;
          bestPriority = centerPri;
        }

        // Search expanding rings if we haven't found a high-priority target
        if (bestPriority < 3) {
          for (const r of radii) {
            if (r === 0) continue;
            for (const a of angles) {
              const rad = (a * Math.PI) / 180;
              const ox = Math.cos(rad) * r;
              const oy = Math.sin(rad) * r;
              const el = document.elementFromPoint(absX + ox, absY + oy);
              const pri = classify(el);
              if (pri > bestPriority) {
                bestPriority = pri;
                const resolved = pri >= 3
                  ? (el as HTMLElement).closest(
                      ".leaflet-marker-icon, .tree-marker, [data-tree-id], button, a, [role='button'], [role='tab'], [role='menuitem']"
                    ) as HTMLElement || el as HTMLElement
                  : el as HTMLElement;
                bestEl = resolved;
                if (pri >= 4) break;
              }
            }
            if (bestPriority >= 4) break;
          }
        }

        // Fallback to exact point
        if (!bestEl) {
          bestEl = document.elementFromPoint(absX, absY) as HTMLElement;
        }

        if (bestEl) {
          // Dispatch full pointer event sequence for better framework compatibility
          const eventInit: MouseEventInit = {
            clientX: absX,
            clientY: absY,
            bubbles: true,
            cancelable: true,
            view: window,
          };
          bestEl.dispatchEvent(new PointerEvent("pointerdown", { ...eventInit, pointerId: 1 }));
          bestEl.dispatchEvent(new MouseEvent("mousedown", eventInit));
          bestEl.dispatchEvent(new PointerEvent("pointerup", { ...eventInit, pointerId: 1 }));
          bestEl.dispatchEvent(new MouseEvent("mouseup", eventInit));
          bestEl.dispatchEvent(new MouseEvent("click", eventInit));
          bestEl.focus?.();
        }

        setDebugInfo(d => ({ ...d, lastEvent: `click:${bestPriority}` }));
      },

      // Scroll
      onScroll: (dx: number, dy: number) => {
        const p = pointerRef.current;
        const absX = p.x * window.innerWidth;
        const absY = p.y * window.innerHeight;

        let target = document.elementFromPoint(absX, absY) as HTMLElement | null;
        let scrolled = false;

        while (target && !scrolled) {
          const { overflowY, overflowX } = getComputedStyle(target);
          const canScrollY = (overflowY === "auto" || overflowY === "scroll") && target.scrollHeight > target.clientHeight;
          const canScrollX = (overflowX === "auto" || overflowX === "scroll") && target.scrollWidth > target.clientWidth;
          if (canScrollY || canScrollX) {
            target.scrollBy({ left: -dx, top: -dy });
            scrolled = true;
          }
          target = target.parentElement;
        }
        if (!scrolled) {
          window.scrollBy({ left: -dx, top: -dy });
        }

        window.dispatchEvent(
          new CustomEvent("s33d-companion-cmd", { detail: { type: "scroll", dx, dy } }),
        );

        setDebugInfo(d => ({ ...d, lastEvent: "scroll", scrollDx: Math.round(dx), scrollDy: Math.round(dy) }));
      },

      // Drag
      onDragStart: () => {
        dragActiveRef.current = true;
        dispatchMouseAt("mousedown", pointerRef.current);
        setDebugInfo(d => ({ ...d, lastEvent: "drag_start" }));
      },
      onDragMove: (dx: number, dy: number) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const p = pointerRef.current;
        p.x = Math.max(0, Math.min(1, p.x + dx / vw));
        p.y = Math.max(0, Math.min(1, p.y + dy / vh));
        window.dispatchEvent(
          new CustomEvent("s33d-companion-cmd", { detail: { type: "pointer_move", x: p.x, y: p.y } }),
        );
        dispatchMouseAt("mousemove", p);
      },
      onDragEnd: () => {
        dragActiveRef.current = false;
        dispatchMouseAt("mouseup", pointerRef.current);
        setDebugInfo(d => ({ ...d, lastEvent: "drag_end" }));
      },

      // Legacy
      onPointerMove: (x: number, y: number) => {
        pointerRef.current = { x, y };
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "pointer_move", x, y } }));
      },
      onPointerHide: () => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "pointer_hide" } }));
      },

      onExportView: () => {
        showCommandFeedback("Capturing…");
        captureAndExport();
      },
      onOpenPanel: () => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "open_panel" } }));
        showCommandFeedback("Opening panel");
      },
      onClosePanel: () => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "close_panel" } }));
        showCommandFeedback("Closing panel");
      },
      onSendToDesktop: (_type: string, _id: string, label?: string) => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "send_to_desktop", entityType: _type, entityId: _id, label } }));
        showCommandFeedback(`Received: ${label || "item"}`);
      },
    });
  }, [paired, registerHandlers, navigate, showCommandFeedback, dispatchMouseAt]);

  return { paired, session, debugInfo };
}
