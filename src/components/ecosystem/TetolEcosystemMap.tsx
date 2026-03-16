import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import EcosystemPulseOverlay from "@/components/ecosystem/EcosystemPulseOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ZoomIn, ZoomOut, Shield, ShieldAlert, ShieldCheck, Zap, ZapOff } from "lucide-react";
import {
  TREE_NODES, PARTNER_NODES, ORBIT_NODES, COMMUNITY_NODE, ALTERNATIVE_NODES, PROPOSAL_NODES,
  CONNECTIONS, RESILIENCE_CONNECTIONS, PROPOSAL_CONNECTIONS, ORBIT_RINGS, getAllNodes,
  DEPENDENCY_COLORS, DEPENDENCY_LABELS,
  SOVEREIGNTY_LABELS, SOVEREIGNTY_COLORS, PROPOSAL_CATEGORIES,
  type EcoNode, type EcoConnection, type OrbitRing, type DependencyLevel, type SovereigntyScore,
} from "@/data/ecosystemMapData";

// ─── Layout constants ───
const SVG_W = 1200;
const SVG_H = 1500;
const TREE_CX = SVG_W / 2;
const TREE_TOP = 180;
const TREE_LAYER_GAP = 140;
const MYCELIUM_Y = TREE_TOP + 3 * TREE_LAYER_GAP + 120;
const RESILIENCE_Y = MYCELIUM_Y + 120;
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

/** Position proposal nodes around the community node */
function proposalPos(index: number, total: number) {
  const baseAngle = -Math.PI * 0.6;
  const spread = Math.PI * 0.8;
  const angle = baseAngle + (total > 1 ? (spread / (total - 1)) * index : 0);
  const dist = 80;
  return {
    x: COMMUNITY_X + Math.cos(angle) * dist,
    y: COMMUNITY_Y + Math.sin(angle) * dist,
  };
}

function nodePos(node: EcoNode, positions?: Record<string, { x: number; y: number }>): { x: number; y: number } {
  if (node.type === "tree") return treePos(node.treeLayer ?? 0);
  if (node.type === "partner") return partnerPos(node.partnerOrder ?? 0, PARTNER_NODES.length);
  if (node.type === "orbit") return orbitPos(node.orbit!, node.orbitAngle ?? 0);
  if (node.id === "community-proposals") return { x: COMMUNITY_X, y: COMMUNITY_Y };
  if (node.type === "proposal") {
    const idx = PROPOSAL_NODES.findIndex((p) => p.id === node.id);
    return proposalPos(idx, PROPOSAL_NODES.length);
  }
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

// ─── Sovereignty ring (arc meter around node) ───
function SovereigntyMeter({ cx, cy, r, score }: { cx: number; cy: number; r: number; score: SovereigntyScore }) {
  const color = SOVEREIGNTY_COLORS[score];
  const circumference = 2 * Math.PI * (r + 7);
  const filledFraction = score / 5;
  const dashLen = circumference * filledFraction;
  const gapLen = circumference * (1 - filledFraction);

  return (
    <g>
      {/* Background track */}
      <circle cx={cx} cy={cy} r={r + 7} fill="none" stroke="hsl(0, 0%, 25%)" strokeWidth={2} opacity={0.2} />
      {/* Filled arc */}
      <circle
        cx={cx} cy={cy} r={r + 7}
        fill="none" stroke={color} strokeWidth={2.5} opacity={0.7}
        strokeDasharray={`${dashLen} ${gapLen}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
      />
      {/* Score label */}
      <text
        x={cx + r + 12} y={cy - r + 2}
        fontSize={7} fill={color} fontFamily="serif" opacity={0.8}
      >
        {score}/5
      </text>
    </g>
  );
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

// ─── Failure X marker ───
function FailureMarker({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const s = r * 0.45;
  return (
    <g opacity={0.9}>
      <circle cx={cx} cy={cy} r={r + 2} fill="hsl(0, 50%, 15%)" fillOpacity={0.6} stroke="hsl(0, 60%, 45%)" strokeWidth={1.5} />
      <line x1={cx - s} y1={cy - s} x2={cx + s} y2={cy + s} stroke="hsl(0, 65%, 55%)" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + s} y1={cy - s} x2={cx - s} y2={cy + s} stroke="hsl(0, 65%, 55%)" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="hsl(0, 60%, 45%)" strokeWidth={1} opacity={0.4}>
        <animate attributeName="r" values={`${r + 4};${r + 10};${r + 4}`} dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

// ─── Node component ───
function EcoNodeCircle({
  node, pos, selected, highlighted, dimmed, disabled, onSelect, resilienceMode, showSovereignty, failureSimMode,
}: {
  node: EcoNode;
  pos: { x: number; y: number };
  selected: boolean;
  highlighted: boolean;
  dimmed: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
  resilienceMode: boolean;
  showSovereignty: boolean;
  failureSimMode: boolean;
}) {
  const isTree = node.type === "tree";
  const isPartner = node.type === "partner";
  const isCommunity = node.type === "community";
  const isAlt = node.type === "alternative";
  const isProposal = node.type === "proposal";
  const r = isTree ? 38 : isCommunity ? 34 : isPartner ? 28 : isAlt ? 18 : isProposal ? 16 : 24;

  const orbitMeta = node.orbit ? ORBIT_RINGS.find((o) => o.id === node.orbit) : null;

  const fillColor = isProposal
    ? "hsl(42, 30%, 14%)"
    : isAlt
    ? "hsl(160, 20%, 12%)"
    : isTree
    ? "hsl(42, 45%, 18%)"
    : isPartner
    ? "hsl(270, 25%, 16%)"
    : isCommunity
    ? "hsl(42, 50%, 20%)"
    : "hsl(220, 20%, 14%)";

  const strokeColor = isProposal
    ? "hsl(42, 40%, 40%)"
    : isAlt
    ? "hsl(160, 40%, 45%)"
    : isTree
    ? "hsl(42, 60%, 50%)"
    : isPartner
    ? "hsl(270, 40%, 50%)"
    : isCommunity
    ? "hsl(42, 55%, 55%)"
    : orbitMeta?.color ?? "hsl(200, 30%, 45%)";

  const showDepBadge = resilienceMode && node.dependencyLevel && (node.type === "orbit" || node.type === "partner");
  const showSovMeter = showSovereignty && node.sovereigntyScore !== undefined && !isTree;

  return (
    <motion.g
      className="cursor-pointer"
      onClick={() => onSelect(node.id)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: disabled ? 0.15 : dimmed ? 0.2 : 1,
        scale: selected ? 1.15 : highlighted ? 1.08 : 1,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: Math.random() * 0.4 }}
      whileHover={{ scale: disabled ? 1 : 1.12 }}
    >
      {/* Dependency badge */}
      {showDepBadge && !disabled && <DependencyBadge cx={pos.x} cy={pos.y} r={r} level={node.dependencyLevel!} />}

      {/* Sovereignty meter */}
      {showSovMeter && !disabled && <SovereigntyMeter cx={pos.x} cy={pos.y} r={r} score={node.sovereigntyScore!} />}

      {/* Glow */}
      {(selected || highlighted) && !disabled && (
        <circle cx={pos.x} cy={pos.y} r={r + 12} fill="none" stroke={strokeColor} strokeWidth={1.5} opacity={0.3}>
          <animate attributeName="r" values={`${r + 10};${r + 16};${r + 10}`} dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.15;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Background */}
      <circle
        cx={pos.x} cy={pos.y} r={r}
        fill={fillColor} stroke={strokeColor}
        strokeWidth={selected ? 2.5 : isAlt || isProposal ? 1 : 1.5}
        strokeDasharray={isAlt ? "4 2" : isProposal ? "3 2" : undefined}
      />

      {/* Emoji */}
      <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={isAlt || isProposal ? 12 : isTree ? 22 : 18} className="select-none pointer-events-none">
        {node.emoji}
      </text>

      {/* Label */}
      <text
        x={pos.x}
        y={pos.y + r + (isAlt || isProposal ? 10 : 14)}
        textAnchor="middle"
        fontSize={isAlt || isProposal ? 7.5 : isTree ? 11 : 9.5}
        fill={isProposal ? "hsl(42, 35%, 55%)" : isAlt ? "hsl(160, 30%, 55%)" : "hsl(42, 30%, 72%)"}
        fontFamily="serif"
        fontStyle={isAlt || isProposal ? "italic" : undefined}
        className="select-none pointer-events-none"
      >
        {node.label}
      </text>

      {/* Failure X overlay */}
      {disabled && <FailureMarker cx={pos.x} cy={pos.y} r={r} />}
    </motion.g>
  );
}

// ─── Connection line ───
function ConnectionLine({
  conn, positions, highlighted, anyDisabled,
}: {
  conn: EcoConnection;
  positions: Record<string, { x: number; y: number }>;
  highlighted: boolean;
  anyDisabled?: boolean;
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
      animate={{
        pathLength: 1,
        opacity: anyDisabled ? 0.1 : highlighted ? 0.9 : isResilience ? 0.5 : isProposal ? 0.3 : 0.4,
      }}
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
function DetailPanel({ node, onClose, resilienceMode, failureSimMode, disabledNodes, onToggleDisable, allNodes, onSelect }: {
  node: EcoNode;
  onClose: () => void;
  resilienceMode: boolean;
  failureSimMode: boolean;
  disabledNodes: Set<string>;
  onToggleDisable: (id: string) => void;
  allNodes: EcoNode[];
  onSelect: (id: string) => void;
}) {
  const orbitMeta = node.orbit ? ORBIT_RINGS.find((o) => o.id === node.orbit) : null;
  const depLevel = node.dependencyLevel;
  const sovScore = node.sovereigntyScore;
  const altNodes = node.alternatives
    ? node.alternatives.map((id) => allNodes.find((n) => n.id === id)).filter(Boolean) as EcoNode[]
    : [];
  const primaryNode = node.alternativeFor ? allNodes.find((n) => n.id === node.alternativeFor) : null;
  const isDisabled = disabledNodes.has(node.id);
  const canDisable = failureSimMode && (node.type === "orbit" || node.type === "partner");
  const proposalCat = node.proposalCategory
    ? PROPOSAL_CATEGORIES.find((c) => c.id === node.proposalCategory)
    : null;

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
                : node.type === "proposal"
                ? "Proposal"
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
            {isDisabled && (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-serif border border-destructive/40 bg-destructive/10 text-destructive">
                Disabled
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{node.description}</p>

      {/* Sovereignty score */}
      {sovScore !== undefined && (
        <div className="mt-3 p-2.5 rounded-lg border border-border/20 bg-muted/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-serif text-muted-foreground">Sovereignty</span>
            <span className="text-[10px] font-serif" style={{ color: SOVEREIGNTY_COLORS[sovScore] }}>
              {SOVEREIGNTY_LABELS[sovScore]}
            </span>
          </div>
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as SovereigntyScore[]).map((s) => (
              <div
                key={s}
                className="flex-1 h-2 rounded-full transition-colors"
                style={{
                  background: s <= sovScore ? SOVEREIGNTY_COLORS[sovScore] : "hsl(0, 0%, 20%)",
                  opacity: s <= sovScore ? 0.8 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      )}

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

      {/* Proposal category badge */}
      {proposalCat && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-sm">{proposalCat.emoji}</span>
          <span className="text-[10px] font-serif text-muted-foreground/80 italic">{proposalCat.label}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary/70 font-serif ml-auto">
            Provisional
          </span>
        </div>
      )}

      {/* Failure simulation button */}
      {canDisable && (
        <button
          onClick={() => onToggleDisable(node.id)}
          className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-serif transition-colors min-h-[40px] ${
            isDisabled
              ? "border-[hsl(160,40%,35%)] bg-[hsl(160,30%,12%)] text-[hsl(160,50%,60%)] hover:bg-[hsl(160,30%,16%)]"
              : "border-destructive/30 bg-destructive/5 text-destructive/80 hover:bg-destructive/10"
          }`}
        >
          {isDisabled ? (
            <>
              <Zap className="w-3.5 h-3.5" />
              Restore this node
            </>
          ) : (
            <>
              <ZapOff className="w-3.5 h-3.5" />
              Simulate failure
            </>
          )}
        </button>
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
          <span className="text-[10px] text-muted-foreground/60 font-serif">
            {isDisabled ? "🔄 Rerouting to:" : "Alternatives:"}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {altNodes.map((alt) => (
              <button
                key={alt.id}
                onClick={() => onSelect(alt.id)}
                className={`text-[10px] px-2 py-1 rounded-full border font-serif transition-colors hover:bg-muted/50 cursor-pointer ${
                  isDisabled ? "border-[hsl(160,50%,40%)] text-[hsl(160,50%,60%)] bg-[hsl(160,30%,10%)]" : ""
                }`}
                style={isDisabled ? undefined : { color: "hsl(160, 40%, 55%)", borderColor: "hsl(160, 30%, 30%)" }}
              >
                {alt.emoji} {alt.label}
                {alt.sovereigntyScore !== undefined && (
                  <span className="ml-1 opacity-60">({alt.sovereigntyScore}/5)</span>
                )}
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
      <text x={TREE_CX} y={RESILIENCE_Y - 20} textAnchor="middle" fontSize={9} fill="hsl(160, 30%, 40%)" fontFamily="serif" opacity={0.4}>
        ── Resilience Roots ──
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

// ─── Resilience reroute indicator ───
function RerouteIndicator({ fromPos, toPos }: { fromPos: { x: number; y: number }; toPos: { x: number; y: number } }) {
  const mx = (fromPos.x + toPos.x) / 2;
  const my = (fromPos.y + toPos.y) / 2 - 15;
  const d = `M${fromPos.x},${fromPos.y} Q${mx},${my} ${toPos.x},${toPos.y}`;

  return (
    <motion.path
      d={d}
      fill="none"
      stroke="hsl(160, 55%, 50%)"
      strokeWidth={2}
      strokeDasharray="6 3"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.8 }}
      transition={{ duration: 0.8 }}
    >
      <animate attributeName="stroke-dashoffset" values="0;-18" dur="1.5s" repeatCount="indefinite" />
    </motion.path>
  );
}

// ─── Main component ───
export default function TetolEcosystemMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [resilienceMode, setResilienceMode] = useState(false);
  const [failureSimMode, setFailureSimMode] = useState(false);
  const [disabledNodes, setDisabledNodes] = useState<Set<string>>(new Set());
  const [showSovereignty, setShowSovereignty] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Enabling failure sim also enables resilience
  useEffect(() => {
    if (failureSimMode && !resilienceMode) setResilienceMode(true);
  }, [failureSimMode, resilienceMode]);

  // Clearing failure sim clears disabled nodes
  const toggleFailureSim = useCallback(() => {
    setFailureSimMode((v) => {
      if (v) setDisabledNodes(new Set());
      return !v;
    });
  }, []);

  const toggleDisableNode = useCallback((id: string) => {
    setDisabledNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allNodes = useMemo(
    () => getAllNodes(resilienceMode, resilienceMode),
    [resilienceMode]
  );

  // Two-pass position calculation
  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    allNodes.filter((n) => n.type !== "alternative" && n.type !== "proposal").forEach((n) => {
      map[n.id] = nodePos(n);
    });
    allNodes.filter((n) => n.type === "proposal").forEach((n) => {
      map[n.id] = nodePos(n, map);
    });
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

    const allConns = resilienceMode
      ? [...CONNECTIONS, ...RESILIENCE_CONNECTIONS, ...PROPOSAL_CONNECTIONS]
      : CONNECTIONS;
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
    if (resilienceMode) return [...base, ...RESILIENCE_CONNECTIONS, ...PROPOSAL_CONNECTIONS];
    return base;
  }, [orbitLinks, resilienceMode]);

  // Active reroute paths (disabled node → its alternatives)
  const reroutePaths = useMemo(() => {
    if (!failureSimMode || disabledNodes.size === 0) return [];
    const paths: { from: string; to: string }[] = [];
    disabledNodes.forEach((id) => {
      const node = allNodes.find((n) => n.id === id);
      if (node?.alternatives) {
        node.alternatives.forEach((altId) => {
          if (!disabledNodes.has(altId)) paths.push({ from: id, to: altId });
        });
      }
    });
    return paths;
  }, [failureSimMode, disabledNodes, allNodes]);

  // Single points of failure
  const singlePointIds = useMemo(() => {
    if (!resilienceMode) return new Set<string>();
    return new Set(
      ORBIT_NODES
        .filter((n) => n.dependencyLevel === "core" && (!n.alternatives || n.alternatives.length === 0))
        .map((n) => n.id)
    );
  }, [resilienceMode]);

  // True SPOF: disabled core nodes with no available alternatives
  const trueSPOFIds = useMemo(() => {
    if (!failureSimMode || disabledNodes.size === 0) return new Set<string>();
    const spofs = new Set<string>();
    disabledNodes.forEach((id) => {
      const node = allNodes.find((n) => n.id === id);
      if (!node) return;
      const hasAvailableAlt = node.alternatives?.some((a) => !disabledNodes.has(a)) ?? false;
      if (!hasAvailableAlt) spofs.add(id);
    });
    return spofs;
  }, [failureSimMode, disabledNodes, allNodes]);

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

  const subtitleText = failureSimMode
    ? `⚡ Failure Simulation — ${disabledNodes.size} node${disabledNodes.size !== 1 ? "s" : ""} disabled${trueSPOFIds.size > 0 ? ` · ${trueSPOFIds.size} true SPOF` : ""}`
    : resilienceMode
    ? "🛡️ Resilience Mode — showing dependency levels and alternative paths"
    : showSovereignty
    ? "🏛️ Sovereignty View — showing decentralisation scores"
    : "The Ethereal Tree of Life — tap any node to explore";

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

        {/* Sovereignty Toggle */}
        <button
          onClick={() => setShowSovereignty((v) => !v)}
          className={`w-10 h-10 rounded-xl border backdrop-blur-md flex items-center justify-center transition-colors text-sm ${
            showSovereignty
              ? "bg-[hsl(42,40%,18%)] border-[hsl(42,50%,35%)] text-[hsl(42,60%,60%)]"
              : "bg-card/80 border-border/30 text-foreground/70 hover:text-foreground"
          }`}
          aria-label="Toggle sovereignty view"
          title="Sovereignty Meter"
        >
          🏛️
        </button>

        {/* Failure Simulation Toggle */}
        <button
          onClick={toggleFailureSim}
          className={`w-10 h-10 rounded-xl border backdrop-blur-md flex items-center justify-center transition-colors ${
            failureSimMode
              ? "bg-[hsl(0,40%,18%)] border-[hsl(0,50%,35%)] text-[hsl(0,60%,60%)]"
              : "bg-card/80 border-border/30 text-foreground/70 hover:text-foreground"
          }`}
          aria-label="Toggle failure simulation"
          title="Failure Simulation"
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 className="text-lg sm:text-xl font-serif text-foreground tracking-wide">
          🌳 TETOL Living Ecosystem Map
        </h1>
        <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-serif mt-0.5">
          {subtitleText}
        </p>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex flex-col gap-1 rounded-xl border border-border/20 bg-card/70 backdrop-blur-md p-3 max-h-[85vh] overflow-y-auto">
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
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full border border-dashed" style={{ borderColor: "hsl(42, 40%, 40%)" }} />
                  <span className="text-[10px] text-muted-foreground/70 font-serif italic">Proposal</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sovereignty legend */}
        <AnimatePresence>
          {showSovereignty && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/20 mt-1.5 pt-1.5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-serif">Sovereignty</span>
                {([5, 4, 3, 2, 1] as SovereigntyScore[]).map((s) => (
                  <div key={s} className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: SOVEREIGNTY_COLORS[s] }} />
                    <span className="text-[10px] text-muted-foreground/70 font-serif">{s} — {SOVEREIGNTY_LABELS[s]}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Failure sim legend */}
        <AnimatePresence>
          {failureSimMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/20 mt-1.5 pt-1.5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-serif">Simulation</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px]">✕</span>
                  <span className="text-[10px] text-muted-foreground/70 font-serif">Disabled node</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "hsl(160, 55%, 50%)" }} />
                  <span className="text-[10px] text-muted-foreground/70 font-serif">Active reroute</span>
                </div>
                <p className="text-[9px] text-muted-foreground/50 font-serif mt-1 italic">
                  Click infrastructure nodes to disable
                </p>
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
            const isDisabledConn = disabledNodes.has(conn.from) || disabledNodes.has(conn.to);
            return (
              <ConnectionLine
                key={`${conn.from}-${conn.to}-${i}`}
                conn={conn}
                positions={positions}
                highlighted={selected ? isHighlighted : false}
                anyDisabled={isDisabledConn}
              />
            );
          })}

          {/* Active reroute paths */}
          {reroutePaths.map((rp) => {
            const fromPos = positions[rp.from];
            const toPos = positions[rp.to];
            if (!fromPos || !toPos) return null;
            return <RerouteIndicator key={`reroute-${rp.from}-${rp.to}`} fromPos={fromPos} toPos={toPos} />;
          })}

          {/* Nodes */}
          {allNodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const isSelected = selected === node.id;
            const isHighlighted = connectedIds.has(node.id);
            const isDimmed = !!selected && !isHighlighted;
            const isDisabled = disabledNodes.has(node.id);
            return (
              <EcoNodeCircle
                key={node.id}
                node={node}
                pos={pos}
                selected={isSelected}
                highlighted={!isSelected && isHighlighted}
                dimmed={isDimmed}
                disabled={isDisabled}
                onSelect={setSelected}
                resilienceMode={resilienceMode}
                showSovereignty={showSovereignty}
                failureSimMode={failureSimMode}
              />
            );
          })}

          {/* Live activity pulse counters */}
          <EcosystemPulseOverlay positions={positions} />

          {/* Single-point-of-failure warning markers */}
          {resilienceMode && !failureSimMode && Array.from(singlePointIds).map((id) => {
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

          {/* True SPOF markers in failure sim */}
          {failureSimMode && Array.from(trueSPOFIds).map((id) => {
            const pos = positions[id];
            if (!pos) return null;
            return (
              <g key={`true-spof-${id}`}>
                <circle cx={pos.x} cy={pos.y} r={50} fill="none" stroke="hsl(0, 70%, 50%)" strokeWidth={2} opacity={0.6}>
                  <animate attributeName="r" values="48;55;48" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <text x={pos.x} y={pos.y - 42} textAnchor="middle" fontSize={9} fill="hsl(0, 70%, 60%)" fontFamily="serif" fontWeight="bold" opacity={0.9}>
                  ⚠ TRUE SPOF
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
            failureSimMode={failureSimMode}
            disabledNodes={disabledNodes}
            onToggleDisable={toggleDisableNode}
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
