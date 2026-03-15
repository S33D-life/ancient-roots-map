import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import EcosystemPulseOverlay from "@/components/ecosystem/EcosystemPulseOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ZoomIn, ZoomOut, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  TREE_NODES, PARTNER_NODES, ORBIT_NODES, COMMUNITY_NODE, ALTERNATIVE_NODES,
  CONNECTIONS, RESILIENCE_CONNECTIONS, ORBIT_RINGS, getAllNodes,
  DEPENDENCY_COLORS, DEPENDENCY_LABELS,
  type EcoNode, type EcoConnection, type OrbitRing, type DependencyLevel,
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
    y: ORBIT_CY + meta.radius * Math.sin(rad) * 0.55,
  };
}

/** Position alternative nodes near their primary node, offset outward */
function alternativePos(altNode: EcoNode, primaryPos: { x: number; y: number }, altIndex: number, altTotal: number) {
  const baseAngle = Math.atan2(primaryPos.y - ORBIT_CY, primaryPos.x - TREE_CX);
  const spreadAngle = 0.35;
  const startAngle = baseAngle - (spreadAngle * (altTotal - 1)) / 2;
  const angle = startAngle + altIndex * spreadAngle;
  const dist = 65;
  return {
    x: primaryPos.x + Math.cos(angle) * dist,
    y: primaryPos.y + Math.sin(angle) * dist,
  };
}

function nodePos(node: EcoNode, positions?: Record<string, { x: number; y: number }>): { x: number; y: number } {
  if (node.type === "tree") return treePos(node.treeLayer ?? 0);
  if (node.type === "partner") return partnerPos(node.partnerOrder ?? 0, PARTNER_NODES.length);
  if (node.type === "orbit") return orbitPos(node.orbit!, node.orbitAngle ?? 0);
  if (node.id === "community-proposals") return { x: COMMUNITY_X, y: COMMUNITY_Y };
  if (node.type === "alternative" && node.alternativeFor && positions) {
    const primaryPos = positions[node.alternativeFor];
    if (primaryPos) {
      const siblings = ALTERNATIVE_NODES.filter((a) => a.alternativeFor === node.alternativeFor);
      const idx = siblings.findIndex((a) => a.id === node.id);
      return alternativePos(node, primaryPos, idx, siblings.length);
    }
  }
  return { x: TREE_CX, y: ORBIT_CY };
}

// ─── Path generators ───
function myceliumPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const mx = (from.x + to.x) / 2 + (Math.random() - 0.5) * 60;
  const my = (from.y + to.y) / 2 + 30 + Math.random() * 30;
  return `M${from.x},${from.y} Q${mx},${my} ${to.x},${to.y}`;
}

function trunkPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const cx = from.x + (Math.random() - 0.5) * 12;
  return `M${from.x},${from.y} C${cx},${from.y + 40} ${cx},${to.y - 40} ${to.x},${to.y}`;
}

function orbitLinkPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx = from.x + dx * 0.5 - dy * 0.15;
  const cy = from.y + dy * 0.5 + dx * 0.08;
  return `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`;
}

// ─── Dependency badge (small ring around node) ───
function DependencyBadge({ cx, cy, r, level }: { cx: number; cy: number; r: number; level: DependencyLevel }) {
  const color = DEPENDENCY_COLORS[level];
  return (
    <circle
      cx={cx} cy={cy} r={r + 4}
      fill="none" stroke={color} strokeWidth={2}
      strokeDasharray={level === "core" ? undefined : level === "important" ? "6 3" : "3 3"}
      opacity={0.7}
    />
  );
}

// ─── Node component ───
function EcoNodeCircle({
  node, pos, selected, highlighted, dimmed, onSelect, resilienceMode,
}: {
  node: EcoNode;
  pos: { x: number; y: number };
  selected: boolean;
  highlighted: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
  resilienceMode: boolean;
}) {
  const isTree = node.type === "tree";
  const isPartner = node.type === "partner";
  const isCommunity = node.type === "community";
  const isAlt = node.type === "alternative";
  const r = isTree ? 38 : isCommunity ? 34 : isPartner ? 28 : isAlt ? 18 : 24;

  const orbitMeta = node.orbit ? ORBIT_RINGS.find((o) => o.id === node.orbit) : null;

  const fillColor = isAlt
    ? "hsl(160, 20%, 12%)"
    : isTree
    ? "hsl(42, 45%, 18%)"
    : isPartner
    ? "hsl(270, 25%, 16%)"
    : isCommunity
    ? "hsl(42, 50%, 20%)"
    : "hsl(220, 20%, 14%)";

  const strokeColor = isAlt
    ? "hsl(160, 40%, 45%)"
    : isTree
    ? "hsl(42, 60%, 50%)"
    : isPartner
    ? "hsl(270, 40%, 50%)"
    : isCommunity
    ? "hsl(42, 55%, 55%)"
    : orbitMeta?.color ?? "hsl(200, 30%, 45%)";

  const showDepBadge = resilienceMode && node.dependencyLevel && node.type === "orbit";

  return (
    <motion.g
      className="cursor-pointer"
      onClick={() => onSelect(node.id)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: dimmed ? 0.2 : 1,
        scale: selected ? 1.15 : highlighted ? 1.08 : 1,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: Math.random() * 0.4 }}
      whileHover={{ scale: 1.12 }}
    >
      {/* Dependency badge */}
      {showDepBadge && <DependencyBadge cx={pos.x} cy={pos.y} r={r} level={node.dependencyLevel!} />}

      {/* Glow */}
      {(selected || highlighted) && (
        <circle cx={pos.x} cy={pos.y} r={r + 12} fill="none" stroke={strokeColor} strokeWidth={1.5} opacity={0.3}>
          <animate attributeName="r" values={`${r + 10};${r + 16};${r + 10}`} dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.15;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Background */}
      <circle
        cx={pos.x} cy={pos.y} r={r}
        fill={fillColor} stroke={strokeColor}
        strokeWidth={selected ? 2.5 : isAlt ? 1 : 1.5}
        strokeDasharray={isAlt ? "4 2" : undefined}
      />

      {/* Emoji */}
      <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={isAlt ? 12 : isTree ? 22 : 18} className="select-none pointer-events-none">
        {node.emoji}
      </text>

      {/* Label */}
      <text
        x={pos.x}
        y={pos.y + r + (isAlt ? 10 : 14)}
        textAnchor="middle"
        fontSize={isAlt ? 7.5 : isTree ? 11 : 9.5}
        fill={isAlt ? "hsl(160, 30%, 55%)" : "hsl(42, 30%, 72%)"}
        fontFamily="serif"
        fontStyle={isAlt ? "italic" : undefined}
        className="select-none pointer-events-none"
      >
        {node.label}
      </text>
    </motion.g>
  );
}

// ─── Connection line ───
function ConnectionLine({
  conn, positions, highlighted,
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
  const isResilience = conn.type === "resilience";

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
    : isResilience
    ? "hsl(160, 50%, 45%)"
    : "hsl(200, 30%, 35%)";

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={isTrunk ? 3 : isMycelium ? 1.8 : isResilience ? 1.2 : 1.2}
      strokeDasharray={isMycelium ? "6 4" : isProposal ? "4 3" : isResilience ? "3 2" : undefined}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: highlighted ? 0.9 : isResilience ? 0.5 : 0.4 }}
      transition={{ duration: 1.2, delay: Math.random() * 0.5 }}
    />
  );
}

// ─── Orbit ring ───
function OrbitRingEllipse({ ring }: { ring: typeof ORBIT_RINGS[number] }) {
  return (
    <ellipse
      cx={TREE_CX} cy={ORBIT_CY} rx={ring.radius} ry={ring.radius * 0.55}
      fill="none" stroke={ring.color} strokeWidth={0.6} opacity={0.15} strokeDasharray="4 6"
    />
  );
}

// ─── Detail panel ───
function DetailPanel({ node, onClose, resilienceMode, allNodes, onSelect }: {
  node: EcoNode;
  onClose: () => void;
  resilienceMode: boolean;
  allNodes: EcoNode[];
  onSelect: (id: string) => void;
}) {
  const orbitMeta = node.orbit ? ORBIT_RINGS.find((o) => o.id === node.orbit) : null;
  const depLevel = node.dependencyLevel;
  const altNodes = node.alternatives
    ? node.alternatives.map((id) => allNodes.find((n) => n.id === id)).filter(Boolean) as EcoNode[]
    : [];
  const primaryNode = node.alternativeFor ? allNodes.find((n) => n.id === node.alternativeFor) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[380px]
        rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl p-5 shadow-2xl z-20 max-h-[70vh] overflow-y-auto"
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
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-serif">
              {node.type === "tree"
                ? ["Crown", "Canopy", "Trunk", "Roots"][node.treeLayer ?? 0]
                : node.type === "partner"
                ? "Mycelium Partner"
                : node.type === "community"
                ? "Community"
                : node.type === "alternative"
                ? "Alternative"
                : orbitMeta?.label ?? "Infrastructure"}
            </span>
            {depLevel && (
              <span
                className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-serif border"
                style={{
                  color: DEPENDENCY_COLORS[depLevel],
                  borderColor: DEPENDENCY_COLORS[depLevel] + "40",
                  background: DEPENDENCY_COLORS[depLevel] + "10",
                }}
              >
                {depLevel}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{node.description}</p>

      {/* Dependency info */}
      {depLevel && resilienceMode && (
        <div className="mt-3 p-2.5 rounded-lg border border-border/20 bg-muted/30">
          <div className="flex items-center gap-1.5 mb-1">
            {depLevel === "core" ? <ShieldAlert className="w-3.5 h-3.5" style={{ color: DEPENDENCY_COLORS.core }} /> :
             depLevel === "important" ? <Shield className="w-3.5 h-3.5" style={{ color: DEPENDENCY_COLORS.important }} /> :
             <ShieldCheck className="w-3.5 h-3.5" style={{ color: DEPENDENCY_COLORS.optional }} />}
            <span className="text-[10px] font-serif text-muted-foreground">{DEPENDENCY_LABELS[depLevel]}</span>
          </div>
        </div>
      )}

      {/* Supports */}
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

      {/* Alternatives */}
      {altNodes.length > 0 && (
        <div className="mt-3">
          <span className="text-[10px] text-muted-foreground/60 font-serif">Alternatives:</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {altNodes.map((alt) => (
              <button
                key={alt.id}
                onClick={() => onSelect(alt.id)}
                className="text-[10px] px-2 py-1 rounded-full border font-serif transition-colors hover:bg-muted/50 cursor-pointer"
                style={{ color: "hsl(160, 40%, 55%)", borderColor: "hsl(160, 30%, 30%)" }}
              >
                {alt.emoji} {alt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* If this IS an alternative, link back to primary */}
      {primaryNode && (
        <div className="mt-3">
          <span className="text-[10px] text-muted-foreground/60 font-serif">Alternative for:</span>
          <button
            onClick={() => onSelect(primaryNode.id)}
            className="ml-1.5 text-[10px] px-2 py-1 rounded-full border font-serif transition-colors hover:bg-muted/50 cursor-pointer"
            style={{ color: "hsl(42, 60%, 55%)", borderColor: "hsl(42, 40%, 30%)" }}
          >
            {primaryNode.emoji} {primaryNode.label}
          </button>
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
      <line x1={0} y1={MYCELIUM_Y - 60} x2={SVG_W} y2={MYCELIUM_Y - 60} stroke="hsl(42, 30%, 25%)" strokeWidth={1.5} opacity={0.3} />
      <defs>
        <linearGradient id="underground-grad" x1="0" y1={MYCELIUM_Y - 60} x2="0" y2={SVG_H} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(270, 15%, 8%)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="hsl(270, 20%, 5%)" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      <rect x={0} y={MYCELIUM_Y - 60} width={SVG_W} height={SVG_H - MYCELIUM_Y + 60} fill="url(#underground-grad)" />
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
  const [resilienceMode, setResilienceMode] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const allNodes = useMemo(() => getAllNodes(resilienceMode), [resilienceMode]);

  // Two-pass position calculation: first primary nodes, then alternatives
  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    // First pass: non-alternative nodes
    allNodes.filter((n) => n.type !== "alternative").forEach((n) => {
      map[n.id] = nodePos(n);
    });
    // Second pass: alternatives (need primary positions)
    allNodes.filter((n) => n.type === "alternative").forEach((n) => {
      map[n.id] = nodePos(n, map);
    });
    return map;
  }, [allNodes]);

  const selectedNode = selected ? allNodes.find((n) => n.id === selected) : null;

  // Connected node IDs for highlighting
  const connectedIds = useMemo(() => {
    if (!selected) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selected);

    const allConns = resilienceMode ? [...CONNECTIONS, ...RESILIENCE_CONNECTIONS] : CONNECTIONS;
    allConns.forEach((c) => {
      if (c.from === selected) ids.add(c.to);
      if (c.to === selected) ids.add(c.from);
    });

    const node = allNodes.find((n) => n.id === selected);
    if (node?.supports) node.supports.forEach((s) => ids.add(s));
    if (node?.alternatives) node.alternatives.forEach((a) => ids.add(a));
    if (node?.alternativeFor) ids.add(node.alternativeFor);

    if (node?.type === "tree") {
      ORBIT_NODES.forEach((o) => {
        if (o.supports?.includes(selected)) ids.add(o.id);
      });
    }
    return ids;
  }, [selected, allNodes, resilienceMode]);

  // Orbit support connections
  const orbitLinks = useMemo(() => {
    const links: EcoConnection[] = [];
    ORBIT_NODES.forEach((o) => {
      o.supports?.forEach((s) => {
        links.push({ from: o.id, to: s, type: "orbit-link" });
      });
    });
    return links;
  }, []);

  const allConnections = useMemo(() => {
    const base = [...CONNECTIONS, ...orbitLinks];
    return resilienceMode ? [...base, ...RESILIENCE_CONNECTIONS] : base;
  }, [orbitLinks, resilienceMode]);

  // Single points of failure
  const singlePointIds = useMemo(() => {
    if (!resilienceMode) return new Set<string>();
    return new Set(
      ORBIT_NODES
        .filter((n) => n.dependencyLevel === "core" && (!n.alternatives || n.alternatives.length === 0))
        .map((n) => n.id)
    );
  }, [resilienceMode]);

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

        {/* Resilience Mode Toggle */}
        <button
          onClick={() => setResilienceMode((v) => !v)}
          className={`w-10 h-10 rounded-xl border backdrop-blur-md flex items-center justify-center transition-colors ${
            resilienceMode
              ? "bg-[hsl(160,40%,18%)] border-[hsl(160,40%,35%)] text-[hsl(160,50%,60%)]"
              : "bg-card/80 border-border/30 text-foreground/70 hover:text-foreground"
          }`}
          aria-label="Toggle resilience mode"
          title="Resilience Mode"
        >
          <Shield className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 className="text-lg sm:text-xl font-serif text-foreground tracking-wide">
          🌳 TETOL Living Ecosystem Map
        </h1>
        <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-serif mt-0.5">
          {resilienceMode
            ? "🛡️ Resilience Mode — showing dependency levels and alternative paths"
            : "The Ethereal Tree of Life — tap any node to explore"}
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

        {/* Resilience legend items */}
        <AnimatePresence>
          {resilienceMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/20 mt-1.5 pt-1.5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-serif">Dependency</span>
                {(["core", "important", "optional"] as DependencyLevel[]).map((level) => (
                  <div key={level} className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: DEPENDENCY_COLORS[level] }} />
                    <span className="text-[10px] text-muted-foreground/70 font-serif capitalize">{level}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "hsl(160, 40%, 45%)" }} />
                  <span className="text-[10px] text-muted-foreground/70 font-serif italic">Alternative path</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          <UndergroundLayer />
          <AmbientParticles />

          {ORBIT_RINGS.map((ring) => (
            <OrbitRingEllipse key={ring.id} ring={ring} />
          ))}

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
            if (!pos) return null;
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
                resilienceMode={resilienceMode}
              />
            );
          })}

          {/* Live activity pulse counters */}
          <EcosystemPulseOverlay positions={positions} />

          {/* Single-point-of-failure warning markers */}
          {resilienceMode && Array.from(singlePointIds).map((id) => {
            const pos = positions[id];
            if (!pos) return null;
            return (
              <g key={`spof-${id}`}>
                <circle cx={pos.x} cy={pos.y} r={42} fill="none" stroke={DEPENDENCY_COLORS.core} strokeWidth={1} opacity={0.4}>
                  <animate attributeName="r" values="40;46;40" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x={pos.x} y={pos.y - 36} textAnchor="middle" fontSize={8} fill={DEPENDENCY_COLORS.core} fontFamily="serif" opacity={0.7}>
                  ⚠ SPOF
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <DetailPanel
            node={selectedNode}
            onClose={() => setSelected(null)}
            resilienceMode={resilienceMode}
            allNodes={allNodes}
            onSelect={setSelected}
          />
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
