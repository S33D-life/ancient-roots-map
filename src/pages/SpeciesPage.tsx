/**
 * SpeciesPage — Treeasurus view for a single species.
 *
 * URL: /species/:slug
 * Sections: header (sci + common), multilingual names, lore snippets,
 * mapped trees of this species, link back to the hive (family).
 *
 * This is the foundation page — minimal, alive, and connected to the
 * existing hive + tree mapping system.
 */
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Languages, MapPin, TreeDeciduous, BookOpen, Globe2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useSpeciesBySlug,
  useSpeciesNames,
  useSpeciesLore,
  useSpeciesTrees,
} from "@/hooks/use-treeasurus";
import { getHiveInfo } from "@/utils/hiveUtils";

const CATEGORY_LABEL: Record<string, string> = {
  folklore: "Folklore",
  medicinal: "Medicinal",
  ecological: "Ecological",
  symbolic: "Symbolic",
  stewardship: "Stewardship",
  food: "Food",
  craft: "Craft",
  other: "Other",
};

export default function SpeciesPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: species, isLoading } = useSpeciesBySlug(slug);
  const { data: names = [] } = useSpeciesNames(species?.id);
  const { data: lore = [] } = useSpeciesLore(species?.id);
  const { data: trees = [] } = useSpeciesTrees(species?.species_key);
  const hive = species?.family ? getHiveInfo(species.family) : null;

  useEffect(() => {
    if (species) {
      const title = `${species.canonical_common_name || species.common_name} · Treeasurus · S33D`;
      document.title = title;
      const desc = species.description_short?.slice(0, 155)
        || `${species.canonical_common_name || species.common_name} — names, lore and mapped trees in the S33D Treeasurus.`;
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", desc);
    }
  }, [species]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-serif text-muted-foreground">Listening for this species…</p>
      </div>
    );
  }

  if (!species) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-serif text-foreground">No species found by that name.</p>
        <Link to="/hives">
          <Button variant="ghost" size="sm" className="font-serif gap-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to the Hives
          </Button>
        </Link>
      </div>
    );
  }

  // Group names by language for display
  const namesByLang = new Map<string, typeof names>();
  for (const n of names) {
    const key = n.language_code || "_other";
    const arr = namesByLang.get(key) || [];
    arr.push(n);
    namesByLang.set(key, arr);
  }

  const displayCommon = species.canonical_common_name || species.common_name;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-8">
        {/* Back */}
        <Link
          to={hive ? `/hive/${hive.slug}` : "/hives"}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-serif tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {hive ? hive.displayName : "Hives"}
        </Link>

        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
            <Sparkles className="w-3 h-3" /> Treeasurus
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-wide">
            {displayCommon}
          </h1>
          {species.scientific_name && (
            <p className="font-serif italic text-muted-foreground text-lg">
              {species.scientific_name}
            </p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-serif pt-1">
            {species.family && (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-muted-foreground/50">Family</span>
                <span className="text-foreground">{species.family}</span>
              </span>
            )}
            {species.genus && (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-muted-foreground/50">Genus</span>
                <span className="text-foreground italic">{species.genus}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <TreeDeciduous className="w-3.5 h-3.5" />
              {trees.length} mapped {trees.length === 1 ? "tree" : "trees"}
            </span>
          </div>

          {species.description_short && (
            <p className="font-serif text-foreground/80 leading-relaxed pt-2">
              {species.description_short}
            </p>
          )}
        </header>

        {/* Multilingual names */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-primary/70" />
            <h2 className="font-serif text-lg text-foreground tracking-wide">Names across the world</h2>
          </div>
          {names.length === 0 ? (
            <Card className="border-dashed border-border/40 bg-transparent">
              <CardContent className="p-4">
                <p className="font-serif text-sm text-muted-foreground italic">
                  No alternate names recorded yet — this is where many tongues will gather.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from(namesByLang.entries()).map(([lang, list]) => (
                <Card key={lang} className="border-border/40 bg-card/40">
                  <CardContent className="p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
                      {list[0].language_name || lang}
                      {list[0].region && (
                        <span className="normal-case tracking-normal text-muted-foreground/60">
                          {" "}· {list[0].region}
                        </span>
                      )}
                    </p>
                    <ul className="space-y-0.5">
                      {list.map((n) => (
                        <li
                          key={n.id}
                          className="text-sm font-serif text-foreground flex items-baseline gap-2"
                        >
                          <span>{n.name}</span>
                          {n.is_primary && (
                            <span className="text-[9px] uppercase tracking-wider text-primary/70">primary</span>
                          )}
                          {n.transliteration && (
                            <span className="text-[10px] text-muted-foreground/60 italic">
                              [{n.transliteration}]
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Lore */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary/70" />
            <h2 className="font-serif text-lg text-foreground tracking-wide">Lore & knowledge</h2>
          </div>
          {lore.length === 0 ? (
            <Card className="border-dashed border-border/40 bg-transparent">
              <CardContent className="p-4">
                <p className="font-serif text-sm text-muted-foreground italic">
                  No lore yet — folklore, medicine, ecology, and craft will gather here over time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {lore.map((entry) => (
                <Card key={entry.id} className="border-border/40 bg-card/40">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-widest text-primary/80 font-serif">
                        {CATEGORY_LABEL[entry.category] || entry.category}
                      </span>
                      {entry.geography && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-serif">
                          <Globe2 className="w-2.5 h-2.5" />
                          {entry.geography}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-base text-foreground">{entry.title}</h3>
                    <p className="font-serif text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {entry.body}
                    </p>
                    {entry.source && (
                      <p className="text-[10px] text-muted-foreground/60 font-serif italic pt-1">
                        Source: {entry.source}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Mapped trees */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary/70" />
            <h2 className="font-serif text-lg text-foreground tracking-wide">Mapped trees of this species</h2>
          </div>
          {trees.length === 0 ? (
            <Card className="border-dashed border-border/40 bg-transparent">
              <CardContent className="p-4">
                <p className="font-serif text-sm text-muted-foreground italic">
                  No trees of this species have been mapped yet.
                </p>
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
                          {t.name || displayCommon}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-serif truncate">
                          {t.variety_name && <span className="italic">{t.variety_name} · </span>}
                          {t.country || `${t.latitude?.toFixed(2)}, ${t.longitude?.toFixed(2)}`}
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
          Treeasurus · a living bridge between language, ecology, culture, and care.
        </p>
      </div>
    </div>
  );
}
