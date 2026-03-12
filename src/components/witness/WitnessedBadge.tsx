/**
 * WitnessedBadge — small visual indicator on tree pages for co-witnessed records.
 */
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WitnessedBadgeProps {
  witnessCount?: number;
  className?: string;
}

export default function WitnessedBadge({ witnessCount = 1, className }: WitnessedBadgeProps) {
  if (witnessCount < 1) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 text-[10px] font-serif border-primary/30 text-primary bg-primary/5 ${className || ""}`}
          >
            <Shield className="w-3 h-3" />
            Witnessed
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="font-serif text-xs">
          <p>Co-verified by {witnessCount + 1} wardens on-site</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
