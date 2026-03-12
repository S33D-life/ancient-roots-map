import { Maximize2, Minimize2 } from "lucide-react";
import type { CompanionCommand } from "@/lib/companion-types";
import { hapticMedium } from "@/lib/haptics";

interface FullscreenToggleProps {
  isFullscreen: boolean;
  send: (cmd: CompanionCommand) => void;
}

export default function FullscreenToggle({ isFullscreen, send }: FullscreenToggleProps) {
  return (
    <button
      onClick={() => {
        hapticMedium();
        send({ type: "toggle_fullscreen" });
      }}
      className={`
        w-full py-3 rounded-xl text-sm font-serif min-h-[48px] flex items-center justify-center gap-2 transition-all
        ${isFullscreen
          ? "bg-primary/15 border border-primary/30 text-primary"
          : "bg-secondary/30 border border-border/30 text-foreground/80 hover:bg-secondary/50"
        }
      `}
    >
      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    </button>
  );
}
