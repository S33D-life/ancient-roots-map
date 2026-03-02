/**
 * Cosmic Calendar — Unified cycle view
 * Brings together lunar phases, solar events, council gatherings,
 * blooming windows, seed cycles, and daily heart resets.
 */
import { useState, useMemo, useEffect } from "react";
import { useCosmicClock, getSolarEvents, getUpcomingLunarEvents, getLunarInfo, type CosmicEvent } from "@/hooks/use-cosmic-clock";
import { useFoodCycles, computeRegionStages, type CycleStage } from "@/hooks/use-food-cycles";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Moon, Sun, Sprout, Users, Flower2 } from "lucide-react";
import CosmicClock from "@/components/CosmicClock";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface CouncilEvent {
  id: string;
  name: string;
  date: string;
}

const CosmicCalendarPage = () => {
  const { lunar, season, countdown } = useCosmicClock();
  const { foods, loading: foodsLoading } = useFoodCycles();
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [councils, setCouncils] = useState<CouncilEvent[]>([]);

  useEffect(() => {
    supabase
      .from("councils")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setCouncils(data.map(c => ({ id: c.id, name: c.name, date: c.created_at })));
      });
  }, []);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday-based
    const days: (Date | null)[] = [];

    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    return days;
  }, [viewMonth, viewYear]);

  // Solar events for this year
  const solarEvents = useMemo(() => getSolarEvents(viewYear), [viewYear]);

  // Lunar events for display
  const lunarDates = useMemo(() => {
    const events: Map<string, { phase: string; emoji: string }> = new Map();
    // Check each day of the month
    for (let d = 1; d <= 31; d++) {
      const date = new Date(viewYear, viewMonth, d);
      if (date.getMonth() !== viewMonth) break;
      const info = getLunarInfo(date);
      if (info.phase === "new_moon" || info.phase === "full_moon") {
        events.set(date.toDateString(), { phase: info.phaseName, emoji: info.emoji });
      }
    }
    return events;
  }, [viewMonth, viewYear]);

  // Blooming species this month
  const bloomingSpecies = useMemo(() => {
    const month = viewMonth + 1;
    return foods.filter(f =>
      f.flowering_months.includes(month) ||
      f.fruiting_months.includes(month) ||
      f.peak_months.includes(month)
    );
  }, [foods, viewMonth]);

  // Events on selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = selectedDate.toDateString();
    const events: { icon: string; label: string; detail: string }[] = [];

    // Lunar
    const l = lunarDates.get(key);
    if (l) events.push({ icon: l.emoji, label: l.phase, detail: l.phase === "Full Moon" ? "Time Tree: Outside of Time" : "Time Tree: Inside of Time" });

    // Solar
    const solar = solarEvents.find(e => e.date.toDateString() === key);
    if (solar) events.push({ icon: solar.emoji, label: solar.name, detail: solar.description });

    // Heart reset
    events.push({ icon: "💚", label: "Daily Heart Reset", detail: "33 seeds refresh. Check-in caps reset." });

    return events;
  }, [selectedDate, lunarDates, solarEvents]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border/20 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif text-lg tracking-wide text-foreground">Cosmic Calendar</h1>
          <div className="w-5" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Live Cosmic Clock */}
        <CosmicClock variant="full" />

        {/* Month Navigator */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-card/60 text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-serif text-base tracking-wide text-foreground">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-card/60 text-muted-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl bg-card/40 backdrop-blur border border-border/20 p-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[10px] font-serif text-muted-foreground/50 uppercase tracking-wider">
                {w}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;

              const lunarEvent = lunarDates.get(day.toDateString());
              const solarEvent = solarEvents.find(e => e.date.toDateString() === day.toDateString());
              const isSelected = selectedDate?.toDateString() === day.toDateString();
              const isTodayCell = isToday(day);

              return (
                <button
                  key={day.getDate()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5
                    text-xs font-serif transition-all
                    ${isSelected ? "bg-primary/20 ring-1 ring-primary/40 text-primary" : "hover:bg-card/80 text-foreground/70"}
                    ${isTodayCell ? "ring-1 ring-primary/30 font-bold text-primary" : ""}
                  `}
                >
                  <span>{day.getDate()}</span>
                  {(lunarEvent || solarEvent) && (
                    <span className="text-[9px] leading-none">
                      {lunarEvent?.emoji || solarEvent?.emoji}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail */}
        {selectedDate && (
          <div className="rounded-xl bg-card/60 backdrop-blur border border-border/30 p-4 space-y-3 animate-in fade-in duration-300">
            <h3 className="font-serif text-sm text-foreground">
              {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDateEvents.map((e, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-base">{e.icon}</span>
                    <div>
                      <p className="text-xs font-serif text-foreground/80">{e.label}</p>
                      <p className="text-[10px] text-muted-foreground">{e.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No cosmic events on this date.</p>
            )}
          </div>
        )}

        {/* Upcoming Events List */}
        <div className="space-y-2">
          <h3 className="font-serif text-sm text-foreground/80 tracking-wide">Upcoming Rhythms</h3>
          <div className="space-y-1.5">
            {getUpcomingLunarEvents(4).map(event => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-border/20"
              >
                <span className="text-lg">{event.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif text-foreground/80">{event.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {event.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {" · "}
                    {Math.ceil((event.date.getTime() - Date.now()) / 86400000)} days away
                  </p>
                </div>
                {event.name.includes("Full") && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-serif">Time Tree</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blooming This Month */}
        {bloomingSpecies.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-serif text-sm text-foreground/80 tracking-wide flex items-center gap-1.5">
              <Flower2 className="w-3.5 h-3.5 text-primary" />
              Blooming This Month
            </h3>
            <div className="flex flex-wrap gap-2">
              {bloomingSpecies.map(sp => (
                <span
                  key={sp.id}
                  className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary/80 font-serif border border-primary/20"
                >
                  {sp.icon} {sp.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* How This Works */}
        <div className="rounded-xl bg-card/30 border border-border/20 p-4 space-y-2">
          <h3 className="font-serif text-sm text-foreground/60">How the Cosmic Calendar Works</h3>
          <div className="text-[10px] text-muted-foreground space-y-1 leading-relaxed">
            <p>🌑🌕 <strong>Lunar phases</strong> are calculated algorithmically and drive Time Tree rituals (Full Moon = Outside of Time, New Moon = Inside of Time).</p>
            <p>🌱☀️ <strong>Solar events</strong> (equinoxes, solstices, cross-quarter days) mark seasonal transitions and future global gatherings.</p>
            <p>💚 <strong>Daily reset</strong> at midnight refreshes your 33 seeds, check-in caps, and Time Tree rewards.</p>
            <p>🌸 <strong>Bloom windows</strong> come from the Seed Cellar's seasonal data. Real phenology, not decoration.</p>
            <p>All cycles are transparent. No hidden mechanics.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CosmicCalendarPage;
