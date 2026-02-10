import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TreeDeciduous, Medal, Crown } from "lucide-react";
import { Loader2 } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  tree_count: number;
}

const rankIcon = (index: number) => {
  if (index === 0) return <Crown className="w-5 h-5 text-primary" />;
  if (index === 1) return <Medal className="w-5 h-5 text-muted-foreground" />;
  if (index === 2) return <Medal className="w-5 h-5 text-accent-foreground" />;
  return <span className="w-5 text-center text-xs font-serif text-muted-foreground">{index + 1}</span>;
};

const DashboardLeaderboard = ({ currentUserId }: { currentUserId?: string }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.rpc("get_tree_leaderboard", { result_limit: 20 });
      if (!error && data) {
        setEntries(data as LeaderboardEntry[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="p-8 text-center">
          <TreeDeciduous className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-serif text-muted-foreground">No trees mapped yet. Be the first!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-serif text-foreground">Top Tree Mappers</h2>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur overflow-hidden">
        <CardContent className="p-0">
          <ul className="divide-y divide-border/30">
            {entries.map((entry, i) => {
              const isCurrentUser = entry.user_id === currentUserId;
              const initials = entry.display_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <li
                  key={entry.user_id}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                    isCurrentUser ? "bg-primary/10" : "hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-center w-7">
                    {rankIcon(i)}
                  </div>
                  <Avatar className="w-9 h-9 border border-border/50">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-serif">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`font-serif text-sm truncate ${isCurrentUser ? "text-primary font-semibold" : "text-foreground"}`}>
                      {entry.display_name}
                      {isCurrentUser && <span className="ml-1.5 text-[10px] text-primary/70">(you)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-serif text-muted-foreground">
                    <TreeDeciduous className="w-3.5 h-3.5" />
                    <span className={isCurrentUser ? "text-primary font-semibold" : ""}>
                      {entry.tree_count}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardLeaderboard;
