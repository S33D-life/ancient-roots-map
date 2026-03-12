import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, MapPin, Camera,
} from "lucide-react";
import type { CompanionCommand, CompanionRoomState } from "@/lib/companion-types";
import ControlButton from "./ControlButton";

interface MapControllerProps {
  roomState: CompanionRoomState;
  send: (cmd: CompanionCommand) => void;
}

export default function MapController({ roomState, send }: MapControllerProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-serif text-primary text-center">Map Room</h3>

      {/* Zoom */}
      <div className="flex items-center justify-center gap-3">
        <ControlButton icon={ZoomOut} label="Zoom out" onPress={() => send({ type: "zoom_out" })} />
        <ControlButton icon={RotateCcw} label="Reset" onPress={() => send({ type: "zoom_reset" })} size="sm" />
        <ControlButton icon={ZoomIn} label="Zoom in" onPress={() => send({ type: "zoom_in" })} />
      </div>

      {/* Pan pad */}
      <div className="grid grid-cols-3 gap-2 w-[160px] mx-auto">
        <div />
        <ControlButton icon={ChevronLeft} label="Pan up" onPress={() => send({ type: "pan", dx: 0, dy: 50 })} className="rotate-90" />
        <div />
        <ControlButton icon={ChevronLeft} label="Pan left" onPress={() => send({ type: "pan", dx: 50, dy: 0 })} />
        <ControlButton icon={MapPin} label="Focus" onPress={() => send({ type: "zoom_reset" })} size="sm" />
        <ControlButton icon={ChevronRight} label="Pan right" onPress={() => send({ type: "pan", dx: -50, dy: 0 })} />
        <div />
        <ControlButton icon={ChevronRight} label="Pan down" onPress={() => send({ type: "pan", dx: 0, dy: -50 })} className="rotate-90" />
        <div />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3">
        <ControlButton icon={ChevronLeft} label="Previous tree" onPress={() => send({ type: "previous" })} />
        <ControlButton icon={ChevronRight} label="Next tree" onPress={() => send({ type: "next" })} />
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
