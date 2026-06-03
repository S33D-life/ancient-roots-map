/**
 * MobileSectionWhisper — ambient ecological locator (mobile only).
 *
 * Watches known section anchors via IntersectionObserver. When the user
 * scrolls into a new zone, a single italic line fades in near the top,
 * lingers ~2.6s, then fades out. No nav chrome, no tap target,
 * pointer-events-none. Respects prefers-reduced-motion (still shows,
 * just without motion).
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const ZONES: { id: string; label: string }[] = [
  { id: "golden-dream",  label: "In the Golden Dream" },
  { id: "council",       label: "In the Council" },
  { id: "heartwood",     label: "In the Heartwood" },
  { id: "ground",        label: "At the Threshold" },
  { id: "atlas-content", label: "Among the Roots" },
];

const MobileSectionWhisper = () => {
  const reduced = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mobile only — skip on tablet/desktop
    const mq = window.matchMedia("(max-width: 640px)");
    if (!mq.matches) return;

    const targets = ZONES
      .map(z => document.getElementById(z.id))
      .filter((el): el is HTMLElement => !!el);
    if (targets.length === 0) return;

    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let lastShown: string | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the most-visible entry above the midpoint
        const candidates = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = candidates[0];
        if (!top) return;
        const id = top.target.id;
        if (id === lastShown) return;
        lastShown = id;
        setActiveId(id);
        setVisible(true);
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => setVisible(false), 2600);
      },
      {
        // Trigger when section crosses the upper third of the viewport
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.1, 0.25],
      }
    );

    targets.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  const label = ZONES.find(z => z.id === activeId)?.label;

  return (
    <div
      className="sm:hidden fixed inset-x-0 z-30 flex justify-center pointer-events-none select-none"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 56px)" }}
      aria-hidden
    >
      <AnimatePresence>
        {visible && label && (
          <motion.span
            key={label}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="font-serif italic text-[11px] tracking-[0.08em] px-3 py-1 rounded-full"
            style={{
              color: "hsl(var(--foreground) / 0.45)",
              background: "hsl(var(--background) / 0.55)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileSectionWhisper;
