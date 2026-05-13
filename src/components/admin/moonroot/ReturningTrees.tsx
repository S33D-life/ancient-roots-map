import { Card, CardContent } from "@/components/ui/card";
import { TreePine } from "lucide-react";
import type { AncientFriendsSummary } from "@/lib/moonroot/types";

export default function ReturningTrees({ summary }: { summary: AncientFriendsSummary }) {
  if (!summary.returningTrees.length && summary.longestStreakDays < 2) return null;

  return (
    <div className="space-y-3">
      {summary.returningTrees.length > 0 && (
        <div className="space-y-2">
          {summary.returningTrees.map((t) => (
            <Card key={t.id} className="bg-card/50 border-primary/10">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <TreePine className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-sm text-foreground truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground font-serif italic truncate">
                    {t.species}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-serif tracking-wide whitespace-nowrap">
                  {t.visits} returns
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {summary.longestStreakDays >= 2 && (
        <div className="text-xs text-muted-foreground font-serif italic text-center">
          Longest rhythm this moon — {summary.longestStreakDays} days in a row.
        </div>
      )}
    </div>
  );
}
