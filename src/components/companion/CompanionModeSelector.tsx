import { Smartphone, TreePine, Users, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import type { CompanionFlowMode } from "@/lib/companion-types";

interface Props {
  onSelect: (mode: CompanionFlowMode) => void;
  isNearTree?: boolean;
}

export default function CompanionModeSelector({ onSelect, isNearTree }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-xs flex flex-col items-center gap-6">
        <div className="p-4 rounded-full" style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
          <Wifi className="w-8 h-8 text-primary" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-serif text-foreground">Companion Mode</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose how you'd like to connect</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          {/* Controller */}
          <button
            onClick={() => onSelect("controller")}
            className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all active:scale-[0.98]"
            style={{
              background: "hsl(var(--secondary) / 0.15)",
              border: "1px solid hsl(var(--border) / 0.2)",
            }}
          >
            <div className="p-2 rounded-lg shrink-0" style={{ background: "hsl(var(--primary) / 0.1)" }}>
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-serif text-foreground">Use as Controller</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Use your phone to guide another screen — map, gallery, rooms
              </p>
            </div>
          </button>

          {/* Shared Encounter */}
          <button
            onClick={() => onSelect("encounter")}
            className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all active:scale-[0.98] relative overflow-hidden"
            style={{
              background: isNearTree
                ? "hsl(120 20% 15% / 0.25)"
                : "hsl(var(--secondary) / 0.15)",
              border: isNearTree
                ? "1px solid hsl(120 30% 40% / 0.35)"
                : "1px solid hsl(var(--border) / 0.2)",
            }}
          >
            {isNearTree && (
              <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-serif"
                style={{
                  background: "hsl(120 25% 30% / 0.4)",
                  color: "hsl(120 30% 70%)",
                  border: "1px solid hsl(120 25% 40% / 0.3)",
                }}>
                At tree
              </span>
            )}
            <div className="p-2 rounded-lg shrink-0" style={{ background: "hsl(42 50% 50% / 0.12)" }}>
              <Users className="w-5 h-5" style={{ color: "hsl(42 50% 60%)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-serif text-foreground">Shared Encounter</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Meet another wanderer at this tree — verify presence, earn 3× hearts
              </p>
            </div>
          </button>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-muted-foreground/50 font-serif">
            Both modes use real-time pairing via code or QR
          </p>
        </div>
      </div>
    </motion.div>
  );
}
