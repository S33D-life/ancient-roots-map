/**
 * HexConstellationMap — Interactive constellation of hex species nodes
 * arranged in organic clusters by botanical family (hive).
 *
 * Features:
 * - Clustered hex layout around a central point
 * - Subtle SVG connection lines between related nodes
 * - Pan & zoom via pointer drag + wheel
 * - Drifting starlight particles
 * - Mobile-friendly with swipeable clusters
 */
import { memo, useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMapFocus } from "@/hooks/use-map-focus";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, Plus, X, Clock, Heart, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type SpeciesActivity } from "@/hooks/useCountrySpeciesActivity";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import HexSpeciesNode, { type HexSpeciesNodeData } from "./HexSpeciesNode";
import { format } from "date-fns";

interface Props {
  species: SpeciesActivity[];
  country: string;
  countrySlug: string;
  loading?: boolean;
  onSpeciesSelect?: (species: string | null) => void;
}

/* ── Cluster layout math ── */

interface ClusterDef {
  family: string;
  hiveIcon: string;
  hiveSlug: string;
  nodes: HexSpeciesNodeData[];
  cx: number;
  cy: number;
}

const FIELD_SIZE = 800;
const FIELD_CENTER = FIELD_SIZE / 2;
const BREATHING_COUNT = 4;

/** Position clusters in a circular pattern around center */
function computeClusters(species: SpeciesActivity[]): ClusterDef[] {
  // Group by hive family
  const familyMap = new Map<string, { nodes: HexSpeciesNodeData[]; icon: string; slug: string }>();

  for (const sp of species) {
    const hive = getHiveForSpecies(sp.species);
    const family = hive?.family || "Unknown";
    const icon = hive?.icon || "🌿";
    const slug = hive?.slug || "unknown";

    if (!familyMap.has(family)) {
      familyMap.set(family, { nodes: [], icon, slug });
    }
    familyMap.get(family)!.nodes.push({
      species: sp.species,
      mapped: sp.mapped,
      offerings: sp.offerings,
      visits: sp.visits,
      hearts: 0,
      score: sp.score,
      recentActivity: sp.recentActivity,
      lastActivity: sp.lastActivity,
      family,
      hiveIcon: icon,
      hiveSlug: slug,
    });
  }

  const clusters: ClusterDef[] = [];
  const families = [...familyMap.entries()].sort((a, b) => {
    const scoreA = a[1].nodes.reduce((s, n) => s + n.score, 0);
    const scoreB = b[1].nodes.reduce((s, n) => s + n.score, 0);
    return scoreB - scoreA;
  });

  const count = families.length;
  const orbitRadius = Math.min(220, 120 + count * 12);

  families.forEach(([family, data], i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const cx = FIELD_CENTER + orbitRadius * Math.cos(angle);
    const cy = FIELD_CENTER + orbitRadius * Math.sin(angle);

    clusters.push({
      family,
      hiveIcon: data.icon,
      hiveSlug: data.slug,
      nodes: data.nodes.sort((a, b) => b.score - a.score),
      cx,
      cy,
    });
  });

  return clusters;
}

/** Position nodes within a cluster in a small hex pattern */
function nodePositionsInCluster(
  nodes: HexSpeciesNodeData[],
  cx: number,
  cy: number,
  nodeSize: number
): Array<{ node: HexSpeciesNodeData; x: number; y: number }> {
  const gap = nodeSize * 0.15;
  const effectiveSize = nodeSize + gap;
  const result: Array<{ node: HexSpeciesNodeData; x: number; y: number }> = [];

  // Hex ring layout: center, then ring 1 (6), ring 2 (12)
  const hexOffsets: Array<[number, number]> = [[0, 0]];

  // Ring 1
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 + 30) * (Math.PI / 180);
    hexOffsets.push([Math.cos(a) * effectiveSize, Math.sin(a) * effectiveSize]);
  }

  // Ring 2
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 + 15) * (Math.PI / 180);
    hexOffsets.push([Math.cos(a) * effectiveSize * 1.9, Math.sin(a) * effectiveSize * 1.9]);
  }

  nodes.forEach((node, i) => {
    if (i >= hexOffsets.length) return;
    const [ox, oy] = hexOffsets[i];
    result.push({ node, x: cx + ox, y: cy + oy });
  });

  return result;
}

/** Generate connection lines between cluster centers */
function computeConnections(clusters: ClusterDef[]): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  // Connect adjacent clusters (circular neighbors)
  for (let i = 0; i < clusters.length; i++) {
    const next = (i + 1) % clusters.length;
    lines.push({
      x1: clusters[i].cx,
      y1: clusters[i].cy,
      x2: clusters[next].cx,
      y2: clusters[next].cy,
    });
  }
  // Connect each to center
  for (const c of clusters) {
    lines.push({ x1: FIELD_CENTER, y1: FIELD_CENTER, x2: c.cx, y2: c.cy });
  }
  return lines;
}

const HexConstellationMap = memo(({ species, country, countrySlug, loading, onSpeciesSelect }: Props) => {
  const navigate = useNavigate();
  const { focusMap } = useMapFocus();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<HexSpeciesNodeData | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeClusterIdx, setActiveClusterIdx] = useState(0);

  // Pan & zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  const maxScore = useMemo(() => Math.max(1, ...species.map(s => s.score)), [species]);

  const breathingSet = useMemo(() => {
    const recent = [...species]
      .filter(s => s.lastActivity)
      .sort((a, b) => new Date(b.lastActivity!).getTime() - new Date(a.lastActivity!).getTime())
      .slice(0, BREATHING_COUNT);
    return new Set(recent.map(s => s.species));
  }, [species]);

  const clusters = useMemo(() => computeClusters(species), [species]);
  const connections = useMemo(() => computeConnections(clusters), [clusters]);

  const nodeSize = isMobile ? 56 : 72;

  const allPositionedNodes = useMemo(() => {
    return clusters.flatMap(c => nodePositionsInCluster(c.nodes, c.cx, c.cy, nodeSize));
  }, [clusters, nodeSize]);

  // Pan handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile) return; // mobile uses cluster swipe
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [pan, isMobile]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.startPanX + dx / zoom, y: dragRef.current.startPanY + dy / zoom });
  }, [zoom]);

  const handlePointerUp = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(2, z - e.deltaY * 0.001)));
  }, []);

  const handleNodeClick = useCallback((data: HexSpeciesNodeData) => {
    setSelected(prev => {
      const next = prev?.species === data.species ? null : data;
      onSpeciesSelect?.(next?.species || null);
      return next;
    });
  }, [onSpeciesSelect]);

  const handleFilterMap = useCallback((sp: HexSpeciesNodeData) => {
    focusMap({ type: "area", id: sp.species, countrySlug, source: "species", species: sp.species });
  }, [focusMap, countrySlug]);

  // Mobile cluster navigation
  const mobileCluster = clusters[activeClusterIdx];
  const mobileNodes = useMemo(() => {
    if (!mobileCluster) return [];
    return nodePositionsInCluster(
      mobileCluster.nodes.slice(0, 7),
      150, 150, 56
    );
  }, [mobileCluster]);

  if (loading) {
    return (
      <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <span className="text-3xl">⬡</span>
            <p className="text-sm text-muted-foreground font-serif">Mapping the constellation…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (species.length === 0) {
    return (
      <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center space-y-3">
          <span className="text-3xl">⬡</span>
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
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-serif font-bold text-foreground">Species Constellation</h3>
        <p className="text-xs text-muted-foreground">
          {species.length} species across {clusters.length} botanical families in {country}
        </p>
      </div>

      {/* ── Mobile: Cluster swipe view ── */}
      {isMobile ? (
        <div className="relative">
          {/* Cluster label + nav */}
          <div className="flex items-center justify-between mb-3 px-2">
            <button
              onClick={() => setActiveClusterIdx(i => (i - 1 + clusters.length) % clusters.length)}
              className="p-1.5 rounded-full bg-card/60 border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="text-xl">{mobileCluster?.hiveIcon}</span>
              <p className="text-xs font-serif text-foreground mt-0.5">{mobileCluster?.family}</p>
              <p className="text-[10px] text-muted-foreground">{mobileCluster?.nodes.length} species</p>
            </div>
            <button
              onClick={() => setActiveClusterIdx(i => (i + 1) % clusters.length)}
              className="p-1.5 rounded-full bg-card/60 border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Cluster dots */}
          <div className="flex justify-center gap-1 mb-3">
            {clusters.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveClusterIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === activeClusterIdx ? "bg-primary w-3" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Mobile hex field */}
          <div className="relative mx-auto constellation-bg rounded-2xl overflow-hidden" style={{ width: 300, height: 300 }}>
            {/* Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="constellation-particle absolute w-0.5 h-0.5 rounded-full bg-primary/25"
                  style={{
                    left: `${20 + i * 20}%`,
                    top: `${30 + (i % 3) * 20}%`,
                    animationDelay: `${i * 1.5}s`,
                  }}
                />
              ))}
            </div>

            {mobileNodes.map(({ node, x, y }) => (
              <div
                key={node.species}
                className="absolute"
                style={{
                  left: x - 28,
                  top: y - 24,
                }}
              >
                <HexSpeciesNode
                  data={node}
                  size={56}
                  isSelected={selected?.species === node.species}
                  isHovered={hovered === node.species}
                  onHover={setHovered}
                  onClick={handleNodeClick}
                  intensity={node.score / maxScore}
                  breathing={breathingSet.has(node.species)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Desktop: Full constellation with pan/zoom ── */
        <div
          ref={containerRef}
          className="relative mx-auto constellation-bg rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ width: "100%", maxWidth: 700, height: 500 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Drifting particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="constellation-particle absolute w-0.5 h-0.5 rounded-full bg-primary/20"
                style={{
                  left: `${10 + i * 15}%`,
                  top: `${20 + (i % 4) * 18}%`,
                  animationDelay: `${i * 1.3}s`,
                }}
              />
            ))}
          </div>

          {/* SVG connection lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${FIELD_SIZE} ${FIELD_SIZE}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center",
            }}
          >
            <defs>
              <filter id="line-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {connections.map((line, i) => (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="hsl(45 60% 50% / 0.08)"
                strokeWidth={0.8}
                filter="url(#line-glow)"
                className="constellation-line"
              />
            ))}

            {/* Cluster labels */}
            {clusters.map(c => (
              <text
                key={c.family}
                x={c.cx}
                y={c.cy - (nodeSize * 1.2)}
                textAnchor="middle"
                fill="hsl(45 60% 60% / 0.5)"
                fontSize={9}
                fontFamily="serif"
                className="pointer-events-none select-none"
              >
                {c.hiveIcon} {c.family}
              </text>
            ))}
          </svg>

          {/* Hex nodes layer */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center",
            }}
          >
            {allPositionedNodes.map(({ node, x, y }) => {
              // Convert SVG coords to container coords
              const scale = 500 / FIELD_SIZE; // container height / field size
              const px = x * (700 / FIELD_SIZE);
              const py = y * scale;

              return (
                <div
                  key={node.species}
                  className="absolute"
                  style={{
                    left: px - nodeSize / 2,
                    top: py - (nodeSize / 1.1547) / 2,
                  }}
                >
                  <HexSpeciesNode
                    data={node}
                    size={nodeSize}
                    isSelected={selected?.species === node.species}
                    isHovered={hovered === node.species}
                    onHover={setHovered}
                    onClick={handleNodeClick}
                    intensity={node.score / maxScore}
                    breathing={breathingSet.has(node.species)}
                  />
                </div>
              );
            })}
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.15))}
              className="w-7 h-7 rounded-full bg-card/80 border border-border/40 text-foreground/70 hover:text-foreground text-sm flex items-center justify-center transition-colors"
            >+</button>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.15))}
              className="w-7 h-7 rounded-full bg-card/80 border border-border/40 text-foreground/70 hover:text-foreground text-sm flex items-center justify-center transition-colors"
            >−</button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="w-7 h-7 rounded-full bg-card/80 border border-border/40 text-foreground/70 hover:text-foreground text-[9px] flex items-center justify-center transition-colors"
            >⟲</button>
          </div>
        </div>
      )}

      {/* Breathing legend */}
      {breathingSet.size > 0 && (
        <p className="text-center text-[10px] text-muted-foreground/60 mt-2 italic font-serif">
          Glowing nodes — most recent activity
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
                    <h4 className="font-serif text-sm font-semibold text-foreground flex items-center gap-2">
                      <span>{selected.hiveIcon}</span>
                      {selected.species}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Score: {selected.score.toFixed(1)}
                      {breathingSet.has(selected.species) && (
                        <span className="ml-1.5 text-primary/70">· Most recent</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelected(null); onSpeciesSelect?.(null); }}
                    className="p-1 rounded-full hover:bg-muted/50 transition-colors"
                  >
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
                    onClick={() => navigate(`/add?species=${encodeURIComponent(selected.species)}&country=${countrySlug}`)}>
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

HexConstellationMap.displayName = "HexConstellationMap";

export default HexConstellationMap;
