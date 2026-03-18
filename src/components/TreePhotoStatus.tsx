/**
 * TreePhotoStatus — shows processing overlay on tree hero image area.
 * Renders inline within the hero when photo_status is not 'ready' or 'none'.
 */
import { Loader2, RefreshCw, ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { PhotoProcessingStatus } from "@/utils/backgroundPhotoProcessor";

interface TreePhotoStatusProps {
  status: PhotoProcessingStatus;
  originalUrl?: string | null;
  onRetry?: () => void;
}

const TreePhotoStatus = ({ status, originalUrl, onRetry }: TreePhotoStatusProps) => {
  if (status === "none" || status === "ready") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
        style={{
          background: originalUrl
            ? "hsla(var(--background) / 0.65)"
            : "radial-gradient(ellipse at center, hsl(var(--muted) / 0.9), hsl(var(--card) / 0.95))",
          backdropFilter: originalUrl ? "blur(8px)" : undefined,
        }}
      >
        {status === "pending" && (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
            <p className="text-sm text-muted-foreground font-serif tracking-wide">Preparing photo…</p>
          </>
        )}

        {status === "processing" && (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-serif tracking-wide">Processing image…</p>
            <p className="text-xs text-muted-foreground/50">You can continue exploring</p>
          </>
        )}

        {status === "failed" && (
          <>
            <ImageIcon className="h-8 w-8 text-destructive/60" />
            <p className="text-sm text-muted-foreground font-serif">Photo processing didn't complete</p>
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
