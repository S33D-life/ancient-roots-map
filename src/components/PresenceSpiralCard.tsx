/**
 * PresenceSpiralCard — self-contained card that fetches data and renders the spiral.
 * Drop into Hearth dashboard, profile, or any context.
 */
import { Card, CardContent } from "@/components/ui/card";
import { TreeDeciduous, Loader2 } from "lucide-react";
import PresenceSpiral from "@/components/PresenceSpiral";
import { usePresenceSpiral } from "@/hooks/use-presence-spiral";

interface PresenceSpiralCardProps {
  userId: string;
  compact?: boolean;
}

export default function PresenceSpiralCard({ userId, compact = false }: PresenceSpiralCardProps) {
  const { sessions, currentStreak, longestStreak, totalSessions, loading } = usePresenceSpiral(userId);

  if (loading) {
    return (
      <Card className="bg-card/60 backdrop-blur border-border/30">
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (totalSessions === 0 && sessions.length === 0) {
    return (
      <Card className="bg-card/60 backdrop-blur border-border/30">
        <CardContent className="p-6 text-center space-y-2">
          <TreeDeciduous className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm font-serif text-muted-foreground">
            No presence sessions yet
          </p>
          <p className="text-xs text-muted-foreground/60 font-serif">
            Complete a 333-second presence ritual at any tree to begin your spiral.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur border-border/30">
      <CardContent className={compact ? "p-3" : "p-6"}>
        {!compact && (
          <div className="flex items-center gap-2 mb-4">
            <TreeDeciduous className="w-4 h-4 text-primary/60" />
            <h3 className="text-sm font-serif text-primary tracking-wider uppercase">
              Presence Spiral
            </h3>
          </div>
        )}
        <PresenceSpiral
          sessions={sessions}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          totalSessions={totalSessions}
          compact={compact}
        />
      </CardContent>
    </Card>
  );
}
