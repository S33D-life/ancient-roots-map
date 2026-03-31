/**
 * RootPulse — A living root-layer that reveals ecosystem pulse + recent activity
 * as one organic unfolding experience beneath the surface of /s33d.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import RootPulseGlyph from "./root-pulse/RootPulseGlyph";
import RootPulseContent from "./root-pulse/RootPulseContent";

export default function RootPulse() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const toggle = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler, { passive: true });
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto px-4 py-16">
      {/* ── Entry point: root glyph ── */}
      <RootPulseGlyph
        open={open}
        onToggle={toggle}
        prefersReduced={!!prefersReduced}
      />

      {/* ── Unfurled root layer ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0, y: -6 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, height: "auto", y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0, y: -6 }}
            transition={{ duration: prefersReduced ? 0.15 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <RootPulseContent prefersReduced={!!prefersReduced} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
