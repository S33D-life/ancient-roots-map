import { useCallback, useRef } from "react";
import type { CompanionCommand } from "@/lib/companion-types";
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
  onPointerMove?: (x: number, y: number) => void;
  onPointerHide?: () => void;
  onPointerDelta?: (dx: number, dy: number) => void;
  onPointerClick?: (x: number, y: number) => void;
  onScroll?: (dx: number, dy: number) => void;
  onNavigateRoom?: (room: string) => void;
  onSendToDesktop?: (entityType: string, entityId: string, label?: string) => void;
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
      case "pointer_move": h.onPointerMove?.(cmd.x, cmd.y); break;
      case "pointer_hide": h.onPointerHide?.(); break;
      case "pointer_delta": h.onPointerDelta?.(cmd.dx, cmd.dy); break;
      case "pointer_click": h.onPointerClick?.(cmd.x, cmd.y); break;
      case "scroll": h.onScroll?.(cmd.dx, cmd.dy); break;
      case "navigate_room": h.onNavigateRoom?.(cmd.room); break;
      case "send_to_desktop": h.onSendToDesktop?.(cmd.entityType, cmd.entityId, cmd.label); break;
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
