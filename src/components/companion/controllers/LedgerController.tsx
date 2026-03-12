import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Camera, BarChart3,
} from "lucide-react";
import type { CompanionCommand, CompanionRoomState } from "@/lib/companion-types";
import ControlButton from "./ControlButton";

interface LedgerControllerProps {
  roomState: CompanionRoomState;
  send: (cmd: CompanionCommand) => void;
}

export default function LedgerController({ roomState, send }: LedgerControllerProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-serif text-primary text-center">Ledger</h3>

      {/* Zoom */}
      <div className="flex items-center justify-center gap-3">
        <ControlButton icon={ZoomOut} label="Zoom out" onPress={() => send({ type: "zoom_out" })} />
        <ControlButton icon={RotateCcw} label="Reset" onPress={() => send({ type: "zoom_reset" })} size="sm" />
        <ControlButton icon={ZoomIn} label="Zoom in" onPress={() => send({ type: "zoom_in" })} />
      </div>

      {/* Pan */}
      <div className="flex items-center justify-center gap-3">
        <ControlButton icon={ChevronLeft} label="Pan left" onPress={() => send({ type: "pan", dx: 60, dy: 0 })} />
        <ControlButton icon={BarChart3} label="Select chart" onPress={() => send({ type: "open_panel" })} size="sm" />
        <ControlButton icon={ChevronRight} label="Pan right" onPress={() => send({ type: "pan", dx: -60, dy: 0 })} />
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
    </div>
  );
}
