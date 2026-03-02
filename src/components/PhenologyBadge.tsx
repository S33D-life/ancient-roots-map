/**
 * PhenologyBadge — Shows current phenological phase for a species.
 * Uses PhenologyService (adapter pattern) with confidence level.
 */
import { usePhenology, getPhaseDisplay, getConfidenceLabel } from "@/hooks/use-phenology";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  speciesKey: string;
  speciesName?: string;
  region?: { bioregionId?: string; hemisphere?: "north" | "south" };
  compact?: boolean;
}

const PhenologyBadge = ({ speciesKey, speciesName, region, compact = false }: Props) => {
  const { signal, loading } = usePhenology({
    speciesKey,
    region: region || { hemisphere: "north" },
    enabled: !!speciesKey,
  });

  if (loading || !signal) return null;

  const display = getPhaseDisplay(signal.phase);
  const confidenceLabel = getConfidenceLabel(signal.confidence);
  const isActive = signal.phase !== "dormant" && signal.phase !== "unknown";

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-serif px-2 py-0.5 rounded-full border ${
        isActive ? 'border-primary/30 text-primary bg-primary/10' : 'border-border/30 text-muted-foreground bg-card/40'
      }`}>
        {display.emoji} {display.label}
      </span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 text-[11px] font-serif px-2 py-0.5 rounded-full border ${
            isActive ? 'border-primary/30 text-primary bg-primary/10' : 'border-border/30 text-muted-foreground bg-card/40'
          }`}>
            {display.emoji} {display.label}
            <span className="text-[9px] opacity-60">· {confidenceLabel}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[200px]">
          <p className="font-medium">{speciesName || speciesKey}: {display.label}</p>
          <p className="text-muted-foreground">Confidence: {confidenceLabel}</p>
          <p className="text-muted-foreground">Source: {signal.source === "community" ? "Community observations" : "Seasonal data"}</p>
          {signal.typicalWindowStart && signal.typicalWindowEnd && (
            <p className="text-muted-foreground">Typical window: Month {signal.typicalWindowStart}–{signal.typicalWindowEnd}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PhenologyBadge;
