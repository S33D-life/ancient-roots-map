/**
 * CountrySpeciesSpiral — golden-angle spiral of the 33 most active species in a country.
 * 
 * "Forest Breath" animation: the 3–5 most recently active species gently pulse
 * using pure CSS/SVG animations (no JS render loops). Respects prefers-reduced-motion.
 * 
 * How "recent" is chosen: each species has a `lastActivity` timestamp derived from the
 * latest tree mapping, check-in, or offering. We sort descending and take the top N (default 4).
 */
import { memo, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TreeDeciduous, Eye, MapPin, Heart, Clock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type SpeciesActivity } from "@/hooks/useCountrySpeciesActivity";
import { format } from "date-fns";

interface Props {
  species: SpeciesActivity[];
  country: string;
  countrySlug: string;
  loading?: boolean;
}

const GOLDEN_ANGLE = 137.508;
const MAX_DOTS = 33;
const SVG_SIZE = 400;
const CENTER = SVG_SIZE / 2;
const BREATHING_COUNT = 4; // N most recent to animate (3–5 range)

function goldenSpiralPoint(index: number): { x: number; y: number } {
  const angle = index * GOLDEN_ANGLE * (Math.PI / 180);
  const r = 12 * Math.sqrt(index + 1);
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  };
}

/** Deterministic per-dot timing offset so pulses don't synchronize */
function seedOffset(species: string): number {
  let h = 0;
  for (let i = 0; i < species.length; i++) h = (h * 31 + species.charCodeAt(i)) | 0;
  return Math.abs(h) % 2000; // 0–2s offset
}

const CountrySpeciesSpiral = memo(({ species, country, countrySlug, loading }: Props) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SpeciesActivity | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const maxScore = useMemo(() => Math.max(1, ...species.map(s => s.score)), [species]);

  // Determine the N most recently active species for breathing animation
  const breathingSet = useMemo(() => {
    const withTimestamps = species
      .filter(s => s.lastActivity)
      .sort((a, b) => new Date(b.lastActivity!).getTime() - new Date(a.lastActivity!).getTime())
      .slice(0, Math.max(3, Math.min(5, BREATHING_COUNT)));
    return new Set(withTimestamps.map(s => s.species));
  }, [species]);

  // Fill placeholders if < 33
  const dots = useMemo(() => {
    const real = species.slice(0, MAX_DOTS);
    const placeholders: Array<SpeciesActivity | null> = [];
    for (let i = real.length; i < MAX_DOTS; i++) {
      placeholders.push(null);
    }
    return [...real.map(s => s as SpeciesActivity | null), ...placeholders];
  }, [species]);

  const handleDotClick = useCallback((sp: SpeciesActivity | null) => {
    if (!sp) return;
    setSelected(prev => prev?.species === sp.species ? null : sp);
  }, []);

  const handleFilterMap = useCallback((sp: SpeciesActivity) => {
    navigate(`/map?species=${encodeURIComponent(sp.species)}&country=${countrySlug}&origin=atlas`);
  }, [navigate, countrySlug]);

  const handleMapNew = useCallback((sp: SpeciesActivity) => {
    navigate(`/add?species=${encodeURIComponent(sp.species)}&country=${countrySlug}`);
  }, [navigate, countrySlug]);

  if (loading) {
    return (
      <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <TreeDeciduous className="w-8 h-8 text-primary/30" />
            <p className="text-sm text-muted-foreground">Computing species activity…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (species.length === 0) {
    return (
      <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center space-y-3">
          <TreeDeciduous className="w-8 h-8 text-primary/40 mx-auto" />
          <p className="text-sm font-serif text-foreground">No species activity yet</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Be the first to map an Ancient Friend in {country}.
          </p>
          <Button variant="sacred" size="sm" onClick={() => navigate(`/add?country=${countrySlug}`)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Map the first tree
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Inject CSS keyframes for forest-breath — only once, scoped via unique class */}
      <style>{`
        @keyframes forest-breath-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes forest-breath-halo {
          0% { r: var(--halo-r-start); opacity: 0.25; }
          60% { opacity: 0.08; }
          100% { r: var(--halo-r-end); opacity: 0; }
        }
        .forest-breath-dot {
          transform-origin: center;
          transform-box: fill-box;
          animation: forest-breath-scale var(--breath-dur, 4.5s) ease-in-out infinite;
          animation-delay: var(--breath-delay, 0s);
        }
        .forest-breath-dot.paused {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .forest-breath-dot {
            animation: none !important;
          }
          .forest-breath-halo {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-serif font-bold text-foreground">Species Spiral</h3>
        <p className="text-xs text-muted-foreground">
          The {Math.min(species.length, 33)} most active species in {country}
        </p>
      </div>

      {/* SVG Spiral */}
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full max-w-[380px] mx-auto"
        style={{ filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.08))" }}
      >
        {dots.map((sp, i) => {
          const { x, y } = goldenSpiralPoint(i);
          const isPlaceholder = !sp;
          const isSelected = sp && selected?.species === sp.species;
          const isHovered = sp && hovered === sp.species;
          const isBreathing = sp && breathingSet.has(sp.species);
          const isPaused = isSelected || isHovered;

          // Size: 4–14 based on score
          const baseSize = isPlaceholder ? 3 : 4 + (sp!.score / maxScore) * 10;
          const size = isSelected ? baseSize + 2 : isHovered ? baseSize + 1 : baseSize;

          // Brightness: recent = bright, old = dim
          const brightness = isPlaceholder ? 0.15 : sp!.recentActivity ? 0.85 : 0.4;

          // Breathing timing: 3.8–6.0s with per-dot offset
          const breathDur = isBreathing ? `${3.8 + (seedOffset(sp!.species) / 2000) * 2.2}s` : undefined;
          const breathDelay = isBreathing ? `${seedOffset(sp!.species) / 1000}s` : undefined;

          return (
            <g key={sp?.species || `placeholder-${i}`}>
              {/* Breathing halo — faint expanding ring for breathing dots */}
              {isBreathing && !isPaused && !isPlaceholder && (
                <circle
                  cx={x}
                  cy={y}
                  r={baseSize + 3}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.18)"
                  strokeWidth={0.6}
                  className="forest-breath-halo"
                  style={{
                    '--halo-r-start': `${baseSize + 3}`,
                    '--halo-r-end': `${baseSize + 8}`,
                  } as React.CSSProperties}
                >
                  <animate
                    attributeName="r"
                    values={`${baseSize + 3};${baseSize + 7};${baseSize + 3}`}
                    dur={`${6 + (seedOffset(sp!.species) % 4)}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.2;0.05;0.2"
                    dur={`${6 + (seedOffset(sp!.species) % 4)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Reduced-motion static indicator for breathing dots */}
              {isBreathing && !isPlaceholder && (
                <circle
                  cx={x}
                  cy={y}
                  r={baseSize + 2.5}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.25)"
                  strokeWidth={0.5}
                  strokeDasharray="2 2"
                  className="hidden motion-reduce:block"
                />
              )}

              {/* Main dot */}
              <circle
                cx={x}
                cy={y}
                r={size}
                fill={isPlaceholder
                  ? "hsl(var(--muted) / 0.3)"
                  : `hsl(var(--primary) / ${brightness})`
                }
                stroke={isSelected ? "hsl(var(--primary))" : "none"}
                strokeWidth={isSelected ? 1.5 : 0}
                className={[
                  isPlaceholder ? "" : "cursor-pointer transition-[r,stroke-width] duration-200",
                  isBreathing && !isPlaceholder ? `forest-breath-dot${isPaused ? " paused" : ""}` : "",
                ].join(" ")}
                style={isBreathing && !isPlaceholder ? {
                  '--breath-dur': breathDur,
                  '--breath-delay': breathDelay,
                } as React.CSSProperties : undefined}
                onClick={() => handleDotClick(sp)}
                onMouseEnter={() => sp && setHovered(sp.species)}
                onMouseLeave={() => setHovered(null)}
              />

              {/* Hover label */}
              {isHovered && !isSelected && sp && (
                <text
                  x={x}
                  y={y - size - 6}
                  textAnchor="middle"
                  fill="hsl(var(--foreground))"
                  fontSize={8}
                  fontFamily="serif"
                  className="pointer-events-none"
                >
                  {sp.species.length > 22 ? sp.species.slice(0, 20) + "…" : sp.species}
                </text>
              )}

              {/* Score label inside larger dots */}
              {!isPlaceholder && baseSize > 8 && (
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="hsl(var(--primary-foreground))"
                  fontSize={Math.min(7, baseSize * 0.6)}
                  fontFamily="monospace"
                  className="pointer-events-none"
                >
                  {sp!.mapped}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {breathingSet.size > 0 && (
        <p className="text-center text-[10px] text-muted-foreground/60 mt-2 italic">
          Breathing seeds — most recent activity
        </p>
      )}

      {/* Selected species detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="mt-4 mx-auto max-w-sm"
          >
            <Card className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-foreground">
                      {selected.species}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Activity Score: {selected.score.toFixed(1)}
                      {breathingSet.has(selected.species) && (
                        <span className="ml-1.5 text-primary/70">· Most recent</span>
                      )}
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)}
                    className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-serif font-bold text-foreground">{selected.mapped}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> Mapped
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-serif font-bold text-foreground">{selected.offerings}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <Heart className="w-2.5 h-2.5" /> Offerings
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-serif font-bold text-foreground">{selected.visits}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" /> Visits
                    </p>
                  </div>
                </div>

                {selected.lastActivity && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    Last activity: {format(new Date(selected.lastActivity), "dd MMM yyyy")}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button variant="sacred" size="sm" className="flex-1 text-xs h-8"
                    onClick={() => handleFilterMap(selected)}>
                    <MapPin className="w-3 h-3 mr-1" /> View on Map
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-8"
                    onClick={() => handleMapNew(selected)}>
                    <Plus className="w-3 h-3 mr-1" /> Map New
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

CountrySpeciesSpiral.displayName = "CountrySpeciesSpiral";

export default CountrySpeciesSpiral;
