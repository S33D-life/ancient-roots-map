import { Maximize2, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FullscreenToggleProps {
  isFullscreen: boolean;
  onToggle: () => void;
  /** Position preset */
  position?: "top-right" | "top-left" | "bottom-right";
  /** Compact icon-only mode */
  compact?: boolean;
  className?: string;
}

/**
 * Unified fullscreen toggle button used across S33D rooms.
 * Subtle glass-morphism style that blends with any background.
 */
const FullscreenToggle = ({
  isFullscreen,
  onToggle,
  position = "top-right",
  compact = false,
  className,
}: FullscreenToggleProps) => {
  const positionClasses: Record<string, string> = {
    "top-right": "top-3 right-3",
    "top-left": "top-3 left-3",
    "bottom-right": "bottom-3 right-3",
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileTap={{ scale: 0.93 }}
      transition={{ duration: 0.2 }}
      onClick={onToggle}
      className={cn(
        "absolute z-[50] flex items-center gap-1.5 rounded-full backdrop-blur-md transition-all duration-200",
        "bg-card/65 border border-border/20 text-foreground/80",
        "hover:brightness-125 active:scale-95",
        compact ? "p-2" : "px-3 py-1.5",
        positionClasses[position],
        className,
      )}
      title={isFullscreen ? "Exit Full Screen (ESC)" : "Enter Full Screen"}
      aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
    >
      {isFullscreen ? (
        <Minimize2 className="w-4 h-4" />
      ) : (
        <Maximize2 className="w-4 h-4" />
      )}
      {!compact && (
        <span className="hidden md:inline text-xs font-serif">
          {isFullscreen ? "Exit" : "Immerse"}
        </span>
      )}
    </motion.button>
  );
};

export default FullscreenToggle;
