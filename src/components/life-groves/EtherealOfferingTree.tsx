/**
 * EtherealOfferingTree — SVG ethereal tree with offerings hanging in the
 * branches at positions stored in life_grove_offerings.memory_position_data.
 *
 * - SVG draws the tree (root flare, tapered trunk, layered canopy, branches,
 *   twigs, threads) with a soft inner light.
 * - Each offering also gets an absolutely-positioned <button> overlay so
 *   it is keyboard reachable and announced to screen readers.
 * - Selected state is lifted: parent decides what to do with the selection.
 *
 * The tree quietly responds to how inhabited it is: more offerings mean a
 * fuller canopy, a warmer glow and a few more ambient motes.
 */
import { useId, useMemo, useRef, useEffect } from "react";
import {
  OFFERING_TYPES,
  TREE_ARCHETYPES,
  type LifeGroveOffering,
  type TreeArchetype,
} from "@/lib/life-groves/types";
import { isPrivateOfferingMedia, resolveOfferingMediaUrl } from "@/utils/offeringMedia";
import {
  BRANCHES,
  TREE_VIEWBOX,
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
  /** Offering ids to keep fully lit; others fade to a faint presence. */
  highlightIds?: string[] | null;
  /** Immersive mode: bigger touch targets, deeper glow, ambient motes. */
  immersive?: boolean;
}

interface Placed {
  offering: LifeGroveOffering;
  pos: OfferingPosition;
  x: number; // svg coords
  y: number;
  ax: number; // branch anchor
  ay: number;
}

const C = TREE_VIEWBOX / 2;

/** Point on a quadratic bezier. */
function bezierAt(b: (typeof BRANCHES)[number], t: number) {
  const u = 1 - t;
  return {
    x: u * u * b.s[0] + 2 * u * t * b.c[0] + t * t * b.e[0],
    y: u * u * b.s[1] + 2 * u * t * b.c[1] + t * t * b.e[1],
  };
}

/** Tapered branch: outline drawn as a closed shape so it thins toward the tip. */
function taperedBranch(idx: number, baseWidth: number): string {
  const b = BRANCHES[idx] ?? BRANCHES[0];
  const steps = 10;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = bezierAt(b, t);
    const n = bezierAt(b, Math.min(1, t + 0.01));
    const dx = n.x - p.x;
    const dy = n.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const w = (baseWidth * (1 - t) ** 1.4) / 2 + 0.35;
    const nx = (-dy / len) * w;
    const ny = (dx / len) * w;
    left.push(`${p.x + nx} ${p.y + ny}`);
    right.unshift(`${p.x - nx} ${p.y - ny}`);
  }
  return `M ${left.join(" L ")} L ${right.join(" L ")} Z`;
}

/** Small twigs branching off each main limb. */
function twigs(idx: number): string[] {
  const b = BRANCHES[idx] ?? BRANCHES[0];
  const out: string[] = [];
  for (const t of [0.52, 0.72, 0.88]) {
    const p = bezierAt(b, t);
    const n = bezierAt(b, Math.min(1, t + 0.02));
    const dx = n.x - p.x;
    const dy = n.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const side = t === 0.72 ? -1 : 1;
    const px = -uy * side;
    const py = ux * side;
    const reach = 22 * (1 - t) + 9;
    out.push(
      `M ${p.x} ${p.y} Q ${p.x + ux * reach * 0.5 + px * reach * 0.5} ${p.y + uy * reach * 0.5 + py * reach * 0.5} ${p.x + ux * reach + px * reach * 0.8} ${p.y + uy * reach + py * reach * 0.8}`,
    );
  }
  return out;
}

export default function EtherealOfferingTree({
  archetype,
  treeName,
  offerings,
  selectedId = null,
  onSelect,
  size = 360,
  highlightIds = null,
  immersive = false,
}: Props) {
  const meta =
    TREE_ARCHETYPES.find((a) => a.value === archetype) ?? TREE_ARCHETYPES[0];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gradientPrefix = useId().replace(/:/g, "");

  const branchGeometry = useMemo(
    () => BRANCHES.map((_, i) => ({
      body: taperedBranch(i, 9 - i * 0.5),
      twigs: twigs(i),
    })),
    [],
  );

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
      const anchor = bezierAt(BRANCHES[pos.branch] ?? BRANCHES[0], pos.t);
      out.push({ offering: o, pos, x, y, ax: anchor.x, ay: anchor.y });
    }
    return out;
  }, [offerings]);

  // How inhabited the tree feels — 0 (waiting) → 1 (richly tended).
  const fullness = Math.min(1, offerings.length / 12);
  const glyphSize = immersive ? 48 : 40;

  /** Deterministic ambient motes — scale gently with fullness. */
  const motes = useMemo(() => {
    const count = immersive ? 8 + Math.round(fullness * 10) : Math.round(fullness * 6);
    const phi = 0.6180339887;
    return Array.from({ length: count }, (_, i) => {
      const a = ((i * phi) % 1) * Math.PI * 2;
      const r = TREE_VIEWBOX * (0.16 + ((i * 0.37) % 1) * 0.22);
      return {
        key: i,
        cx: C + Math.cos(a) * r,
        cy: TREE_VIEWBOX * 0.38 + Math.sin(a) * r * 0.82,
        r: 0.9 + ((i * 0.53) % 1) * 1.3,
        dur: 7 + ((i * 0.41) % 1) * 6,
      };
    });
  }, [fullness, immersive]);

  // Focus the selected glyph button when it changes (keyboard friendliness).
  useEffect(() => {
    if (!selectedId) return;
    const node = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-offering-id="${selectedId}"]`,
    );
    node?.focus({ preventScroll: true });
  }, [selectedId]);

  const leaf = (l: number, s: number, a: number) =>
    `hsl(${meta.hueA} ${s}% ${l}% / ${a})`;
  const bark = (l: number, a: number) => `hsl(${meta.hueB} 30% ${l}% / ${a})`;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto select-none"
      style={{ width: size, height: size, maxWidth: immersive ? "112vw" : "100%" }}
    >
      {/* outer halo — breathing light around the whole tree */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full motion-safe:animate-[lifeGroveBreathe_11s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle at 50% 42%, ${leaf(64, 58, 0.16 + fullness * 0.2)}, ${bark(24, 0.05)} 58%, transparent 74%)`,
          filter: "blur(14px)",
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
          <radialGradient id={`${gradientPrefix}-canopy-back`} cx="50%" cy="42%" r="58%">
            <stop offset="0%" stopColor={leaf(46, 32, 0.4)} />
            <stop offset="70%" stopColor={leaf(30, 28, 0.22)} />
            <stop offset="100%" stopColor={leaf(22, 24, 0)} />
          </radialGradient>
          <radialGradient id={`${gradientPrefix}-canopy-mid`} cx="46%" cy="38%" r="55%">
            <stop offset="0%" stopColor={leaf(58, 48, 0.42)} />
            <stop offset="65%" stopColor={leaf(38, 44, 0.26)} />
            <stop offset="100%" stopColor={leaf(28, 40, 0)} />
          </radialGradient>
          <radialGradient id={`${gradientPrefix}-canopy-front`} cx="52%" cy="33%" r="48%">
            <stop offset="0%" stopColor={leaf(72, 58, 0.34 + fullness * 0.18)} />
            <stop offset="60%" stopColor={leaf(52, 52, 0.2)} />
            <stop offset="100%" stopColor={leaf(40, 48, 0)} />
          </radialGradient>
          <radialGradient id={`${gradientPrefix}-heartlight`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`hsl(42 85% 74% / ${0.22 + fullness * 0.22})`} />
            <stop offset="100%" stopColor="hsl(42 85% 74% / 0)" />
          </radialGradient>
          <linearGradient id={`${gradientPrefix}-trunk`} x1="0.2" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor={bark(34, 1)} />
            <stop offset="45%" stopColor={bark(24, 1)} />
            <stop offset="100%" stopColor={bark(14, 1)} />
          </linearGradient>
          <linearGradient id={`${gradientPrefix}-ground`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={leaf(40, 30, 0)} />
            <stop offset="50%" stopColor={leaf(46, 36, 0.36)} />
            <stop offset="100%" stopColor={leaf(40, 30, 0)} />
          </linearGradient>
        </defs>

        {/* layered canopy — back, mid, front for depth */}
        <g aria-hidden>
          <ellipse cx={C - 28} cy={TREE_VIEWBOX * 0.4} rx={TREE_VIEWBOX * 0.37} ry={TREE_VIEWBOX * 0.3} fill={`url(#${gradientPrefix}-canopy-back)`} opacity="0.72" />
          <ellipse cx={C + 42} cy={TREE_VIEWBOX * 0.37} rx={TREE_VIEWBOX * 0.32} ry={TREE_VIEWBOX * 0.27} fill={`url(#${gradientPrefix}-canopy-back)`} opacity="0.58" />
          <ellipse cx={C * 0.66} cy={TREE_VIEWBOX * 0.48} rx={TREE_VIEWBOX * 0.22} ry={TREE_VIEWBOX * 0.18} fill={`url(#${gradientPrefix}-canopy-mid)`} />
          <ellipse cx={C * 0.9} cy={TREE_VIEWBOX * 0.29} rx={TREE_VIEWBOX * 0.25} ry={TREE_VIEWBOX * 0.2} fill={`url(#${gradientPrefix}-canopy-mid)`} />
          <ellipse cx={C * 1.3} cy={TREE_VIEWBOX * 0.4} rx={TREE_VIEWBOX * 0.24} ry={TREE_VIEWBOX * 0.21} fill={`url(#${gradientPrefix}-canopy-mid)`} />
          <ellipse
            cx={C}
            cy={TREE_VIEWBOX * 0.32}
            rx={TREE_VIEWBOX * (0.26 + fullness * 0.05)}
            ry={TREE_VIEWBOX * (0.22 + fullness * 0.04)}
            fill={`url(#${gradientPrefix}-canopy-front)`}
            className="motion-safe:animate-[lifeGroveBreathe_13s_ease-in-out_infinite]"
            style={{ transformOrigin: "50% 36%" }}
          />
        </g>

        {/* inner life force behind the trunk */}
        <ellipse
          aria-hidden
          cx={C}
          cy={TREE_VIEWBOX * 0.5}
          rx={TREE_VIEWBOX * 0.2}
          ry={TREE_VIEWBOX * 0.26}
          fill={`url(#${gradientPrefix}-heartlight)`}
        />

        {/* ground glow */}
        <ellipse aria-hidden cx={C} cy={TREE_VIEWBOX * 0.87} rx={TREE_VIEWBOX * 0.34} ry={TREE_VIEWBOX * 0.035} fill={`url(#${gradientPrefix}-ground)`} />

        {/* root flare + tapered trunk */}
        <path
          aria-hidden
          d={`M ${C - 26} ${TREE_VIEWBOX * 0.885}
              C ${C - 19} ${TREE_VIEWBOX * 0.85}, ${C - 14} ${TREE_VIEWBOX * 0.79}, ${C - 11} ${TREE_VIEWBOX * 0.68}
              C ${C - 9} ${TREE_VIEWBOX * 0.58}, ${C - 6} ${TREE_VIEWBOX * 0.5}, ${C - 5} ${TREE_VIEWBOX * 0.41}
              L ${C + 5} ${TREE_VIEWBOX * 0.41}
              C ${C + 6} ${TREE_VIEWBOX * 0.5}, ${C + 9} ${TREE_VIEWBOX * 0.58}, ${C + 11} ${TREE_VIEWBOX * 0.68}
              C ${C + 14} ${TREE_VIEWBOX * 0.79}, ${C + 19} ${TREE_VIEWBOX * 0.85}, ${C + 26} ${TREE_VIEWBOX * 0.885}
              C ${C + 12} ${TREE_VIEWBOX * 0.9}, ${C - 12} ${TREE_VIEWBOX * 0.9}, ${C - 26} ${TREE_VIEWBOX * 0.885} Z`}
          fill={`url(#${gradientPrefix}-trunk)`}
        />
        {/* trunk rim light */}
        <path
          aria-hidden
          d={`M ${C + 4} ${TREE_VIEWBOX * 0.42} C ${C + 6} ${TREE_VIEWBOX * 0.55}, ${C + 10} ${TREE_VIEWBOX * 0.7}, ${C + 15} ${TREE_VIEWBOX * 0.85}`}
          stroke={`hsl(42 70% 80% / ${0.14 + fullness * 0.1})`}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />

        {/* branches + twigs */}
        <g aria-hidden>
          {branchGeometry.map((branch, i) => (
            <g key={i}>
              <path d={branch.body} fill={bark(21, 0.92)} />
              {branch.twigs.map((d, j) => (
                <path
                  key={j}
                  d={d}
                  fill="none"
                  stroke={bark(26, 0.6)}
                  strokeWidth={1.1}
                  strokeLinecap="round"
                />
              ))}
              {/* faint rim light along the top of each limb */}
              <path
                d={branch.body}
                fill="none"
                stroke={`hsl(42 70% 82% / 0.1)`}
                strokeWidth={0.6}
              />
            </g>
          ))}
        </g>

        {/* ambient motes */}
        <g aria-hidden>
          {motes.map((m) => (
            <circle
              key={m.key}
              cx={m.cx}
              cy={m.cy}
              r={m.r}
              fill="hsl(42 90% 82% / 0.5)"
              className="ethereal-mote"
              style={{ animationDuration: `${m.dur}s`, animationDelay: `${m.key * -0.47}s` }}
            />
          ))}
        </g>

        {/* threads from branch to glyph */}
        <g aria-hidden>
          {placed.map((p) => (
            <line
              key={`thread-${p.offering.id}`}
              x1={p.ax}
              y1={p.ay}
              x2={p.x}
              y2={p.y}
              stroke={`hsl(${meta.hueB} 25% 62% / 0.4)`}
              strokeWidth={0.7}
            />
          ))}
        </g>
      </svg>

      {/* Glyph buttons overlay */}
      {placed.map((p, i) => {
        const glyphMeta = OFFERING_TYPES.find((m) => m.value === p.offering.offering_type);
        const leftPct = (p.x / TREE_VIEWBOX) * 100;
        const topPct = (p.y / TREE_VIEWBOX) * 100;
        const isSelected = selectedId === p.offering.id;
        const dimmed = highlightIds ? !highlightIds.includes(p.offering.id) : false;
        return (
          <button
            key={p.offering.id}
            type="button"
            data-offering-id={p.offering.id}
            onClick={() => onSelect?.(isSelected ? null : p.offering)}
            aria-pressed={isSelected}
            aria-hidden={dimmed || undefined}
            tabIndex={dimmed ? -1 : 0}
            aria-label={`${glyphMeta?.label ?? "Offering"}: ${p.offering.title ?? p.offering.contributor_name}`}
            className={[
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
              "flex items-center justify-center bg-transparent",
              "transition-all duration-500",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "hover:scale-110",
              isSelected
                ? "scale-125 drop-shadow-[0_0_14px_hsl(38_90%_70%/0.9)]"
                : "drop-shadow-[0_0_6px_hsl(38_90%_70%/0.45)]",
              dimmed ? "opacity-20 scale-90 pointer-events-none" : "opacity-100",
            ].join(" ")}
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: glyphSize,
              height: glyphSize,
              padding: 0,
              border: "none",
            }}
          >
            {/* Sway lives on the glyph, not the button — the touch target
                stays exactly where the finger expects it. */}
            <span
              className="motion-safe:animate-[lifeGroveSway_11s_ease-in-out_infinite] flex rounded-full border border-primary/15 bg-background/5"
              style={{ animationDelay: `${(i % 5) * 0.7}s` }}
            >
              <LifeGroveOfferingGlyph type={p.offering.offering_type} size={glyphSize} variant="tree" />
            </span>
          </button>
        );
      })}

      {treeName && (
        <p
          className="absolute bottom-0 left-0 right-0 text-center font-serif text-xs italic pointer-events-none"
          style={{ color: `hsl(${meta.hueB} 25% 68% / 0.85)` }}
        >
          {treeName}
        </p>
      )}

      <style>{`
        @keyframes lifeGroveBreathe {
          0%, 100% { opacity: 0.72; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes lifeGroveSway {
          0%, 100% { transform: rotate(-1.25deg) translateY(0); }
          50% { transform: rotate(1.25deg) translateY(-1px); }
        }
        @keyframes etherealMote {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.58; }
        }
        .ethereal-mote { animation: etherealMote 10s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ethereal-mote { animation: none; opacity: 0.34; }
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
        <LifeGroveOfferingGlyph type={offering.offering_type} size={24} variant="card" />
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
          onClick={async (e) => {
            // Private media is only released through the checked server path.
            if (!isPrivateOfferingMedia(offering.media_url)) return;
            e.preventDefault();
            const signed = await resolveOfferingMediaUrl(offering.media_url, offering.id);
            if (signed) window.open(signed, "_blank", "noopener,noreferrer");
          }}
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
