/**
 * CouncilCalendar — upcoming gatherings list, drawn from the existing
 * COUNCIL_CYCLES source of truth (src/data/council/councilCycles.ts).
 *
 * Reuses councilCycles helpers — does not introduce a parallel calendar.
 * Links out to /cosmic for the full moon/seasonal calendar.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { COUNCIL_CYCLES } from "@/data/council/councilCycles";
import {
  formatGatheringDate,
  formatMarkerDate,
  moonEmoji,
  moonLabel,
} from "@/data/council/councilCycles";

interface Props {
  /** How many upcoming sessions to show (default 4). */
  limit?: number;
}

const CouncilCalendar = ({ limit = 4 }: Props) => {
  const upcoming = useMemo(() => {
    const now = Date.now();
    return COUNCIL_CYCLES
      .filter((c) => new Date(c.gatheringDate).getTime() >= now - 24 * 60 * 60 * 1000)
      .sort((a, b) => a.gatheringDate.localeCompare(b.gatheringDate))
      .slice(0, limit);
  }, [limit]);

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/30">
      <CardContent className="p-5 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CalendarDays className="h-5 w-5 text-primary/70 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-lg md:text-xl font-serif tracking-wide text-foreground/90">
                Council Calendar
              </h2>
              <p className="text-xs md:text-sm font-serif italic text-muted-foreground/70 mt-0.5 leading-relaxed">
                New moons, full moons, gatherings, and living invitations.
              </p>
            </div>
          </div>
          <Link
            to="/cosmic"
            className="text-[10px] font-serif tracking-wider uppercase text-muted-foreground/50 hover:text-primary/70 transition-colors flex items-center gap-1 shrink-0 mt-1"
          >
            Cosmic <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-xs font-serif italic text-muted-foreground/60 py-3">
            The next gathering is yet to be set. Listen to the cycle.
          </p>
        ) : (
          <ul className="divide-y divide-border/30">
            {upcoming.map((c) => (
              <li
                key={c.id}
                className="py-3 flex items-start gap-3 text-sm font-serif"
              >
                <span className="text-lg leading-none mt-0.5">{moonEmoji(c.moonPhase)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-foreground/85">{c.title}</span>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground/40">
                      {moonLabel(c.moonPhase)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    🌿 {formatGatheringDate(c.gatheringDate)} · {c.time}
                  </div>
                  <div className="text-[11px] text-muted-foreground/40 mt-0.5">
                    Lunar marker · {formatMarkerDate(c.markerDate)} · curated by {c.curator}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default CouncilCalendar;
