/**
 * HexSpeciesNode — A hexagonal species node for the constellation map.
 * Flat-top hex with forest gradient, gold edges, hover glow + expand.
 */
import { memo } from "react";
import { motion } from "framer-motion";
import { TreePine, Heart, Eye } from "lucide-react";

export interface HexSpeciesNodeData {
  species: string;
  mapped: number;
  offerings: number;
  visits: number;
  hearts?: number;
  score: number;
  recentActivity?: boolean;
  lastActivity?: string | null;
  family?: string;
  hiveIcon?: string;
  hiveSlug?: string;
}

interface HexSpeciesNodeProps {
  data: HexSpeciesNodeData;
  size: number;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (species: string | null) => void;
  onClick: (data: HexSpeciesNodeData) => void;
  /** 0–1 normalised score for visual intensity */
  intensity: number;
  breathing?: boolean;
}

const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

const HexSpeciesNode = memo(({
  data,
  size,
  isSelected,
  isHovered,
  onHover,
  onClick,
  intensity,
  breathing,
}: HexSpeciesNodeProps) => {
  const showDetails = isHovered || isSelected;
  const glowOpacity = isSelected ? 0.35 : isHovered ? 0.2 : 0;

  return (
    <motion.button
      onClick={() => onClick(data)}
      onMouseEnter={() => onHover(data.species)}
      onMouseLeave={() => onHover(null)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className="group relative focus:outline-none shrink-0"
      style={{ width: size, height: size / 1.1547 }}
      title={data.species}
    >
      {/* Outer gold border hex */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          clipPath: HEX_CLIP,
          background: isSelected
            ? "linear-gradient(135deg, hsl(45 80% 55%), hsl(42 70% 40%))"
            : "linear-gradient(135deg, hsl(45 50% 40% / 0.45), hsl(45 60% 30% / 0.25))",
        }}
      />

      {/* Inner hex */}
      <div
        className="absolute transition-all duration-300"
        style={{
          inset: "2px",
          clipPath: HEX_CLIP,
          background: isSelected
            ? `linear-gradient(160deg, hsl(150 25% 14%), hsl(150 30% 9%))`
            : `linear-gradient(160deg, hsl(150 25% ${10 + intensity * 5}%), hsl(150 30% 7%))`,
        }}
      >
        {/* Hover / selection glow */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: glowOpacity,
            background: "radial-gradient(circle at center, hsl(45 70% 50% / 0.3), transparent 70%)",
          }}
        />

        {/* Breathing pulse */}
        {breathing && (
          <div
            className="absolute inset-0 constellation-breath"
            style={{
              background: "radial-gradient(circle at center, hsl(var(--primary) / 0.15), transparent 60%)",
            }}
          />
        )}

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-1 gap-0">
          {/* Icon */}
          <span className="text-base sm:text-lg leading-none drop-shadow-sm">
            {data.hiveIcon || "🌿"}
          </span>

          {/* Name */}
          <p className="text-[8px] sm:text-[9px] font-serif text-center leading-tight text-foreground/85 group-hover:text-primary transition-colors line-clamp-2 max-w-[90%]">
            {data.species.length > 16 ? data.species.slice(0, 14) + "…" : data.species}
          </p>

          {/* Tree count */}
          <span className="text-[9px] sm:text-[10px] font-serif tabular-nums text-primary/80 font-semibold">
            {data.mapped}
          </span>

          {/* Expanded stats on hover */}
          {showDetails && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="flex items-center gap-0.5 text-[7px] text-muted-foreground">
                <Heart className="w-2 h-2" />{data.offerings}
              </span>
              <span className="flex items-center gap-0.5 text-[7px] text-muted-foreground">
                <Eye className="w-2 h-2" />{data.visits}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
});

HexSpeciesNode.displayName = "HexSpeciesNode";
export default HexSpeciesNode;
