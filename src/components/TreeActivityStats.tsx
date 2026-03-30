/**
 * TreeActivityStats — shows collective life/activity stats
 * for an Ancient Friend: physical visits, unique wanderers, digital encounters.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Users, Eye } from "lucide-react";

interface TreeActivityStatsProps {
  treeId: string;
  compact?: boolean;
}

interface Stats {
  physical_visits: number;
  unique_wanderers: number;
  digital_encounters: number;
}

export default function TreeActivityStats({ treeId, compact = false }: TreeActivityStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!treeId) return;
    supabase
      .rpc("get_tree_activity_stats", { p_tree_id: treeId })
      .then(({ data }) => {
        if (data) setStats(data as unknown as Stats);
      });
  }, [treeId]);

  if (!stats) return null;

  // Don't show if completely empty
  if (stats.physical_visits === 0 && stats.digital_encounters === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-[10px] font-serif text-muted-foreground">
        {stats.physical_visits > 0 && (
          <span className="flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />
            {stats.physical_visits}
          </span>
        )}
        {stats.unique_wanderers > 0 && (
          <span className="flex items-center gap-1">
            <Users className="w-2.5 h-2.5" />
            {stats.unique_wanderers}
          </span>
        )}
        {stats.digital_encounters > 0 && (
          <span className="flex items-center gap-1">
            <Eye className="w-2.5 h-2.5" />
            {stats.digital_encounters}
          </span>
        )}
      </div>
    );
  }

  return (
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
