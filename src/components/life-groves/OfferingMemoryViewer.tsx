/**
 * OfferingMemoryViewer — a calm sheet for encountering one memory from
 * inside the full-screen Tree. The tree stays perceptible behind a soft
 * scrim, so the memory is met *within* the tree rather than elsewhere.
 *
 * Per-type presentation is reused wholesale from OfferingLibraryCard, so
 * photographs, songs, books, voice notes, poems and letters keep the
 * elevated rendering they already have in the Heartwood Library.
 */
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { OFFERING_TYPES, type LifeGroveOffering } from "@/lib/life-groves/types";
import LifeGroveOfferingGlyph from "./LifeGroveOfferingGlyph";
import OfferingLibraryCard from "./OfferingLibraryCard";

interface Props {
  offering: LifeGroveOffering | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  /** Position within the current selection, for a quiet "3 of 9". */
  index?: number;
  total?: number;
}

export default function OfferingMemoryViewer({
  offering,
  onClose,
  onPrev,
  onNext,
  index,
  total,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!offering) return;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [offering, onClose, onPrev, onNext]);

  const meta = offering
    ? OFFERING_TYPES.find((m) => m.value === offering.offering_type)
    : null;

  return (
    <AnimatePresence>
      {offering && (
        <motion.div
          key="memory-viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="absolute inset-0 z-[20] flex items-end sm:items-center justify-center"
        >
          {/* scrim — the tree remains perceptible through it */}
          <button
            type="button"
            aria-label="Close this memory"
            onClick={onClose}
            className="absolute inset-0 bg-background/55 backdrop-blur-[3px]"
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`${meta?.label ?? "Offering"}${offering.title ? `: ${offering.title}` : ""}`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full sm:max-w-lg max-h-[86vh] overflow-y-auto
              rounded-t-3xl sm:rounded-3xl border border-primary/25
              bg-card/85 backdrop-blur-xl shadow-2xl focus:outline-none"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <header className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3
              bg-card/80 backdrop-blur-xl border-b border-border/25">
              <LifeGroveOfferingGlyph type={offering.offering_type} size={22} variant="card" />
              <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
                {meta?.label ?? offering.offering_type}
              </span>
              {typeof index === "number" && typeof total === "number" && total > 1 && (
                <span className="font-serif text-[10px] text-muted-foreground/50">
                  {index + 1} of {total}
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close this memory"
                className="ml-auto h-11 w-11 -mr-2 flex items-center justify-center rounded-full
                  text-muted-foreground/75 hover:text-foreground transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="p-3">
              <OfferingLibraryCard offering={offering} />
            </div>

            {(onPrev || onNext) && total && total > 1 && (
              <footer className="flex items-center justify-between gap-2 px-3 pb-4">
                <button
                  type="button"
                  onClick={onPrev}
                  className="h-11 px-4 inline-flex items-center gap-1.5 rounded-full
                    font-serif text-xs text-muted-foreground/80 hover:text-foreground
                    border border-border/30 bg-background/40 transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="h-11 px-4 inline-flex items-center gap-1.5 rounded-full
                    font-serif text-xs text-muted-foreground/80 hover:text-foreground
                    border border-border/30 bg-background/40 transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
