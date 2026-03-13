import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Globe, Mountain, Droplets, Leaf, TreeDeciduous, ArrowRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";


interface BioRegion {
  id: string;
  name: string;
  type: string;
  countries: string[];
  climate_band: string | null;
  elevation_range: string | null;
  dominant_species: string[];
  governance_status: string;
  center_lat: number | null;
  center_lon: number | null;
}

const typeEmoji = (t: string) => {
  if (t.includes("Mountain")) return "🏔️";
  if (t.includes("Wetland")) return "🌊";
  if (t.includes("Forest")) return "🌲";
  if (t.includes("Watershed")) return "💧";
  return "🌍";
};

const BioRegionsIndexPage = () => {
  const [regions, setRegions] = useState<BioRegion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("bio_regions")
        .select("id, name, type, countries, climate_band, elevation_range, dominant_species, governance_status, center_lat, center_lon, parent_id")
        .order("name");
      if (data) setRegions(data as unknown as BioRegion[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24 pt-16">
        <section className="relative px-4 pt-10 pb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl mx-auto text-center">
            <div className="mb-4">
              <AtlasBreadcrumb segments={[{ label: "Bio-Regions" }]} />
            </div>

            <Badge variant="outline" className="mb-3 text-[10px] border-primary/30 text-primary">
              <Layers className="w-3 h-3 mr-1" /> Ecological Navigation Layer
            </Badge>

            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
              Bio-Regions
            </h1>
            <p className="text-sm text-muted-foreground italic mb-6 max-w-lg mx-auto leading-relaxed">
              Ecological systems rather than political ones — mountains, watersheds,
              wetlands, and forest biomes that define how life actually organises itself on Earth.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Button variant="outline" size="sm" asChild>
                <Link to="/atlas"><Globe className="w-3.5 h-3.5 mr-1" /> Countries</Link>
              </Button>
              <Button variant="outline" size="sm" className="border-primary/30 text-primary" disabled>
                <Layers className="w-3.5 h-3.5 mr-1" /> Bio-Regions
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/hives"><TreeDeciduous className="w-3.5 h-3.5 mr-1" /> Species Hives</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="px-4 max-w-3xl mx-auto">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-12">Loading bio-regions…</p>
          ) : regions.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-12">No bio-regions yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {regions.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Link to={`/atlas/bio-regions/${r.id}`}>
                    <Card className="border-primary/10 hover:border-primary/30 transition-all group cursor-pointer">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
                              {typeEmoji(r.type)} {r.name}
                            </h2>
                            <p className="text-xs text-muted-foreground">{r.type}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">{r.governance_status}</Badge>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {r.countries.map(c => (
                            <Badge key={c} variant="outline" className="text-[10px]"><Globe className="w-2.5 h-2.5 mr-0.5" /> {c}</Badge>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {r.elevation_range && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground"><Mountain className="w-2.5 h-2.5 mr-0.5" /> {r.elevation_range}</Badge>
                          )}
                          {r.climate_band && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">{r.climate_band}</Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] text-muted-foreground"><Leaf className="w-2.5 h-2.5 mr-0.5" /> {r.dominant_species.length} species</Badge>
                        </div>

                        <div className="flex justify-end">
                          <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Explore <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
      
    </PageShell>
  );
};

export default BioRegionsIndexPage;
