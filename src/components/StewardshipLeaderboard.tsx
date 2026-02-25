/**
 * StewardshipLeaderboard — shows top contributors to a tree's record.
 * Uses the get_stewardship_leaderboard DB function.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface LeaderEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  offering_count: number;
  total_impact: number;
}

interface Props {
  treeId: string;
}

const StewardshipLeaderboard = ({ treeId }: Props) => {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    supabase
      .rpc("get_stewardship_leaderboard", { p_tree_id: treeId, result_limit: 5 })
      .then(({ data }) => {
        if (data) setEntries(data as LeaderEntry[]);
      });
  }, [treeId]);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-serif text-sm tracking-wide text-foreground">Tree Stewards</h3>
      </div>
      <div className="space-y-2">
        {entries.map((e, i) => (
          <div key={e.user_id} className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-mono w-4 text-right">{i + 1}</span>
            <div className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center text-xs font-serif text-primary shrink-0 overflow-hidden">
              {e.avatar_url ? (
                <img src={e.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                (e.display_name || "?")[0]
              )}
            </div>
            <span className="text-sm font-serif text-foreground flex-1 truncate">{e.display_name}</span>
            <span className="text-[10px] text-muted-foreground font-serif">
              {e.offering_count} offering{e.offering_count !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StewardshipLeaderboard;
