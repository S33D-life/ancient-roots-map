/**
 * BloomingMapCard — connect Quest Cave to the seasonal blooming map.
 * Two columns: Individual Bloom and Collective Bloom.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flower2, Globe } from "lucide-react";

interface Props {
  individualTrees: number;
  individualOfferings: number;
  collectiveTrees: number;
  collectiveOfferings: number;
}

export default function BloomingMapCard({
  individualTrees, individualOfferings, collectiveTrees, collectiveOfferings,
}: Props) {
  return (
    <Card className="border border-amber-900/25 bg-gradient-to-br from-rose-50/40 via-card/60 to-emerald-50/30 dark:from-rose-950/10 dark:to-emerald-950/10">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
            <Flower2 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-sm text-foreground">The Blooming Map</h3>
            <p className="text-[11px] font-serif text-muted-foreground/80 italic mt-0.5">
              Your seasonal encounters help grow the Blooming Map — a living record of which trees, species, places, and people are awakening through the year.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/40 bg-card/50 p-2.5 space-y-1.5">
            <div className="text-[10px] font-serif uppercase tracking-wider text-muted-foreground">
              Individual Bloom
            </div>
            <ul className="space-y-1 text-[11px] font-serif text-foreground/80">
              <li className="flex justify-between"><span>Trees met</span><span className="tabular-nums">{individualTrees}</span></li>
              <li className="flex justify-between"><span>Offerings</span><span className="tabular-nums">{individualOfferings}</span></li>
              <li className="flex justify-between text-muted-foreground/70"><span>Four-seasons in progress</span><span>—</span></li>
            </ul>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-2.5 space-y-1.5">
            <div className="text-[10px] font-serif uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3" /> Collective Bloom
            </div>
            <ul className="space-y-1 text-[11px] font-serif text-foreground/80">
              <li className="flex justify-between"><span>Trees mapped</span><span className="tabular-nums">{collectiveTrees}</span></li>
              <li className="flex justify-between"><span>Offerings rooted</span><span className="tabular-nums">{collectiveOfferings}</span></li>
              <li className="flex justify-between text-muted-foreground/70"><span>Species waking</span><span>—</span></li>
            </ul>
          </div>
        </div>

        <Button asChild size="sm" variant="outline" className="w-full h-8 text-[11px] font-serif">
          <Link to="/map">Walk the Blooming Map</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
