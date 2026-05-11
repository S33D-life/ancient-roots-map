/**
 * TreePhotoStatus — shows processing overlay on tree hero image area.
 * Renders inline within the hero when photo_status is not 'ready' or 'none'.
 *
 * Includes a 30s timeout fallback so the overlay can never trap the user
 * in an infinite "Processing image…" state.
 */
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { PhotoProcessingStatus } from "@/utils/backgroundPhotoProcessor";

interface TreePhotoStatusProps {
  status: PhotoProcessingStatus;
  originalUrl?: string | null;
  onRetry?: () => void;
  /** Milliseconds before pending/processing falls back to a recoverable state. */
  timeoutMs?: number;
}

const TreePhotoStatus = ({
  status,
  originalUrl,
  onRetry,
  timeoutMs = 30000,
}: TreePhotoStatusProps) => {
  const [timedOut, setTimedOut] = useState(false);

  // Reset timeout whenever the upstream status changes.
  useEffect(() => {
    setTimedOut(false);
    if (status !== "pending" && status !== "processing") return;
    const t = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(t);
  }, [status, timeoutMs]);

  if (status === "none" || status === "ready") return null;

  const effectiveStatus: PhotoProcessingStatus =
    timedOut && (status === "pending" || status === "processing")
      ? "failed"
      : status;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4 text-center"
        style={{
          background: originalUrl
            ? "hsla(var(--background) / 0.65)"
            : "radial-gradient(ellipse at center, hsl(var(--muted) / 0.9), hsl(var(--card) / 0.95))",
          backdropFilter: originalUrl ? "blur(8px)" : undefined,
        }}
      >
        {effectiveStatus === "pending" && (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
            <p className="text-sm text-muted-foreground font-serif tracking-wide">Preparing photo…</p>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry} className="mt-1 gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </Button>
            )}
          </>
        )}

        {effectiveStatus === "processing" && (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-serif tracking-wide">Processing image…</p>
            <p className="text-xs text-muted-foreground/50">You can continue exploring</p>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry} className="mt-1 gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </Button>
            )}
          </>
        )}

        {effectiveStatus === "failed" && (
          <>
            <ImageIcon className="h-8 w-8 text-destructive/60" />
            <p className="text-sm text-muted-foreground font-serif">
              {timedOut ? "Photo is taking longer than expected" : "Photo processing didn't complete"}
            </p>
            {originalUrl && (
              <p className="text-xs text-muted-foreground/50">Original photo preserved</p>
            )}
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry} className="mt-1 gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </Button>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default TreePhotoStatus;
