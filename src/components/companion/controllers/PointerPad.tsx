import { useRef, useCallback } from "react";
import { Crosshair } from "lucide-react";
import type { CompanionCommand } from "@/lib/companion-types";

/**
 * Touch pad that sends normalised pointer coordinates (0-1)
 * from the mobile controller to the desktop.
 */

interface PointerPadProps {
  send: (cmd: CompanionCommand) => void;
}

export default function PointerPad({ send }: PointerPadProps) {
  const padRef = useRef<HTMLDivElement>(null);

  const sendPos = useCallback(
    (clientX: number, clientY: number) => {
      const pad = padRef.current;
      if (!pad) return;
      const rect = pad.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      send({ type: "pointer_move", x, y });
    },
    [send],
  );

  const handleTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) sendPos(t.clientX, t.clientY);
    },
    [sendPos],
  );

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      if (e.buttons !== 1) return;
      sendPos(e.clientX, e.clientY);
    },
    [sendPos],
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-serif">
        <Crosshair className="w-3 h-3" />
        <span>Pointer Pad</span>
      </div>
      <div
        ref={padRef}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        onTouchEnd={() => send({ type: "pointer_hide" })}
        onMouseDown={handleMouse}
        onMouseMove={handleMouse}
        onMouseUp={() => send({ type: "pointer_hide" })}
        onMouseLeave={() => send({ type: "pointer_hide" })}
        className="w-full aspect-video rounded-xl border border-border/40 bg-secondary/20
          touch-none cursor-crosshair relative overflow-hidden"
      >
        {/* Grid hint */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "25% 25%",
          }}
        />
      </div>
    </div>
  );
}
