/**
 * SpringLensToggle — Subtle toggle for activating the Spring Lens.
 * Can be placed inline in any page header or filter bar.
 */
import { useSeasonalLens } from "@/contexts/SeasonalLensContext";
import { Flower2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SpringLensToggleProps {
  compact?: boolean;
}

const SpringLensToggle = ({ compact = false }: SpringLensToggleProps) => {
  const { activeLens, toggleSpringLens } = useSeasonalLens();
  const isActive = activeLens === "spring";

  return (
    <button
      onClick={toggleSpringLens}
      className={`
        inline-flex items-center gap-1.5 font-serif transition-all duration-300 rounded-full
        ${compact ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-1"}
        ${isActive
          ? "bg-primary/15 text-primary border border-primary/30 shadow-sm shadow-primary/10"
          : "bg-card/40 text-muted-foreground/60 border border-border/20 hover:border-primary/20 hover:text-muted-foreground"
        }
      `}
      title={isActive ? "Deactivate Spring Lens" : "Activate Spring Lens"}
    >
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.span
            key="active"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-1"
          >
            <Flower2 className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3"}`} />
            🌸 Spring Lens
          </motion.span>
        ) : (
          <motion.span
            key="inactive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            <Flower2 className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3"}`} />
            Spring
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default SpringLensToggle;
