/**
 * TreeActivityTimeline — compact chronological feed showing
 * recent activity at a tree (check-ins, offerings, seeds, whispers).
 */
import { MapPin, Camera, FileText, Music, MessageSquare, Sparkles, Mic, BookOpen } from "lucide-react";
import { useTreeActivityTimeline, type TimelineEvent } from "@/hooks/use-tree-activity-timeline";

const typeConfig: Record<TimelineEvent["type"], { icon: React.ElementType; color: string }> = {
  checkin: { icon: MapPin, color: "hsl(var(--primary))" },
  offering: { icon: Sparkles, color: "hsl(42, 90%, 55%)" },
  seed: { icon: Sparkles, color: "hsl(120, 50%, 50%)" },
  whisper: { icon: MessageSquare, color: "hsl(270, 50%, 60%)" },
  meeting: { icon: MapPin, color: "hsl(200, 55%, 50%)" },
};

function formatRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface Props {
  treeId: string | undefined;
  limit?: number;
}

const TreeActivityTimeline = ({ treeId, limit = 5 }: Props) => {
  const { events, hasActivity } = useTreeActivityTimeline(treeId, limit);

  if (!hasActivity) return null;

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-serif text-muted-foreground uppercase tracking-widest mb-3">Recent Activity</h4>
      <div className="relative pl-5 space-y-3">
        {/* Vertical timeline line */}
        <div
          className="absolute left-[7px] top-1 bottom-1 w-px"
          style={{ background: "linear-gradient(to bottom, hsl(var(--primary) / 0.3), transparent)" }}
        />

        {events.map((event) => {
          const cfg = typeConfig[event.type];
          const Icon = cfg.icon;
          return (
            <div key={event.id} className="relative flex items-start gap-3">
              {/* Dot on timeline */}
              <div
                className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: cfg.color,
                  background: "hsl(var(--background))",
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: cfg.color }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex items-baseline gap-2">
                <Icon className="w-3 h-3 shrink-0 mt-0.5" style={{ color: cfg.color }} />
                <span className="text-sm font-serif text-foreground/85 truncate">{event.label}</span>
                {event.detail && (
                  <span className="text-xs text-muted-foreground truncate hidden sm:inline">— {event.detail}</span>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0 tabular-nums">
                {formatRelative(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TreeActivityTimeline;
