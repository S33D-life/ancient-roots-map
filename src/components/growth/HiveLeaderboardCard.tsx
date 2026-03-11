/**
 * HiveLeaderboardCard — friendly monthly leaderboard for a species hive.
 * Shows top guardians this month. Framed as celebration, not competition.
 */
import { useHiveLeaderboard, type LeaderboardEntry } from "@/hooks/use-hive-leaderboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TreePine, Heart, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  family: string;
  accentHsl: string;
  icon: string;
  compact?: boolean;
}

const RANK_LABELS = ["🌳", "🌿", "🌱"];

const HiveLeaderboardCard = ({ family, accentHsl, icon, compact }: Props) => {
  const { data: entries, isLoading } = useHiveLeaderboard(family);

  if (isLoading) {
    return (
      <Card className="bg-card/60 border-border/50">
        <CardContent className="p-4 flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card className="bg-card/60 border-border/50">
        <CardContent className="p-4 text-center py-6">
          <Users className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs font-serif text-muted-foreground">
            No activity this month yet. Be the first guardian!
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayed = compact ? entries.slice(0, 5) : entries;

  return (
    <Card className="bg-card/60 border-border/50 overflow-hidden">
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, hsl(${accentHsl}), transparent)` }} />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <p className="font-serif text-sm" style={{ color: `hsl(${accentHsl})` }}>
            This Month's Guardians
          </p>
        </div>
        <div className="space-y-2">
          {displayed.map((e, i) => (
            <Link
              key={e.user_id}
              to={`/wanderer/${e.user_id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 transition-colors group"
            >
              <span className="text-sm w-5 text-center shrink-0">
                {RANK_LABELS[i] || `${i + 1}`}
              </span>
              <Avatar className="h-7 w-7">
                <AvatarImage src={e.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {(e.display_name || "W")[0]}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-xs font-serif truncate text-foreground group-hover:text-primary transition-colors">
                {e.display_name || "Wanderer"}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <TreePine className="w-3 h-3" />{e.trees_mapped}
                </span>
                <span className="flex items-center gap-0.5">
                  <Heart className="w-3 h-3" style={{ color: `hsl(${accentHsl})` }} />{e.species_hearts}
                </span>
              </div>
            </Link>
          ))}
        </div>
        {compact && entries.length > 5 && (
          <p className="text-[10px] text-center text-muted-foreground font-serif pt-1">
            +{entries.length - 5} more guardians
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default HiveLeaderboardCard;
