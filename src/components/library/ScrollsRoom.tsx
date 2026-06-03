/**
 * ScrollsRoom — The Cycle Trunk.
 *
 * Reframed from a flat list of records into a vertical stack of *cycle rings*.
 * Each ring is one lunation. Opening a ring reveals its three voices:
 *   • Council voice  — what governance decided this cycle
 *   • Forest voice   — what the Ancient Friends witnessed (Moonroot digest)
 *   • System voice   — how the system itself was tended (Stewardship report)
 *
 * The PDF is no longer the artifact. The ring is the artifact. The PDF is a seal.
 *
 * No new tables yet — rings are derived from lunar phases. As `cycle_id`
 * binding lands, each scroll slot will fill in automatically.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Scroll, Trees, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { nextNewMoon } from "@/lib/astronomy";
import { deriveLunarFraming, moonIllumination } from "@/lib/moonroot/lunar";
import CollaboratorShelf from "@/components/CollaboratorShelf";
import { cn } from "@/lib/utils";

// ─── Cycle derivation ──────────────────────────────────────────────────────

interface CycleRing {
  /** Stable id derived from the new-moon date (YYYY-MM-DD). */
  id: string;
  /** Cycle start (the new moon that opened it). */
  start: Date;
  /** Cycle end (the next new moon). */
  end: Date;
  /** Poetic label, e.g. "Strawberry Moon · June 2026". */
  label: string;
  /** Lunar glyph for the *middle* of the cycle (full-ish). */
  glyph: string;
  /** One-line whisper for this ring. */
  whisper: string;
  /** True if `now` lies within this cycle. */
  isCurrent: boolean;
}

const MOON_NAMES: Record<number, string> = {
  0: "Wolf Moon", 1: "Snow Moon", 2: "Worm Moon", 3: "Pink Moon",
  4: "Flower Moon", 5: "Strawberry Moon", 6: "Buck Moon", 7: "Sturgeon Moon",
  8: "Harvest Moon", 9: "Hunter's Moon", 10: "Beaver Moon", 11: "Cold Moon",
};

function buildRings(count: number, now: Date = new Date()): CycleRing[] {
  // Find the most recent new moon at or before `now`, then step backward.
  const cycleLen = 29.530588 * 24 * 60 * 60 * 1000;
  // nextNewMoon returns the *next* one — walk backward to find the one that opened the current cycle.
  let cursorStart = nextNewMoon(new Date(now.getTime() - cycleLen));
  // Edge: if cursorStart is somehow still ahead of now, step back one cycle.
  if (cursorStart.getTime() > now.getTime()) {
    cursorStart = new Date(cursorStart.getTime() - cycleLen);
  }

  const rings: CycleRing[] = [];
  for (let i = 0; i < count; i++) {
    const start = new Date(cursorStart.getTime() - i * cycleLen);
    const end = new Date(start.getTime() + cycleLen);
    const mid = new Date(start.getTime() + cycleLen / 2);
    const framing = deriveLunarFraming("full_moon", mid);
    const monthName = MOON_NAMES[mid.getMonth()];
    const year = mid.getFullYear();
    const id = start.toISOString().slice(0, 10);
    const isCurrent = now >= start && now < end;

    // Override glyph: rings show the *full* moon glyph as their seal, unless current → live phase.
    const glyph = isCurrent
      ? deriveLunarFraming("full_moon", now).glyph
      : framing.glyph;

    rings.push({
      id,
      start,
      end,
      label: `${monthName} · ${mid.toLocaleString("en-GB", { month: "long", year: "numeric" })}`,
      glyph: glyph === "🌑" ? "🌕" : glyph, // never seal a ring with a new moon
      whisper: framing.whisper,
      isCurrent,
    });
  }
  return rings;
}

// ─── Scroll slot ───────────────────────────────────────────────────────────

interface ScrollSlot {
  key: "council" | "forest" | "system";
  label: string;
  voice: string;
  icon: typeof Scroll;
  to: string;
  unsealedHint: string;
}

const SCROLL_SLOTS: ScrollSlot[] = [
  {
    key: "council",
    label: "Council Voice",
    voice: "What governance decided",
    icon: Scroll,
    to: "/council/records",
    unsealedHint: "The council has not yet sealed this ring.",
  },
  {
    key: "forest",
    label: "Forest Voice",
    voice: "What the Ancient Friends witnessed",
    icon: Trees,
    to: "/library/gallery",
    unsealedHint: "The Moonroot digest for this ring is not yet sealed.",
  },
  {
    key: "system",
    label: "System Voice",
    voice: "How the system was tended",
    icon: Wrench,
    to: "/library/tap-root",
    unsealedHint: "The stewardship report for this ring is not yet sealed.",
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

const ScrollsRoom = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [openRingId, setOpenRingId] = useState<string | null>(null);
  const [showOtherRecords, setShowOtherRecords] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const rings = useMemo(() => buildRings(6), []);
  const currentRing = rings.find((r) => r.isCurrent) ?? rings[0];
  const illum = moonIllumination(new Date());

  // Auto-open the current ring on first paint.
  useEffect(() => {
    if (currentRing && openRingId === null) setOpenRingId(currentRing.id);
  }, [currentRing, openRingId]);

  return (
    <div className="space-y-8">
      {/* ── Trunk header ─────────────────────────────────────────────── */}
      <header className="text-center space-y-2 px-4">
        <p className="text-[10px] uppercase tracking-[0.35em] font-serif text-muted-foreground/70">
          The Cycle Trunk
        </p>
        <h1 className="font-serif text-2xl md:text-3xl text-foreground/90">
          Every moon, the trunk grows one ring.
        </h1>
        <p className="text-sm font-serif italic text-muted-foreground/80">
          Three voices sign it. The forest remembers.
        </p>
        <p className="text-[11px] font-serif text-muted-foreground/60 pt-1">
          {currentRing?.glyph} Now beneath the {currentRing?.label}
          <span className="opacity-60"> · {Math.round(illum * 100)}% illuminated</span>
        </p>
      </header>

      {/* ── Vertical stack of rings ──────────────────────────────────── */}
      <ol className="relative space-y-3 pl-6 md:pl-8" aria-label="Cycle rings">
        {/* Trunk line */}
        <div
          aria-hidden
          className="absolute left-2 md:left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border/40 to-transparent"
        />

        {rings.map((ring) => {
          const open = openRingId === ring.id;
          return (
            <li key={ring.id} className="relative">
              {/* Ring node on the trunk */}
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[18px] md:-left-[22px] top-4 w-3 h-3 rounded-full border transition-all",
                  ring.isCurrent
                    ? "bg-primary/80 border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] animate-pulse"
                    : "bg-background border-border/60",
                )}
              />

              <button
                type="button"
                onClick={() => setOpenRingId(open ? null : ring.id)}
                className={cn(
                  "w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl",
                  "border transition-all duration-300",
                  ring.isCurrent
                    ? "border-primary/30 bg-gradient-to-r from-primary/[0.04] to-transparent"
                    : "border-border/40 bg-card/30 hover:border-border/70",
                )}
                aria-expanded={open}
                aria-controls={`ring-${ring.id}`}
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {ring.glyph}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-serif text-sm md:text-base text-foreground/90 truncate">
                    {ring.label}
                    {ring.isCurrent && (
                      <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-primary/80 font-sans">
                        current ring
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] font-serif italic text-muted-foreground/70 truncate">
                    {ring.whisper}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground/60 transition-transform duration-300 shrink-0",
                    open && "rotate-180",
                  )}
                />
              </button>

              {/* Three scrolls inside the ring */}
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={`ring-${ring.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 ml-4 md:ml-8 grid gap-2 md:grid-cols-3">
                      {SCROLL_SLOTS.map((slot) => {
                        const Icon = slot.icon;
                        // For now, only the *current* ring exposes live links —
                        // past rings will fill in as cycle_id binding lands.
                        const sealed = ring.isCurrent;
                        return (
                          <Link
                            key={slot.key}
                            to={sealed ? slot.to : "#"}
                            onClick={(e) => {
                              if (!sealed) e.preventDefault();
                            }}
                            aria-disabled={!sealed}
                            className={cn(
                              "group block p-3 rounded-lg border bg-background/50 transition-all",
                              sealed
                                ? "border-border/50 hover:border-primary/40 hover:bg-primary/[0.03]"
                                : "border-dashed border-border/30 cursor-default",
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon
                                className={cn(
                                  "w-3.5 h-3.5",
                                  sealed
                                    ? "text-primary/70 group-hover:text-primary"
                                    : "text-muted-foreground/40",
                                )}
                              />
                              <span className="text-[10px] uppercase tracking-[0.2em] font-serif text-muted-foreground/70">
                                {slot.label}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "text-xs font-serif leading-snug",
                                sealed ? "text-foreground/85" : "text-muted-foreground/60 italic",
                              )}
                            >
                              {sealed ? slot.voice : slot.unsealedHint}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>

      {/* ── Other records (folded; not the trunk) ─────────────────────── */}
      <section className="pt-2 border-t border-border/30">
        <button
          type="button"
          onClick={() => setShowOtherRecords((s) => !s)}
          className="text-[11px] uppercase tracking-[0.25em] font-serif text-muted-foreground/70 hover:text-foreground/80 transition-colors flex items-center gap-2"
          aria-expanded={showOtherRecords}
        >
          Other records
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              showOtherRecords && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {showOtherRecords && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Link
                    to="/ledger"
                    className="block p-4 rounded-lg border border-border/40 bg-card/30 hover:border-primary/40 transition-colors"
                  >
                    <p className="font-serif text-sm text-foreground/90">Tree Ledger</p>
                    <p className="text-[11px] font-serif italic text-muted-foreground/70 mt-0.5">
                      The transparency explorer.
                    </p>
                  </Link>
                  <Link
                    to="/council-of-life"
                    className="block p-4 rounded-lg border border-border/40 bg-card/30 hover:border-primary/40 transition-colors"
                  >
                    <p className="font-serif text-sm text-foreground/90">Council of Life</p>
                    <p className="text-[11px] font-serif italic text-muted-foreground/70 mt-0.5">
                      Enter the council chamber.
                    </p>
                  </Link>
                </div>

                {currentUserId && (
                  <div className="pt-2">
                    <h3 className="text-[11px] uppercase tracking-[0.25em] font-serif text-muted-foreground/70 mb-3">
                      Collaborator Volumes
                    </h3>
                    <CollaboratorShelf userId={currentUserId} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default ScrollsRoom;
