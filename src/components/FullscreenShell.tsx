import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import FullscreenCompanionHint from "@/components/FullscreenCompanionHint";

interface FullscreenShellProps {
  active: boolean;
  children: React.ReactNode;
  className?: string;
  /** Background style — "dark" for deep immersion, "page" for normal bg */
  tone?: "dark" | "page";
}

/**
 * FullscreenShell — wraps any room content in a fixed overlay when fullscreen is active.
 * Provides consistent enter/exit animation and safe-area padding.
 *
 * Usage:
 *   <FullscreenShell active={isFullscreen}>
 *     <YourContent />
 *     <FullscreenToggle ... />
 *   </FullscreenShell>
 */
const FullscreenShell = ({
  active,
  children,
  className,
  tone = "dark",
}: FullscreenShellProps) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="fullscreen-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            "fixed inset-0 z-[100] flex flex-col",
            tone === "dark" ? "bg-[hsl(30,15%,5%)]" : "bg-background",
            className,
          )}
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullscreenShell;
