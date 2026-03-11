/**
 * HexHiveCell — A single hexagonal hive cell for the honeycomb wall.
 * Flat-top orientation, clip-path hexagon, forest-green gradient with gold edges.
 */
import { memo } from "react";
import { motion } from "framer-motion";
import { TreePine, Music, Heart, Users } from "lucide-react";

interface HexHiveCellProps {
  icon: string;
  name: string;
  accentHsl: string;
  treeCount: number;
  offeringCount: number;
  heartCount: number;
  wandererCount: number;
  topSpecies: string[];
  isExpanded: boolean;
  onClick: () => void;
}

/* flat-top hexagon via clip-path */
const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

const HexHiveCell = memo(({
  icon,
  name,
  accentHsl,
  treeCount,
  offeringCount,
  heartCount,
  wandererCount,
  topSpecies,
  isExpanded,
  onClick,
}: HexHiveCellProps) => {
  const hasHearts = heartCount > 0;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="group relative focus:outline-none"
      style={{ aspectRatio: "1.1547 / 1" /* flat-top hex aspect */ }}
    >
      {/* Gold border layer (slightly larger hex behind) */}
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

      {/* Inner hex — inset by 2px */}
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

        {/* Heart pulse glow */}
        {hasHearts && (
          <div
            className="absolute inset-0 animate-pulse opacity-20"
            style={{
              background: `radial-gradient(circle at 50% 70%, hsl(${accentHsl} / 0.3), transparent 60%)`,
            }}
          />
        )}

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-2 py-3 gap-0.5">
          {/* Icon */}
          <span className="text-2xl sm:text-3xl leading-none drop-shadow-sm">{icon}</span>

          {/* Name */}
          <p className="text-[10px] sm:text-xs font-serif text-center leading-tight text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 max-w-[90%] mt-0.5">
            {name.replace(" Hive", "")}
          </p>

          {/* Stats 2×2 grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-0 mt-1">
            {[
              { Icon: TreePine, val: treeCount },
              { Icon: Music, val: offeringCount },
              { Icon: Heart, val: heartCount },
              { Icon: Users, val: wandererCount },
            ].map(({ Icon, val }, i) => (
              <div key={i} className="flex items-center gap-0.5 justify-center">
                <Icon className="w-2.5 h-2.5 text-muted-foreground/60" />
                <span
                  className="text-[9px] sm:text-[10px] font-serif tabular-nums"
                  style={{ color: val > 0 ? `hsl(${accentHsl})` : "hsl(var(--muted-foreground) / 0.4)" }}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>

          {/* Species tags */}
          {topSpecies.length > 0 && (
            <div className="flex flex-wrap gap-0.5 justify-center mt-1 max-w-[95%]">
              {topSpecies.slice(0, 2).map(sp => (
                <span
                  key={sp}
                  className="text-[7px] sm:text-[8px] font-serif px-1.5 py-0 rounded-full truncate max-w-[60px]"
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
  );
});

HexHiveCell.displayName = "HexHiveCell";
export default HexHiveCell;
