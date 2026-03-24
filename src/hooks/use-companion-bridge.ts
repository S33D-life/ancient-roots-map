import { useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompanion } from "@/contexts/CompanionContext";
import type { CompanionRoom } from "@/lib/companion-types";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";

/**
 * useCompanionBridge — placed inside BrowserRouter, wires up global
 * desktop-side handlers so companion commands actually DO things.
 *
 * This is the missing link: it maps navigate_room to React Router,
 * toggle_fullscreen to the Fullscreen API, and shows toasts for feedback.
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

/** Detect which "room" the desktop is currently in based on pathname */
function detectRoom(pathname: string): CompanionRoom {
  if (pathname.startsWith("/map") || pathname.startsWith("/tree/")) return "map";
  if (pathname.includes("staff")) return "staff";
  if (pathname.startsWith("/ledger")) return "ledger";
  if (pathname.startsWith("/library")) return "gallery";
  return "unknown";
}

export function useCompanionBridge() {
  const { paired, registerHandlers, broadcastRoomState, session } = useCompanion();
  const navigate = useNavigate();
  const location = useLocation();
  const lastToastRef = useRef(0);

  // Broadcast room state whenever route changes and we're paired
  useEffect(() => {
    if (!paired) return;
    const room = detectRoom(location.pathname);
    broadcastRoomState({
      room,
      isFullscreen: !!document.fullscreenElement,
      activeItemLabel: document.title,
    });
  }, [paired, location.pathname, broadcastRoomState]);

  // Show a brief desktop toast for command feedback (throttled)
  const showCommandFeedback = useCallback((label: string) => {
    const now = Date.now();
    // Throttle toasts to max 1 per 800ms
    if (now - lastToastRef.current < 800) return;
    lastToastRef.current = now;
    toast("📱 " + label, { duration: 1500, position: "bottom-right" });
  }, []);

  // Register global handlers when paired
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
      onPointerMove: (x: number, y: number) => {
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
  }, [paired, registerHandlers, navigate, showCommandFeedback]);

  return { paired, session };
}
