import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompanion } from "@/contexts/CompanionContext";
import type { CompanionRoom } from "@/lib/companion-types";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";

/**
 * useCompanionBridge — desktop-side handler that maps companion commands
 * to actual desktop actions: navigation, pointer, scroll, click, drag, fullscreen.
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

  /** Dispatch a synthetic mouse event at the pointer position */
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

        // If dragging, also dispatch mousemove
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

      // Click
      onPointerClick: (_x: number, _y: number) => {
        const p = pointerRef.current;
        const absX = p.x * window.innerWidth;
        const absY = p.y * window.innerHeight;

        // Dispatch click event for the orb pulse
        window.dispatchEvent(
          new CustomEvent("s33d-companion-cmd", { detail: { type: "pointer_click" } }),
        );

        const el = document.elementFromPoint(absX, absY);
        if (el && el instanceof HTMLElement) {
          el.click();
          el.focus?.();
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

      // Drag lifecycle
      onDragStart: () => {
        dragActiveRef.current = true;
        const p = pointerRef.current;
        dispatchMouseAt("mousedown", p);
        setDebugInfo(d => ({ ...d, lastEvent: "drag_start" }));
      },
      onDragMove: (dx: number, dy: number) => {
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
        dispatchMouseAt("mousemove", p);
      },
      onDragEnd: () => {
        dragActiveRef.current = false;
        const p = pointerRef.current;
        dispatchMouseAt("mouseup", p);
        setDebugInfo(d => ({ ...d, lastEvent: "drag_end" }));
      },

      // Legacy absolute pointer
      onPointerMove: (x: number, y: number) => {
        pointerRef.current = { x, y };
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "pointer_move", x, y } }));
      },
      onPointerHide: () => {
        window.dispatchEvent(new CustomEvent("s33d-companion-cmd", { detail: { type: "pointer_hide" } }));
      },

      onExportView: () => showCommandFeedback("Capture requested"),
      onOpenPanel: () => showCommandFeedback("Opening panel"),
      onClosePanel: () => showCommandFeedback("Closing panel"),
      onSendToDesktop: (_type: string, _id: string, label?: string) => {
        showCommandFeedback(`Received: ${label || "item"}`);
      },
    });
  }, [paired, registerHandlers, navigate, showCommandFeedback, dispatchMouseAt]);

  return { paired, session, debugInfo };
}
