/**
 * LocationConfidenceBadge — shows the location confidence level on tree pages.
 */
import { Badge } from "@/components/ui/badge";
import { CONFIDENCE_LABELS, type LocationConfidence } from "@/utils/locationRefinement";

interface LocationConfidenceBadgeProps {
  confidence: string | null;
  refinementCount?: number;
  className?: string;
}

export default function LocationConfidenceBadge({
  confidence,
  refinementCount,
  className = "",
}: LocationConfidenceBadgeProps) {
  const level = (confidence as LocationConfidence) || "approximate";
  const config = CONFIDENCE_LABELS[level] || CONFIDENCE_LABELS.approximate;

  const colorMap: Record<LocationConfidence, string> = {
    approximate: "bg-muted text-muted-foreground",
    good: "bg-primary/10 text-primary border-primary/20",
    refined: "bg-primary/15 text-primary border-primary/30",
    trunk_confirmed: "bg-primary/20 text-primary border-primary/40",
  };

  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-serif tracking-wider gap-1 ${colorMap[level]} ${className}`}
    >
      <span>{config.emoji}</span>
      {config.label}
      {refinementCount != null && refinementCount > 0 && (
        <span className="opacity-60">· {refinementCount} {refinementCount === 1 ? "point" : "points"}</span>
      )}
    </Badge>
  );
}
