/**
 * HeartbeatNotification — global heart-earned notification overlay.
 * Renders a batched, pulsing notification near the top of the viewport,
 * above all page content, navigation, maps, and sheets.
 *
 * Listens to: window "s33d-hearts-earned" CustomEvent
 *   detail: { amount: number; source?: "offering" | "checkin" | "whisper" | "tree-added" | "collect" | string }
 *
 * Tap to open the Heart Jar (dispatches "s33d-open-heart-jar").
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useQuietMode } from "@/contexts/QuietModeContext";

const BATCH_WINDOW_MS = 1500;
const VISIBLE_MS = 4500;

type Source = "offering" | "checkin" | "whisper" | "tree-added" | "collect" | string;

const sourceCopy = (source?: Source): string | null => {
  switch (source) {
    case "offering":
      return "Offering received — hearts are flowing";
    case "checkin":
      return "Canopy check-in honoured";
    case "whisper":
      return "Whisper carried on the wind";
    case "tree-added":
      return "Ancient Friend added — your path has grown";
    case "collect":
      return "Hearts gathered from the canopy";
    default:
      return null;
  }
};

const HeartbeatNotification = () => {
  const [batchTotal, setBatchTotal] = useState(0);
  const [source, setSource] = useState<Source | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const { showCelebrations } = useQuietMode();

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const amount = e.detail?.amount;
      const src: Source | undefined = e.detail?.source;
      if (typeof amount !== "number" || amount <= 0) return;

      setBatchTotal((prev) => prev + amount);
      if (src) setSource(src);
      setVisible(true);

      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setBatchTotal(0);
          setSource(undefined);
        }, 600);
      }, VISIBLE_MS);
    };

    window.addEventListener("s33d-hearts-earned", handler as EventListener);
    return () => {
      window.removeEventListener("s33d-hearts-earned", handler as EventListener);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const handleTap = () => {
    window.dispatchEvent(new CustomEvent("s33d-open-heart-jar"));
    setVisible(false);
  };

  const message = sourceCopy(source);

  return (
    <AnimatePresence>
      {visible && batchTotal > 0 && showCelebrations && (
        <motion.button
          type="button"
          onClick={handleTap}
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed left-1/2 -translate-x-1/2 z-[10000]
                     flex items-center gap-2.5 px-4 py-2.5 rounded-full
                     bg-card/95 border border-primary/30 backdrop-blur-md shadow-2xl
                     cursor-pointer hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 4.25rem)",
            boxShadow: "0 10px 30px -8px hsl(var(--primary) / 0.35), 0 0 0 1px hsl(var(--primary) / 0.15)",
            maxWidth: "min(92vw, 420px)",
          }}
          aria-label={`${batchTotal} hearts gathered — open Heart Jar`}
        >
          <motion.span
            animate={{
              scale: [1, 1.2, 1],
              filter: [
                "drop-shadow(0 0 0px hsl(var(--primary) / 0))",
                "drop-shadow(0 0 8px hsl(var(--primary) / 0.55))",
                "drop-shadow(0 0 1px hsl(var(--primary) / 0.05))",
              ],
            }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.6, 1], repeat: Infinity, repeatDelay: 0.4 }}
            className="inline-flex shrink-0"
          >
            <Heart className="w-4 h-4 text-primary fill-primary/50" />
          </motion.span>

          <div className="flex flex-col items-start leading-tight min-w-0">
            <motion.span
              key={batchTotal}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-sm font-serif text-primary font-semibold tabular-nums"
            >
              +{batchTotal} S33D Heart{batchTotal === 1 ? "" : "s"} gathered
            </motion.span>
            {message && (
              <span className="text-[10px] font-serif text-muted-foreground truncate max-w-[260px]">
                {message}
              </span>
            )}
          </div>

          <motion.span
            initial={{ scale: 0.9, opacity: 0.3 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut", repeat: Infinity, repeatDelay: 0.5 }}
            className="absolute inset-0 rounded-full border border-primary/20 pointer-events-none"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default HeartbeatNotification;
