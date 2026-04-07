/**
 * MapLegend — subtle, toggleable legend for map signal types.
 * Remembers collapsed state via localStorage.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const STORAGE_KEY = "s33d-map-legend-collapsed";

function loadCollapsed(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
}

export default function MapLegend() {
  const [collapsed, setCollapsed] = useState(loadCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
  };

  return (
    <div
      className="absolute top-3 left-3 z-[15] select-none"
      style={{ pointerEvents: "auto" }}
    >
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-serif tracking-wide transition-colors"
        style={{
          background: "hsl(var(--card) / 0.88)",
          border: "1px solid hsl(var(--border) / 0.25)",
          backdropFilter: "blur(8px)",
          color: "hsl(var(--muted-foreground) / 0.7)",
        }}
      >
        <span className="text-xs">🗺️</span>
        Legend
        <ChevronDown
          className="w-3 h-3 transition-transform"
          style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
        />
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="mt-1 px-3 py-2.5 rounded-lg space-y-1.5"
            style={{
              background: "hsl(var(--card) / 0.92)",
              border: "1px solid hsl(var(--border) / 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <LegendRow emoji="✨" label="Ancient tree" color="42 80% 55%" />
            <LegendRow emoji="💚" label="Hearts available" color="140 40% 55%" />
            <LegendRow emoji="🌬️" label="Whisper waiting" color="260 40% 60%" />
            <LegendRow emoji="🌱" label="Seed planted" color="120 50% 50%" />
            <LegendRow emoji="🐦" label="Birdsong recorded" color="200 60% 55%" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LegendRow({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs shrink-0">{emoji}</span>
      <span className="text-[10px] font-serif" style={{ color: `hsl(${color})` }}>
        {label}
      </span>
    </div>
  );
}
