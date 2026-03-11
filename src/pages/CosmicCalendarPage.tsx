/**
 * Cosmic Calendar — Unified cycle view with modular Calendar Lenses + Phenology signals.
 * 
 * Harmonised with: Map, Blooming Clock, Harvest Exchange, TEOTAG.
 */
import { useState, useMemo } from "react";
import { useSeasonalLens } from "@/contexts/SeasonalLensContext";
import { useCosmicClock, getSolarEvents, getUpcomingLunarEvents, getLunarInfo } from "@/hooks/use-cosmic-clock";
import { useFoodCycles } from "@/hooks/use-food-cycles";
import { useCalendarLenses } from "@/hooks/use-calendar-lenses";
import { usePhenology, getPhaseDisplay } from "@/hooks/use-phenology";
import { useMarkets } from "@/hooks/use-markets";
import { useSeasonalEvents } from "@/hooks/use-seasonal-events";
import { getTzolkinDay, formatTzolkinLabel } from "@/utils/mayanTzolkin";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Flower2, Settings, Leaf, Activity, TreeDeciduous, MapPin, Calendar, ArrowRight } from "lucide-react";
import CosmicClock from "@/components/CosmicClock";
import SeasonalLensBanner from "@/components/seasonal/SeasonalLensBanner";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CosmicCalendarPage = () => {
  const { lunar, season, countdown } = useCosmicClock();
  const { foods } = useFoodCycles();
  const { markets: openMarkets } = useMarkets({ status: "open" });
  const { userId } = useCurrentUser();
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { activeLenses, getLensDataForDate, todayMayan, prefs } = useCalendarLenses(userId);
  const { activeLens: seasonalLens, isLensMonth } = useSeasonalLens();

  // Unified seasonal events (includes harvest listings + food cycles)
  const { harvestEvents, bloomEvents, getEventsForMonth } = useSeasonalEvents(viewMonth + 1);

  // Mayan lens active?
  const mayanActive = activeLenses.some(l => l.slug === "mayan");

  // Seasonal lens: is current view month within the active lens?
  const isSeasonalMonth = !!seasonalLens && isLensMonth(viewMonth + 1);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    return days;
  }, [viewMonth, viewYear]);

  const solarEvents = useMemo(() => getSolarEvents(viewYear), [viewYear]);

  const lunarDates = useMemo(() => {
    const events: Map<string, { phase: string; emoji: string }> = new Map();
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

  const bloomingSpecies = useMemo(() => {
    const month = viewMonth + 1;
    return foods.filter(f =>
      f.flowering_months.includes(month) || f.fruiting_months.includes(month) || f.peak_months.includes(month)
    );
  }, [foods, viewMonth]);

  // Check if a day has harvest events (for dot indicator)
  const hasHarvestForDay = useMemo(() => {
    if (harvestEvents.length === 0) return new Set<number>();
    // Harvest events span entire months, so all days in the month show
    return new Set(harvestEvents.map(() => -1)); // flag: has any
  }, [harvestEvents]);
  const monthHasHarvests = harvestEvents.length > 0;

  // Selected date: combine built-in events + lens events + harvest events
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = selectedDate.toDateString();
    const events: { icon: string; label: string; detail: string; lensSlug?: string; link?: string }[] = [];

    const l = lunarDates.get(key);
    if (l) events.push({ icon: l.emoji, label: l.phase, detail: l.phase === "Full Moon" ? "Time Tree: Outside of Time" : "Time Tree: Inside of Time" });

    const solar = solarEvents.find(e => e.date.toDateString() === key);
    if (solar) events.push({ icon: solar.emoji, label: solar.name, detail: solar.description });

    events.push({ icon: "💚", label: "Daily Heart Reset", detail: "33 seeds refresh. Check-in caps reset." });

    // Lens-contributed events
    const lensData = getLensDataForDate(selectedDate);
    for (const ld of lensData) {
      if (ld.lensSlug === "astronomical") continue;
      events.push({ icon: ld.lensIcon, label: ld.label, detail: ld.detail, lensSlug: ld.lensSlug });
    }

    // Harvest listing events for this month
    const selMonth = selectedDate.getMonth() + 1;
    const monthHarvests = getEventsForMonth(selMonth).filter(e => e.source === "harvest_listing");
    for (const h of monthHarvests) {
      events.push({
        icon: h.emoji,
        label: h.title,
        detail: `${h.metadata?.availLabel || "Harvest"} · ${h.subtitle || ""}`.trim(),
        link: h.links?.harvestId ? `/harvest/${h.links.harvestId}` : undefined,
      });
    }

    return events;
  }, [selectedDate, lunarDates, solarEvents, getLensDataForDate, getEventsForMonth]);

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
          <Link to="/cosmic/settings" className="text-muted-foreground hover:text-foreground">
            <Settings className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Live Cosmic Clock */}
        <CosmicClock variant="full" />

        {/* Calendar Lenses */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-serif text-muted-foreground/50 uppercase tracking-wider">Lenses:</span>
          {activeLenses.map(lens => (
            <span
              key={lens.id}
              className="text-[10px] px-2 py-0.5 rounded-full bg-card/60 border border-border/20 text-muted-foreground font-serif flex items-center gap-1"
            >
              {lens.icon} {lens.name}
            </span>
          ))}
          <Link to="/cosmic/settings" className="text-[10px] text-primary/60 hover:text-primary font-serif">
            Edit
          </Link>
        </div>

        {/* Seasonal Lens banner */}
        <SeasonalLensBanner context="calendar" />

        {/* Month Navigator */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-card/60 text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-serif text-base tracking-wide text-foreground">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-card/60 text-muted-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl bg-card/40 backdrop-blur border border-border/20 p-3">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[10px] font-serif text-muted-foreground/50 uppercase tracking-wider">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;

              const lunarEvent = lunarDates.get(day.toDateString());
              const solarEvent = solarEvents.find(e => e.date.toDateString() === day.toDateString());
              const isSelected = selectedDate?.toDateString() === day.toDateString();
              const isTodayCell = isToday(day);

              // Mayan glyph for the day (if lens active)
              const mayanGlyph = mayanActive ? getTzolkinDay(day).signGlyph : null;

              return (
                <button
                  key={day.getDate()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0
                    text-xs font-serif transition-all
                    ${isSelected ? "bg-primary/20 ring-1 ring-primary/40 text-primary" : "hover:bg-card/80 text-foreground/70"}
                    ${isTodayCell ? "ring-1 ring-primary/30 font-bold text-primary" : ""}
                    ${isSeasonalMonth && !isSelected ? "bg-primary/[0.03]" : ""}
                  `}
                >
                  <span className="leading-none">{day.getDate()}</span>
                  <div className="flex items-center gap-0.5">
                    {lunarEvent && <span className="text-[8px] leading-none">{lunarEvent.emoji}</span>}
                    {solarEvent && !lunarEvent && <span className="text-[8px] leading-none">{solarEvent.emoji}</span>}
                    {mayanGlyph && <span className="text-[7px] leading-none opacity-50">{mayanGlyph}</span>}
                  </div>
                  {/* Harvest dot indicator */}
                  {monthHasHarvests && (
                    <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-500/60" />
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
            <div className="space-y-2">
              {selectedDateEvents.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-base">{e.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-serif text-foreground/80">{e.label}</p>
                    <p className="text-[10px] text-muted-foreground">{e.detail}</p>
                    {e.lensSlug === "mayan" && (
                      <span className="text-[9px] text-muted-foreground/40 font-serif italic">Mayan Tzolkin lens · GMT correlation</span>
                    )}
                  </div>
                  {/* Cross-navigation link for harvest events */}
                  {e.link && (
                    <Link to={e.link} className="text-[9px] text-primary/60 hover:text-primary font-serif flex items-center gap-0.5 shrink-0">
                      View <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Seasonal signals for selected date */}
            {(() => {
              const selMonth = selectedDate.getMonth() + 1;
              const activeSpecies = foods.filter(f =>
                (f.flowering_months as number[]).includes(selMonth) ||
                (f.fruiting_months as number[]).includes(selMonth) ||
                (f.peak_months as number[]).includes(selMonth)
              );
              if (activeSpecies.length === 0) return null;
              return (
                <div className="pt-2 border-t border-border/20 space-y-1.5">
                  <p className="text-[10px] font-serif text-muted-foreground/70 flex items-center gap-1">
                    <Leaf className="w-3 h-3" /> Seasonal signals
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSpecies.slice(0, 6).map(sp => {
                      const phase = (sp.peak_months as number[]).includes(selMonth) ? "peak"
                        : (sp.flowering_months as number[]).includes(selMonth) ? "flowering" : "fruiting";
                      const display = getPhaseDisplay(phase);
                      return (
                        <span key={sp.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/5 text-primary/70 font-serif border border-primary/10">
                          {sp.icon} {sp.name} · {display.emoji} {display.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Harvest Exchange — This Month ── */}
        {harvestEvents.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm text-foreground/80 tracking-wide flex items-center gap-1.5">
                <TreeDeciduous className="w-3.5 h-3.5 text-primary" />
                Harvests This Month
              </h3>
              <Link to="/harvest" className="text-[10px] text-primary/60 hover:text-primary font-serif flex items-center gap-0.5">
                Browse all <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            <div className="space-y-1.5">
              {harvestEvents.slice(0, 4).map(h => (
                <Link
                  key={h.id}
                  to={h.links?.harvestId ? `/harvest/${h.links.harvestId}` : "/harvest"}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-border/20 hover:border-primary/30 transition-all no-underline"
                >
                  <span className="text-lg">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-serif text-foreground/80 line-clamp-1">{h.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {h.metadata?.availLabel} {h.subtitle ? `· ${h.subtitle}` : ""}
                    </p>
                  </div>
                  {h.links?.treeId && (
                    <MapPin className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Active Cycle Opportunities */}
        {openMarkets.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-serif text-sm text-foreground/80 tracking-wide flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Active Cycle Opportunities
            </h3>
            <div className="space-y-1.5">
              {openMarkets.slice(0, 3).map(m => (
                <Link
                  key={m.id}
                  to={`/markets/${m.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-border/20 hover:border-primary/30 transition-all"
                >
                  <span className="text-lg">🌀</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-serif text-foreground/80 line-clamp-1">{m.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {m.totalStaked} hearts staked · Closes {new Date(m.close_time).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className="text-[10px] text-primary/60 font-serif shrink-0">
                    {m.scope}
                  </span>
                </Link>
              ))}
            </div>
            {openMarkets.length > 3 && (
              <Link to="/library/rhythms" className="block text-center text-[10px] text-primary/60 hover:text-primary font-serif">
                View all {openMarkets.length} active cycles →
              </Link>
            )}
          </div>
        )}

        {/* Upcoming Rhythms */}
        <div className="space-y-2">
          <h3 className="font-serif text-sm text-foreground/80 tracking-wide">Upcoming Rhythms</h3>
          <div className="space-y-1.5">
            {getUpcomingLunarEvents(4).map(event => (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-border/20">
                <span className="text-lg">{event.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif text-foreground/80">{event.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {event.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {" · "}{Math.ceil((event.date.getTime() - Date.now()) / 86400000)} days away
                  </p>
                  {/* Show Mayan day for upcoming lunar events */}
                  {mayanActive && (
                    <p className="text-[9px] text-muted-foreground/50 font-serif">
                      {formatTzolkinLabel(getTzolkinDay(event.date))}
                    </p>
                  )}
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
                <span key={sp.id} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary/80 font-serif border border-primary/20">
                  {sp.icon} {sp.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Cross-navigation footer ── */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link
            to="/harvest"
            className="flex items-center gap-2 p-3 rounded-xl bg-card/30 border border-border/20 hover:border-primary/20 transition-all no-underline"
          >
            <TreeDeciduous className="w-4 h-4 text-primary/60" />
            <div>
              <p className="text-[10px] font-serif text-foreground/70">Harvest Exchange</p>
              <p className="text-[9px] text-muted-foreground/50">Browse guardian produce</p>
            </div>
          </Link>
          <Link
            to="/map"
            className="flex items-center gap-2 p-3 rounded-xl bg-card/30 border border-border/20 hover:border-primary/20 transition-all no-underline"
          >
            <MapPin className="w-4 h-4 text-primary/60" />
            <div>
              <p className="text-[10px] font-serif text-foreground/70">Living Atlas</p>
              <p className="text-[9px] text-muted-foreground/50">Explore the map</p>
            </div>
          </Link>
        </div>

        {/* How This Works */}
        <div className="rounded-xl bg-card/30 border border-border/20 p-4 space-y-2">
          <h3 className="font-serif text-sm text-foreground/60">How the Cosmic Calendar Works</h3>
          <div className="text-[10px] text-muted-foreground space-y-1 leading-relaxed">
            <p>🌑🌕 <strong>Lunar phases</strong> are calculated algorithmically and drive Time Tree rituals.</p>
            <p>🌱☀️ <strong>Solar events</strong> mark seasonal transitions and future global gatherings.</p>
            <p>💚 <strong>Daily reset</strong> at midnight refreshes your 33 seeds, check-in caps, and Time Tree rewards.</p>
            <p>🌸 <strong>Bloom windows</strong> come from the Seed Cellar's seasonal data.</p>
            <p>🍎 <strong>Harvest listings</strong> from guardian produce appear as seasonal calendar events.</p>
            <p>🐍 <strong>Calendar Lenses</strong> are optional overlays. Cultural lenses are offered with respect and attribution. <Link to="/cosmic/settings" className="text-primary underline">Manage lenses →</Link></p>
            <p>All cycles are transparent. No hidden mechanics.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CosmicCalendarPage;
