/**
 * HexHiveCell — A single hexagonal hive cell for the honeycomb wall.
 * Flat-top orientation, clip-path hexagon, forest gradient with gold edges.
 * Features: hover tooltip, activity ring, heart pulse, nation & species tags.
 */
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { TreePine, Music, Heart, Users, Globe, Activity } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HexHiveCellProps {
  icon: string;
  name: string;
  accentHsl: string;
  treeCount: number;
  offeringCount: number;
  heartCount: number;
  wandererCount: number;
  topSpecies: string[];
  nations?: string[];
  speciesCounts?: Record<string, number>;
  isExpanded: boolean;
  onClick: () => void;
}

/* flat-top hexagon via clip-path */
const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

/** Determine activity level from metrics */
function getActivityLevel(trees: number, offerings: number, hearts: number): "dormant" | "quiet" | "active" | "thriving" {
  const score = trees + offerings * 2 + hearts * 0.5;
  if (score >= 50) return "thriving";
  if (score >= 15) return "active";
  if (score >= 3) return "quiet";
  return "dormant";
}

const ACTIVITY_COLORS: Record<string, string> = {
  dormant: "hsl(var(--muted-foreground) / 0.2)",
  quiet: "hsl(45 40% 40% / 0.4)",
  active: "hsl(45 60% 50% / 0.6)",
  thriving: "hsl(45 80% 55% / 0.9)",
};

const ACTIVITY_LABELS: Record<string, string> = {
  dormant: "Dormant",
  quiet: "Quiet",
  active: "Active",
  thriving: "Thriving",
};

const HexHiveCell = memo(({
  icon,
  name,
  accentHsl,
  treeCount,
  offeringCount,
  heartCount,
  wandererCount,
  topSpecies,
  nations = [],
  speciesCounts = {},
  isExpanded,
  onClick,
}: HexHiveCellProps) => {
  const hasHearts = heartCount > 0;
  const shortName = name.replace(" Hive", "");
  const activity = useMemo(
    () => getActivityLevel(treeCount, offeringCount, heartCount),
    [treeCount, offeringCount, heartCount],
  );

  // Top species with counts for tooltip
  const speciesBreakdown = useMemo(() => {
    return Object.entries(speciesCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [speciesCounts]);

  const tooltipContent = (
    <div className="space-y-2 text-xs font-serif">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="font-semibold text-foreground">{name}</p>
          <span
            className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full mt-0.5"
            style={{
              background: ACTIVITY_COLORS[activity].replace(/[^,]+$/, "0.15)"),
              color: ACTIVITY_COLORS[activity],
            }}
          >
            <Activity className="w-2.5 h-2.5" /> {ACTIVITY_LABELS[activity]}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
        <span className="flex items-center gap-1"><TreePine className="w-3 h-3" /> {treeCount} trees</span>
        <span className="flex items-center gap-1"><Music className="w-3 h-3" /> {offeringCount} offerings</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {heartCount} hearts</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {wandererCount} wanderers</span>
      </div>
      {nations.length > 0 && (
        <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
          <Globe className="w-2.5 h-2.5" /> {nations.slice(0, 4).join(", ")}{nations.length > 4 ? ` +${nations.length - 4}` : ""}
        </p>
      )}
      {speciesBreakdown.length > 0 && (
        <div className="border-t border-border/30 pt-1.5">
          <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-1">Species</p>
          <div className="space-y-0.5">
            {speciesBreakdown.map(([sp, count]) => (
              <div key={sp} className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] text-muted-foreground">{sp}</span>
                <span className="text-[9px] tabular-nums" style={{ color: `hsl(${accentHsl})` }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-[9px] text-primary/60 italic">Click to {isExpanded ? "enter hive" : "preview"}</p>
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="group relative focus:outline-none w-full"
            style={{ aspectRatio: "1.1547 / 1" }}
          >
            {/* Activity ring — outer glow border */}
            <div
              className="absolute transition-all duration-500"
              style={{
                inset: "-3px",
                clipPath: HEX_CLIP,
                background: isExpanded
                  ? `linear-gradient(135deg, hsl(${accentHsl}), hsl(45 80% 55%))`
                  : `linear-gradient(135deg, ${ACTIVITY_COLORS[activity]}, hsl(45 50% 35% / 0.2))`,
                opacity: isExpanded ? 1 : activity === "dormant" ? 0.3 : 0.7,
              }}
            />

            {/* Gold border layer */}
            <div
              className="absolute inset-0 transition-all duration-300"
              style={{
                clipPath: HEX_CLIP,
                background: isExpanded
                  ? `linear-gradient(135deg, hsl(${accentHsl}), hsl(45 80% 55%))`
                  : "linear-gradient(135deg, hsl(45 50% 40% / 0.5), hsl(45 60% 30% / 0.3))",
                filter: isExpanded ? "brightness(1.2)" : undefined,
              }}
            />

            {/* Inner hex */}
            <div
              className="absolute transition-all duration-300"
              style={{
                inset: "2px",
                clipPath: HEX_CLIP,
                background: isExpanded
                  ? `linear-gradient(160deg, hsl(${accentHsl} / 0.25), hsl(150 30% 8%))`
                  : "linear-gradient(160deg, hsl(150 25% 12%), hsl(150 30% 8%))",
              }}
            >
              {/* Hover glow overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at center, hsl(45 70% 50% / 0.12), transparent 70%)`,
                }}
              />

              {/* Heart pulse glow — scales with activity */}
              {hasHearts && (
                <div
                  className="absolute inset-0"
                  style={{
                    opacity: activity === "thriving" ? 0.25 : activity === "active" ? 0.15 : 0.08,
                    background: `radial-gradient(circle at 50% 65%, hsl(${accentHsl} / 0.3), transparent 60%)`,
                    animation: activity !== "dormant" ? "hex-pulse 3.6s ease-in-out infinite" : undefined,
                  }}
                />
              )}

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center px-3 gap-0.5">
                {/* Activity dot */}
                <div
                  className="absolute top-[10%] right-[15%] w-1.5 h-1.5 rounded-full"
                  style={{ background: ACTIVITY_COLORS[activity] }}
                  title={ACTIVITY_LABELS[activity]}
                />

                {/* Icon */}
                <span className="text-2xl leading-none drop-shadow-sm">{icon}</span>

                {/* Name */}
                <p className="text-[11px] font-serif text-center leading-tight text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 max-w-[85%] mt-0.5 font-medium">
                  {shortName}
                </p>

                {/* Stats row — compact 2×2 */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-0 mt-1">
                  {[
                    { Icon: TreePine, val: treeCount },
                    { Icon: Music, val: offeringCount },
                    { Icon: Heart, val: heartCount },
                    { Icon: Users, val: wandererCount },
                  ].map(({ Icon, val }, i) => (
                    <div key={i} className="flex items-center gap-0.5 justify-center">
                      <Icon className="w-2.5 h-2.5 text-muted-foreground/50" />
                      <span
                        className="text-[10px] font-serif tabular-nums"
                        style={{ color: val > 0 ? `hsl(${accentHsl})` : "hsl(var(--muted-foreground) / 0.35)" }}
                      >
                        {val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Nation indicator — single line */}
                {nations.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <Globe className="w-2 h-2 text-muted-foreground/40" />
                    <span className="text-[8px] font-serif text-muted-foreground/50 truncate max-w-[70px]">
                      {nations.length <= 2 ? nations.join(", ") : `${nations.length} regions`}
                    </span>
                  </div>
                )}

                {/* Species tags — max 2 */}
                {topSpecies.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 justify-center mt-0.5 max-w-[92%]">
                    {topSpecies.slice(0, 2).map(sp => (
                      <span
                        key={sp}
                        className="text-[7px] font-serif px-1.5 py-0 rounded-full truncate max-w-[65px]"
                        style={{
                          background: `hsl(${accentHsl} / 0.15)`,
                          color: `hsl(${accentHsl})`,
                          border: `1px solid hsl(${accentHsl} / 0.2)`,
                        }}
                      >
                        {sp}
                      </span>
                    ))}
                    {topSpecies.length > 2 && (
                      <span className="text-[7px] font-serif text-muted-foreground/50">+{topSpecies.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={8}
          className="max-w-[250px] p-3 z-50"
          collisionPadding={16}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

HexHiveCell.displayName = "HexHiveCell";
export default HexHiveCell;
