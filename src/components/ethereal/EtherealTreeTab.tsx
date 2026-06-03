/**
 * EtherealTreeTab — V1 prototype "living digital twin" of an Ancient Friend.
 *
 * Spatial / ritual view of offerings + whispers, distinct from the Offerings
 * archive tab. Pure SVG + CSS motion. Deterministic placement from id hash —
 * no spatial coords persisted, no schema changes.
 *
 *  Zones:
 *    canopy  → photo / art / prayer            (leaves drift)
 *    upper   → poem / voice                    (light blooms)
 *    mid     → song                            (pulse with rhythm)
 *    trunk   → story / book / nft              (still candles)
 *    roots   → whispers                        (slow travel)
 *    ground  → hearts / seeds ambient glow     (derived)
 *
 *  Architecture notes (intentional shortcuts):
 *   - Hash-based Poisson-ish sampling per render — same id → same spot.
 *   - Visible node cap = 120; overflow folds into a per-zone "constellation".
 *   - No drag, no edit, no persistence. Reversible: delete this folder + the
 *     <TabsTrigger value="ethereal"> in TreeDetailPage.tsx.
 */
import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Offering, OfferingType } from "@/hooks/use-offerings";
import type { TreeWhisper } from "@/hooks/use-whispers";

type Zone = "canopy" | "upper" | "mid" | "trunk" | "roots" | "ground";

const ZONE_FOR_TYPE: Record<OfferingType, Zone> = {
  photo: "canopy",
  art: "canopy",
  prayer: "canopy",
  poem: "upper",
  voice: "upper",
  song: "mid",
  story: "trunk",
  book: "trunk",
  nft: "trunk",
};

// Polygons in 400×600 viewBox space, very loose ellipse hints
const ZONE_RECTS: Record<Zone, { cx: number; cy: number; rx: number; ry: number }> = {
  canopy: { cx: 200, cy: 140, rx: 150, ry: 70 },
  upper: { cx: 200, cy: 215, rx: 130, ry: 45 },
  mid: { cx: 200, cy: 280, rx: 100, ry: 35 },
  trunk: { cx: 200, cy: 365, rx: 35, ry: 55 },
  roots: { cx: 200, cy: 500, rx: 170, ry: 55 },
  ground: { cx: 200, cy: 455, rx: 160, ry: 18 },
};

const MAX_NODES = 120;

// Tiny deterministic string-hash → [0,1)
function hash01(seed: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function placeInZone(zone: Zone, seed: string): { x: number; y: number } {
  const rect = ZONE_RECTS[zone];
  // sample point inside ellipse (rejection-free via polar)
  const t = hash01(seed, 1) * Math.PI * 2;
  const r = Math.sqrt(hash01(seed, 2));
  return {
    x: rect.cx + Math.cos(t) * rect.rx * r,
    y: rect.cy + Math.sin(t) * rect.ry * r,
  };
}

// Local moon-phase approximation (0 = new, 0.5 = full, 1 = new). No API.
function moonFullness(date = new Date()): number {
  const synodic = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14); // known new moon
  const days = (date.getTime() - ref) / 86400000;
  const phase = ((days % synodic) + synodic) % synodic / synodic; // 0..1
  return 1 - Math.abs(0.5 - phase) * 2; // 0 at new, 1 at full
}

interface NodeDatum {
  id: string;
  zone: Zone;
  kind: OfferingType | "whisper";
  title: string;
  subtitle?: string;
  payload: Offering | TreeWhisper;
}

type FilterDef = {
  id: string;
  label: string;
  match: (n: NodeDatum) => boolean;
  zones: Zone[]; // which zones "awaken" when this filter is active
  hint: string; // poetic metaphor anchor
};

const FILTERS: FilterDef[] = [
  { id: "all", label: "All", match: () => true, zones: ["canopy", "upper", "mid", "trunk", "roots", "ground"], hint: "Every memory, held at once." },
  { id: "photo", label: "Photos", match: (n) => n.kind === "photo", zones: ["canopy"], hint: "Photos hang in the canopy like light." },
  { id: "song", label: "Songs", match: (n) => n.kind === "song", zones: ["mid"], hint: "Songs ring through the middle branches." },
  { id: "poem", label: "Poems", match: (n) => n.kind === "poem" || n.kind === "voice", zones: ["upper"], hint: "Poems bloom in the high branches." },
  { id: "story", label: "Stories", match: (n) => n.kind === "story" || n.kind === "book", zones: ["trunk"], hint: "Stories live deep inside the trunk." },
  { id: "whisper", label: "Whispers", match: (n) => n.kind === "whisper", zones: ["roots"], hint: "Whispers travel through the roots." },
  { id: "prayer", label: "Prayers", match: (n) => n.kind === "prayer" || n.kind === "art", zones: ["canopy"], hint: "Prayers drift among the leaves." },
];

interface Props {
  treeId: string;
  treeName: string;
  offerings: Offering[];
  whispers: TreeWhisper[];
  onViewInOfferings?: (kind: OfferingType | "whisper", offeringId?: string) => void;
}

export function EtherealTreeTab({ treeId, treeName, offerings, whispers, onViewInOfferings }: Props) {
  const [filter, setFilter] = useState("all");
  const [activeNode, setActiveNode] = useState<NodeDatum | null>(null);

  const nodes: NodeDatum[] = useMemo(() => {
    const offeringNodes: NodeDatum[] = offerings
      .filter((o) => (o.type as OfferingType) in ZONE_FOR_TYPE)
      .map((o) => ({
        id: `off-${o.id}`,
        zone: ZONE_FOR_TYPE[o.type as OfferingType],
        kind: o.type as OfferingType,
        title: o.title || o.type,
        subtitle: o.content?.slice(0, 80) || undefined,
        payload: o,
      }));
    const whisperNodes: NodeDatum[] = whispers.map((w) => ({
      id: `wsp-${w.id}`,
      zone: "roots",
      kind: "whisper",
      title: "A whisper",
      subtitle: (w.message_content || "").slice(0, 80),
      payload: w,
    }));
    return [...offeringNodes, ...whisperNodes];
  }, [offerings, whispers]);

  const visible = nodes.slice(0, MAX_NODES);
  const overflow = nodes.length - visible.length;
  const overflowByZone: Partial<Record<Zone, number>> = {};
  if (overflow > 0) {
    nodes.slice(MAX_NODES).forEach((n) => {
      overflowByZone[n.zone] = (overflowByZone[n.zone] || 0) + 1;
    });
  }

  const totalMemories = nodes.length;
  const aliveness =
    totalMemories === 0
      ? "Newly rooted."
      : totalMemories < 6
      ? "Quietly listening."
      : totalMemories < 24
      ? "Half-remembering."
      : totalMemories < 72
      ? "Full of remembering."
      : "Brimming with lives.";

  const activeFilter = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const isAll = filter === "all";
  const zoneAwake = (z: Zone) => isAll || activeFilter.zones.includes(z);
  // Opacity helpers — "awake" zones brighten, others recede without disappearing.
  const awake = (z: Zone, on = 1, off = 0.28) => (zoneAwake(z) ? on : off);

  // Moon ambience — derived locally, recomputed once per mount.
  const moon = useMemo(() => moonFullness(), []);
  // Halo gets quietly stronger near full moon; tone shifts a touch cooler.
  const haloBoost = 0.35 + moon * 0.25; // 0.35..0.60
  const haloHue = 45 - moon * 8; // 45 (gold) → 37 (cooler amber-ivory)

  // Whisper root pulses — only when whispers exist, kept sparse.
  const hasWhispers = whispers.length > 0;
  const rootPulsePaths = [
    "M200 420 Q 160 470 80 540",
    "M200 420 Q 240 470 320 540",
    "M200 420 Q 200 490 200 580",
  ];

  return (
    <div className="space-y-3">
      {/* Filter ribbon */}
      <div className="flex flex-wrap gap-1.5 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-serif tracking-wider transition-all border",
              filter === f.id
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-secondary/20 text-muted-foreground border-border/30 hover:border-border/60"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Metaphor hint — teaches the spatial language in one quiet line */}
      <p
        key={activeFilter.id}
        className="px-2 text-[11px] font-serif italic text-primary/60 tracking-wide animate-fade-in"
      >
        {activeFilter.hint}
      </p>

      {/* Canvas */}
      <div className="relative w-full rounded-xl overflow-hidden border border-border/40 bg-gradient-to-b from-[hsl(80_15%_8%)] via-[hsl(70_12%_11%)] to-[hsl(40_18%_8%)]">
        <svg
          viewBox="0 0 400 600"
          className="w-full h-auto block"
          style={{ maxHeight: "75vh" }}
          role="img"
          aria-label={`Ethereal tree of ${treeName} with ${totalMemories} living memories`}
        >
          <defs>
            <radialGradient id="et-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(45 80% 70%)" stopOpacity="0.9" />
              <stop offset="60%" stopColor="hsl(45 80% 60%)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(45 80% 60%)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="et-whisper" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(160 50% 70%)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(160 50% 60%)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="et-ground" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="hsl(45 60% 50%)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(45 60% 50%)" stopOpacity="0" />
            </radialGradient>
            <filter id="et-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>

          {/* Breathing wrapper — extremely slow inhale/exhale that all of the
              tree's still elements share. Subconscious, never overt. */}
          <g className="et-breath">
            {/* Ambient ground glow */}
            <ellipse
              cx="200" cy="455" rx="180" ry="30"
              fill="url(#et-ground)"
              style={{ opacity: awake("ground", 1, 0.4), transition: "opacity 900ms ease" }}
            />

            {/* Roots — awaken with whispers */}
            <g
              stroke="hsl(160 35% 40%)"
              strokeWidth={zoneAwake("roots") ? 1.4 : 1.1}
              fill="none"
              style={{
                opacity: awake("roots", 0.75, 0.32),
                transition: "opacity 900ms ease, stroke-width 900ms ease",
              }}
            >
              <path d="M200 420 Q 160 470 80 540" />
              <path d="M200 420 Q 240 470 320 540" />
              <path d="M200 420 Q 200 490 200 580" />
              <path d="M200 420 Q 130 460 60 490" />
              <path d="M200 420 Q 270 460 340 490" />
              <path d="M200 420 Q 180 480 120 575" />
              <path d="M200 420 Q 220 480 280 575" />
            </g>

            {/* Whisper root pulses — sparse travelling glows along major roots.
                Only rendered when whispers exist. SMIL animateMotion keeps
                this CSS-free and reduced-motion is handled below by halting
                the keyTimes via the .et-no-motion override. */}
            {hasWhispers &&
              rootPulsePaths.map((d, i) => (
                <g key={`pulse-${i}`} className="et-root-pulse">
                  <circle r="2.2" fill="hsl(160 70% 78%)" opacity="0.85" filter="url(#et-soft)">
                    <animateMotion
                      dur={`${14 + i * 3}s`}
                      begin={`${i * 4.5}s`}
                      repeatCount="indefinite"
                      path={d}
                      rotate="auto"
                    />
                  </circle>
                </g>
              ))}

            {/* Trunk — awakens with stories */}
            <path
              d="M180 420 Q 175 350 185 290 Q 195 240 200 210 Q 205 240 215 290 Q 225 350 220 420 Z"
              fill="hsl(35 22% 16%)"
              stroke="hsl(40 30% 25%)"
              strokeWidth="0.8"
              style={{ opacity: awake("trunk", 1, 0.55), transition: "opacity 900ms ease" }}
            />

            {/* Branches — awaken with canopy / upper / mid filters */}
            <g
              stroke="hsl(40 28% 22%)"
              strokeWidth="2"
              fill="none"
              style={{
                opacity: awake("canopy", 0.85, zoneAwake("upper") || zoneAwake("mid") ? 0.6 : 0.3),
                transition: "opacity 900ms ease",
              }}
            >
              <path d="M200 240 Q 170 215 110 180" />
              <path d="M200 240 Q 230 215 290 180" />
              <path d="M200 215 Q 165 190 95 145" />
              <path d="M200 215 Q 235 190 305 145" />
              <path d="M200 200 Q 200 170 200 100" />
              <path d="M200 220 Q 150 200 75 200" />
              <path d="M200 220 Q 250 200 325 200" />
            </g>

            {/* Canopy halo — brightens for photos / prayers / poems, and
                quietly responds to the local moon phase. */}
            <ellipse
              cx="200" cy="140" rx="160" ry="80"
              fill={`hsl(${haloHue.toFixed(1)} 80% 65% / 0.9)`}
              style={{
                opacity: zoneAwake("canopy") ? haloBoost : haloBoost * 0.36,
                transition: "opacity 1200ms ease",
                mixBlendMode: "screen",
                filter: "url(#et-soft)",
              }}
            />
          </g>

          {/* Nodes */}
          {visible.map((n) => {
            const pos = placeInZone(n.zone, n.id);
            const dim = !FILTERS.find((f) => f.id === filter)!.match(n);
            const isWhisper = n.kind === "whisper";
            const baseRadius = isWhisper ? 2.2 : 3;
            const isSelected = activeNode?.id === n.id;
            const quieted = !!activeNode && !isSelected;
            return (
              <g
                key={n.id}
                onClick={() => setActiveNode(n)}
                className={cn(
                  "cursor-pointer transition-opacity duration-700",
                  dim
                    ? "opacity-[0.10]"
                    : quieted
                    ? "opacity-[0.32]"
                    : "opacity-100"
                )}
                tabIndex={0}
                role="button"
                aria-label={`${n.kind}: ${n.title}`}
              >
                {/* Selected anchor — ceremonial ring that keeps the memory
                    visibly rooted in place while the sheet is open. */}
                {isSelected && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={16}
                      fill="none"
                      stroke={isWhisper ? "hsl(160 60% 70%)" : "hsl(45 85% 72%)"}
                      strokeWidth="0.6"
                      opacity="0.7"
                      className="et-anchor-ring"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={22}
                      fill={isWhisper ? "url(#et-whisper)" : "url(#et-glow)"}
                      opacity="0.55"
                      filter="url(#et-soft)"
                      className="et-anchor-halo"
                    />
                  </>
                )}
                {/* outer glow */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={9}
                  fill={isWhisper ? "url(#et-whisper)" : "url(#et-glow)"}
                  filter="url(#et-soft)"
                  className={cn("et-node-glow", `et-zone-${n.zone}`)}
                />
                {/* core */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? baseRadius + 0.6 : baseRadius}
                  fill={isWhisper ? "hsl(160 70% 75%)" : "hsl(45 90% 78%)"}
                  className="et-node-core"
                />
              </g>
            );
          })}

          {/* Constellation overflow markers */}
          {Object.entries(overflowByZone).map(([zone, count]) => {
            const rect = ZONE_RECTS[zone as Zone];
            return (
              <g
                key={`ov-${zone}`}
                className={cn(
                  "transition-opacity duration-700",
                  activeNode ? "opacity-[0.25]" : "opacity-100"
                )}
              >
                <circle cx={rect.cx} cy={rect.cy} r="14" fill="url(#et-glow)" opacity="0.6" />
                <text
                  x={rect.cx}
                  y={rect.cy + 3}
                  textAnchor="middle"
                  fontSize="9"
                  fill="hsl(45 40% 85%)"
                  fontFamily="serif"
                >
                  +{count}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Bottom aliveness line */}
        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
          <p className="text-[11px] font-serif italic text-primary/70 tracking-wide">{aliveness}</p>
        </div>
      </div>

      {/* Inline motion styles — scoped to ethereal nodes */}
      <style>{`
        /* Subconscious tree breathing — opacity only, no transform, so
           layout stays absolutely still. ~16s inhale/exhale. */
        .et-breath { animation: et-breathe 16s ease-in-out infinite; }
        @keyframes et-breathe {
          0%, 100% { opacity: 0.92; }
          50%      { opacity: 1; }
        }

        /* Per-node ambient pulse */
        .et-node-glow { animation: et-pulse 6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }

        /* Hanging memory motion — gentle sway in branches/canopy/upper/mid */
        .et-zone-canopy .et-node-core,
        .et-zone-canopy.et-node-glow,
        .et-zone-upper  .et-node-core,
        .et-zone-upper.et-node-glow,
        .et-zone-mid    .et-node-core,
        .et-zone-mid.et-node-glow {
          animation-name: et-sway;
          animation-duration: 11s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .et-zone-upper .et-node-core, .et-zone-upper.et-node-glow { animation-duration: 13s; }
        .et-zone-mid   .et-node-core, .et-zone-mid.et-node-glow   { animation-duration: 9s; }

        /* Whisper traveller glow — fade in/out so pulses appear and dissolve. */
        .et-root-pulse circle { animation: et-pulse-fade 14s ease-in-out infinite; }

        @keyframes et-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.18); }
        }
        @keyframes et-sway {
          0%, 100% { transform: translate(0, 0); }
          25%      { transform: translate(0.8px, -1.2px); }
          50%      { transform: translate(0, -2px); }
          75%      { transform: translate(-0.8px, -1.2px); }
        }
        @keyframes et-pulse-fade {
          0%, 100% { opacity: 0; }
          10%, 90% { opacity: 0.85; }
        }

        /* Ceremonial anchor — slow ring expansion + halo breath. Marks the
           selected memory as visibly rooted in place while the sheet reads. */
        .et-anchor-ring {
          transform-origin: center;
          transform-box: fill-box;
          animation: et-anchor-ring 4.5s ease-out infinite;
        }
        .et-anchor-halo {
          transform-origin: center;
          transform-box: fill-box;
          animation: et-anchor-halo 5s ease-in-out infinite;
        }
        @keyframes et-anchor-ring {
          0%   { transform: scale(0.6); opacity: 0.9; }
          70%  { transform: scale(1.4); opacity: 0;   }
          100% { transform: scale(1.4); opacity: 0;   }
        }
        @keyframes et-anchor-halo {
          0%, 100% { opacity: 0.45; transform: scale(0.95); }
          50%      { opacity: 0.75; transform: scale(1.08); }
        }

        @media (prefers-reduced-motion: reduce) {
          .et-breath,
          .et-node-glow,
          .et-node-core,
          .et-root-pulse circle { animation: none !important; }
          .et-root-pulse { display: none; }
        }
      `}</style>

      {/* Node preview sheet */}
      <Sheet open={!!activeNode} onOpenChange={(open) => !open && setActiveNode(null)}>
        <SheetContent side="bottom" className="max-h-[70vh]">
          {activeNode && (
            <>
              <SheetHeader className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px] font-mono tracking-wider">
                    {activeNode.kind}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono tracking-wider opacity-60">
                    {activeNode.zone}
                  </Badge>
                </div>
                <SheetTitle className="font-serif">{activeNode.title}</SheetTitle>
                {activeNode.subtitle && (
                  <SheetDescription className="font-serif italic">
                    {activeNode.subtitle}
                  </SheetDescription>
                )}
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-serif text-xs tracking-wider gap-1.5 w-fit"
                  onClick={() => {
                    const payloadId =
                      activeNode.kind === "whisper"
                        ? (activeNode.payload as TreeWhisper).id
                        : (activeNode.payload as Offering).id;
                    setActiveNode(null);
                    onViewInOfferings?.(activeNode.kind, payloadId);
                  }}
                >
                  View in Offerings
                  <ArrowRight className="h-3 w-3" />
                </Button>
                <p className="text-xs text-muted-foreground font-serif">
                  Held inside {treeName}. Open the Offerings tab to tend or witness in full.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {totalMemories === 0 && (
        <p className="text-center text-xs text-muted-foreground/70 italic font-serif px-6">
          No memories yet live in this tree. Be the first to offer a photo, a song, or a whisper.
        </p>
      )}
    </div>
  );
}

export default EtherealTreeTab;
