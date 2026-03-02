/**
 * CosmicClock — Minimal cosmic rhythm indicator
 * Shows lunar phase, season, daily reset countdown, and optional Mayan day.
 */
import { useEffect, useState } from "react";
import { useCosmicClock } from "@/hooks/use-cosmic-clock";
import { useCalendarLenses } from "@/hooks/use-calendar-lenses";
import { formatTzolkinLabel } from "@/utils/mayanTzolkin";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

interface Props {
  variant?: "compact" | "full";
}

const CosmicClock = ({ variant = "compact" }: Props) => {
  const { lunar, season, countdown, now } = useCosmicClock();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const { todayMayan } = useCalendarLenses(userId);

  const countdownStr = `${String(countdown.hours).padStart(2, "0")}:${String(countdown.minutes).padStart(2, "0")}:${String(countdown.seconds).padStart(2, "0")}`;

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/cosmic"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card/40 backdrop-blur border border-border/20 text-xs font-serif text-muted-foreground hover:bg-card/60 transition-colors"
            >
              <span>{lunar.emoji}</span>
              <span>{season.emoji}</span>
              {todayMayan && <span className="text-[9px] opacity-60">{todayMayan.signGlyph}</span>}
              <span className="tabular-nums text-[10px] text-muted-foreground/60">{countdownStr}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-[220px]">
            <p className="font-medium">{lunar.phaseName} · {season.label}</p>
            {todayMayan && <p className="text-muted-foreground">{formatTzolkinLabel(todayMayan)}</p>}
            <p className="text-muted-foreground">Daily reset in {countdown.hours}h {countdown.minutes}m</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant
  return (
    <div className="p-4 rounded-xl bg-card/60 backdrop-blur border border-border/30 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-serif tracking-wide text-foreground/80">Cosmic Clock</h3>
        <Link to="/cosmic" className="text-[10px] text-primary hover:underline font-serif">
          View Calendar →
        </Link>
      </div>

      <div className={`grid ${todayMayan ? "grid-cols-4" : "grid-cols-3"} gap-3`}>
        {/* Lunar */}
        <div className="text-center space-y-1">
          <span className="text-2xl">{lunar.emoji}</span>
          <p className="text-[10px] font-serif text-muted-foreground leading-tight">{lunar.phaseName}</p>
          <p className="text-[9px] text-muted-foreground/50">{Math.round(lunar.illumination * 100)}% lit</p>
        </div>

        {/* Season */}
        <div className="text-center space-y-1">
          <span className="text-2xl">{season.emoji}</span>
          <p className="text-[10px] font-serif text-muted-foreground leading-tight">{season.label}</p>
          <p className="text-[9px] text-muted-foreground/50">
            {now.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Mayan (if enabled) */}
        {todayMayan && (
          <div className="text-center space-y-1">
            <span className="text-2xl">{todayMayan.signGlyph}</span>
            <p className="text-[10px] font-serif text-muted-foreground leading-tight">{formatTzolkinLabel(todayMayan)}</p>
            <p className="text-[9px] text-muted-foreground/50 italic">Tzolkin</p>
          </div>
        )}

        {/* Reset */}
        <div className="text-center space-y-1">
          <span className="text-2xl">⏳</span>
          <p className="text-[10px] font-serif text-muted-foreground leading-tight">Daily Reset</p>
          <p className="text-[9px] tabular-nums text-muted-foreground/50">{countdownStr}</p>
        </div>
      </div>
    </div>
  );
};

export default CosmicClock;
