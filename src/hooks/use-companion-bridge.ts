import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompanion } from "@/contexts/CompanionContext";
import type { CompanionRoom } from "@/lib/companion-types";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";

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

      // Click — prioritise tree markers by searching for closest interactive element
      onPointerClick: (_x: number, _y: number) => {
        const p = pointerRef.current;
        const absX = p.x * window.innerWidth;
        const absY = p.y * window.innerHeight;

        window.dispatchEvent(
          new CustomEvent("s33d-companion-cmd", { detail: { type: "pointer_click" } }),
        );

        // Try to find a tree marker first (they have data attributes or specific classes)
        // Sample a small area around the click point to bias toward markers
        let bestEl: HTMLElement | null = null;
        const searchRadius = 8;
        const offsets = [
          [0, 0], [-searchRadius, 0], [searchRadius, 0], [0, -searchRadius], [0, searchRadius],
          [-searchRadius, -searchRadius], [searchRadius, -searchRadius],
          [-searchRadius, searchRadius], [searchRadius, searchRadius],
        ];

        for (const [ox, oy] of offsets) {
          const el = document.elementFromPoint(absX + ox, absY + oy);
          if (el instanceof HTMLElement) {
            // Prefer elements that look like tree markers or interactive elements
            const isMarker = el.closest(".leaflet-marker-icon, .tree-marker, [data-tree-id], .leaflet-interactive");
            const isButton = el.closest("button, a, [role='button']");
            if (isMarker || isButton) {
              bestEl = (isMarker || isButton) as HTMLElement;
              break;
            }
          }
        }

        // Fallback to exact point
        if (!bestEl) {
          bestEl = document.elementFromPoint(absX, absY) as HTMLElement;
        }

        if (bestEl) {
          bestEl.click();
          bestEl.focus?.();
        }

        setDebugInfo(d => ({ ...d, lastEvent: "click" }));
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

      onExportView: () => showCommandFeedback("Capture requested"),
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
