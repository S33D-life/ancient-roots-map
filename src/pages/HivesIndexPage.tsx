import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllHives, type HiveInfo, getHiveForSpecies } from "@/utils/hiveUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";

const HivesIndexPage = () => {
  const allHives = useMemo(() => getAllHives(), []);
  const [treeCounts, setTreeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("trees")
        .select("species");
      const counts: Record<string, number> = {};
      (data || []).forEach(t => {
        const hive = getHiveForSpecies(t.species);
        if (hive) {
          counts[hive.family] = (counts[hive.family] || 0) + 1;
        }
      });
      setTreeCounts(counts);
      setLoading(false);
    };
    fetchCounts();
  }, []);

  const filteredHives = useMemo(() => {
    if (!search) return allHives;
    const q = search.toLowerCase();
    return allHives.filter(h =>
      h.displayName.toLowerCase().includes(q) ||
      h.family.toLowerCase().includes(q) ||
      h.representativeSpecies.some(sp => sp.toLowerCase().includes(q))
    );
  }, [allHives, search]);

  // Sort by tree count descending
  const sortedHives = useMemo(() => {
    return [...filteredHives].sort((a, b) => (treeCounts[b.family] || 0) - (treeCounts[a.family] || 0));
  }, [filteredHives, treeCounts]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-wide mb-2">Species Hives</h1>
          <p className="text-muted-foreground font-serif mb-6 max-w-2xl">
            Explore the living botanical families of the Ancient Friends grove. Each hive is a shared commons of trees, offerings, and ecological knowledge.
          </p>

          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search hives or species…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 font-serif text-sm"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedHives.map((hive, i) => {
              const count = treeCounts[hive.family] || 0;
              return (
                <motion.div
                  key={hive.family}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/hive/${hive.slug}`}>
                    <Card
                      className="bg-card/60 backdrop-blur border-border/50 hover:border-primary/30 transition-all cursor-pointer group h-full"
                      style={{
                        borderLeftWidth: 3,
                        borderLeftColor: `hsl(${hive.accentHsl})`,
                      }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{hive.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif text-foreground group-hover:text-primary transition-colors text-lg">
                              {hive.displayName}
                            </h3>
                            <p className="text-xs text-muted-foreground font-serif mt-1 line-clamp-2">
                              {hive.description}
                            </p>
                            <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground font-serif">
                              <span>{count} tree{count !== 1 ? "s" : ""}</span>
                              <span>·</span>
                              <span>{hive.representativeSpecies.length} species</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HivesIndexPage;
