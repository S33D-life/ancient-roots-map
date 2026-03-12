import { useCallback, useRef, useEffect } from "react";
import type { CompanionCommand, CompanionRoom, CompanionRoomState } from "@/lib/companion-types";
import { useCompanionSession } from "./use-companion-session";

/**
 * useCompanionDisplay — desktop-side hook that listens for companion commands
 * and dispatches them to registered room handlers.
 */

export interface RoomHandlers {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onPan?: (dx: number, dy: number) => void;
  onFocusTree?: (treeId: string) => void;
  onFocusStaff?: (staffCode: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleFullscreen?: () => void;
  onEnterFullscreen?: () => void;
  onExitFullscreen?: () => void;
  onOpenPanel?: () => void;
  onClosePanel?: () => void;
  onHighlightNode?: (nodeId: string) => void;
  onExportView?: () => void;
  onSelectChart?: (chartId: string) => void;
}

export function useCompanionDisplay() {
  const handlersRef = useRef<RoomHandlers>({});

  const handleCommand = useCallback((cmd: CompanionCommand) => {
    const h = handlersRef.current;
    switch (cmd.type) {
      case "zoom_in": h.onZoomIn?.(); break;
      case "zoom_out": h.onZoomOut?.(); break;
      case "zoom_reset": h.onZoomReset?.(); break;
      case "pan": h.onPan?.(cmd.dx, cmd.dy); break;
      case "focus_tree": h.onFocusTree?.(cmd.treeId); break;
      case "focus_staff": h.onFocusStaff?.(cmd.staffCode); break;
      case "next": h.onNext?.(); break;
      case "previous": h.onPrevious?.(); break;
      case "toggle_fullscreen": h.onToggleFullscreen?.(); break;
      case "enter_fullscreen": h.onEnterFullscreen?.(); break;
      case "exit_fullscreen": h.onExitFullscreen?.(); break;
      case "open_panel": h.onOpenPanel?.(); break;
      case "close_panel": h.onClosePanel?.(); break;
      case "highlight_node": h.onHighlightNode?.(cmd.nodeId); break;
      case "export_view": h.onExportView?.(); break;
      case "select_chart": h.onSelectChart?.(cmd.chartId); break;
    }
  }, []);

  const companion = useCompanionSession({
    role: "display",
    onCommand: handleCommand,
  });

  const registerHandlers = useCallback((handlers: RoomHandlers) => {
    handlersRef.current = handlers;
  }, []);

  return {
    ...companion,
    registerHandlers,
  };
}
