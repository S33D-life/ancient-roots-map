/**
 * @deprecated The Blooming Clock Dial is now the primary seasonal entry point.
 * This component is retained as a thin wrapper for backward compatibility
 * but will be removed in a future pass.
 * 
 * It now toggles all seasons (not just spring) via the SeasonalLens context.
 */
import { useSeasonalLens, LENS_CONFIGS, type SeasonalLensType } from "@/contexts/SeasonalLensContext";
import { motion, AnimatePresence } from "framer-motion";

interface SpringLensToggleProps {
  compact?: boolean;
}

/** Determine the "natural" season for the current month */
function currentSeasonKey(): SeasonalLensType {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

const SpringLensToggle = ({ compact = false }: SpringLensToggleProps) => {
  const { activeLens, setLens } = useSeasonalLens();
  const seasonKey = currentSeasonKey();
  const config = LENS_CONFIGS[seasonKey];
  const isActive = activeLens != null;

  const handleToggle = () => {
    setLens(isActive ? null : seasonKey);
  };

  const activeConfig = activeLens ? LENS_CONFIGS[activeLens] : null;

  return (
    <button
      onClick={handleToggle}
      className={`
        inline-flex items-center gap-1.5 font-serif transition-all duration-300 rounded-full
        ${compact ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-1"}
        ${isActive
          ? "bg-primary/15 text-primary border border-primary/30 shadow-sm shadow-primary/10"
          : "bg-card/40 text-muted-foreground/60 border border-border/20 hover:border-primary/20 hover:text-muted-foreground"
        }
      `}
      title={isActive ? `Deactivate ${activeConfig?.label || "Seasonal Lens"}` : `Activate ${config?.label || "Seasonal Lens"}`}
    >
      <AnimatePresence mode="wait">
        {isActive && activeConfig ? (
          <motion.span
            key="active"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-1"
          >
            {activeConfig.emoji} {activeConfig.label}
          </motion.span>
        ) : (
          <motion.span
            key="inactive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            {config?.emoji} {config?.label?.replace(" Lens", "") || "Season"}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default SpringLensToggle;
