/**
 * DailySeedCounter — compact daily seed indicator for header/panels.
 * Shows remaining seeds with a minimal radial progress hint.
 */
import { Sprout } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DailySeedCounterProps {
  remaining: number;
  total?: number;
  compact?: boolean;
}

const DailySeedCounter = ({ remaining, total = 33, compact = false }: DailySeedCounterProps) => {
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const isEmpty = remaining <= 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`
            inline-flex items-center gap-1.5 rounded-full border transition-colors cursor-default
            ${compact ? "px-2 py-0.5" : "px-2.5 py-1"}
            ${isEmpty
              ? "border-border/20 text-muted-foreground/40"
              : "border-primary/20 text-primary/80"
            }
          `}
          style={{
            background: isEmpty
              ? "hsl(var(--muted) / 0.15)"
              : `linear-gradient(90deg, hsl(var(--primary) / 0.08) ${pct}%, transparent ${pct}%)`,
          }}
        >
          <Sprout className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
          <span className={`font-serif tabular-nums ${compact ? "text-[10px]" : "text-[11px]"}`}>
            {remaining}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs font-serif">
        <p>{remaining} of {total} seeds remaining today</p>
        <p className="text-muted-foreground/60 text-[10px] mt-0.5">
          Plant seeds at trees to grow Hearts
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default DailySeedCounter;
