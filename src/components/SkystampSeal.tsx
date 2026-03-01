/**
 * SkystampSeal — compact stamp rendered next to the Staff sigil on offerings/whispers/check-ins.
 * Default: tiny icon + 2 short lines. Tap expands to SkystampDrawer.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { getSealIcon, type SkyStamp, type SkyCore, type SkyPlanet, type SkySeal } from "@/hooks/use-skystamp";

interface SkystampSealProps {
  skyStampId: string | null | undefined;
  /** Compact mode: just icon, no text */
  compact?: boolean;
}

const SkystampSeal = ({ skyStampId, compact = false }: SkystampSealProps) => {
  const [stamp, setStamp] = useState<SkyStamp | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!skyStampId) return;
    supabase
      .from("sky_stamps")
      .select("*")
      .eq("id", skyStampId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStamp({
            id: data.id,
            created_at: data.created_at,
            lat: data.lat,
            lng: data.lng,
            weather: data.weather as any,
            sky_core: data.sky_core as unknown as SkyCore | null,
            sky_planets: data.sky_planets as unknown as SkyPlanet[] | null,
            seal: data.seal as unknown as SkySeal,
          });
        }
      });
  }, [skyStampId]);

  if (!stamp || !stamp.seal) return null;

  const icon = getSealIcon(stamp.seal.glyphKey);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setDrawerOpen(true); }}
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors font-serif"
        title="Skystamp — tap to expand"
      >
        <span className="w-4 h-4 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-[9px] text-primary">
          {icon}
        </span>
        {!compact && (
          <span className="max-w-[120px] truncate opacity-70">
            {stamp.seal.shortLine1}
          </span>
        )}
      </button>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="font-serif tracking-widest text-sm uppercase flex items-center gap-2">
              <span className="w-6 h-6 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center text-sm text-primary">
                {icon}
              </span>
              Skystamp
            </DrawerTitle>
            <DrawerDescription className="font-serif text-xs">
              {stamp.seal.shortLine1} — {stamp.seal.shortLine2}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            {/* Weather section */}
            {stamp.weather && (
              <Section title="Weather">
                <div className="grid grid-cols-2 gap-2 text-xs font-serif">
                  <Stat label="Temperature" value={`${Math.round((stamp.weather as any).temp)}°C`} />
                  <Stat label="Feels like" value={`${Math.round((stamp.weather as any).feelsLike)}°C`} />
                  <Stat label="Wind" value={`${Math.round((stamp.weather as any).windSpeed)} km/h`} />
                  <Stat label="Humidity" value={`${(stamp.weather as any).humidity}%`} />
                  <Stat label="Clouds" value={`${(stamp.weather as any).clouds}%`} />
                  <Stat label="UV Index" value={`${(stamp.weather as any).uvi}`} />
                </div>
                {(stamp.weather as any).weatherDesc && (
                  <p className="text-xs text-muted-foreground mt-1 font-serif">
                    {(stamp.weather as any).weatherIcon} {(stamp.weather as any).weatherDesc}
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground/50 mt-1">
                  Source: {(stamp.weather as any).source || "mock"} • {new Date(stamp.created_at).toLocaleString()}
                </p>
              </Section>
            )}

            {/* Sky Core section */}
            {stamp.sky_core && (
              <Section title="Sky Position">
                <div className="grid grid-cols-2 gap-2 text-xs font-serif">
                  <Stat label="Sun Altitude" value={`${stamp.sky_core.sun.altitudeDeg}°`} />
                  <Stat label="Sun Azimuth" value={`${stamp.sky_core.sun.azimuthDeg}°`} />
                  <Stat label="Phase" value={stamp.sky_core.sun.twilightPhase.replace(/_/g, " ")} />
                  <Stat label={stamp.sky_core.sun.isDaylight ? "☀️ Daylight" : "🌙 Night"} value="" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-serif">
                  <Stat label="Moon Phase" value={stamp.sky_core.moon.phaseName} />
                  <Stat label="Illumination" value={`${stamp.sky_core.moon.illuminationPct}%`} />
                  <Stat label="Moon Alt" value={`${stamp.sky_core.moon.altitudeDeg}°`} />
                  <Stat label="Moon Az" value={`${stamp.sky_core.moon.azimuthDeg}°`} />
                </div>
              </Section>
            )}

            {/* Planets section */}
            {stamp.sky_planets && stamp.sky_planets.length > 0 && (
              <Section title="Visible Planets">
                <div className="space-y-1">
                  {stamp.sky_planets.map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-xs font-serif px-2 py-1 rounded bg-secondary/20">
                      <span>{p.name}</span>
                      <span className="text-muted-foreground">
                        Alt {p.altitudeDeg}° • Az {p.azimuthDeg}°
                        {p.isLikelyVisible && <span className="ml-1 text-primary">✦ visible</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <h4 className="text-[10px] uppercase tracking-widest text-primary/60 font-serif">{title}</h4>
    {children}
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-muted-foreground/60 text-[9px]">{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
);

export default SkystampSeal;
