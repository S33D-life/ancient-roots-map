/**
 * SnapshotBadge — displays a compact Tree Health Snapshot summary
 * on witnessed tree records.
 */
import { Leaf, Sun, Volume2, MapPin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { TreeHealthSnapshot, SnapshotQuality } from "@/lib/env-snapshot-types";

interface SnapshotBadgeProps {
  snapshot: TreeHealthSnapshot;
  quality: SnapshotQuality;
}

const qualityConfig: Record<SnapshotQuality, { label: string; color: string }> = {
  basic: { label: "Basic", color: "text-muted-foreground" },
  standard: { label: "Standard", color: "text-primary/70" },
  rich: { label: "Rich", color: "text-primary" },
};

export default function SnapshotBadge({ snapshot, quality }: SnapshotBadgeProps) {
  const qc = qualityConfig[quality];
  const signals: string[] = [];

  if (snapshot.light) {
    signals.push(`🌿 ${snapshot.light.canopyCoveragePct}% canopy coverage`);
  }
  if (snapshot.sound) {
    signals.push(
      snapshot.sound.birdsongDetected
        ? "🐦 Birdsong detected"
        : `🔊 Ambient ${snapshot.sound.avgDbLevel}dB`
    );
  }
  if (snapshot.gps) {
    signals.push(`📍 ${snapshot.gps.confidence} GPS confidence (±${snapshot.gps.combinedAccuracyM}m)`);
  }
  if (snapshot.photos) {
    const total = snapshot.photos.initiatorCount + snapshot.photos.joinerCount;
    signals.push(`📸 ${total} photos from ${total > 1 ? "multiple angles" : "1 angle"}`);
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-[9px] font-serif gap-1 border-primary/20 cursor-help ${qc.color}`}
          >
            <Leaf className="w-2.5 h-2.5" />
            Health Snapshot
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-[240px] bg-card border-border/50 p-3"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-serif text-foreground font-medium">
                Tree Health Snapshot
              </span>
              <span className={`text-[9px] font-serif ${qc.color}`}>
                {qc.label}
              </span>
            </div>
            <div className="space-y-1">
              {signals.map((s, i) => (
                <p key={i} className="text-[10px] text-muted-foreground font-serif">
                  {s}
                </p>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground/50 font-serif">
              {snapshot.seasonHint} · {new Date(snapshot.capturedAt).toLocaleDateString()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
