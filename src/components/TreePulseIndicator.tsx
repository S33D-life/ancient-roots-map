/**
 * TreePulseIndicator — shows pulse status on tree detail pages.
 * Lightweight component querying 7-day activity for a single tree.
 */
import { useTreePulse } from "@/hooks/use-forest-pulse";
import { PULSE_LABELS, PULSE_COLORS } from "@/utils/forestPulse";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

interface TreePulseIndicatorProps {
  treeId: string;
}

export default function TreePulseIndicator({ treeId }: TreePulseIndicatorProps) {
  const { data: pulse } = useTreePulse(treeId);

  if (!pulse || pulse.pulse === "quiet") return null;

  const activeSignals = pulse.signals.filter(s => s.value > 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-serif text-foreground">Pulse:</span>
        <Badge variant="outline" className={`text-[9px] ${PULSE_COLORS[pulse.pulse]}`}>
          {PULSE_LABELS[pulse.pulse]}
        </Badge>
      </div>
      {activeSignals.length > 0 && (
        <span className="text-[10px] text-muted-foreground">
          {activeSignals.map(s => `${s.icon} ${s.value} ${s.label.toLowerCase()}`).join(" · ")}
        </span>
      )}
    </div>
  );
}
