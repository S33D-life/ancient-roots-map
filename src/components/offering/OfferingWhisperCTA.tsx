/**
 * OfferingWhisperCTA — Post-offering prompt card.
 *
 * Shown after a successful offering creation.
 * Gives the wanderer the choice to:
 *   (a) Share this offering as a whisper → opens OfferingWhisperDrawer
 *   (b) Return to the tree → dismisses silently
 *
 * Design principles:
 *   - Gentle and optional — never blocks the return journey
 *   - Appears after the celebration animation, not during
 *   - Small footprint: bottom floating card, not a full modal
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, TreePine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import OfferingWhisperDrawer from "./OfferingWhisperDrawer";

interface Props {
  visible: boolean;
  offeringId: string;
  treeId: string;
  treeName?: string;
  treeSpecies?: string;
  treeSpeciesKey?: string | null;
  /** Called when user chooses "Return to Tree" or after whisper is sent */
  onDismiss: () => void;
}

export default function OfferingWhisperCTA({
  visible,
  offeringId,
  treeId,
  treeName,
  treeSpecies,
  treeSpeciesKey,
  onDismiss,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleWhisperSent() {
    setDrawerOpen(false);
    onDismiss();
  }

  return (
    <>
      <AnimatePresence>
        {visible && !drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 24, stiffness: 260, delay: 0.15 }}
            className="fixed bottom-6 left-4 right-4 z-[60] max-w-md mx-auto"
          >
            <div
              className="rounded-2xl border border-primary/20 shadow-xl p-4 space-y-3"
              style={{
                background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--card) / 0.95))",
              }}
            >
              {/* Dismiss */}
              <button
                type="button"
                onClick={onDismiss}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/60 text-muted-foreground/50 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Copy */}
              <div className="pr-6">
                <p className="font-serif text-sm text-foreground leading-snug">
                  Your offering is sealed beneath the roots.
                </p>
                <p className="text-[11px] font-serif text-muted-foreground/70 mt-0.5 leading-relaxed">
                  Would you like to send it as a whisper — to another wanderer, or anyone who visits this tree?
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  variant="default"
                  size="sm"
                  className="flex-1 rounded-xl font-serif text-sm gap-1.5"
                >
                  <Wind className="w-3.5 h-3.5" />
                  Share as Whisper
                </Button>
                <Button
                  type="button"
                  onClick={onDismiss}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl font-serif text-sm gap-1.5"
                >
                  <TreePine className="w-3.5 h-3.5" />
                  Return to Tree
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <OfferingWhisperDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        offeringId={offeringId}
        treeId={treeId}
        treeName={treeName}
        treeSpecies={treeSpecies}
        treeSpeciesKey={treeSpeciesKey}
        onSent={handleWhisperSent}
      />
    </>
  );
}
