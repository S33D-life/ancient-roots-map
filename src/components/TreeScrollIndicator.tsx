import { motion } from "framer-motion";
import type { TreeSection } from "@/hooks/use-tree-scroll";

const INDICATOR_SECTIONS: { id: TreeSection; label: string; position: "above" | "center" | "below" }[] = [
  { id: "golden-dream", label: "CROWN", position: "above" },
  { id: "council", label: "CANOPY", position: "above" },
  { id: "heartwood", label: "TRUNK", position: "above" },
  { id: "atlas-hero", label: "─ ─ ─", position: "center" },
  { id: "atlas-content", label: "ROOTS", position: "below" },
];

interface Props {
  activeSection: TreeSection;
  onNavigate: (section: TreeSection) => void;
}

const TreeScrollIndicator = ({ activeSection, onNavigate }: Props) => {
  return (
    <nav
      className="fixed right-3 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-3"
      aria-label="Tree sections"
    >
      {INDICATOR_SECTIONS.map(({ id, label }) => {
        const isActive = activeSection === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="group flex items-center gap-2 transition-all duration-300"
            aria-current={isActive ? "true" : undefined}
          >
            <span
              className="text-[9px] font-serif tracking-[0.25em] uppercase transition-all duration-300 select-none"
              style={{
                color: isActive
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted-foreground) / 0.2)",
              }}
            >
              {label}
            </span>
            <motion.div
              className="rounded-full"
              animate={{
                width: isActive ? 12 : 4,
                height: 4,
                backgroundColor: isActive
                  ? "hsl(42 90% 55%)"
                  : "hsl(var(--muted-foreground) / 0.15)",
              }}
              transition={{ duration: 0.3 }}
            />
          </button>
        );
      })}
    </nav>
  );
};

export default TreeScrollIndicator;
