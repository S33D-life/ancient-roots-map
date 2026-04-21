/**
 * GardenDetailPage — simple page for a single Garden / Orchard.
 *
 * Shows: name, description, open days, notes, a small location preview,
 * and the list of trees that belong to it. Intentionally minimal — this
 * is a foundation page, not a full community surface yet.
 */
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, TreeDeciduous, Calendar, Lock, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGardenBySlug, useGardenTrees } from "@/hooks/use-gardens";
import { useEffect } from "react";

export default function GardenDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: garden, isLoading } = useGardenBySlug(slug);
  const { data: trees = [] } = useGardenTrees(garden?.id);

  useEffect(() => {
    if (garden) {
      document.title = `${garden.name} · Garden · S33D`;
      const desc = garden.description?.slice(0, 155) || `${garden.name} — a living garden on the S33D atlas.`;
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", desc);
    }
  }, [garden]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-serif text-muted-foreground">Listening for this garden…</p>
      </div>
    );
  }

  if (!garden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-serif text-foreground">No garden found by that name.</p>
        <Link to="/map">
          <Button variant="ghost" size="sm" className="font-serif gap-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to the map
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{garden.name} · Garden · S33D</title>
        <meta name="description" content={garden.description?.slice(0, 155) || `${garden.name} — a living garden on the S33D atlas.`} />
        <link rel="canonical" href={`https://www.s33d.life/garden/${garden.slug}`} />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* Back */}
        <Link to="/map" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-serif tracking-wider">
          <ArrowLeft className="w-3.5 h-3.5" />
          Atlas
        </Link>

        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
            {garden.is_public ? (
              <><Globe2 className="w-3 h-3" /> Public garden</>
            ) : (
              <><Lock className="w-3 h-3" /> Private garden</>
            )}
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-wide">{garden.name}</h1>
          {garden.description && (
            <p className="font-serif text-foreground/80 leading-relaxed">{garden.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-serif pt-1">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {garden.latitude.toFixed(4)}, {garden.longitude.toFixed(4)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TreeDeciduous className="w-3.5 h-3.5" />
              {garden.tree_count} {garden.tree_count === 1 ? "tree" : "trees"}
            </span>
            {garden.open_days && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {garden.open_days}
              </span>
            )}
          </div>
        </header>

        {/* Notes */}
        {garden.notes && (
          <Card className="border-border/40 bg-card/40">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif mb-2">
                Notes
              </p>
              <p className="font-serif text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {garden.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Trees in this garden */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg text-foreground tracking-wide">Trees in this garden</h2>
          {trees.length === 0 ? (
            <Card className="border-dashed border-border/40 bg-transparent">
              <CardContent className="p-6 text-center">
                <p className="font-serif text-sm text-muted-foreground italic">
                  No trees have been planted in this garden yet.
                </p>
                <Link to={`/map?addTree=true&gardenId=${garden.id}`}>
                  <Button variant="ghost" size="sm" className="mt-3 font-serif gap-2">
                    <TreeDeciduous className="w-3.5 h-3.5" />
                    Map a tree here
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trees.map((t: any) => (
                <Link key={t.id} to={`/tree/${t.id}`} className="group">
                  <Card className="border-border/40 bg-card/40 hover:border-primary/40 transition-colors overflow-hidden">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {t.photo_thumb_url || t.photo_processed_url ? (
                          <img
                            src={t.photo_thumb_url || t.photo_processed_url}
                            alt={t.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <TreeDeciduous className="w-5 h-5 text-primary/70" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {t.name || t.species}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-serif truncate">
                          {t.variety_name ? `${t.species} · ${t.variety_name}` : t.species}
                          {t.planted_year && ` · planted ${t.planted_year}`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <p className="text-[10px] text-muted-foreground/50 font-serif text-center pt-6">
          A garden is alive · trees, people, and seasons grow with it.
        </p>
      </div>
    </div>
  );
}
