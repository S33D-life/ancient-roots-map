import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MapContextIndicatorProps {
  /** e.g. "Olive Hive", "Italy Atlas" */
  label: string | null;
  /** Number of visible trees */
  treeCount: number;
  /** Origin context for storytelling */
  origin?: string | null;
  /** Clear all deep-link filters */
  onClear: () => void;
}

/**
 * Floating contextual indicator shown when the map is opened via a deep link
 * from a Hive, Country Atlas, or species page.
 */
const MapContextIndicator = ({ label, treeCount, origin, onClear }: MapContextIndicatorProps) => {
  if (!label) return null;

  const originLabel = origin === "hive" ? "Species Hive"
    : origin === "atlas" ? "Country Atlas"
    : origin === "species" ? "Species Page"
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="absolute z-[1001] left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full font-serif text-[11px] backdrop-blur-md max-w-[calc(100vw-3rem)]"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 4.5rem)",
          background: "hsla(30, 25%, 10%, 0.9)",
          color: "hsl(42, 80%, 60%)",
          border: "1px solid hsla(42, 60%, 45%, 0.3)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <span className="truncate">
          Viewing: <strong>{label}</strong>
          <span className="text-muted-foreground ml-1">
            ({treeCount} {treeCount === 1 ? "tree" : "trees"})
          </span>
        </span>
        {originLabel && (
          <span className="text-[9px] opacity-60 hidden sm:inline">
            from {originLabel}
          </span>
        )}
        <button
          onClick={onClear}
          className="shrink-0 p-0.5 rounded-full transition-colors hover:bg-white/10"
          title="Clear filter"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapContextIndicator;
