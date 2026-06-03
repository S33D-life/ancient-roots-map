/**
 * BeWithThisTreeCanopy — unified "Be With This Tree" action canopy.
 *
 * Replaces the fragmented entry points (Witness, Visit Again, Make Offering,
 * Begin Encounter, Whisper, Seeds & Hearts) with one ceremonial 4-mode ritual
 * grid. Logic and routes are preserved — this is purely a grouping/hierarchy
 * pass so the page reads as a single living encounter flow.
 *
 * Modes:
 *   🌿 Meet Again         — check-in / active encounter
 *   ✨ Leave Something Here — canonical offering gateway
 *   🫧 Send Through Roots  — whisper propagation
 *   🌱 Tend This Tree      — seeds, hearts, stewardship
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SingleTreePresence } from "@/hooks/use-single-tree-presence";

type Mode = {
  key: string;
  glyph: string;
  label: string;
  subtitle: string;
  hint?: string;
  onSelect: () => void;
  disabled?: boolean;
  emphasis?: boolean;
};

interface Props {
  treeName: string;
  proximityGate: { status: string; isUnlocked: boolean; canCheckin?: boolean };
  meetingStatus: string;
  hasMet: boolean;
  treePresence?: SingleTreePresence | null;
  onMeetAgain: () => void;
  onLeaveOffering: () => void;
  onSendThroughRoots: () => void;
  onTendTree: () => void;
}

export default function BeWithThisTreeCanopy({
  treeName,
  proximityGate,
  meetingStatus,
  hasMet,
  treePresence,
  onMeetAgain,
  onLeaveOffering,
  onSendThroughRoots,
  onTendTree,
}: Props) {
  const isActive = meetingStatus === "active" || meetingStatus === "expiring";
  const canCheckin = proximityGate.canCheckin ?? proximityGate.status === "unlocked_present";
  const isNearby = proximityGate.status === "unlocked_nearby";
  const isLocked = !proximityGate.isUnlocked && proximityGate.status !== "checking";

  // Meet Again copy
  let meetLabel = "Meet Again";
  let meetHint: string = hasMet ? "Return to this tree" : "Begin your meeting";
  let meetDisabled = false;

  if (isActive) {
    meetLabel = "Present Now";
    meetHint = "Meeting in progress";
  } else if (canCheckin) {
    meetLabel = hasMet ? "Check In Again" : "Check In";
    meetHint = "You are beneath the canopy";
  } else if (isNearby) {
    meetLabel = "Move Closer";
    meetHint = "Within 100m to check in";
    meetDisabled = true;
  } else if (isLocked) {
    meetLabel = "Find This Tree";
    meetHint = "Visit in person to meet";
    meetDisabled = true;
  } else if (hasMet) {
    meetHint = "This tree remembers you";
    meetDisabled = true;
  }

  // Whisper is open in grace / nearby / present; otherwise gated to a soft note
  const rootsOpen = proximityGate.isUnlocked || hasMet;

  const modes: Mode[] = [
    {
      key: "meet",
      glyph: "🌿",
      label: meetLabel,
      subtitle: "Meet again",
      hint: meetHint,
      onSelect: onMeetAgain,
      disabled: meetDisabled,
      emphasis: canCheckin || isActive,
    },
    {
      key: "offering",
      glyph: "✨",
      label: "Leave Something Here",
      subtitle: "Offer",
      hint: "Photo · poem · song · bloom",
      onSelect: onLeaveOffering,
      disabled: isLocked,
    },
    {
      key: "roots",
      glyph: "🫧",
      label: "Send Through the Roots",
      subtitle: "Whisper",
      hint: rootsOpen ? "Travels to kin trees" : "Visit to unlock the roots",
      onSelect: onSendThroughRoots,
      disabled: !rootsOpen,
    },
    {
      key: "tend",
      glyph: "🌱",
      label: "Tend This Tree",
      subtitle: "Seeds & hearts",
      hint: "Plant, collect, steward",
      onSelect: onTendTree,
    },
  ];

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
      {/* Header — soft ceremonial label */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-serif tracking-[0.22em] uppercase text-muted-foreground/60">
            Be with this tree
          </p>
        </div>
        {treePresence && treePresence.count > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
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

      {/* 2x2 ritual grid */}
      <div className="grid grid-cols-2 gap-1.5 p-2 pt-1">
        {modes.map((mode) => (
          <motion.button
            key={mode.key}
            onClick={mode.disabled ? undefined : mode.onSelect}
            disabled={mode.disabled}
            whileTap={mode.disabled ? undefined : { scale: 0.98 }}
            className={cn(
              "relative text-left rounded-xl px-3 py-3 transition-all min-h-[88px] flex flex-col gap-1",
              "border",
              mode.disabled
                ? "border-border/20 bg-secondary/10 opacity-60 cursor-not-allowed"
                : mode.emphasis
                  ? "border-primary/35 bg-primary/8 hover:bg-primary/12 active:bg-primary/15"
                  : "border-border/25 bg-card/30 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10",
            )}
            style={
              mode.emphasis
                ? {
                    background:
                      "radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.10), transparent 70%), hsl(var(--primary) / 0.05)",
                  }
                : undefined
            }
          >
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none" aria-hidden>
                {mode.glyph}
              </span>
              <span className="text-[9px] font-serif tracking-[0.18em] uppercase text-muted-foreground/60">
                {mode.subtitle}
              </span>
            </div>
            <p
              className={cn(
                "text-sm font-serif leading-tight",
                mode.emphasis ? "text-primary" : "text-foreground/90",
              )}
            >
              {mode.label}
            </p>
            {mode.hint && (
              <p className="text-[10.5px] font-serif text-muted-foreground/70 leading-snug mt-auto">
                {mode.hint}
              </p>
            )}
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
