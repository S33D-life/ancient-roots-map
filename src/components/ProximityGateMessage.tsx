/**
 * ProximityGateMessage — gentle messaging when offerings/whispers are locked
 * because the user isn't near the tree and the grace period has expired.
 */
import { MapPin, Clock, TreeDeciduous } from "lucide-react";
import type { GateStatus } from "@/hooks/use-tree-proximity-gate";

interface Props {
  status: GateStatus;
  graceLabel: string | null;
  treeName?: string;
  className?: string;
}

const ProximityGateMessage = ({ status, graceLabel, treeName, className = "" }: Props) => {
  if (status === "unlocked_present") return null;

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

  if (status === "locked") {
    return (
      <div
        className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-xs font-serif ${className}`}
        style={{
          borderColor: "hsl(var(--muted-foreground) / 0.2)",
          background: "hsl(var(--muted) / 0.3)",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        <TreeDeciduous className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
        <div className="space-y-1">
          <p className="leading-relaxed">
            Offerings and whispers are seeded at the tree. Please return to{" "}
            {treeName ? <strong className="text-foreground">{treeName}</strong> : "this ancient friend"} to continue your story.
          </p>
          <p className="opacity-60 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Being present allows your offerings to resonate more deeply.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default ProximityGateMessage;
