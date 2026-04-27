/**
 * DreamTreesPanel — UI-only Dream Trees gallery (v0.2).
 * "Add Dream Tree" is a coming-soon affordance until persistence lands.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Plus, Sparkles } from "lucide-react";
import { DREAM_TREES, type DreamStatus } from "./dreamTreesConfig";
import { PATH_ARCHETYPES, type PathArchetype } from "./pathArchetypes";

const STATUS_TONE: Record<DreamStatus, string> = {
  Dreaming: "border-border/40 text-muted-foreground bg-muted/30",
  Planned:  "border-amber-600/30 text-amber-700 dark:text-amber-300 bg-amber-500/10",
  Visited:  "border-sky-600/30 text-sky-700 dark:text-sky-300 bg-sky-500/10",
  Mapped:   "border-emerald-600/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
  Offered:  "border-rose-600/30 text-rose-700 dark:text-rose-300 bg-rose-500/10",
  Complete: "border-primary/40 text-primary bg-primary/10",
};

function pathLabel(p: PathArchetype): string {
  return PATH_ARCHETYPES.find(x => x.key === p)?.title ?? p;
}

export default function DreamTreesPanel() {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-sm text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary/80" /> Dream Trees
          </h3>
          <p className="text-[11px] font-serif text-muted-foreground/80 italic mt-0.5 max-w-md">
            Where dream trees become living paths. Choose a calling; the cave will help you walk toward it.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled
          title="Coming soon"
          className="text-xs font-serif h-8"
        >
          <Plus className="w-3 h-3 mr-1" /> Add Dream
        </Button>
      </div>

      <div className="grid gap-2">
        {DREAM_TREES.map((d) => (
          <Card key={d.id} className="border border-border/40 bg-card/50">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-serif text-sm text-foreground leading-snug">{d.title}</p>
                  <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5">
                    {d.speciesOrPlace}
                  </p>
                  <p className="text-[11px] font-serif text-foreground/70 mt-1 italic">
                    {d.reason}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[9px] font-serif shrink-0 ${STATUS_TONE[d.status]}`}>
                  {d.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-serif text-muted-foreground/70">
                  {pathLabel(d.linkedPath)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] font-serif">
                    <Link to={d.mapTo ?? "/map"}>
                      <MapIcon className="w-3 h-3 mr-1" /> Open Map
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    title="Coming soon"
                    className="h-7 text-[11px] font-serif"
                  >
                    Add to Target
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
