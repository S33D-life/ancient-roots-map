/**
 * ProgressionSeal — quiet circular progress ring with seal label.
 * Pure SVG, no dependencies. Used across Living Paths sections.
 */
interface Props {
  current: number;
  target: number;
  /** Short ceremonial label shown beneath the ring. */
  sealLabel?: string;
  /** Glyph or short text inside the ring. */
  centerText?: string;
  size?: number;
}

export default function ProgressionSeal({
  current,
  target,
  sealLabel,
  centerText,
  size = 96,
}: Props) {
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5" aria-label={`${current} of ${target}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <defs>
          <radialGradient id="seal-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.18)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
          </radialGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r + 4} fill="url(#seal-bg)" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeOpacity={0.5}
          strokeWidth={2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeOpacity={0.85}
          strokeWidth={2}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
        <text
          x="50%"
          y="50%"
          dy="0.35em"
          textAnchor="middle"
          className="font-serif"
          fontSize={size * 0.22}
          fill="hsl(var(--foreground))"
        >
          {centerText ?? `${current}/${target}`}
        </text>
      </svg>
      {sealLabel && (
        <p className="font-serif text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 text-center">
          {sealLabel}
        </p>
      )}
    </div>
  );
}
