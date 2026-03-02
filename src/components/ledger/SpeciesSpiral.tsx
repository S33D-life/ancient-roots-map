/**
 * SpeciesSpiral — 2D SVG spiral visualization of species in the tree ledger.
 * Each species node sits along an Archimedean spiral.
 * Clicking a node expands its tree string.
 */
import { memo, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RingsOf12, { type RingSlot } from "@/components/RingsOf12";

export interface SpeciesNode {
  species: string;
  treeCount: number;
  visitCount: number;
  heartsGenerated: number;
  hasBloom?: boolean;
  recentActivity?: boolean;
  councilMentioned?: boolean;
}

export interface TreeBead {
  id: string;
  name: string;
  species: string;
  w3w?: string | null;
  location?: string;
  mappedBy?: string;
  mappedAt?: string;
  visitCount: number;
  heartsGenerated: number;
  isMinted?: boolean;
  isFeatured?: boolean;
  recentlyActive?: boolean;
  visits?: RingSlot[];
}

interface SpeciesSpiralProps {
  speciesNodes: SpeciesNode[];
  treesMap: Record<string, TreeBead[]>;
  onTreeClick?: (tree: TreeBead) => void;
  onSpeciesClick?: (species: string) => void;
  className?: string;
}

const SPIRAL_A = 30;  // start radius
const SPIRAL_B = 12;  // growth per revolution
const SIZE = 600;
const CENTER = SIZE / 2;

function spiralPoint(i: number, total: number): { x: number; y: number; angle: number } {
  const maxAngle = Math.PI * 2 * Math.max(2, Math.ceil(total / 8));
  const angle = (i / total) * maxAngle;
  const r = SPIRAL_A + SPIRAL_B * (angle / (Math.PI * 2));
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
    angle,
  };
}

const SpeciesSpiral = memo(({
  speciesNodes,
  treesMap,
  onTreeClick,
  onSpeciesClick,
  className = "",
}: SpeciesSpiralProps) => {
  const [expandedSpecies, setExpandedSpecies] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedBead, setSelectedBead] = useState<TreeBead | null>(null);

  const maxTreeCount = useMemo(
    () => Math.max(1, ...speciesNodes.map(n => n.treeCount)),
    [speciesNodes]
  );

  const handleNodeClick = useCallback((species: string) => {
    setExpandedSpecies(prev => prev === species ? null : species);
    setSelectedBead(null);
    onSpeciesClick?.(species);
  }, [onSpeciesClick]);

  const handleBeadClick = useCallback((tree: TreeBead) => {
    setSelectedBead(prev => prev?.id === tree.id ? null : tree);
    onTreeClick?.(tree);
  }, [onTreeClick]);

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[600px] mx-auto"
        style={{ filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.1))" }}
      >
        {/* Spiral guide path */}
        <path
          d={(() => {
            const pts: string[] = [];
            for (let i = 0; i <= 200; i++) {
              const angle = (i / 200) * Math.PI * 2 * Math.max(2, Math.ceil(speciesNodes.length / 8));
              const r = SPIRAL_A + SPIRAL_B * (angle / (Math.PI * 2));
              const x = CENTER + r * Math.cos(angle);
              const y = CENTER + r * Math.sin(angle);
              pts.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
            }
            return pts.join(" ");
          })()}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={0.5}
          opacity={0.4}
        />

        {/* Species nodes */}
        {speciesNodes.map((node, i) => {
          const { x, y, angle } = spiralPoint(i, speciesNodes.length);
          const sizeScale = 6 + (node.treeCount / maxTreeCount) * 14;
          const visitRatio = node.treeCount > 0 ? node.visitCount / (node.treeCount * 12) : 0;
          const brightness = 0.4 + visitRatio * 0.6;
          const isExpanded = expandedSpecies === node.species;
          const isHovered = hoveredNode === node.species;

          return (
            <g key={node.species}>
              {/* Tree strings (radial line from spiral) */}
              {isExpanded && treesMap[node.species] && (
                <g>
                  {treesMap[node.species].map((tree, treeIdx) => {
                    const stringLength = 30 + treeIdx * 18;
                    const bx = x + Math.cos(angle) * stringLength;
                    const by = y + Math.sin(angle) * stringLength;
                    const isSelected = selectedBead?.id === tree.id;

                    return (
                      <g key={tree.id}>
                        {/* String line */}
                        <line
                          x1={x}
                          y1={y}
                          x2={bx}
                          y2={by}
                          stroke="hsl(var(--primary) / 0.3)"
                          strokeWidth={0.7}
                        />
                        {/* Tree bead */}
                        <circle
                          cx={bx}
                          cy={by}
                          r={isSelected ? 6 : 4}
                          fill={tree.isMinted
                            ? "hsl(42 80% 55%)"
                            : tree.visitCount > 0
                              ? "hsl(var(--primary))"
                              : "hsl(var(--muted-foreground))"
                          }
                          stroke={tree.recentlyActive ? "hsl(120 60% 50%)" : "none"}
                          strokeWidth={tree.recentlyActive ? 1.5 : 0}
                          opacity={0.9}
                          className="cursor-pointer transition-all duration-200"
                          onClick={(e) => { e.stopPropagation(); handleBeadClick(tree); }}
                        />
                        {/* Bead label on hover/select */}
                        {isSelected && (
                          <text
                            x={bx}
                            y={by - 10}
                            textAnchor="middle"
                            fill="hsl(var(--foreground))"
                            fontSize={7}
                            fontFamily="serif"
                          >
                            {tree.name.length > 18 ? tree.name.slice(0, 18) + "…" : tree.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Bloom halo */}
              {node.hasBloom && (
                <circle
                  cx={x}
                  cy={y}
                  r={sizeScale + 5}
                  fill="none"
                  stroke="hsl(330 70% 60% / 0.4)"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                >
                  <animate
                    attributeName="r"
                    values={`${sizeScale + 4};${sizeScale + 7};${sizeScale + 4}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Recent activity pulse */}
              {node.recentActivity && (
                <circle
                  cx={x}
                  cy={y}
                  r={sizeScale + 3}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.5)"
                  strokeWidth={1}
                >
                  <animate
                    attributeName="opacity"
                    values="0.6;0.1;0.6"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Main node */}
              <circle
                cx={x}
                cy={y}
                r={isExpanded ? sizeScale + 2 : sizeScale}
                fill={`hsl(var(--primary) / ${brightness})`}
                stroke={isExpanded ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={isExpanded ? 1.5 : 0.5}
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleNodeClick(node.species)}
                onMouseEnter={() => setHoveredNode(node.species)}
                onMouseLeave={() => setHoveredNode(null)}
              />

              {/* Council marker */}
              {node.councilMentioned && (
                <circle
                  cx={x + sizeScale * 0.7}
                  cy={y - sizeScale * 0.7}
                  r={2.5}
                  fill="hsl(42 80% 55%)"
                />
              )}

              {/* Species label */}
              {(isHovered || isExpanded) && (
                <text
                  x={x}
                  y={y + sizeScale + 12}
                  textAnchor="middle"
                  fill="hsl(var(--foreground))"
                  fontSize={8}
                  fontFamily="serif"
                  fontWeight={isExpanded ? "bold" : "normal"}
                >
                  {node.species || "Unknown"}
                </text>
              )}

              {/* Tree count inside node */}
              {sizeScale > 10 && (
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="hsl(var(--primary-foreground))"
                  fontSize={Math.min(9, sizeScale * 0.7)}
                  fontFamily="mono"
                  pointerEvents="none"
                >
                  {node.treeCount}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Selected bead detail panel */}
      <AnimatePresence>
        {selectedBead && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 left-0 right-0 mx-auto max-w-sm rounded-xl border border-border bg-card/95 backdrop-blur-sm p-4 shadow-lg"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-serif text-sm font-semibold text-foreground">{selectedBead.name}</h4>
                <p className="text-xs text-muted-foreground">{selectedBead.species}</p>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                {selectedBead.isMinted && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">Minted</span>
                )}
                {selectedBead.isFeatured && (
                  <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono">Featured</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center mb-3">
              <div>
                <p className="text-lg font-serif font-bold text-foreground">{selectedBead.visitCount}</p>
                <p className="text-[10px] text-muted-foreground">Visits</p>
              </div>
              <div>
                <p className="text-lg font-serif font-bold text-foreground">{selectedBead.heartsGenerated}</p>
                <p className="text-[10px] text-muted-foreground">Hearts</p>
              </div>
              <div>
                <RingsOf12
                  slots={selectedBead.visits || []}
                  size={48}
                  baseRadius={10}
                  ringGap={8}
                  showProgress={false}
                />
              </div>
            </div>
            {selectedBead.w3w && (
              <p className="text-[10px] text-muted-foreground font-mono">///{ selectedBead.w3w}</p>
            )}
            <button
              className="mt-2 w-full text-xs text-primary hover:underline text-center"
              onClick={() => setSelectedBead(null)}
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SpeciesSpiral.displayName = "SpeciesSpiral";

export default SpeciesSpiral;
