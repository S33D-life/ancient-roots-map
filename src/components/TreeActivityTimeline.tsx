/**
 * TreeActivityTimeline — compact chronological feed showing
 * recent activity at a tree (check-ins, offerings, seeds, whispers).
 */
import { MapPin, Sparkles, MessageSquare } from "lucide-react";
import { useTreeActivityTimeline, type TimelineEvent } from "@/hooks/use-tree-activity-timeline";

const typeConfig: Record<TimelineEvent["type"], { icon: React.ElementType; label: string; accent: string }> = {
  checkin:  { icon: MapPin,          label: "Visit",    accent: "hsl(var(--primary))" },
  offering: { icon: Sparkles,        label: "Offering", accent: "hsl(42, 90%, 55%)" },
  seed:     { icon: Sparkles,        label: "Seed",     accent: "hsl(120, 50%, 50%)" },
  whisper:  { icon: MessageSquare,   label: "Whisper",  accent: "hsl(270, 50%, 60%)" },
  meeting:  { icon: MapPin,          label: "Meeting",  accent: "hsl(200, 55%, 50%)" },
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

const TreeActivityTimeline = ({ treeId, limit = 4 }: Props) => {
  const { events, hasActivity } = useTreeActivityTimeline(treeId, limit);

  if (!hasActivity) {
    return (
      <div className="rounded-xl border border-border/20 bg-card/30 p-5 text-center space-y-1.5">
        <p className="text-xs font-serif text-muted-foreground/70 uppercase tracking-widest">Recent Activity</p>
        <p className="text-sm font-serif text-muted-foreground">No activity yet — be the first to visit or leave an offering.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/20 bg-card/30 p-4 space-y-3">
      <p className="text-xs font-serif text-muted-foreground/70 uppercase tracking-widest">Recent Activity</p>

      <div className="relative pl-5 space-y-2.5">
        {/* Vertical timeline line */}
        <div
          className="absolute left-[7px] top-1 bottom-1 w-px"
          style={{ background: "linear-gradient(to bottom, hsl(var(--primary) / 0.25), transparent)" }}
        />

        {events.map((event) => {
          const cfg = typeConfig[event.type];
          const Icon = cfg.icon;
          return (
            <div key={event.id} className="relative flex items-start gap-2.5">
              {/* Dot */}
              <div
                className="absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: cfg.accent, background: "hsl(var(--background))" }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.accent }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                <Icon className="w-3 h-3 shrink-0 mt-0.5 text-muted-foreground/60" />
                <span className="text-sm font-serif text-foreground/85 truncate">{event.label}</span>
                {event.detail && (
                  <span className="text-xs text-muted-foreground truncate hidden sm:inline">— {event.detail}</span>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0 tabular-nums">
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
