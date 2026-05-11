/**
 * EtherealOfferingTree — SVG ethereal tree with offerings hanging in the
 * branches at positions stored in life_grove_offerings.memory_position_data.
 *
 * - SVG draws the tree (trunk, canopy, branch paths, threads).
 * - Each offering also gets an absolutely-positioned <button> overlay so
 *   it is keyboard reachable and announced to screen readers.
 * - Selected state is lifted: parent decides what to do with the selection
 *   (preview card, scroll-to library entry, etc).
 */
import { useMemo, useRef, useState, useEffect } from "react";
import {
  OFFERING_TYPES,
  TREE_ARCHETYPES,
  type LifeGroveOffering,
  type TreeArchetype,
} from "@/lib/life-groves/types";
import {
  BRANCHES,
  TREE_VIEWBOX,
  branchPath,
  parsePosition,
  pointFor,
  assignOfferingPosition,
  type OfferingPosition,
} from "@/lib/life-groves/positions";
import LifeGroveOfferingGlyph from "./LifeGroveOfferingGlyph";

interface Props {
  archetype: TreeArchetype;
  treeName?: string | null;
  offerings: LifeGroveOffering[];
  selectedId?: string | null;
  onSelect?: (offering: LifeGroveOffering | null) => void;
  /** size in pixels (square). Defaults to 360. */
  size?: number;
}

interface Placed {
  offering: LifeGroveOffering;
  pos: OfferingPosition;
  x: number; // svg coords
  y: number;
}

export default function EtherealOfferingTree({
  archetype,
  treeName,
  offerings,
  selectedId = null,
  onSelect,
  size = 360,
}: Props) {
  const meta =
    TREE_ARCHETYPES.find((a) => a.value === archetype) ?? TREE_ARCHETYPES[0];
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Resolve positions (assign on the fly if missing — kept ephemeral; the
  // server-stored value is authoritative once the row is re-fetched).
  const placed = useMemo<Placed[]>(() => {
    const out: Placed[] = [];
    const filled: LifeGroveOffering[] = [];
    for (const o of offerings) {
      let pos = parsePosition(o.memory_position_data);
      if (!pos) pos = assignOfferingPosition(filled);
      filled.push({ ...o, memory_position_data: pos });
      const { x, y } = pointFor(pos);
      out.push({ offering: o, pos, x, y });
    }
    return out;
  }, [offerings]);

  // Focus the selected glyph button when it changes (keyboard friendliness).
  useEffect(() => {
    if (!selectedId) return;
    const node = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-offering-id="${selectedId}"]`,
    );
    node?.focus({ preventScroll: true });
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto select-none"
      style={{ width: size, height: size, maxWidth: "100%" }}
    >
      {/* halo */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full motion-safe:animate-[lifeGroveBreathe_8s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle at 50% 45%, hsl(${meta.hueA} 60% 60% / 0.32), hsl(${meta.hueB} 35% 25% / 0.06) 60%, transparent 75%)`,
          filter: "blur(10px)",
        }}
      />
      <svg
        viewBox={`0 0 ${TREE_VIEWBOX} ${TREE_VIEWBOX}`}
        width="100%"
        height="100%"
        className="relative"
        role="img"
        aria-label={`Ethereal ${meta.label}${treeName ? ` named ${treeName}` : ""}, holding ${offerings.length} offering${offerings.length === 1 ? "" : "s"}`}
      >
        <defs>
          <radialGradient id={`canopy-${archetype}`} cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor={`hsl(${meta.hueA} 65% 68%)`} stopOpacity="0.6" />
            <stop offset="60%" stopColor={`hsl(${meta.hueA} 50% 38%)`} stopOpacity="0.45" />
            <stop offset="100%" stopColor={`hsl(${meta.hueA} 45% 22%)`} stopOpacity="0.15" />
          </radialGradient>
          <linearGradient id={`trunk-${archetype}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`hsl(${meta.hueB} 35% 28%)`} />
            <stop offset="100%" stopColor={`hsl(${meta.hueB} 30% 16%)`} />
          </linearGradient>
        </defs>

        {/* soft canopy aura */}
        <circle
          cx={TREE_VIEWBOX / 2}
          cy={TREE_VIEWBOX * 0.36}
          r={TREE_VIEWBOX * 0.34}
          fill={`url(#canopy-${archetype})`}
        />

        {/* ground glow */}
        <ellipse
          cx={TREE_VIEWBOX / 2}
          cy={TREE_VIEWBOX * 0.86}
          rx={TREE_VIEWBOX * 0.32}
          ry={TREE_VIEWBOX * 0.04}
          fill={`hsl(${meta.hueA} 40% 30% / 0.35)`}
        />

        {/* trunk */}
        <path
          d={`M ${TREE_VIEWBOX / 2 - 9} ${TREE_VIEWBOX * 0.86}
              C ${TREE_VIEWBOX / 2 - 11} ${TREE_VIEWBOX * 0.66}, ${TREE_VIEWBOX / 2 - 6} ${TREE_VIEWBOX * 0.55}, ${TREE_VIEWBOX / 2 - 4} ${TREE_VIEWBOX * 0.44}
              L ${TREE_VIEWBOX / 2 + 4} ${TREE_VIEWBOX * 0.44}
              C ${TREE_VIEWBOX / 2 + 6} ${TREE_VIEWBOX * 0.55}, ${TREE_VIEWBOX / 2 + 11} ${TREE_VIEWBOX * 0.66}, ${TREE_VIEWBOX / 2 + 9} ${TREE_VIEWBOX * 0.86}
              Z`}
          fill={`url(#trunk-${archetype})`}
        />

        {/* branches */}
        {BRANCHES.map((_, i) => (
          <path
            key={i}
            d={branchPath(i)}
            fill="none"
            stroke={`hsl(${meta.hueB} 30% 22% / 0.85)`}
            strokeWidth={3.5 - i * 0.2}
            strokeLinecap="round"
          />
        ))}

        {/* threads from branch to glyph */}
        {placed.map((p) => {
          const b = BRANCHES[p.pos.branch];
          // branch point at same t (without offset) as anchor
          const u = 1 - p.pos.t;
          const ax =
            u * u * b.s[0] + 2 * u * p.pos.t * b.c[0] + p.pos.t * p.pos.t * b.e[0];
          const ay =
            u * u * b.s[1] + 2 * u * p.pos.t * b.c[1] + p.pos.t * p.pos.t * b.e[1];
          return (
            <line
              key={`thread-${p.offering.id}`}
              x1={ax}
              y1={ay}
              x2={p.x}
              y2={p.y}
              stroke={`hsl(${meta.hueB} 25% 60% / 0.45)`}
              strokeWidth={0.7}
            />
          );
        })}
      </svg>

      {/* Glyph buttons overlay */}
      {placed.map((p) => {
        const meta = OFFERING_TYPES.find((m) => m.value === p.offering.offering_type);
        const leftPct = (p.x / TREE_VIEWBOX) * 100;
        const topPct = (p.y / TREE_VIEWBOX) * 100;
        const isSelected = selectedId === p.offering.id;
        return (
          <button
            key={p.offering.id}
            type="button"
            data-offering-id={p.offering.id}
            onClick={() => onSelect?.(isSelected ? null : p.offering)}
            aria-pressed={isSelected}
            aria-label={`${meta?.label ?? "Offering"}: ${p.offering.title ?? p.offering.contributor_name}`}
            className={[
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
              "flex items-center justify-center",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "hover:scale-110",
              isSelected
                ? "scale-125 ring-2 ring-primary shadow-[0_0_18px_hsl(38_90%_70%/0.6)]"
                : "shadow-[0_0_10px_hsl(38_90%_70%/0.35)]",
            ].join(" ")}
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: 28,
              height: 28,
              fontSize: 14,
              background:
                "radial-gradient(circle, hsl(38 90% 80% / 0.95), hsl(38 60% 50% / 0.6) 70%, transparent)",
              border: "1px solid hsl(38 60% 70% / 0.7)",
            }}
          >
            <span aria-hidden>{meta?.glyph ?? "🍃"}</span>
          </button>
        );
      })}

      {treeName && (
        <p
          className="absolute bottom-0 left-0 right-0 text-center font-serif text-xs italic pointer-events-none"
          style={{ color: `hsl(${meta.hueB} 25% 65% / 0.85)` }}
        >
          {treeName}
        </p>
      )}

      <style>{`
        @keyframes lifeGroveBreathe {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}

/** Small preview card shown when a glyph is selected. */
export function OfferingPreviewCard({
  offering,
  onClose,
}: {
  offering: LifeGroveOffering;
  onClose: () => void;
}) {
  const meta = OFFERING_TYPES.find((m) => m.value === offering.offering_type);
  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label={`${meta?.label ?? "Offering"} preview`}
      className="mt-4 rounded-2xl border border-primary/30 bg-card/60 p-4 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base" aria-hidden>{meta?.glyph ?? "🍃"}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] font-serif text-muted-foreground/70">
          {meta?.label ?? offering.offering_type}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-xs font-serif text-muted-foreground/70 hover:text-foreground"
          aria-label="Close offering preview"
        >
          close
        </button>
      </div>
      {offering.title && (
        <h4 className="font-serif text-base text-foreground leading-snug">
          {offering.title}
        </h4>
      )}
      {offering.body_text && (
        <p className="text-sm font-serif text-muted-foreground/90 mt-1 whitespace-pre-wrap">
          {offering.body_text}
        </p>
      )}
      {offering.media_url && (
        <a
          href={offering.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline mt-2 inline-block break-all"
        >
          Open media
        </a>
      )}
      <p className="text-[11px] font-serif text-muted-foreground/60 mt-3">
        — {offering.contributor_name}
      </p>
    </aside>
  );
}
