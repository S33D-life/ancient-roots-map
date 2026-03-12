import { Link } from "react-router-dom";
import { TreeDeciduous, BookOpen, Leaf, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FullscreenToggle from "@/components/FullscreenToggle";
import FullscreenCompanionHint from "@/components/FullscreenCompanionHint";

interface FullscreenMapControlsProps {
  onExit: () => void;
}

const NAV_ITEMS = [
  { to: "/map", icon: TreeDeciduous, label: "Roots" },
  { to: "/library", icon: BookOpen, label: "Trunk" },
  { to: "/council-of-life", icon: Leaf, label: "Canopy" },
  { to: "/golden-dream", icon: Sparkles, label: "Crown" },
] as const;

/**
 * Compact floating nav bar shown in fullscreen map mode.
 * Transparent, minimal, and non-blocking.
 */
const FullscreenMapControls = ({ onExit }: FullscreenMapControlsProps) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25 }}
        className="fixed top-0 left-0 right-0 z-[60] pointer-events-none"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between px-3 py-2 pointer-events-auto">
          {/* Compact TETOL nav — icon-only on mobile, labels on desktop */}
          <div
            className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-full"
            style={{
              background: "hsl(var(--card) / 0.65)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid hsl(var(--border) / 0.2)",
            }}
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-accent/30"
                style={{ color: "hsl(var(--foreground) / 0.7)" }}
                title={item.label}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden md:inline text-xs font-serif">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Exit fullscreen — uses unified toggle */}
          <FullscreenToggle
            isFullscreen
            onToggle={onExit}
            position="top-right"
            className="relative top-auto right-auto"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullscreenMapControls;
