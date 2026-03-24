import { motion } from "framer-motion";
import { Crosshair, Move, ScrollText } from "lucide-react";
import type { CompanionMode } from "@/lib/companion-types";
import { hapticTap } from "@/lib/haptics";

/**
 * Segmented pill switch for controller modes.
 * Aligned with the S33D / Heartwood aesthetic.
 */

interface ModeSwitchProps {
  mode: CompanionMode;
  onChange: (mode: CompanionMode) => void;
}

const MODES: { key: CompanionMode; icon: typeof Crosshair; label: string }[] = [
  { key: "trackpad", icon: Crosshair, label: "Trackpad" },
  { key: "pointer", icon: Move, label: "Pointer" },
  { key: "scroll", icon: ScrollText, label: "Scroll" },
];

export default function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div
      className="flex items-center rounded-xl p-1 relative"
      style={{
        background: "hsl(var(--secondary) / 0.3)",
        border: "1px solid hsl(var(--border) / 0.25)",
      }}
    >
      {MODES.map(({ key, icon: Icon, label }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            onClick={() => {
              if (key !== mode) {
                hapticTap();
                onChange(key);
              }
            }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-serif z-10 transition-colors duration-200 min-h-[32px]"
            style={{
              color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
            }}
          >
            {active && (
              <motion.div
                layoutId="companion-mode-pill"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: "hsl(var(--primary))",
                  boxShadow: "0 2px 8px hsl(var(--primary) / 0.3)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="w-3 h-3 relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
