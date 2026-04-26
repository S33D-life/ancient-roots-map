/**
 * ProximityGateMessage — warm, dynamic proximity guidance.
 *
 * Replaces the old "must be within 100m" rejection with an encouraging
 * walking-distance read-out that updates as the wanderer approaches.
 *
 *   far away (>500m)  →  "You're 1.2km away — walk closer to gather"
 *   approaching       →  "340m away — almost in earshot 🌿"
 *   nearby (<200m)    →  "120m — you can feel it now"
 *   ready (<100m)     →  "You've arrived ✨"
 *   grace             →  "You may still offer from afar"
 */
import { Footprints, Clock, Sparkles, TreeDeciduous } from "lucide-react";
import { motion } from "framer-motion";
import type { GateStatus } from "@/hooks/use-tree-proximity-gate";

interface Props {
  status: GateStatus;
  graceLabel: string | null;
  treeName?: string;
  /** Live distance from user → tree in meters (null = unknown / no permission) */
  distanceMeters?: number | null;
  className?: string;
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)}km`;
}

const ProximityGateMessage = ({
  status,
  graceLabel,
  treeName,
  distanceMeters,
  className = "",
}: Props) => {
  // Already at the tree — affirm gently, then step out of the way
  if (status === "unlocked_present") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-serif ${className}`}
        style={{
          borderColor: "hsl(140 40% 45% / 0.25)",
          background: "hsl(140 40% 35% / 0.06)",
          color: "hsl(140 40% 55%)",
        }}
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span>You've arrived at {treeName ?? "this tree"}.</span>
      </motion.div>
    );
  }

  if (status === "unlocked_grace" && graceLabel) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-serif ${className}`}
        style={{
          borderColor: "hsl(var(--primary) / 0.2)",
          background: "hsl(var(--primary) / 0.05)",
          color: "hsl(var(--primary))",
        }}
      >
        <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />
        <span>
          You last visited {treeName ? <strong>{treeName}</strong> : "this tree"} — you may still offer from afar.{" "}
          <span className="opacity-70">{graceLabel}</span>
        </span>
      </div>
    );
  }

  // Within OFFERING_RADIUS but not check-in distance — almost there
  if (status === "unlocked_nearby") {
    const dist = distanceMeters && distanceMeters > 0 ? formatDistance(distanceMeters) : null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-serif ${className}`}
        style={{
          borderColor: "hsl(42 70% 50% / 0.25)",
          background: "hsl(42 70% 50% / 0.05)",
          color: "hsl(42 70% 50%)",
        }}
      >
        <Footprints className="w-3.5 h-3.5 shrink-0" />
        <span>
          {dist ? <><strong>{dist}</strong> away — </> : null}
          almost in earshot of {treeName ?? "this tree"}.
        </span>
      </motion.div>
    );
  }

  // Locked / no_location → encouraging walking message
  if (status === "locked" || status === "no_location") {
    const dist = distanceMeters && distanceMeters > 0 ? formatDistance(distanceMeters) : null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-xs font-serif ${className}`}
        style={{
          borderColor: "hsl(var(--muted-foreground) / 0.2)",
          background: "hsl(var(--muted) / 0.3)",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        <TreeDeciduous className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
        <div className="space-y-1 min-w-0">
          {dist ? (
            <p className="leading-relaxed">
              You're <strong className="text-foreground tabular-nums">{dist}</strong> from{" "}
              {treeName ? <strong className="text-foreground">{treeName}</strong> : "this ancient friend"} — walk closer to gather hearts and offer.
            </p>
          ) : (
            <p className="leading-relaxed">
              Hearts gather at the tree. Walk to{" "}
              {treeName ? <strong className="text-foreground">{treeName}</strong> : "this ancient friend"} to continue your story.
            </p>
          )}
          <p className="opacity-60 flex items-center gap-1">
            <Footprints className="w-3 h-3" />
            Being present lets your offerings resonate more deeply.
          </p>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default ProximityGateMessage;
