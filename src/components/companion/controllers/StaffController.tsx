import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Camera, Eye,
} from "lucide-react";
import type { CompanionCommand, CompanionRoomState } from "@/lib/companion-types";
import ControlButton from "./ControlButton";

interface StaffControllerProps {
  roomState: CompanionRoomState;
  send: (cmd: CompanionCommand) => void;
}

export default function StaffController({ roomState, send }: StaffControllerProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-serif text-primary text-center">Staff Room</h3>

      {/* Zoom */}
      <div className="flex items-center justify-center gap-3">
        <ControlButton icon={ZoomOut} label="Zoom out" onPress={() => send({ type: "zoom_out" })} />
        <ControlButton icon={RotateCcw} label="Reset" onPress={() => send({ type: "zoom_reset" })} size="sm" />
        <ControlButton icon={ZoomIn} label="Zoom in" onPress={() => send({ type: "zoom_in" })} />
      </div>

      {/* Navigate staffs */}
      <div className="flex items-center justify-center gap-3">
        <ControlButton icon={ChevronLeft} label="Previous" onPress={() => send({ type: "previous" })} />
        <ControlButton icon={Eye} label="Focus" onPress={() => send({ type: "open_panel" })} />
        <ControlButton icon={ChevronRight} label="Next" onPress={() => send({ type: "next" })} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        <ControlButton
          icon={roomState.isFullscreen ? Minimize2 : Maximize2}
          label="Fullscreen"
          onPress={() => send({ type: "toggle_fullscreen" })}
        />
        <ControlButton icon={Camera} label="Capture" onPress={() => send({ type: "export_view" })} />
      </div>

      {roomState.activeItemLabel && (
        <p className="text-xs text-muted-foreground text-center truncate">
          {roomState.activeItemLabel}
        </p>
      )}
    </div>
  );
}
