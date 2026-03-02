/**
 * PresenceRitual — 333-second fullscreen focus mode.
 * Any touch/click/key resets the timer. Subtle breathing animation.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Z } from "@/lib/z-index";

const TOTAL = 333;

interface PresenceRitualProps {
  open: boolean;
  treeName: string;
  onComplete: (reflection?: string) => void;
  onCancel: () => void;
}

export default function PresenceRitual({ open, treeName, onComplete, onCancel }: PresenceRitualProps) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL);
  const [phase, setPhase] = useState<"counting" | "done" | "reflection">("counting");
  const [reflection, setReflection] = useState("");
  const [resetFlash, setResetFlash] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastResetRef = useRef(0);

  // Start / restart timer
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(TOTAL);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPhase("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Init on open
  useEffect(() => {
    if (open) {
      setPhase("counting");
      setReflection("");
      startTimer();
      // Lock scroll
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.body.style.overflow = "";
    };
  }, [open, startTimer]);

  // Any interaction resets (during counting phase)
  const handleInteraction = useCallback(() => {
    if (phase !== "counting") return;
    const now = Date.now();
    // Debounce resets to 500ms
    if (now - lastResetRef.current < 500) return;
    lastResetRef.current = now;
    setResetFlash(true);
    startTimer();
    setTimeout(() => setResetFlash(false), 600);
  }, [phase, startTimer]);

  // Block navigation
  useEffect(() => {
    if (!open || phase !== "counting") return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [open, phase]);

  if (!open) return null;

  const progress = ((TOTAL - secondsLeft) / TOTAL) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background flex flex-col items-center justify-center select-none"
        style={{ zIndex: Z.OVERLAY + 10 }}
        onPointerDown={handleInteraction}
        onKeyDown={handleInteraction}
        tabIndex={0}
      >
        {/* Cancel button - top right, small */}
        <button
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          className="absolute top-4 right-4 p-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          style={{ zIndex: Z.OVERLAY + 11 }}
        >
          <X className="w-5 h-5" />
        </button>

        {phase === "counting" && (
          <div className="flex flex-col items-center gap-8 pointer-events-none">
            {/* Reset flash */}
            {resetFlash && (
              <motion.div
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-destructive/10 rounded-full"
              />
            )}

            {/* Breathing tree icon */}
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-primary/40"
            >
              <TreeDeciduous className="w-20 h-20" />
            </motion.div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-6xl md:text-8xl font-mono text-foreground/80 tabular-nums tracking-wider">
                {minutes}:{secs.toString().padStart(2, "0")}
              </p>
              <p className="text-sm text-muted-foreground/50 font-serif mt-4 max-w-xs text-center">
                Be still with <span className="text-primary/60 italic">{treeName}</span>
              </p>
            </div>

            {/* Progress ring */}
            <div className="w-48 h-1 rounded-full bg-muted/20 overflow-hidden">
              <motion.div
                className="h-full bg-primary/30 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <p className="text-xs text-muted-foreground/30 font-serif">
              Any touch resets the timer
            </p>
          </div>
        )}

        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 max-w-sm px-6 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="text-primary"
            >
              <TreeDeciduous className="w-16 h-16" />
            </motion.div>
            <h2 className="text-2xl font-serif text-primary">Presence Complete</h2>
            <p className="text-sm text-muted-foreground font-serif text-center">
              You were still with {treeName} for 333 seconds.
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 font-serif"
                onClick={() => onComplete()}
              >
                Continue
              </Button>
              <Button
                variant="mystical"
                className="flex-1 font-serif"
                onClick={() => setPhase("reflection")}
              >
                Add Reflection
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "reflection" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 max-w-sm px-6 w-full pointer-events-auto"
          >
            <TreeDeciduous className="w-10 h-10 text-primary/60" />
            <h2 className="text-xl font-serif text-primary">Reflection</h2>
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What arose during your stillness?"
              rows={4}
              maxLength={500}
              className="w-full font-serif"
              autoFocus
            />
            <p className="text-xs text-muted-foreground/50">{reflection.length}/500</p>
            <Button
              className="w-full font-serif"
              onClick={() => onComplete(reflection || undefined)}
            >
              Complete
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
