import { useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompanion } from "@/contexts/CompanionContext";
import type { CompanionRoom } from "@/lib/companion-types";
import { toast } from "sonner";

/**
 * useCompanionBridge — placed inside BrowserRouter, wires up global
 * desktop-side handlers so companion commands actually DO things.
 *
 * This is the missing link: it maps navigate_room to React Router,
 * toggle_fullscreen to the Fullscreen API, and shows toasts for feedback.
 */

const ROOM_ROUTES: Record<CompanionRoom, string> = {
  map: "/map",
  staff: "/library/staff-room",
  gallery: "/library",
  ledger: "/ledger",
  tree: "/map",
  card: "/library",
  unknown: "/",
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
      onZoomIn: () => showCommandFeedback("Zoom in"),
      onZoomOut: () => showCommandFeedback("Zoom out"),
      onZoomReset: () => showCommandFeedback("View reset"),
      onPan: () => {}, // Handled silently — too frequent for toasts
      onNext: () => showCommandFeedback("Next"),
      onPrevious: () => showCommandFeedback("Previous"),
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
