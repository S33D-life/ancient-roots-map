import {
  Maximize2, Minimize2, ChevronLeft, ChevronRight,
  Camera, X,
} from "lucide-react";
import type { CompanionCommand, CompanionRoomState } from "@/lib/companion-types";
import ControlButton from "./ControlButton";

interface GalleryControllerProps {
  roomState: CompanionRoomState;
  send: (cmd: CompanionCommand) => void;
}

export default function GalleryController({ roomState, send }: GalleryControllerProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-serif text-primary text-center">Gallery</h3>

      {/* Navigate */}
      <div className="flex items-center justify-center gap-4">
        <ControlButton icon={ChevronLeft} label="Previous" onPress={() => send({ type: "previous" })} large />
        <ControlButton icon={ChevronRight} label="Next" onPress={() => send({ type: "next" })} large />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        <ControlButton
          icon={roomState.isFullscreen ? Minimize2 : Maximize2}
          label="Fullscreen"
          onPress={() => send({ type: "toggle_fullscreen" })}
        />
        <ControlButton icon={Camera} label="Capture" onPress={() => send({ type: "export_view" })} />
        <ControlButton icon={X} label="Close" onPress={() => send({ type: "close_panel" })} />
      </div>

      {roomState.activeItemLabel && (
        <p className="text-xs text-muted-foreground text-center truncate">
          {roomState.activeItemLabel}
        </p>
      )}
    </div>
  );
}
