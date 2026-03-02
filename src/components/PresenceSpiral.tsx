/**
 * PresenceSpiral — golden-angle spiral visualization of completed 333s sessions.
 *
 * Each dot = one session, plotted chronologically in a Fermat/golden-angle spiral.
 * Ring guides mark 7-day boundaries. Dot states: recent glow, repeat-tree outlined,
 * milestone seeds every 33 sessions.
 */
import { useMemo } from "react";

const GOLDEN_ANGLE = 137.508; // degrees
const DOT_RADIUS = 4;
const MILESTONE_RADIUS = 7;
const RING_SESSIONS_PER_WEEK = 7; // approximate guide
const SCALE = 5.5; // controls spiral spread

interface PresenceSession {
  id: string;
  tree_id: string;
  completed_at: string;
  duration_seconds: number;
  geo_validated?: boolean;
}

interface PresenceSpiralProps {
  sessions: PresenceSession[];
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  /** Compact mode for embedding in cards */
  compact?: boolean;
}

export default function PresenceSpiral({
  sessions,
  currentStreak,
  longestStreak,
  totalSessions,
  compact = false,
}: PresenceSpiralProps) {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // Track which trees have been visited more than once
  const treeVisitCounts = useMemo(() => {
    const counts = new Map<string, number>();
    sessions.forEach((s) => counts.set(s.tree_id, (counts.get(s.tree_id) || 0) + 1));
    return counts;
  }, [sessions]);

  // Sort chronologically
  const sorted = useMemo(
    () => [...sessions].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()),
    [sessions]
  );

  const size = compact ? 180 : 280;
  const center = size / 2;

  // Calculate max radius needed
  const maxN = Math.max(sorted.length, 1);
  const maxR = SCALE * Math.sqrt(maxN);
  const viewScale = (size / 2 - 16) / Math.max(maxR, 1);

  // Ring guides (every 7 sessions ≈ 1 week if daily)
  const ringCount = Math.ceil(sorted.length / RING_SESSIONS_PER_WEEK);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-label={`Presence spiral: ${totalSessions} sessions`}
      >
        {/* Ring guides */}
        {Array.from({ length: ringCount }, (_, i) => {
          const ringN = (i + 1) * RING_SESSIONS_PER_WEEK;
          const r = SCALE * Math.sqrt(ringN) * viewScale;
          return (
            <circle
              key={`ring-${i}`}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
              strokeDasharray="2 4"
              opacity={0.3}
            />
          );
        })}

        {/* Session dots */}
        {sorted.map((session, i) => {
          const n = i + 1;
          const angle = (n * GOLDEN_ANGLE * Math.PI) / 180;
          const r = SCALE * Math.sqrt(n) * viewScale;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);

          const age = now - new Date(session.completed_at).getTime();
          const isRecent = age < sevenDaysMs;
          const isRepeatTree = (treeVisitCounts.get(session.tree_id) || 0) > 1;
          const isMilestone = n % 33 === 0;
          const dotR = isMilestone ? MILESTONE_RADIUS : DOT_RADIUS;

          return (
            <g key={session.id}>
              {/* Glow for recent */}
              {isRecent && (
                <circle
                  cx={x}
                  cy={y}
                  r={dotR + 3}
                  fill="hsl(var(--primary) / 0.15)"
                  className="animate-pulse"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={dotR}
                fill={isMilestone ? "hsl(var(--primary))" : isRecent ? "hsl(var(--primary) / 0.8)" : "hsl(var(--muted-foreground) / 0.35)"}
                stroke={isRepeatTree ? "hsl(var(--primary) / 0.6)" : "none"}
                strokeWidth={isRepeatTree ? 1.5 : 0}
              />
              {/* Milestone seed marker */}
              {isMilestone && (
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[7px] fill-primary-foreground font-mono pointer-events-none"
                >
                  🌱
                </text>
              )}
            </g>
          );
        })}

        {/* Center label */}
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          className="text-[11px] fill-foreground font-serif"
        >
          {totalSessions}
        </text>
        <text
          x={center}
          y={center + 8}
          textAnchor="middle"
          className="text-[8px] fill-muted-foreground font-serif"
        >
          presences
        </text>
      </svg>

      {/* Stats row */}
      {!compact && (
        <div className="flex items-center gap-4 text-xs font-serif text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            <span>{currentStreak}d streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
            <span>Best: {longestStreak}d</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-primary/60 inline-block" />
            <span>Repeat trees</span>
          </div>
        </div>
      )}
    </div>
  );
}
