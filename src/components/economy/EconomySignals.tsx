/**
 * EconomySignals — Unified three-layer economy indicator.
 * Shows S33D Hearts, Species Hearts, and Influence in a consistent
 * visual format used across Vault, Value Tree, Staff pages, and Hives.
 *
 * Single source of truth for economy signal presentation.
 */
import { Heart, Sprout, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EconomyBalances {
  s33dHearts?: number;
  speciesHearts?: number;
  influence?: number;
}

type SignalSize = "sm" | "md" | "lg";

interface EconomySignalsProps {
  balances: EconomyBalances;
  /** Labels: "minted" | "earned" | "balance" | "generated" */
  variant?: "minted" | "earned" | "balance" | "generated";
  size?: SignalSize;
  className?: string;
  /** Show only non-zero values */
  compact?: boolean;
}

const SIGNAL_CONFIG = [
  {
    key: "s33dHearts" as const,
    icon: Heart,
    label: "S33D Hearts",
    color: "hsl(0, 65%, 55%)",
    sublabels: {
      minted: "currently minted",
      earned: "earned",
      balance: "balance",
      generated: "generated",
    },
  },
  {
    key: "speciesHearts" as const,
    icon: Sprout,
    label: "Species Hearts",
    color: "hsl(var(--primary))",
    sublabels: {
      minted: "currently recorded",
      earned: "earned",
      balance: "balance",
      generated: "generated",
    },
  },
  {
    key: "influence" as const,
    icon: Shield,
    label: "Influence",
    color: "hsl(42, 80%, 50%)",
    sublabels: {
      minted: "currently earned",
      earned: "earned",
      balance: "balance",
      generated: "generated",
    },
  },
] as const;

const SIZE_CLASSES: Record<SignalSize, { wrapper: string; icon: string; value: string; label: string; sublabel: string }> = {
  sm: {
    wrapper: "gap-2 px-3 py-2 min-w-[110px]",
    icon: "w-6 h-6",
    value: "text-xs",
    label: "text-[8px]",
    sublabel: "text-[7px]",
  },
  md: {
    wrapper: "gap-2.5 px-4 py-3 min-w-[140px]",
    icon: "w-8 h-8",
    value: "text-sm",
    label: "text-[9px]",
    sublabel: "text-[8px]",
  },
  lg: {
    wrapper: "gap-3 px-5 py-4 min-w-[160px]",
    icon: "w-10 h-10",
    value: "text-base",
    label: "text-[10px]",
    sublabel: "text-[9px]",
  },
};

const EconomySignals = ({
  balances,
  variant = "balance",
  size = "md",
  className,
  compact = false,
}: EconomySignalsProps) => {
  const sc = SIZE_CLASSES[size];

  const signals = SIGNAL_CONFIG.filter((s) => {
    if (!compact) return true;
    const val = balances[s.key];
    return val !== undefined && val > 0;
  });

  return (
    <div className={cn("flex flex-wrap justify-center gap-3", className)}>
      {signals.map((signal) => {
        const Icon = signal.icon;
        const value = balances[signal.key] ?? 0;

        return (
          <div
            key={signal.key}
            className={cn(
              "flex items-center rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm",
              sc.wrapper,
            )}
          >
            <div
              className={cn("rounded-full flex items-center justify-center shrink-0", sc.icon)}
              style={{ backgroundColor: `${signal.color}15` }}
            >
              <Icon
                className={size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"}
                style={{ color: signal.color }}
              />
            </div>
            <div className="text-left">
              <p className={cn("font-serif font-bold tabular-nums text-foreground", sc.value)}>
                {value.toLocaleString()}
              </p>
              <p className={cn("font-serif text-muted-foreground leading-tight", sc.label)}>
                {signal.label}
              </p>
              <p className={cn("font-serif text-muted-foreground/50", sc.sublabel)}>
                {signal.sublabels[variant]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EconomySignals;
