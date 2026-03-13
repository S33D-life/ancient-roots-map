import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import {
  TREE_NODES, PARTNER_NODES, ORBIT_NODES, COMMUNITY_NODE,
  CONNECTIONS, ORBIT_RINGS, getAllNodes,
  type EcoNode, type EcoConnection, type OrbitRing,
} from "@/data/ecosystemMapData";

// ─── Layout constants ───
const SVG_W = 1200;
const SVG_H = 1400;
const TREE_CX = SVG_W / 2;
const TREE_TOP = 180;
const TREE_LAYER_GAP = 140;
const MYCELIUM_Y = TREE_TOP + 3 * TREE_LAYER_GAP + 120;
const ORBIT_CY = TREE_TOP + 1.5 * TREE_LAYER_GAP;
const COMMUNITY_X = 180;
const COMMUNITY_Y = MYCELIUM_Y - 40;

function treePos(layer: number) {
  return { x: TREE_CX, y: TREE_TOP + layer * TREE_LAYER_GAP };
}

function partnerPos(order: number, total: number) {
  const spread = 700;
  const startX = TREE_CX - spread / 2;
  const x = total === 1 ? TREE_CX : startX + (spread / (total - 1)) * order;
  const yWobble = Math.sin(order * 1.8) * 25;
  return { x, y: MYCELIUM_Y + yWobble };
}

function orbitPos(ring: OrbitRing, angleDeg: number) {
  const meta = ORBIT_RINGS.find((r) => r.id === ring);
  if (!meta) return { x: TREE_CX, y: ORBIT_CY };
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: TREE_CX + meta.radius * Math.cos(rad),
    y: ORBIT_CY + meta.radius * Math.sin(rad) * 0.55, // Elliptical
  };
}

function nodePos(node: EcoNode): { x: number; y: number } {
  if (node.type === "tree") return treePos(node.treeLayer ?? 0);
  if (node.type === "partner") return partnerPos(node.partnerOrder ?? 0, PARTNER_NODES.length);
  if (node.type === "orbit") return orbitPos(node.orbit!, node.orbitAngle ?? 0);
  if (node.id === "community-proposals") return { x: COMMUNITY_X, y: COMMUNITY_Y };
  return { x: TREE_CX, y: ORBIT_CY };
}

// ─── Mycelium path generator ───
function myceliumPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const mx = (from.x + to.x) / 2 + (Math.random() - 0.5) * 60;
  const my = (from.y + to.y) / 2 + 30 + Math.random() * 30;
  return `M${from.x},${from.y} Q${mx},${my} ${to.x},${to.y}`;
}

// ─── Organic trunk path ───
function trunkPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const cx = from.x + (Math.random() - 0.5) * 12;
  return `M${from.x},${from.y} C${cx},${from.y + 40} ${cx},${to.y - 40} ${to.x},${to.y}`;
}

// ─── Orbit link path (curved) ───
function orbitLinkPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx = from.x + dx * 0.5 - dy * 0.15;
  const cy = from.y + dy * 0.5 + dx * 0.08;
  return `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`;
}

// ─── Node component ───
function EcoNodeCircle({
  node,
  pos,
  selected,
  highlighted,
  dimmed,
  onSelect,
}: {
  node: EcoNode;
  pos: { x: number; y: number };
  selected: boolean;
  highlighted: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
}) {
  const isTree = node.type === "tree";
  const isPartner = node.type === "partner";
  const isCommunity = node.type === "community";
  const r = isTree ? 38 : isCommunity ? 34 : isPartner ? 28 : 24;

  const orbitMeta = node.orbit ? ORBIT_RINGS.find((o) => o.id === node.orbit) : null;

  const fillColor = isTree
    ? "hsl(42, 45%, 18%)"
    : isPartner
    ? "hsl(270, 25%, 16%)"
    : isCommunity
    ? "hsl(42, 50%, 20%)"
    : "hsl(220, 20%, 14%)";

  const strokeColor = isTree
    ? "hsl(42, 60%, 50%)"
    : isPartner
    ? "hsl(270, 40%, 50%)"
    : isCommunity
    ? "hsl(42, 55%, 55%)"
    : orbitMeta?.color ?? "hsl(200, 30%, 45%)";

  return (
    <motion.g
      className="cursor-pointer"
      onClick={() => onSelect(node.id)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: dimmed ? 0.25 : 1,
        scale: selected ? 1.15 : highlighted ? 1.08 : 1,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: Math.random() * 0.4 }}
      whileHover={{ scale: 1.12 }}
    >
      {/* Glow */}
      {(selected || highlighted) && (
        <circle cx={pos.x} cy={pos.y} r={r + 12} fill="none" stroke={strokeColor} strokeWidth={1.5} opacity={0.3}>
          <animate attributeName="r" values={`${r + 10};${r + 16};${r + 10}`} dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.15;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Background */}
      <circle cx={pos.x} cy={pos.y} r={r} fill={fillColor} stroke={strokeColor} strokeWidth={selected ? 2.5 : 1.5} />

      {/* Emoji */}
      <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={isTree ? 22 : 18} className="select-none pointer-events-none">
        {node.emoji}
      </text>

      {/* Label */}
      <text
        x={pos.x}
        y={pos.y + r + 14}
        textAnchor="middle"
        fontSize={isTree ? 11 : 9.5}
        fill="hsl(42, 30%, 72%)"
        fontFamily="serif"
        className="select-none pointer-events-none"
      >
        {node.label}
      </text>
    </motion.g>
  );
}

// ─── Connection line ───
function ConnectionLine({
  conn,
  positions,
  highlighted,
}: {
  conn: EcoConnection;
  positions: Record<string, { x: number; y: number }>;
  highlighted: boolean;
}) {
  const from = positions[conn.from];
  const to = positions[conn.to];
  if (!from || !to) return null;

  const isTrunk = conn.type === "trunk";
  const isMycelium = conn.type === "mycelium";
  const isProposal = conn.type === "proposal-link";

  const d = isTrunk
    ? trunkPath(from, to)
    : isMycelium
    ? myceliumPath(from, to)
    : orbitLinkPath(from, to);

  const color = isTrunk
    ? "hsl(42, 50%, 35%)"
    : isMycelium
    ? "hsl(270, 30%, 40%)"
    : isProposal
    ? "hsl(42, 45%, 40%)"
    : "hsl(200, 30%, 35%)";

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={isTrunk ? 3 : isMycelium ? 1.8 : 1.2}
      strokeDasharray={isMycelium ? "6 4" : isProposal ? "4 3" : undefined}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: highlighted ? 0.9 : 0.4 }}
      transition={{ duration: 1.2, delay: Math.random() * 0.5 }}
    />
  );
}

// ─── Orbit ring ───
function OrbitRingEllipse({ ring }: { ring: typeof ORBIT_RINGS[number] }) {
  return (
    <ellipse
      cx={TREE_CX}
      cy={ORBIT_CY}
      rx={ring.radius}
      ry={ring.radius * 0.55}
      fill="none"
      stroke={ring.color}
      strokeWidth={0.6}
      opacity={0.15}
      strokeDasharray="4 6"
    />
  );
}

// ─── Detail panel ───
function DetailPanel({ node, onClose }: { node: EcoNode; onClose: () => void }) {
  const orbitMeta = node.orbit ? ORBIT_RINGS.find((o) => o.id === node.orbit) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[360px]
        rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl p-5 shadow-2xl z-20"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <span className="text-3xl">{node.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-serif text-foreground">{node.label}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-serif">
              {node.type === "tree"
                ? ["Crown", "Canopy", "Trunk", "Roots"][node.treeLayer ?? 0]
                : node.type === "partner"
                ? "Mycelium Partner"
                : node.type === "community"
                ? "Community"
                : orbitMeta?.label ?? "Infrastructure"}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{node.description}</p>

      {node.supports && node.supports.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-muted-foreground/60 font-serif mr-1">Supports:</span>
          {node.supports.map((s) => {
            const target = TREE_NODES.find((t) => t.id === s);
            return (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-serif">
                {target?.emoji} {target?.label ?? s}
              </span>
            );
          })}
        </div>
      )}

      {node.url && (
        <a
          href={node.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline font-serif"
        >
          <ExternalLink className="w-3 h-3" />
          Visit
        </a>
      )}
    </motion.div>
  );
}

// ─── Underground texture ───
function UndergroundLayer() {
  return (
    <g>
      {/* Ground line */}
      <line x1={0} y1={MYCELIUM_Y - 60} x2={SVG_W} y2={MYCELIUM_Y - 60} stroke="hsl(42, 30%, 25%)" strokeWidth={1.5} opacity={0.3} />
      {/* Underground gradient */}
      <defs>
        <linearGradient id="underground-grad" x1="0" y1={MYCELIUM_Y - 60} x2="0" y2={SVG_H} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(270, 15%, 8%)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="hsl(270, 20%, 5%)" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      <rect x={0} y={MYCELIUM_Y - 60} width={SVG_W} height={SVG_H - MYCELIUM_Y + 60} fill="url(#underground-grad)" />

      {/* Mycelium label */}
      <text x={TREE_CX} y={MYCELIUM_Y - 75} textAnchor="middle" fontSize={10} fill="hsl(270, 25%, 45%)" fontFamily="serif" opacity={0.6}>
        ── Mycelium Network ──
      </text>
    </g>
  );
}

// ─── Ambient particles ───
function AmbientParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      cx: 100 + Math.random() * (SVG_W - 200),
      cy: 100 + Math.random() * (MYCELIUM_Y - 200),
      r: 1 + Math.random() * 2,
      dur: 8 + Math.random() * 12,
      delay: Math.random() * 6,
    })),
  []);

  return (
    <g>
      {particles.map((p) => (
        <circle key={p.id} cx={p.cx} cy={p.cy} r={p.r} fill="hsl(42, 60%, 55%)" opacity={0}>
          <animate attributeName="opacity" values="0;0.25;0" dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite" />
          <animate attributeName="cy" values={`${p.cy};${p.cy - 30};${p.cy}`} dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );
}

// ─── Main component ───
export default function TetolEcosystemMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const allNodes = useMemo(() => getAllNodes(), []);
  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    allNodes.forEach((n) => {
      map[n.id] = nodePos(n);
    });
    return map;
  }, [allNodes]);

  const selectedNode = selected ? allNodes.find((n) => n.id === selected) : null;

  // Connected node IDs for highlighting
  const connectedIds = useMemo(() => {
    if (!selected) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selected);
    CONNECTIONS.forEach((c) => {
      if (c.from === selected) ids.add(c.to);
      if (c.to === selected) ids.add(c.from);
    });
    // Orbit support links
    const node = allNodes.find((n) => n.id === selected);
    if (node?.supports) node.supports.forEach((s) => ids.add(s));
    // Reverse: if selected is a tree node, find orbits that support it
    if (node?.type === "tree") {
      ORBIT_NODES.forEach((o) => {
        if (o.supports?.includes(selected)) ids.add(o.id);
      });
    }
    return ids;
  }, [selected, allNodes]);

  // Orbit support connections (dynamic)
  const orbitLinks = useMemo(() => {
    const links: EcoConnection[] = [];
    ORBIT_NODES.forEach((o) => {
      o.supports?.forEach((s) => {
        links.push({ from: o.id, to: s, type: "orbit-link" });
      });
    });
    return links;
  }, []);

  const allConnections = useMemo(() => [...CONNECTIONS, ...orbitLinks], [orbitLinks]);

  // Pan/zoom handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x) / zoom,
      y: dragStart.current.panY + (e.clientY - dragStart.current.y) / zoom,
    });
  }, [dragging, zoom]);

  const handlePointerUp = useCallback(() => setDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(2.5, z - e.deltaY * 0.001)));
  }, []);

  // SEO
  useEffect(() => {
    document.title = "TETOL Ecosystem Map — S33D.life";
  }, []);

  return (
    <div className="relative w-full h-[100dvh] bg-background overflow-hidden" ref={containerRef}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="w-10 h-10 rounded-xl bg-card/80 border border-border/30 backdrop-blur-md flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
          className="w-10 h-10 rounded-xl bg-card/80 border border-border/30 backdrop-blur-md flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-10 h-10 rounded-xl bg-card/80 border border-border/30 backdrop-blur-md flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors text-[10px] font-serif"
          aria-label="Reset view"
        >
          1:1
        </button>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 className="text-lg sm:text-xl font-serif text-foreground tracking-wide">
          🌳 TETOL Living Ecosystem Map
        </h1>
        <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-serif mt-0.5">
          The Ethereal Tree of Life — tap any node to explore
        </p>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex flex-col gap-1 rounded-xl border border-border/20 bg-card/70 backdrop-blur-md p-3">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-serif mb-1">Legend</span>
        {[
          { emoji: "🌳", label: "Core Tree", color: "hsl(42, 60%, 50%)" },
          { emoji: "🍄", label: "Mycelium Partners", color: "hsl(270, 40%, 50%)" },
          { emoji: "💡", label: "Community", color: "hsl(42, 55%, 55%)" },
          ...ORBIT_RINGS.map((r) => ({ emoji: "○", label: r.label, color: r.color })),
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            <span className="text-[10px] text-muted-foreground/70 font-serif">{item.label}</span>
          </div>
        ))}
      </div>

      {/* SVG canvas */}
      <div
        className="w-full h-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: "center center",
          }}
        >
          {/* Underground */}
          <UndergroundLayer />

          {/* Ambient particles */}
          <AmbientParticles />

          {/* Orbit ring ellipses */}
          {ORBIT_RINGS.map((ring) => (
            <OrbitRingEllipse key={ring.id} ring={ring} />
          ))}

          {/* Orbit ring labels */}
          {ORBIT_RINGS.map((ring) => (
            <text
              key={`label-${ring.id}`}
              x={TREE_CX + ring.radius + 8}
              y={ORBIT_CY - 6}
              fontSize={8}
              fill={ring.color}
              opacity={0.4}
              fontFamily="serif"
            >
              {ring.label}
            </text>
          ))}

          {/* Connections */}
          {allConnections.map((conn, i) => {
            const isHighlighted = connectedIds.has(conn.from) && connectedIds.has(conn.to);
            return (
              <ConnectionLine
                key={`${conn.from}-${conn.to}-${i}`}
                conn={conn}
                positions={positions}
                highlighted={selected ? isHighlighted : false}
              />
            );
          })}

          {/* Nodes */}
          {allNodes.map((node) => {
            const pos = positions[node.id];
            const isSelected = selected === node.id;
            const isHighlighted = connectedIds.has(node.id);
            const isDimmed = !!selected && !isHighlighted;
            return (
              <EcoNodeCircle
                key={node.id}
                node={node}
                pos={pos}
                selected={isSelected}
                highlighted={!isSelected && isHighlighted}
                dimmed={isDimmed}
                onSelect={setSelected}
              />
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <DetailPanel node={selectedNode} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      {/* Back button */}
      <div className="absolute bottom-4 left-4 z-10">
        <a
          href="/library"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card/80 border border-border/30 backdrop-blur-md text-xs font-serif text-muted-foreground hover:text-foreground transition-colors min-h-[40px]"
        >
          ← Heartwood
        </a>
      </div>
    </div>
  );
}
