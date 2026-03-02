/**
 * TreeScrollIndicator — subtle right-side vertical nav for the tree scroll.
 * Refined: softer colors, gentler transitions, breathing dot for active.
 */
import { motion } from "framer-motion";
import type { TreeSection } from "@/hooks/use-tree-scroll";

const INDICATOR_SECTIONS: { id: TreeSection; label: string }[] = [
  { id: "golden-dream", label: "CROWN" },
  { id: "council", label: "CANOPY" },
  { id: "heartwood", label: "TRUNK" },
  { id: "atlas-hero", label: "─ ─ ─" },
  { id: "atlas-content", label: "ROOTS" },
];

/* Section-specific accent hues for the active dot */
const SECTION_HUES: Record<TreeSection, string> = {
  "golden-dream": "45 70% 58%",
  council: "150 35% 48%",
  heartwood: "28 50% 52%",
  "atlas-hero": "42 80% 55%",
  "atlas-content": "42 80% 55%",
};

interface Props {
  activeSection: TreeSection;
  onNavigate: (section: TreeSection) => void;
}

const TreeScrollIndicator = ({ activeSection, onNavigate }: Props) => {
  return (
    <nav
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-4"
      aria-label="Tree sections"
    >
      {INDICATOR_SECTIONS.map(({ id, label }) => {
        const isActive = activeSection === id;
        const hue = SECTION_HUES[id];
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="group flex items-center gap-2.5 py-0.5 transition-all duration-500"
            aria-current={isActive ? "true" : undefined}
          >
            <span
              className="text-[8px] font-serif tracking-[0.3em] uppercase transition-all duration-500 select-none"
              style={{
                color: isActive
                  ? `hsl(${hue})`
                  : "hsl(var(--muted-foreground) / 0.15)",
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {label}
            </span>
            <motion.div
              className="rounded-full"
              animate={{
                width: isActive ? 10 : 3,
                height: 3,
                backgroundColor: isActive
                  ? `hsl(${hue})`
                  : "hsl(var(--muted-foreground) / 0.1)",
              }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </button>
        );
      })}
    </nav>
  );
};

export default TreeScrollIndicator;
