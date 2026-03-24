import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn, ZoomOut, RotateCcw, Crosshair, ChevronLeft, ChevronRight,
  TreePine, MapPin, ExternalLink, Heart,
} from "lucide-react";
import type { CompanionCommand, CompanionRoomState } from "@/lib/companion-types";
import { hapticTap } from "@/lib/haptics";

/**
 * Map-aware companion controller — compact quick actions + tree focus card.
 * Replaces the old bulky grid with a light strip and contextual tree info.
 */

interface MapControllerProps {
  roomState: CompanionRoomState;
  send: (cmd: CompanionCommand) => void;
}

function QuickBtn({
  icon: Icon,
  label,
  onPress,
  accent = false,
}: {
  icon: typeof ZoomIn;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={() => { hapticTap(); onPress(); }}
      className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-all active:scale-90"
      style={{
        background: accent ? "hsl(var(--primary) / 0.12)" : "hsl(var(--secondary) / 0.25)",
        border: `1px solid ${accent ? "hsl(var(--primary) / 0.25)" : "hsl(var(--border) / 0.2)"}`,
      }}
      title={label}
    >
      <Icon className="w-4 h-4" style={{ color: accent ? "hsl(var(--primary))" : undefined }} />
      <span className="text-[7px] text-muted-foreground leading-none">{label}</span>
    </button>
  );
}

export default function MapController({ roomState, send }: MapControllerProps) {
  const hasTree = !!roomState.activeItemLabel && roomState.activeItemLabel !== document.title;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Quick action strip */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        <QuickBtn icon={ZoomIn} label="Zoom +" onPress={() => send({ type: "zoom_in" })} />
        <QuickBtn icon={ZoomOut} label="Zoom −" onPress={() => send({ type: "zoom_out" })} />
        <QuickBtn icon={RotateCcw} label="Reset" onPress={() => send({ type: "zoom_reset" })} />
        <QuickBtn icon={Crosshair} label="Locate" onPress={() => send({ type: "locate_me" })} accent />
        <QuickBtn icon={ChevronLeft} label="Prev" onPress={() => send({ type: "previous" })} />
        <QuickBtn icon={ChevronRight} label="Next" onPress={() => send({ type: "next" })} />
      </div>

      {/* Tree focus card */}
      <AnimatePresence>
        {hasTree && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl p-2.5 flex items-center gap-2.5"
              style={{
                background: "linear-gradient(135deg, hsl(120 15% 12%), hsl(30 12% 11%))",
                border: "1px solid hsl(42 40% 40% / 0.25)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(42 50% 50% / 0.12)" }}
              >
                <TreePine className="w-4 h-4" style={{ color: "hsl(42 50% 55%)" }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-serif truncate" style={{ color: "hsl(40 30% 88%)" }}>
                  {roomState.activeItemLabel}
                </p>
                <p className="text-[9px]" style={{ color: "hsl(40 15% 60%)" }}>
                  Selected tree
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => { hapticTap(); send({ type: "open_panel" }); }}
                  className="p-1.5 rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: "hsl(42 50% 50% / 0.15)",
                    border: "1px solid hsl(42 50% 50% / 0.25)",
                  }}
                  title="Open details"
                >
                  <ExternalLink className="w-3 h-3" style={{ color: "hsl(42 50% 55%)" }} />
                </button>
                <button
                  onClick={() => { hapticTap(); send({ type: "send_to_desktop", entityType: "offer", entityId: roomState.activeItemId || "", label: "Offer" }); }}
                  className="p-1.5 rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: "hsl(var(--primary) / 0.12)",
                    border: "1px solid hsl(var(--primary) / 0.2)",
                  }}
                  title="Offer"
                >
                  <Heart className="w-3 h-3 text-primary" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom level indicator */}
      {roomState.zoomLevel != null && (
        <div className="flex items-center justify-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-muted-foreground/40" />
          <span className="text-[9px] text-muted-foreground/40 font-mono">z{roomState.zoomLevel}</span>
        </div>
      )}
    </div>
  );
}
