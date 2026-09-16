/**
 * FullscreenTreeView — the immersive Ethereal Tree.
 *
 * An experience layer over the same canonical Grove data: it receives the
 * offerings the Grove page already fetched, so visibility and stewardship
 * rules are inherited untouched. No parallel memory system.
 *
 * Chrome is deliberately sparse: close, the grove's name, a gentle filter,
 * and the tree itself.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import {
  OFFERING_TYPES,
  TREE_ARCHETYPES,
  type LifeGroveOffering,
  type OfferingType,
  type TreeArchetype,
} from "@/lib/life-groves/types";
import EtherealOfferingTree from "./EtherealOfferingTree";
import OfferingMemoryViewer from "./OfferingMemoryViewer";

interface Props {
  open: boolean;
  onClose: () => void;
  archetype: TreeArchetype;
  groveTitle: string;
  treeName?: string | null;
  rememberedName?: string | null;
  offerings: LifeGroveOffering[];
  /** Open straight onto one memory (tapped from the Grove page). */
  initialOfferingId?: string | null;
}

type Filter = "all" | OfferingType;

export default function FullscreenTreeView({
  open,
  onClose,
  archetype,
  groveTitle,
  treeName,
  rememberedName,
  offerings,
  initialOfferingId = null,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [treeSize, setTreeSize] = useState(360);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  const meta =
    TREE_ARCHETYPES.find((a) => a.value === archetype) ?? TREE_ARCHETYPES[0];

  /** Only the types actually hanging here — never offer an empty filter. */
  const presentTypes = useMemo(() => {
    const seen = new Set(offerings.map((o) => o.offering_type));
    return OFFERING_TYPES.filter((t) => seen.has(t.value));
  }, [offerings]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? offerings
        : offerings.filter((o) => o.offering_type === filter),
    [offerings, filter],
  );

  const selected = useMemo(
    () => offerings.find((o) => o.id === selectedId) ?? null,
    [offerings, selectedId],
  );
  const selectedIndex = visible.findIndex((o) => o.id === selectedId);

  useEffect(() => {
    if (selectedId && selectedIndex < 0) setSelectedId(null);
  }, [filter, selectedId, selectedIndex]);

  const step = (delta: number) => {
    if (visible.length === 0) return;
    const from = selectedIndex >= 0 ? selectedIndex : 0;
    const next = (from + delta + visible.length) % visible.length;
    setSelectedId(visible[next].id);
  };

  // Size the tree to the smaller viewport axis, leaving room for the chrome.
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 640;
      setTreeSize(Math.max(300, Math.min(w * (mobile ? 1.1 : 0.86), h - (mobile ? 150 : 120), 820)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  // Lock page scroll and let Escape leave the tree.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    shellRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selectedId) onClose();
      if (!selectedId && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        step(e.key === "ArrowRight" ? 1 : -1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedId, onClose, visible.length]);

  // Reset when the tree is left; honour an entry memory when it is entered.
  useEffect(() => {
    if (open) {
      setSelectedId(initialOfferingId ?? null);
    } else {
      setSelectedId(null);
      setFilter("all");
    }
  }, [open, initialOfferingId]);

  /** Deterministic far starfield — calm, never busy. */
  const stars = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const phi = 0.6180339887;
        return {
          key: i,
          left: ((i * phi) % 1) * 100,
          top: ((i * 0.317) % 1) * 100,
          size: 1 + ((i * 0.53) % 1) * 1.6,
          delay: ((i * 0.41) % 1) * 8,
          dur: 5 + ((i * 0.29) % 1) * 7,
        };
      }),
    [],
  );

  const subtitle = rememberedName ? `for ${rememberedName}` : treeName ?? null;

  // Portalled to <body>: page-level motion wrappers create containing blocks
  // for fixed positioning, which would otherwise strand the tree mid-document.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="ethereal-fullscreen"
          ref={shellRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`${groveTitle} — the Ethereal Tree`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.45 }}
          className="fixed inset-0 z-[120] flex flex-col overflow-hidden focus:outline-none"
          style={{
            background: `radial-gradient(ellipse 120% 85% at 50% 38%, hsl(${meta.hueB} 26% 12%), hsl(${meta.hueB} 30% 6%) 62%, hsl(${meta.hueB} 34% 4%))`,
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* night-sky ambience */}
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background: `radial-gradient(ellipse 60% 46% at 50% 43%, hsl(${meta.hueA} 42% 32% / 0.12), transparent 72%), linear-gradient(to bottom, hsl(${meta.hueB} 30% 5% / 0.16), transparent 42%, hsl(${meta.hueA} 30% 12% / 0.08))`,
              }}
            />
            {stars.map((s) => (
              <span
                key={s.key}
                className="absolute rounded-full motion-safe:animate-[etherealStar_linear_infinite]"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  background: "hsl(42 60% 92% / 0.55)",
                  animationDuration: `${s.dur}s`,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>

          {/* minimal chrome — top */}
          <header className="relative z-10 flex items-start gap-2 px-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Leave the tree"
              className="h-11 w-11 shrink-0 flex items-center justify-center rounded-full
                bg-background/25 border border-border/20 backdrop-blur-md
                text-foreground/75 hover:text-foreground transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex-1 text-center pt-1 min-w-0">
              <h2 className="font-serif text-base sm:text-lg text-foreground/90 truncate">
                {groveTitle}
              </h2>
              {subtitle && (
                <p className="font-serif text-[11px] italic text-foreground/50 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="h-11 w-11 shrink-0" aria-hidden />
          </header>

          {/* the tree */}
          <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center px-0 -my-2 sm:-my-4">
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.955, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 1.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <EtherealOfferingTree
                archetype={archetype}
                treeName={rememberedName ? treeName : null}
                offerings={offerings}
                selectedId={selectedId}
                onSelect={(o) => setSelectedId(o?.id ?? null)}
                size={treeSize}
                immersive
                highlightIds={filter === "all" ? null : visible.map((o) => o.id)}
              />
            </motion.div>
          </div>

          {/* invitation / hint */}
          <div className="relative z-10 px-6 text-center min-h-[2rem]">
            {offerings.length === 0 ? (
              <p className="font-serif text-sm italic text-foreground/60">
                The branches are waiting. This tree is ready to receive memory.
              </p>
            ) : (
                <p className="font-serif text-xs italic text-foreground/55">
                {offerings.length} memor{offerings.length === 1 ? "y" : "ies"} resting in
                the branches · touch one to open it
              </p>
            )}
          </div>

          {/* filters — emphasise, never empty the tree */}
          {presentTypes.length > 1 && (
            <nav
              aria-label="Filter what glows in the branches"
               className="relative z-10 px-3 pb-3 pt-2 overflow-x-auto"
            >
              <ul className="flex gap-2 w-max mx-auto">
                {[{ value: "all" as const, label: "All" }, ...presentTypes].map((t) => {
                  const active = filter === t.value;
                  return (
                    <li key={t.value}>
                      <button
                        type="button"
                        onClick={() => setFilter(t.value as Filter)}
                        aria-pressed={active}
                        className={[
                          "h-11 px-4 rounded-full font-serif text-xs whitespace-nowrap",
                          "border backdrop-blur-md transition-all duration-300",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          active
                            ? "border-primary/45 bg-primary/15 text-foreground"
                            : "border-border/20 bg-background/20 text-foreground/60 hover:text-foreground/90",
                        ].join(" ")}
                      >
                        {t.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          <OfferingMemoryViewer
            offering={selected}
            onClose={() => setSelectedId(null)}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            index={selectedIndex >= 0 ? selectedIndex : undefined}
            total={visible.length}
          />

          <style>{`
            @keyframes etherealStar {
              0%, 100% { opacity: 0.1; }
              50% { opacity: 0.75; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
