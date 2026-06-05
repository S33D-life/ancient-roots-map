/**
 * BeWithThisTreeCanopy — living presence state.
 *
 * Progressively simplifies based on the user's relationship to the tree:
 *
 *   STATE A — Stranger  (never met)
 *     "Meet This Tree" → primary: Begin Presence · secondary: Leave Something Here
 *
 *   STATE B — Present   (check-in active)
 *     "You Are Here · Xh remaining" → primary: Deepen Presence · secondary: Leave Something Here
 *     (Check In Again is NEVER shown while presence is active.)
 *
 *   STATE C — Steward   (returning, not currently present)
 *     "Meet Again" + inline collapsible "Seeds & Hearts" stewardship grove.
 *     The grove (Seeds & Hearts, stewardship, ecology) is revealed in place
 *     instead of duplicated below the page.
 *
 * Whisper ("Whisper Through the Roots") demoted to a tertiary link so it no
 * longer competes with the primary presence action.
 */
import { lazy, Suspense, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SingleTreePresence } from "@/hooks/use-single-tree-presence";

interface Props {
  treeName: string;
  proximityGate: { status: string; isUnlocked: boolean; canCheckin?: boolean };
  meetingStatus: string;
  hasMet: boolean;
  treePresence?: SingleTreePresence | null;
  /** Remaining presence window in minutes (when active). */
  presenceRemainingMinutes?: number | null;
  onMeetAgain: () => void;
  onLeaveOffering: () => void;
  onWhisperThroughRoots: () => void;
  /** Optional stewardship surface revealed inline under "Seeds & Hearts". */
  tendChildren?: ReactNode;
}

function formatRemaining(mins: number | null | undefined): string | null {
  if (mins == null || !Number.isFinite(mins) || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  if (h <= 0) return `${m}m remaining`;
  if (m <= 0) return `${h}h remaining`;
  return `${h}h ${m}m remaining`;
}

export default function BeWithThisTreeCanopy({
  treeName,
  proximityGate,
  meetingStatus,
  hasMet,
  treePresence,
  presenceRemainingMinutes,
  onMeetAgain,
  onLeaveOffering,
  onWhisperThroughRoots,
  tendChildren,
}: Props) {
  const isActive = meetingStatus === "active" || meetingStatus === "expiring";
  const canCheckin = proximityGate.canCheckin ?? proximityGate.status === "unlocked_present";
  const isNearby = proximityGate.status === "unlocked_nearby";
  const isLocked = !proximityGate.isUnlocked && proximityGate.status !== "checking";
  const rootsOpen = proximityGate.isUnlocked || hasMet;

  // Resolve presence state
  const state: "stranger" | "present" | "steward" =
    isActive ? "present" : hasMet ? "steward" : "stranger";

  const [tendOpen, setTendOpen] = useState(false);

  // Primary action wording per state
  let primaryLabel = "Begin Presence";
  let primaryHint: string | null = "Mark your presence beneath the canopy";
  let primaryDisabled = false;

  if (state === "present") {
    primaryLabel = "Deepen Presence";
    primaryHint = "Add to this meeting";
  } else if (state === "steward") {
    primaryLabel = "Meet Again";
    primaryHint = canCheckin
      ? "You are beneath the canopy"
      : isNearby
        ? "Within 100m to check in"
        : isLocked
          ? "Visit in person to meet"
          : "Return to this tree";
    if (!canCheckin && (isNearby || isLocked)) primaryDisabled = true;
  } else {
    // stranger
    if (canCheckin) primaryHint = "You are beneath the canopy";
    else if (isNearby) {
      primaryHint = "Within 100m to begin";
      primaryDisabled = true;
    } else if (isLocked) {
      primaryHint = "Visit in person to meet";
      primaryDisabled = true;
    }
  }

  // Header line
  const remaining = formatRemaining(presenceRemainingMinutes);
  const headerLine =
    state === "present"
      ? remaining
        ? `Presence active · ${remaining}`
        : "Presence active"
      : state === "steward"
        ? "This tree remembers you"
        : "Mark your presence beneath the canopy";

  const headerTitle =
    state === "present" ? "You Are Here" : state === "steward" ? "Tend This Tree" : "Meet This Tree";

  const headerGlyph = state === "present" ? "🟢" : state === "steward" ? "🌱" : "🌿";

  return (
    <motion.section
      aria-label={`Be with ${treeName}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mt-2 mb-4 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.07), transparent 70%), hsl(var(--card) / 0.4)",
      }}
    >
      {/* ── Living header ── */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden>{headerGlyph}</span>
            <h3 className="font-serif text-base text-primary tracking-wide leading-tight">
              {headerTitle}
            </h3>
          </div>
          <p className="text-[11px] font-serif text-muted-foreground/80 mt-1 leading-snug">
            {headerLine}
          </p>
        </div>
        {treePresence && treePresence.count > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 pt-1">
            <span className="relative flex h-[6px] w-[6px]">
              {treePresence.state === "here_now" && (
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                  style={{ background: "hsl(145, 55%, 48%)" }}
                />
              )}
              <span
                className="relative inline-flex rounded-full h-[6px] w-[6px]"
                style={{
                  background:
                    treePresence.state === "here_now"
                      ? "hsl(145, 55%, 48%)"
                      : "hsl(210, 35%, 58%)",
                  boxShadow:
                    treePresence.state === "here_now"
                      ? "0 0 6px hsla(145,55%,48%,0.4)"
                      : "none",
                }}
              />
            </span>
            <span
              className="text-[10px] font-serif"
              style={{
                color:
                  treePresence.state === "here_now"
                    ? "hsl(145, 50%, 55%)"
                    : "hsl(210, 30%, 62%)",
              }}
            >
              {treePresence.count > 1
                ? `${treePresence.count} here`
                : treePresence.state === "here_now"
                  ? "Someone here"
                  : "Recently met"}
            </span>
          </div>
        )}
      </div>

      {/* ── Primary + Secondary actions ── */}
      <div className="px-3 pb-3 space-y-2">
        <motion.button
          onClick={primaryDisabled ? undefined : onMeetAgain}
          disabled={primaryDisabled}
          whileTap={primaryDisabled ? undefined : { scale: 0.985 }}
          className={cn(
            "w-full text-left rounded-xl px-4 py-3.5 transition-all border",
            primaryDisabled
              ? "border-border/20 bg-secondary/10 opacity-60 cursor-not-allowed"
              : "border-primary/35 hover:border-primary/55 active:bg-primary/15",
          )}
          style={
            primaryDisabled
              ? undefined
              : {
                  background:
                    "radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.12), transparent 70%), hsl(var(--primary) / 0.06)",
                }
          }
        >
          <p className="text-base font-serif text-primary leading-tight">{primaryLabel}</p>
          {primaryHint && (
            <p className="text-[11px] font-serif text-muted-foreground/75 mt-1 leading-snug">
              {primaryHint}
            </p>
          )}
        </motion.button>

        <motion.button
          onClick={isLocked ? undefined : onLeaveOffering}
          disabled={isLocked}
          whileTap={isLocked ? undefined : { scale: 0.985 }}
          className={cn(
            "w-full text-left rounded-xl px-4 py-3 transition-all border",
            isLocked
              ? "border-border/20 bg-secondary/10 opacity-60 cursor-not-allowed"
              : "border-border/30 bg-card/30 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden>✨</span>
            <p className="text-sm font-serif text-foreground/90 leading-tight">
              Leave Something Here
            </p>
          </div>
          <p className="text-[11px] font-serif text-muted-foreground/70 mt-0.5 leading-snug pl-6">
            Photo · poem · song · bloom
          </p>
        </motion.button>

        {/* Whisper Through the Roots — peer card, quieter tone via icon/copy */}
        <motion.button
          type="button"
          onClick={rootsOpen ? onWhisperThroughRoots : undefined}
          disabled={!rootsOpen}
          whileTap={rootsOpen ? { scale: 0.985 } : undefined}
          className={cn(
            "whisper-roots-btn w-full text-left rounded-xl px-4 py-3 transition-all border",
            rootsOpen
              ? "border-border/30 bg-card/30 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10"
              : "border-border/20 bg-secondary/10 opacity-60 cursor-not-allowed",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden>🌬️</span>
            <p className="text-sm font-serif text-foreground/90 leading-tight">
              Whisper Through the Roots
            </p>
          </div>
          <p className="text-[11px] font-serif text-muted-foreground/70 mt-0.5 leading-snug pl-6">
            Mycelial message · carried beneath
          </p>
        </motion.button>
      </div>

      {/* ── Seeds & Hearts — inline stewardship disclosure (steward & present only) ── */}
      {tendChildren && state !== "stranger" && (
        <div className="border-t border-border/20">
          <button
            type="button"
            onClick={() => setTendOpen((v) => !v)}
            aria-expanded={tendOpen}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none" aria-hidden>🌱</span>
              <span className="text-[11px] font-serif tracking-[0.22em] uppercase text-muted-foreground/75">
                Seeds & Hearts
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-300",
                tendOpen && "rotate-180",
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {tendOpen && (
              <motion.div
                key="tend-grove"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 pt-1">{tendChildren}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </motion.section>
  );
}
