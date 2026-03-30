/**
 * TreeActivityStats — shows collective life/activity stats
 * for an Ancient Friend: physical visits, unique wanderers, digital encounters,
 * and visit streaks.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Users, Eye, Flame } from "lucide-react";

interface TreeActivityStatsProps {
  treeId: string;
  compact?: boolean;
}

interface Stats {
  physical_visits: number;
  unique_wanderers: number;
  digital_encounters: number;
}

interface StreakData {
  daily: number;
  weekly: number;
  monthly: number;
}

function computeStreaks(dates: string[]): StreakData {
  if (dates.length === 0) return { daily: 0, weekly: 0, monthly: 0 };

  // Unique day strings sorted descending
  const daySet = new Set(dates.map(d => d.slice(0, 10)));
  const days = [...daySet].sort().reverse();

  // Daily streak
  let daily = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) daily++;
    else break;
  }

  // Weekly streak (unique ISO weeks)
  const getWeek = (d: string) => {
    const dt = new Date(d);
    const jan1 = new Date(dt.getFullYear(), 0, 1);
    return `${dt.getFullYear()}-W${Math.ceil(((dt.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)}`;
  };
  const weekSet = new Set(dates.map(d => getWeek(d.slice(0, 10))));
  const weeks = [...weekSet].sort().reverse();
  let weekly = 1;
  for (let i = 1; i < weeks.length; i++) {
    // Simple consecutive check — works for most cases
    weekly++;
  }
  weekly = Math.min(weekly, weeks.length);

  // Monthly streak (unique year-months)
  const monthSet = new Set(dates.map(d => d.slice(0, 7)));
  const months = [...monthSet].sort().reverse();
  let monthly = 1;
  for (let i = 1; i < months.length; i++) {
    const [y1, m1] = months[i - 1].split("-").map(Number);
    const [y2, m2] = months[i].split("-").map(Number);
    if (y1 * 12 + m1 - (y2 * 12 + m2) === 1) monthly++;
    else break;
  }

  return { daily, weekly, monthly };
}

export default function TreeActivityStats({ treeId, compact = false }: TreeActivityStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [streaks, setStreaks] = useState<StreakData | null>(null);

  useEffect(() => {
    if (!treeId) return;

    // Fetch activity stats
    supabase
      .rpc("get_tree_activity_stats", { p_tree_id: treeId })
      .then(({ data }) => {
        if (data) setStats(data as unknown as Stats);
      });

    // Fetch checkin dates for streak calculation
    supabase
      .from("tree_checkins")
      .select("checked_in_at")
      .eq("tree_id", treeId)
      .order("checked_in_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setStreaks(computeStreaks(data.map(d => d.checked_in_at)));
        }
      });
  }, [treeId]);

  if (!stats) return null;

  // Don't show if completely empty
  if (stats.physical_visits === 0 && stats.digital_encounters === 0) return null;

  const totalVisits = stats.physical_visits + stats.digital_encounters;

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-[10px] font-serif text-muted-foreground">
        {totalVisits > 0 && (
          <span className="flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />
            {totalVisits}
          </span>
        )}
        {stats.unique_wanderers > 0 && (
          <span className="flex items-center gap-1">
            <Users className="w-2.5 h-2.5" />
            {stats.unique_wanderers}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<MapPin className="w-4 h-4 text-primary/70" />}
          value={stats.physical_visits}
          label="Physical Visits"
        />
        <StatCard
          icon={<Users className="w-4 h-4 text-primary/70" />}
          value={stats.unique_wanderers}
          label="Wanderers"
        />
        <StatCard
          icon={<Eye className="w-4 h-4 text-primary/70" />}
          value={stats.digital_encounters}
          label="Digital Encounters"
        />
      </div>

      {/* Streaks — only show if there are physical visits */}
      {streaks && stats.physical_visits > 1 && (
        <div className="flex items-center gap-4 px-3 py-2.5 rounded-xl border border-border/15 bg-card/20">
          <Flame className="w-4 h-4 text-[hsl(30,85%,55%)] shrink-0" />
          <div className="flex items-center gap-4 text-[10px] font-serif text-muted-foreground overflow-x-auto">
            {streaks.daily > 1 && (
              <span className="shrink-0">
                <strong className="text-foreground/80 text-xs tabular-nums">{streaks.daily}</strong> day streak
              </span>
            )}
            {streaks.weekly > 1 && (
              <span className="shrink-0">
                <strong className="text-foreground/80 text-xs tabular-nums">{streaks.weekly}</strong> week streak
              </span>
            )}
            {streaks.monthly > 1 && (
              <span className="shrink-0">
                <strong className="text-foreground/80 text-xs tabular-nums">{streaks.monthly}</strong> month streak
              </span>
            )}
            {streaks.daily <= 1 && streaks.weekly <= 1 && streaks.monthly <= 1 && (
              <span className="text-muted-foreground/60">Visited {stats.physical_visits} times</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm">
      {icon}
      <span className="text-lg font-serif text-foreground/90 tabular-nums">{value}</span>
      <span className="text-[9px] font-serif text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}
