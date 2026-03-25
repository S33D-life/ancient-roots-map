/**
 * FirstWalkTrail — a minimal 3-step onboarding widget.
 *
 * Appears as a floating strip on the homepage for new users.
 * Steps: Visit Map → Explore a Tree → Contribute (add tree or offering).
 * Auto-completes steps as the user navigates. Dismissible.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useQuietMode } from "@/contexts/QuietModeContext";
import { Link } from "react-router-dom";
import { MapPin, TreeDeciduous, Gift, Check, X, ChevronRight } from "lucide-react";
import { useFirstWalk, type WalkStep } from "@/hooks/use-first-walk";

const STEP_META: Record<WalkStep, { icon: typeof MapPin; label: string; hint: string; to: string }> = {
  "visit-map":    { icon: MapPin,        label: "Visit the Map",     hint: "Discover ancient trees worldwide",  to: "/map" },
  "explore-tree": { icon: TreeDeciduous, label: "Explore a Tree",    hint: "Tap any marker to meet a tree",     to: "/map" },
  "contribute":   { icon: Gift,          label: "Contribute",        hint: "Add a tree or leave an offering",   to: "/add-tree" },
};

const FirstWalkTrail = () => {
  const { steps, completed, finished, dismissed, dismiss, currentIndex } = useFirstWalk();

  const { showOnboardingNudges } = useQuietMode();

  // Don't render if finished, dismissed, or nudges disabled
  if (finished || dismissed || !showOnboardingNudges) return null;

  const progress = completed.size;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.5, delay: 1.5 }}
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[55]"
      >
        <div
          className="rounded-2xl border backdrop-blur-md shadow-xl overflow-hidden"
          style={{
            background: "hsl(var(--card) / 0.92)",
            borderColor: "hsl(var(--primary) / 0.2)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-serif text-foreground/80">Your First Walk</span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-sans"
                style={{
                  background: "hsl(var(--primary) / 0.1)",
                  color: "hsl(var(--primary))",
                }}
              >
                {progress}/{steps.length}
              </span>
            </div>
            <button
              onClick={dismiss}
              className="p-1 rounded-full text-muted-foreground/40 hover:text-foreground transition-colors"
              aria-label="Dismiss trail"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-2">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.5)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "hsl(var(--primary))" }}
                initial={{ width: 0 }}
                animate={{ width: `${(progress / steps.length) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="px-3 pb-3 space-y-1">
            {steps.map((step, i) => {
              const meta = STEP_META[step];
              const Icon = meta.icon;
              const done = completed.has(step);
              const isCurrent = i === currentIndex;

              return (
                <Link
                  key={step}
                  to={meta.to}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
                    ${isCurrent
                      ? "bg-primary/8 border border-primary/20"
                      : done
                        ? "opacity-60"
                        : "opacity-40"
                    }
                    ${!done ? "hover:bg-primary/5" : ""}
                  `}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      background: done
                        ? "hsl(var(--primary) / 0.15)"
                        : isCurrent
                          ? "hsl(var(--primary) / 0.1)"
                          : "hsl(var(--muted) / 0.3)",
                    }}
                  >
                    {done ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" style={{ color: isCurrent ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-serif ${done ? "line-through text-muted-foreground" : "text-foreground/85"}`}>
                      {meta.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[10px] text-muted-foreground/60 leading-tight">{meta.hint}</p>
                    )}
                  </div>
                  {isCurrent && !done && (
                    <ChevronRight className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FirstWalkTrail;
