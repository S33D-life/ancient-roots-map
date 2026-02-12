import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, CheckCircle2, Timer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Meeting {
  id: string;
  user_id: string;
  tree_id: string;
  created_at: string;
  expires_at: string;
  notes: string | null;
}

type TimerStatus = "active" | "expiring" | "expired" | "invalid" | "none";

interface MeetingTimerProps {
  treeId: string;
  treeName: string;
  userId: string | null;
  onMeetingChange?: (meeting: Meeting | null) => void;
  onStatusChange?: (status: TimerStatus) => void;
}

const MEETING_DURATION_MS = 12 * 60 * 60 * 1000;
const EXPIRING_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getTimerStatus(meeting: Meeting): TimerStatus {
  const now = Date.now();
  const createdAt = new Date(meeting.created_at).getTime();
  const expiresAt = new Date(meeting.expires_at).getTime();

  // Future meeting = invalid
  if (createdAt > now + 60000) return "invalid";

  const remaining = expiresAt - now;
  if (remaining <= 0) return "expired";
  if (remaining <= EXPIRING_THRESHOLD_MS) return "expiring";
  return "active";
}

const MeetingTimer = ({ treeId, treeName, userId, onMeetingChange, onStatusChange }: MeetingTimerProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Fetch meetings
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetchMeetings = async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("tree_id", treeId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) setMeetings(data as Meeting[]);
      setLoading(false);
    };
    fetchMeetings();

    const channel = supabase
      .channel(`meetings-${treeId}-${userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "meetings",
        filter: `tree_id=eq.${treeId}`,
      }, () => fetchMeetings())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [treeId, userId]);

  // Tick timer every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const latestMeeting = meetings[0] || null;
  const status: TimerStatus = latestMeeting ? getTimerStatus(latestMeeting) : "none";
  const remaining = latestMeeting
    ? Math.max(0, new Date(latestMeeting.expires_at).getTime() - now)
    : 0;
  const progress = latestMeeting
    ? Math.min(1, (now - new Date(latestMeeting.created_at).getTime()) / MEETING_DURATION_MS)
    : 0;

  useEffect(() => {
    onMeetingChange?.(latestMeeting);
    onStatusChange?.(status);
  }, [latestMeeting?.id, status]);

  const createMeeting = async () => {
    if (!userId) { toast.error("Please sign in to meet this Ancient Friend"); return; }
    setCreating(true);
    try {
      const { error } = await supabase.from("meetings").insert({
        user_id: userId,
        tree_id: treeId,
      });
      if (error) throw error;
      toast.success(`You have met ${treeName}! Your 12-hour offering window is now open.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create meeting");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return null;

  if (!userId) {
    return (
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground font-serif">
            Sign in to meet this Ancient Friend and leave offerings
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    none: { color: "text-muted-foreground", bg: "bg-secondary/30", icon: Plus, label: "No active meeting" },
    active: { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Timer, label: "Offering window open" },
    expiring: { color: "text-amber-400", bg: "bg-amber-500/10", icon: AlertTriangle, label: "Window closing soon" },
    expired: { color: "text-muted-foreground", bg: "bg-secondary/20", icon: CheckCircle2, label: "Window closed" },
    invalid: { color: "text-red-400", bg: "bg-red-500/10", icon: AlertTriangle, label: "Invalid meeting timestamp" },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  return (
    <Card className={`border-border/50 backdrop-blur ${cfg.bg} transition-colors duration-500`}>
      <CardContent className="p-4">
        {/* Status + Timer */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
            <div>
              <p className={`text-sm font-serif font-medium ${cfg.color}`}>{cfg.label}</p>
              {status === "active" || status === "expiring" ? (
                <p className="text-xs text-muted-foreground font-mono" aria-label={`Time remaining: ${formatRemaining(remaining)}`}>
                  {formatRemaining(remaining)} remaining
                </p>
              ) : null}
            </div>
          </div>

          {(status === "none" || status === "expired") && (
            <Button
              size="sm"
              onClick={createMeeting}
              disabled={creating}
              className="font-serif text-xs tracking-wider gap-1.5"
            >
              {creating ? <Clock className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {status === "expired" ? "Meet Again" : "Meet this Ancient Friend"}
            </Button>
          )}
        </div>

        {/* Progress bar for active/expiring */}
        {(status === "active" || status === "expiring") && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${status === "expiring" ? "bg-amber-400" : "bg-emerald-400"}`}
                initial={{ width: `${(1 - progress) * 100}%` }}
                animate={{ width: `${(1 - progress) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        )}

        {/* Invalid warning */}
        {status === "invalid" && (
          <p className="text-xs text-red-400/80 mt-2 font-serif">
            This meeting has a future timestamp and cannot be used. Please create a new meeting.
          </p>
        )}

        {/* Meeting history */}
        {meetings.length > 1 && (
          <details className="mt-3">
            <summary className="text-[10px] text-muted-foreground/60 font-serif tracking-widest uppercase cursor-pointer hover:text-muted-foreground transition-colors">
              Meeting history ({meetings.length})
            </summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {meetings.map((m, i) => {
                const s = getTimerStatus(m);
                return (
                  <div key={m.id} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                      s === "active" || s === "expiring" ? "border-emerald-500/40 text-emerald-400" : "border-border/30"
                    }`}>
                      {i === 0 ? "latest" : s}
                    </Badge>
                    <span className="font-mono">
                      {new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export { MeetingTimer, type Meeting, type TimerStatus };
export default MeetingTimer;
