/**
 * Seasonal Ritual Calendar — shows upcoming moon phases, solstices,
 * equinoxes, and cross-quarter days. Ties into the app's mythic tone.
 */
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Sparkles } from "lucide-react";

interface RitualEvent {
  name: string;
  date: Date;
  type: "new_moon" | "full_moon" | "solstice" | "equinox" | "cross_quarter";
  emoji: string;
  description: string;
}

function getMoonEvents(year: number): RitualEvent[] {
  // Known new moon: Jan 29 2025 12:36 UTC
  const knownNew = new Date("2025-01-29T12:36:00Z").getTime();
  const synodicMs = 29.53058867 * 24 * 60 * 60 * 1000;
  const events: RitualEvent[] = [];

  const startOfYear = new Date(year, 0, 1).getTime();
  const endOfYear = new Date(year + 1, 0, 1).getTime();

  // Find first new moon of the year
  let cycle = knownNew;
  while (cycle + synodicMs < startOfYear) cycle += synodicMs;

  // Generate all moons for the year
  while (cycle < endOfYear) {
    if (cycle >= startOfYear) {
      events.push({
        name: "New Moon",
        date: new Date(cycle),
        type: "new_moon",
        emoji: "🌑",
        description: "A time for planting seeds and setting intentions",
      });
    }
    const full = cycle + synodicMs / 2;
    if (full >= startOfYear && full < endOfYear) {
      events.push({
        name: "Full Moon",
        date: new Date(full),
        type: "full_moon",
        emoji: "🌕",
        description: "A time for gathering, gratitude, and digital fires",
      });
    }
    cycle += synodicMs;
  }

  return events;
}

function getSolarEvents(year: number): RitualEvent[] {
  // Approximate dates — accurate enough for ritual planning
  return [
    { name: "Imbolc", date: new Date(year, 1, 1), type: "cross_quarter", emoji: "🕯️", description: "First stirring of spring — honour the returning light" },
    { name: "Spring Equinox", date: new Date(year, 2, 20), type: "equinox", emoji: "🌱", description: "Balance of light and dark — plant with purpose" },
    { name: "Beltane", date: new Date(year, 4, 1), type: "cross_quarter", emoji: "🔥", description: "Peak of spring — celebrate life's abundance" },
    { name: "Summer Solstice", date: new Date(year, 5, 21), type: "solstice", emoji: "☀️", description: "Longest day — honour the canopy at its fullest" },
    { name: "Lughnasadh", date: new Date(year, 7, 1), type: "cross_quarter", emoji: "🌾", description: "First harvest — gather the fruits of stewardship" },
    { name: "Autumn Equinox", date: new Date(year, 8, 22), type: "equinox", emoji: "🍂", description: "Balance returns — reflect on the year's growth" },
    { name: "Samhain", date: new Date(year, 10, 1), type: "cross_quarter", emoji: "🎃", description: "Thin veil — remember the ancient friends lost" },
    { name: "Winter Solstice", date: new Date(year, 11, 21), type: "solstice", emoji: "❄️", description: "Longest night — kindle the inner fire" },
  ];
}

function daysUntil(date: Date, now: Date): number {
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const TYPE_COLORS: Record<string, string> = {
  new_moon: "hsl(var(--muted-foreground))",
  full_moon: "hsl(var(--primary))",
  solstice: "hsl(var(--accent))",
  equinox: "hsl(42, 80%, 55%)",
  cross_quarter: "hsl(15, 70%, 55%)",
};

const SeasonalRitualCalendar = () => {
  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();

  const events = useMemo(() => {
    const moons = getMoonEvents(year);
    const solar = getSolarEvents(year);
    // Also include next year's early events
    const nextSolar = getSolarEvents(year + 1).filter(e => daysUntil(e.date, now) <= 90);
    const nextMoons = getMoonEvents(year + 1).filter(e => daysUntil(e.date, now) <= 90);

    return [...moons, ...solar, ...nextSolar, ...nextMoons]
      .filter(e => e.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 8);
  }, [year, now]);

  const nextSolar = events.find(e => e.type === "solstice" || e.type === "equinox" || e.type === "cross_quarter");

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center border border-primary/25">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="font-serif text-sm tracking-wide">
            Seasonal Ritual Calendar
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {/* Hero: next solar event */}
        {nextSolar && (
          <div
            className="p-3 rounded-xl mb-3 border"
            style={{
              background: `linear-gradient(135deg, hsl(var(--card)), hsl(var(--card) / 0.5))`,
              borderColor: TYPE_COLORS[nextSolar.type] + "33",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{nextSolar.emoji}</span>
              <div>
                <p className="font-serif text-sm" style={{ color: TYPE_COLORS[nextSolar.type] }}>
                  {nextSolar.name}
                </p>
                <p className="text-[10px] text-muted-foreground font-serif">
                  {nextSolar.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  {" · "}
                  {daysUntil(nextSolar.date, now) === 0 ? "Today!" : `in ${daysUntil(nextSolar.date, now)} days`}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-serif italic">
              {nextSolar.description}
            </p>
          </div>
        )}

        {/* Event timeline */}
        <div className="space-y-0.5">
          {events.map((event, i) => {
            const days = daysUntil(event.date, now);
            const isToday = days === 0;

            return (
              <div
                key={`${event.name}-${i}`}
                className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-secondary/10 transition-colors"
              >
                <span className="text-sm w-6 text-center">{event.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif truncate" style={{ color: TYPE_COLORS[event.type] }}>
                    {event.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-serif">
                    {event.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <Badge
                  variant={isToday ? "default" : "outline"}
                  className="text-[9px] font-serif tabular-nums shrink-0"
                >
                  {isToday ? "Today" : `${days}d`}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonalRitualCalendar;
