import { Card, CardContent } from "@/components/ui/card";
import { TreePine, Footprints, Sparkles, Music, Image as ImageIcon, MessageCircle, Inbox, Heart } from "lucide-react";
import type { AncientFriendsSummary } from "@/lib/moonroot/types";

const ITEMS: Array<{ key: keyof AncientFriendsSummary; label: string; icon: any }> = [
  { key: "treesMappedCount", label: "Trees mapped", icon: TreePine },
  { key: "treesVisitedCount", label: "Trees visited", icon: Footprints },
  { key: "totalVisitsCount", label: "Total visits", icon: Footprints },
  { key: "offeringsCount", label: "Offerings", icon: Sparkles },
  { key: "songsCount", label: "Songs", icon: Music },
  { key: "photosCount", label: "Photos", icon: ImageIcon },
  { key: "whispersSentCount", label: "Whispers sent", icon: MessageCircle },
  { key: "whispersReceivedCount", label: "Whispers received", icon: Inbox },
  { key: "heartsEarnedCount", label: "S33D Hearts earned", icon: Heart },
];

export default function DigestSummaryCards({ summary }: { summary: AncientFriendsSummary }) {
  const allZero = ITEMS.every((i) => Number(summary[i.key]) === 0);

  if (allZero) {
    return (
      <Card className="bg-card/60 border-primary/20">
        <CardContent className="p-6 text-center font-serif italic text-muted-foreground">
          No Ancient Friends activity found in this moon window yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const value = Number(summary[it.key]) || 0;
          return (
            <Card key={String(it.key)} className="bg-card/60 border-primary/15">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-serif text-foreground leading-none">{value}</div>
                  <div className="text-xs text-muted-foreground font-serif tracking-wide mt-1">{it.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {summary.topTree && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-4 font-serif text-sm">
            <span className="text-muted-foreground">Most-visited Ancient Friend: </span>
            <span className="text-primary font-medium">{summary.topTree.name}</span>
            <span className="text-muted-foreground"> ({summary.topTree.species}) — {summary.topTree.visits} visit{summary.topTree.visits === 1 ? "" : "s"}</span>
          </CardContent>
        </Card>
      )}

      {summary.speciesConnectedWith.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summary.speciesConnectedWith.map((s) => (
            <span key={s} className="text-xs px-2 py-1 rounded-full bg-secondary/40 text-secondary-foreground font-serif italic">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
