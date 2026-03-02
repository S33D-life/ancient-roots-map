/**
 * PublicTesterBlessing — a calm threshold screen shown once
 * before the user enters the Living Atlas for the first time.
 *
 * - Stores dismissal in localStorage so it never blocks again.
 * - Does NOT block map preloading (map renders behind this overlay).
 * - Accessible again via Settings → "View Welcome".
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LS_KEY = "s33d-blessing-dismissed";

/** Check if the blessing has been dismissed */
export function isBlessingDismissed(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Reset the blessing so it shows again (for Settings → "View Welcome") */
export function resetBlessing(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

interface Props {
  onComplete: () => void;
}

const PublicTesterBlessing = ({ onComplete }: Props) => {
  const [leaving, setLeaving] = useState(false);

  const handleBegin = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {}
    setLeaving(true);
  }, []);

  const handleSkip = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {}
    setLeaving(true);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!leaving && (
        <motion.div
          key="blessing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, hsl(80 18% 14%), hsl(80 15% 8%) 70%)",
          }}
        >
          {/* Soft ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, hsla(42 80% 50% / 0.06) 0%, transparent 60%)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
            className="relative text-center max-w-md space-y-8"
          >
            {/* Subtle leaf glyph */}
            <span
              className="block text-4xl opacity-40 select-none"
              aria-hidden="true"
            >
              🌿
            </span>

            <h1
              className="text-2xl sm:text-3xl font-serif tracking-wide leading-snug"
              style={{ color: "hsl(var(--foreground))" }}
            >
              Welcome to the Living Atlas
            </h1>

            <p
              className="text-base sm:text-lg font-serif leading-relaxed"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              You are stepping into a map that remembers.
            </p>

            <p
              className="text-sm leading-relaxed max-w-xs mx-auto"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Wander gently. If something feels unclear, broken, or
              brilliant&nbsp;— tap{" "}
              <span
                className="font-semibold"
                style={{ color: "hsl(var(--primary))" }}
              >
                Spark
              </span>{" "}
              and tell us.
            </p>

            <p
              className="text-xs tracking-wide"
              style={{ color: "hsl(45 30% 40%)" }}
            >
              Your notes shape the roots, the trunk, and the crown.
            </p>

            {/* CTA */}
            <button
              onClick={handleBegin}
              className="mx-auto block px-8 py-3.5 rounded-xl text-sm font-serif font-semibold tracking-wider transition-all duration-200 active:scale-95 hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary)), hsl(45 100% 60%))",
                color: "hsl(var(--primary-foreground))",
                boxShadow:
                  "0 4px 20px hsla(42 80% 50% / 0.25), 0 0 0 1px hsla(42 60% 50% / 0.15)",
              }}
            >
              Begin the Wander
            </button>

            {/* Skip link */}
            <button
              onClick={handleSkip}
              className="block mx-auto text-xs transition-colors duration-150 hover:underline"
              style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}
            >
              Skip introduction
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PublicTesterBlessing;
