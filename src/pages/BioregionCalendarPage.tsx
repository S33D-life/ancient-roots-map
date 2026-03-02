/**
 * BioregionCalendarPage — Bioregional Calendar view with tabs:
 * Overview, Calendar, Blooming Now, Seed Windows, Ancient Friends.
 * Integrates PhenologyService + cosmic cycles.
 */
import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useBioregionCalendar } from "@/hooks/use-bioregion-calendar";
import { useCosmicClock, getLunarInfo, getSolarEvents } from "@/hooks/use-cosmic-clock";
import { getPhaseDisplay } from "@/hooks/use-phenology";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Flower2, Sprout, TreeDeciduous, Calendar, Leaf, Mountain, Droplets } from "lucide-react";
import { motion } from "framer-motion";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const typeEmoji = (t: string) => {
  if (t.includes("Mountain")) return "🏔️";
  if (t.includes("Wetland")) return "🌊";
  if (t.includes("Forest")) return "🌲";
  return "🌍";
};

const markerTypeColor = (t: string) => {
  switch (t) {
    case "phenology": return "bg-primary/10 text-primary border-primary/20";
    case "climate": return "bg-accent/10 text-accent-foreground border-accent/20";
    case "migration": return "bg-secondary/20 text-secondary-foreground border-secondary/20";
    case "harvest": return "bg-primary/15 text-primary border-primary/25";
    case "planting": return "bg-primary/10 text-primary border-primary/15";
    default: return "bg-muted text-muted-foreground border-border/20";
  }
};

const BioregionCalendarPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { region, markers, seedWindows, linkedTrees, loading, getMarkersForMonth, getSeedWindowsForMonth } = useBioregionCalendar(slug);
  const { lunar, season } = useCosmicClock(region?.hemisphere === "south" ? "south" : "north");
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const currentMonth = new Date().getMonth() + 1;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const activeMarkers = useMemo(() => getMarkersForMonth(viewMonth + 1), [getMarkersForMonth, viewMonth]);
  const activeSeeds = useMemo(() => getSeedWindowsForMonth(viewMonth + 1), [getSeedWindowsForMonth, viewMonth]);
  const nowMarkers = useMemo(() => getMarkersForMonth(currentMonth), [getMarkersForMonth, currentMonth]);
  const bloomingNow = useMemo(() => nowMarkers.filter(m => m.marker_type === "phenology"), [nowMarkers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-serif text-sm">Loading bioregion…</div>
      </div>
    );
  }

  if (!region) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground font-serif">Bioregion not found</p>
          <Link to="/atlas/bio-regions" className="text-primary text-sm font-serif hover:underline">← All Bioregions</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border/20 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to={`/atlas/bio-regions/${slug}`} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="text-center">
            <h1 className="font-serif text-base tracking-wide text-foreground">{region.name}</h1>
            <p className="text-[10px] text-muted-foreground">Bioregional Calendar</p>
          </div>
          <Link to="/cosmic" className="text-muted-foreground hover:text-foreground text-xs font-serif">
            {lunar.emoji}
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Cosmic context bar */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-card/40 border border-border/20">
          <span className="text-lg">{typeEmoji(region.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-serif text-muted-foreground">
              {region.countries.join(" · ")} · {region.climate_band || region.type}
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              {lunar.emoji} {lunar.phaseName} · {season.emoji} {season.label} · {region.hemisphere === "south" ? "Southern" : "Northern"} hemisphere
            </p>
          </div>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className="w-full bg-card/40 border border-border/20">
            <TabsTrigger value="overview" className="font-serif text-xs flex-1">Overview</TabsTrigger>
            <TabsTrigger value="calendar" className="font-serif text-xs flex-1">Calendar</TabsTrigger>
            <TabsTrigger value="blooming" className="font-serif text-xs flex-1">Blooming</TabsTrigger>
            <TabsTrigger value="seeds" className="font-serif text-xs flex-1">Seeds</TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW ── */}
          <TabsContent value="overview" className="space-y-4">
            {region.short_description && (
              <p className="text-xs text-muted-foreground font-serif leading-relaxed italic">
                {region.short_description}
              </p>
            )}
            {region.biome_description && (
              <p className="text-xs text-muted-foreground/80 font-serif leading-relaxed">
                {region.biome_description}
              </p>
            )}

            {/* What's happening now */}
            {nowMarkers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-serif text-foreground/80 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-primary" /> Happening Now
                </h3>
                <div className="space-y-1.5">
                  {nowMarkers.map(m => (
                    <div key={m.id} className={`flex items-start gap-2 p-2.5 rounded-lg border ${markerTypeColor(m.marker_type)}`}>
                      <span className="text-base">{m.emoji}</span>
                      <div className="flex-1">
                        <p className="text-xs font-serif font-medium">{m.name}</p>
                        {m.description && <p className="text-[10px] opacity-70">{m.description}</p>}
                        <span className="text-[9px] opacity-50">{m.confidence} confidence</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 rounded-lg bg-card/40 border border-border/20">
                <p className="text-lg font-serif font-bold text-foreground">{markers.length}</p>
                <p className="text-[9px] text-muted-foreground">Seasonal Markers</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card/40 border border-border/20">
                <p className="text-lg font-serif font-bold text-foreground">{seedWindows.length}</p>
                <p className="text-[9px] text-muted-foreground">Seed Windows</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card/40 border border-border/20">
                <p className="text-lg font-serif font-bold text-foreground">{linkedTrees.length}</p>
                <p className="text-[9px] text-muted-foreground">Ancient Friends</p>
              </div>
            </div>

            {/* Flagship species */}
            {region.dominant_species.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-serif text-foreground/80">Flagship Species</h3>
                <div className="flex flex-wrap gap-1.5">
                  {region.dominant_species.map(sp => (
                    <Badge key={sp} variant="outline" className="text-[10px] font-serif">🌿 {sp}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── CALENDAR ── */}
          <TabsContent value="calendar" className="space-y-4">
            {/* Month nav */}
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-card/60 text-muted-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="font-serif text-sm tracking-wide text-foreground">
                {MONTHS_FULL[viewMonth]} {viewYear}
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-card/60 text-muted-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Year ring — 12 months with markers */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {MONTHS_SHORT.map((label, i) => {
                const m = i + 1;
                const monthMarkers = getMarkersForMonth(m);
                const isCurrent = m === currentMonth;
                const isViewing = i === viewMonth;
                return (
                  <button
                    key={m}
                    onClick={() => setViewMonth(i)}
                    className={`flex flex-col items-center rounded-lg p-1.5 border transition-colors ${
                      isViewing ? "border-primary bg-primary/10" : isCurrent ? "border-primary/30" : "border-border/20"
                    }`}
                  >
                    <span className="text-[9px] font-serif text-muted-foreground">{label}</span>
                    <div className="flex gap-0.5 mt-0.5">
                      {monthMarkers.slice(0, 3).map((mk, j) => (
                        <span key={j} className="text-[7px]">{mk.emoji}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active markers for selected month */}
            <div className="space-y-2">
              <h3 className="text-xs font-serif text-foreground/80">
                {MONTHS_FULL[viewMonth]} — {activeMarkers.length} seasonal event{activeMarkers.length !== 1 ? "s" : ""}
              </h3>
              {activeMarkers.length === 0 ? (
                <p className="text-[10px] text-muted-foreground font-serif italic">No markers for this month yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {activeMarkers.map(m => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border ${markerTypeColor(m.marker_type)}`}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <div className="flex-1">
                        <p className="text-xs font-serif font-medium">{m.name}</p>
                        {m.description && <p className="text-[10px] opacity-70">{m.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[8px] h-4">{m.marker_type}</Badge>
                          {m.elevation_band && m.elevation_band !== "all" && (
                            <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                              <Mountain className="w-2.5 h-2.5" /> {m.elevation_band}
                            </span>
                          )}
                          <span className="text-[8px] text-muted-foreground">{m.confidence} confidence</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Seed windows for selected month */}
            {activeSeeds.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-serif text-foreground/80 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-primary" /> Seed Windows
                </h3>
                <div className="space-y-1">
                  {activeSeeds.map(sw => {
                    const month = viewMonth + 1;
                    const isSowing = sw.sow_month_start && sw.sow_month_end &&
                      isMonthInRange(month, sw.sow_month_start, sw.sow_month_end);
                    const isHarvesting = sw.harvest_month_start && sw.harvest_month_end &&
                      isMonthInRange(month, sw.harvest_month_start, sw.harvest_month_end);
                    return (
                      <div key={sw.id} className="flex items-center gap-2 p-2 rounded-lg bg-card/40 border border-border/20">
                        <span className="text-sm">{isSowing ? "🌱" : "🌾"}</span>
                        <div className="flex-1">
                          <p className="text-[11px] font-serif">{sw.species_name}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {isSowing && "Sow now"}{isSowing && isHarvesting && " · "}{isHarvesting && "Harvest now"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lunar events this month */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-serif text-foreground/80">Cosmic Rhythms</h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const events: { day: number; emoji: string; name: string }[] = [];
                  for (let d = 1; d <= 31; d++) {
                    const date = new Date(viewYear, viewMonth, d);
                    if (date.getMonth() !== viewMonth) break;
                    const info = getLunarInfo(date);
                    if (info.phase === "new_moon" || info.phase === "full_moon") {
                      events.push({ day: d, emoji: info.emoji, name: info.phaseName });
                    }
                  }
                  const solar = getSolarEvents(viewYear).filter(e => e.date.getMonth() === viewMonth);
                  return [...events.map(e => (
                    <span key={`l-${e.day}`} className="text-[10px] px-2 py-1 rounded-full bg-card/60 border border-border/20 font-serif">
                      {e.emoji} {e.name} · {MONTHS_SHORT[viewMonth]} {e.day}
                    </span>
                  )), ...solar.map(s => (
                    <span key={s.id} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 border border-primary/20 font-serif text-primary">
                      {s.emoji} {s.name} · {MONTHS_SHORT[viewMonth]} {s.date.getDate()}
                    </span>
                  ))];
                })()}
              </div>
            </div>
          </TabsContent>

          {/* ── BLOOMING NOW ── */}
          <TabsContent value="blooming" className="space-y-4">
            <h3 className="text-xs font-serif text-foreground/80 flex items-center gap-1.5">
              <Flower2 className="w-3.5 h-3.5 text-primary" /> Currently Active Phenology
            </h3>
            {bloomingNow.length === 0 ? (
              <p className="text-xs text-muted-foreground font-serif italic">
                No active bloom signals this month. Check the calendar for upcoming windows.
              </p>
            ) : (
              <div className="space-y-2">
                {bloomingNow.map(m => (
                  <div key={m.id} className="p-3 rounded-xl bg-primary/5 border border-primary/15 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{m.emoji}</span>
                      <div>
                        <p className="text-sm font-serif font-medium text-foreground">{m.name}</p>
                        {m.description && <p className="text-[10px] text-muted-foreground">{m.description}</p>}
                      </div>
                    </div>
                    {m.species_keys.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.species_keys.map(sk => (
                          <Badge key={sk} variant="outline" className="text-[9px] font-serif">
                            🌿 {sk.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      <span>Window: {MONTHS_SHORT[m.typical_month_start - 1]}–{MONTHS_SHORT[m.typical_month_end - 1]}</span>
                      <span>· {m.confidence} confidence</span>
                      {m.elevation_band && m.elevation_band !== "all" && <span>· {m.elevation_band} elevation</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All markers timeline */}
            <h3 className="text-xs font-serif text-foreground/80 mt-4">Full Year Phenology Timeline</h3>
            <div className="space-y-1">
              {markers.filter(m => m.marker_type === "phenology").map(m => (
                <div key={m.id} className="flex items-center gap-2 text-[10px] font-serif">
                  <span>{m.emoji}</span>
                  <span className="flex-1 text-foreground/70">{m.name}</span>
                  <span className="text-muted-foreground">
                    {MONTHS_SHORT[m.typical_month_start - 1]}–{MONTHS_SHORT[m.typical_month_end - 1]}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── SEED WINDOWS ── */}
          <TabsContent value="seeds" className="space-y-4">
            <h3 className="text-xs font-serif text-foreground/80 flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-primary" /> Seed Planting & Harvest Windows
            </h3>
            {seedWindows.length === 0 ? (
              <p className="text-xs text-muted-foreground font-serif italic">No seed windows defined for this bioregion yet.</p>
            ) : (
              <div className="space-y-3">
                {seedWindows.map(sw => {
                  const nowSowing = sw.sow_month_start && sw.sow_month_end &&
                    isMonthInRange(currentMonth, sw.sow_month_start, sw.sow_month_end);
                  const nowHarvesting = sw.harvest_month_start && sw.harvest_month_end &&
                    isMonthInRange(currentMonth, sw.harvest_month_start, sw.harvest_month_end);
                  const nowDormant = sw.dormant_month_start && sw.dormant_month_end &&
                    isMonthInRange(currentMonth, sw.dormant_month_start, sw.dormant_month_end);
                  return (
                    <div key={sw.id} className="p-3 rounded-xl bg-card/60 border border-border/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-serif font-medium text-foreground">{sw.species_name}</p>
                        {nowSowing && <Badge className="text-[9px] bg-primary/15 text-primary border-primary/20" variant="outline">🌱 Sow Now</Badge>}
                        {nowHarvesting && <Badge className="text-[9px] bg-primary/15 text-primary border-primary/20" variant="outline">🌾 Harvest Now</Badge>}
                        {nowDormant && !nowSowing && !nowHarvesting && <Badge className="text-[9px]" variant="outline">💤 Dormant</Badge>}
                      </div>
                      {/* Month bar */}
                      <div className="grid grid-cols-12 gap-0.5 h-4">
                        {MONTHS_SHORT.map((label, i) => {
                          const m = i + 1;
                          const sowing = sw.sow_month_start && sw.sow_month_end && isMonthInRange(m, sw.sow_month_start, sw.sow_month_end);
                          const harvesting = sw.harvest_month_start && sw.harvest_month_end && isMonthInRange(m, sw.harvest_month_start, sw.harvest_month_end);
                          const dormant = sw.dormant_month_start && sw.dormant_month_end && isMonthInRange(m, sw.dormant_month_start, sw.dormant_month_end);
                          return (
                            <div
                              key={i}
                              className={`rounded-sm flex items-center justify-center text-[6px] font-mono ${
                                sowing ? "bg-primary/30 text-primary" :
                                harvesting ? "bg-primary/20 text-primary/70" :
                                dormant ? "bg-muted/40 text-muted-foreground/40" :
                                "bg-card/30"
                              } ${m === currentMonth ? "ring-1 ring-primary/40" : ""}`}
                              title={`${label}: ${sowing ? "Sow" : harvesting ? "Harvest" : dormant ? "Dormant" : "—"}`}
                            >
                              {label[0]}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-3 text-[8px] text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/30" /> Sow</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/20" /> Harvest</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted/40" /> Dormant</span>
                      </div>
                      {sw.notes && <p className="text-[10px] text-muted-foreground/70 font-serif italic">{sw.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Ancient Friends linked to this bioregion */}
        {linkedTrees.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-xs font-serif text-foreground/80 flex items-center gap-1.5">
              <TreeDeciduous className="w-3.5 h-3.5 text-primary" /> Notable Ancient Friends
            </h3>
            <div className="space-y-1.5">
              {linkedTrees.slice(0, 10).map(t => (
                <Link
                  key={t.id}
                  to={`/tree/${t.id}`}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-card/40 border border-border/20 hover:bg-card/60 transition-colors"
                >
                  <TreeDeciduous className="w-4 h-4 text-primary/60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-serif text-foreground truncate">{t.name}</p>
                    <p className="text-[9px] text-muted-foreground">{t.species || "Unknown species"}{t.nation ? ` · ${t.nation}` : ""}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Transparency note */}
        <div className="mt-6 p-3 rounded-xl bg-card/30 border border-border/20">
          <p className="text-[10px] text-muted-foreground font-serif leading-relaxed">
            <strong>About this calendar:</strong> Seasonal markers are based on general phenological patterns for this bioregion.
            Actual timing varies by year, microclimate, and elevation. Confidence levels indicate data quality.
            Community observations help refine accuracy over time.
          </p>
        </div>
      </div>
    </div>
  );
};

function isMonthInRange(month: number, start: number, end: number): boolean {
  if (start <= end) return month >= start && month <= end;
  return month >= start || month <= end;
}

export default BioregionCalendarPage;
