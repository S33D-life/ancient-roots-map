/**
 * TreeDetailPresenceBlock — unified check-in prompt + presence signal + encounter nudge.
 * Replaces the old check-in prompt and CollectHeartsButton above tabs.
 * Shows presence, guides the user, and hints toward Encounters when relevant.
 */
import { motion } from "framer-motion";
import { TreeDeciduous, ChevronRight, Heart, Wind } from "lucide-react";
import type { SingleTreePresence } from "@/hooks/use-single-tree-presence";
import type { TreeWhisper } from "@/hooks/use-whispers";

interface Props {
  tree: { id: string; name: string };
  proximityGate: { status: string; isUnlocked: boolean; canCheckin?: boolean };
  meetingStatus: string;
  checkinStats: { totalVisits?: number } | null;
  onCheckin: () => void;
  treePresence: SingleTreePresence | null;
  availableWhispers: TreeWhisper[];
  hasHearts: boolean;
  onGoToEncounters: () => void;
}

export default function TreeDetailPresenceBlock({
  tree,
  proximityGate,
  meetingStatus,
  checkinStats,
  onCheckin,
  treePresence,
  availableWhispers,
  hasHearts,
  onGoToEncounters,
}: Props) {
  const canCheckin = proximityGate.canCheckin ?? (proximityGate.status === "unlocked_present");
  const isNearby = proximityGate.status === "unlocked_present" || proximityGate.status === "unlocked_nearby" || proximityGate.status === "unlocked_grace";
  const isActive = meetingStatus === "active" || meetingStatus === "expiring";
  const hasCheckedIn = checkinStats && (checkinStats.totalVisits ?? 0) > 0;
  const hasWhispers = availableWhispers.length > 0;
  const hasEncounterContent = hasWhispers || hasHearts;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-4 mb-2 space-y-2"
    >
      {/* ── Presence signal ── */}
      {treePresence && (
        <div className="flex items-center gap-2 px-4 py-1.5">
          {treePresence.state === "here_now" ? (
            <>
              <span className="relative flex h-[6px] w-[6px] shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: "hsl(145, 55%, 48%)" }} />
                <span className="relative inline-flex rounded-full h-[6px] w-[6px]" style={{ background: "hsl(145, 55%, 48%)", boxShadow: "0 0 6px hsla(145,55%,48%,0.4)" }} />
              </span>
              <p className="text-[11px] font-serif" style={{ color: "hsl(145, 50%, 55%)" }}>
                {treePresence.count > 1 ? `${treePresence.count} wanderers here now` : "Someone is here now"}
              </p>
            </>
          ) : (
            <>
              <span className="flex h-[5px] w-[5px] rounded-full shrink-0" style={{ background: "hsl(210, 35%, 58%)", opacity: 0.7 }} />
              <p className="text-[11px] font-serif" style={{ color: "hsl(210, 30%, 55%)" }}>
                {treePresence.count > 1 ? `${treePresence.count} wanderers here recently` : "Recently met"}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Check-in / meeting status ── */}
      {isActive ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-serif text-foreground/80">
                {hasCheckedIn && (checkinStats?.totalVisits ?? 0) > 1
                  ? `Welcome back — your path with ${tree.name} continues`
                  : `You've found an Ancient Friend`}
              </p>
              <p className="text-[10px] font-serif text-muted-foreground/60 mt-0.5">
                Leave an offering, listen for whispers, or simply be present
              </p>
            </div>
          </div>
        </div>
      ) : canCheckin ? (
        <button
          onClick={onCheckin}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40" style={{ background: "hsl(120, 50%, 50%)" }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "hsl(120, 50%, 50%)" }} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif text-foreground/90 group-hover:text-primary transition-colors">
              {hasCheckedIn ? "Check in again" : "Begin your meeting with this tree"}
            </p>
            <p className="text-[11px] font-serif text-muted-foreground mt-0.5">You are beneath this canopy — mark your arrival</p>
          </div>
          <TreeDeciduous className="w-4 h-4 text-primary/40 shrink-0" />
        </button>
      ) : proximityGate.status === "unlocked_nearby" ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/15 bg-primary/5">
          <span className="flex h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "hsl(42, 55%, 55%)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-serif text-foreground/70">
              You are nearby — move closer to check in
            </p>
            <p className="text-[10px] font-serif text-muted-foreground/50 mt-0.5">
              Check-in requires being within 100m of the tree
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/30 bg-secondary/10">
          <span className="flex h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "hsl(42, 50%, 50%)", opacity: 0.4 }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-serif text-muted-foreground/80">
              {proximityGate.status === "no_location"
                ? "Location access is needed to check in"
                : hasCheckedIn
                  ? `Visited ${checkinStats!.totalVisits} time${checkinStats!.totalVisits !== 1 ? "s" : ""} — this tree remembers you`
                  : "This tree is waiting — find it to begin your meeting"}
            </p>
          </div>
        </div>
      )}

      {/* ── Encounter nudge — hint toward Encounters tab when content awaits ── */}
      {hasEncounterContent && !isActive && (
        <button
          onClick={onGoToEncounters}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-left transition-colors hover:bg-primary/5 group"
        >
          <div className="flex items-center gap-1.5 shrink-0">
            {hasWhispers && <Wind className="w-3 h-3" style={{ color: "hsl(260, 40%, 60%)" }} />}
            {hasHearts && <Heart className="w-3 h-3" style={{ color: "hsl(140, 40%, 55%)" }} />}
          </div>
          <p className="text-[11px] font-serif text-muted-foreground/70 group-hover:text-foreground/80 transition-colors flex-1">
            {hasWhispers && hasHearts
              ? "Whispers and hearts are waiting in Encounters"
              : hasWhispers
                ? "A whisper lingers — explore Encounters"
                : "Hearts are waiting — explore Encounters"}
          </p>
          <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
        </button>
      )}
    </motion.div>
  );
}
