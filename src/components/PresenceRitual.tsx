/**
 * PresenceRitual — 333-second fullscreen focus mode.
 * Any touch/click/key resets the timer. Subtle breathing animation.
 * Resilient to screen-off / background: uses wall-clock elapsed time
 * and persists state to sessionStorage so returning from sleep resumes.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Z } from "@/lib/z-index";

const TOTAL = 333;
const STORAGE_KEY = "s33d_presence_session";
const MAX_AWAY_MS = 10 * 60 * 1000; // 10 minutes — if away longer, session expires

interface SessionState {
  startedAt: number; // wall-clock ms when current countdown began
  treeId?: string;
}

interface PresenceRitualProps {
  open: boolean;
  treeName: string;
  treeId?: string;
  onComplete: (reflection?: string) => void;
  onCancel: () => void;
}

function saveSession(s: SessionState | null) {
  try {
    if (s) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function loadSession(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function PresenceRitual({ open, treeName, treeId, onComplete, onCancel }: PresenceRitualProps) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL);
  const [phase, setPhase] = useState<"counting" | "done" | "reflection" | "resuming">("counting");
  const [reflection, setReflection] = useState("");
  const [resetFlash, setResetFlash] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const startedAtRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);
  const lastResetRef = useRef(0);

  // Wall-clock tick — resilient to sleep/background
  const tick = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    const remaining = Math.max(0, TOTAL - elapsed);
    setSecondsLeft(remaining);
    if (remaining <= 0) {
      setPhase("done");
      saveSession(null);
      return; // stop looping
    }
    rafRef.current = requestAnimationFrame(() => {
      // Use setTimeout for ~1s cadence but driven by wall clock
      setTimeout(() => tick(), 250);
    });
  }, []);

  const stopTick = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  // Start a fresh countdown
  const startTimer = useCallback(() => {
    stopTick();
    const now = Date.now();
    startedAtRef.current = now;
    setSecondsLeft(TOTAL);
    saveSession({ startedAt: now, treeId });
    tick();
  }, [tick, stopTick, treeId]);

  // Resume from saved session
  const resumeSession = useCallback((saved: SessionState) => {
    const elapsed = Date.now() - saved.startedAt;
    if (elapsed > TOTAL * 1000 + 1000) {
      // Already done
      setPhase("done");
      saveSession(null);
      return;
    }
    startedAtRef.current = saved.startedAt;
    setSecondsLeft(Math.max(0, TOTAL - Math.floor(elapsed / 1000)));
    setPhase("counting");
    tick();
  }, [tick]);

  // Init on open
  useEffect(() => {
    if (!open) return;

    setReflection("");
    setShowExitConfirm(false);

    const saved = loadSession();
    if (saved && saved.treeId === treeId) {
      const awayMs = Date.now() - saved.startedAt;
      if (awayMs < MAX_AWAY_MS + TOTAL * 1000) {
        // Resumable — show brief "resuming" then continue
        setPhase("resuming");
        setTimeout(() => resumeSession(saved), 1200);
      } else {
        // Too long, start fresh
        setPhase("counting");
        startTimer();
      }
    } else {
      setPhase("counting");
      startTimer();
    }

    document.body.style.overflow = "hidden";

    return () => {
      stopTick();
      document.body.style.overflow = "";
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Visibility change handler — resume on return
  useEffect(() => {
    if (!open) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && phase === "counting") {
        // Recalculate from wall clock — timer self-corrects via tick()
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        if (elapsed >= TOTAL) {
          stopTick();
          setPhase("done");
          setSecondsLeft(0);
          saveSession(null);
        }
        // Otherwise tick() will self-correct on next cycle
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [open, phase, stopTick]);

  // Any interaction resets (during counting phase only)
  const handleInteraction = useCallback(() => {
    if (phase !== "counting") return;
    const now = Date.now();
    if (now - lastResetRef.current < 500) return;
    lastResetRef.current = now;
    setResetFlash(true);
    startTimer();
    setTimeout(() => setResetFlash(false), 600);
  }, [phase, startTimer]);

  // Block navigation during counting
  useEffect(() => {
    if (!open || phase !== "counting") return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [open, phase]);

  // Handle intentional exit
  const handleExit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (phase === "counting" && secondsLeft < TOTAL - 10) {
      // They've been present >10s — confirm
      setShowExitConfirm(true);
    } else {
      saveSession(null);
      onCancel();
    }
  }, [phase, secondsLeft, onCancel]);

  const confirmExit = useCallback(() => {
    saveSession(null);
    stopTick();
    onCancel();
  }, [onCancel, stopTick]);

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
        onPointerDown={phase === "counting" ? handleInteraction : undefined}
        onKeyDown={phase === "counting" ? handleInteraction : undefined}
        tabIndex={0}
      >
        {/* Close button — always visible */}
        <button
          onClick={handleExit}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-muted/30 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
          style={{ zIndex: Z.OVERLAY + 11 }}
          aria-label="Leave Tree Presence"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Exit confirmation overlay */}
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-6 pointer-events-auto"
            style={{ zIndex: Z.OVERLAY + 12 }}
          >
            <TreeDeciduous className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm font-serif text-muted-foreground text-center max-w-xs">
              Leave your time with <span className="text-primary italic">{treeName}</span>?
              <br />
              <span className="text-xs text-muted-foreground/60">Your presence will not be recorded.</span>
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="font-serif"
                onClick={() => setShowExitConfirm(false)}
              >
                Stay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="font-serif text-muted-foreground"
                onClick={confirmExit}
              >
                Leave
              </Button>
            </div>
          </motion.div>
        )}

        {/* Resuming state */}
        {phase === "resuming" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-primary/40"
            >
              <TreeDeciduous className="w-16 h-16" />
            </motion.div>
            <p className="text-sm font-serif text-muted-foreground/60">Resuming presence…</p>
          </motion.div>
        )}

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
