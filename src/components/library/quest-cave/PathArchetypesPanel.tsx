/**
 * PathArchetypesPanel — Choose Your Path Today.
 * Four cards: Creator / Pilgrim / Collector / Curator.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Feather, Footprints, BookHeart, Sprout } from "lucide-react";
import { PATH_ARCHETYPES, type PathArchetypeMeta } from "./pathArchetypes";

const ICON_MAP: Record<PathArchetypeMeta["icon"], typeof Feather> = {
  Feather, Footprints, BookHeart, Sprout,
};

export default function PathArchetypesPanel() {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-serif text-sm text-foreground">Choose Your Path Today</h3>
        <p className="text-[11px] font-serif text-muted-foreground/80 italic mt-0.5">
          Reasons for journeying — not rigid roles. You may walk more than one.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PATH_ARCHETYPES.map((p) => {
          const Icon = ICON_MAP[p.icon];
          return (
            <Card key={p.key} className="border border-border/40 bg-card/50 hover:border-primary/40 transition-colors">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div
                    className="p-1.5 rounded-lg border shrink-0"
                    style={{ backgroundColor: `${p.accent}1A`, borderColor: `${p.accent}55` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: p.accent }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-sm text-foreground leading-snug">{p.title}</p>
                    <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5">
                      {p.hint}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="w-full h-8 text-[11px] font-serif">
                  <Link to={p.ctaTo}>
                    {p.ctaLabel} <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
