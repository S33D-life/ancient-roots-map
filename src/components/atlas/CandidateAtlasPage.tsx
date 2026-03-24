/**
 * CandidateAtlasPage — Atlas page for candidate expansion regions.
 * Prioritises mapped trees and regions first, readiness info second.
 * Follows the same data-loading pattern as DatasetAtlasPage.
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMapFocus } from "@/hooks/use-map-focus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageShell from "@/components/PageShell";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";
import PlaceMapPreview from "@/components/atlas/PlaceMapPreview";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { getDatasetConfig } from "@/config/datasetIntegration";
import {
  TreeDeciduous, Compass, Telescope, BookOpen, MapPin,
  Layers, Sprout, Globe, Flower2, ArrowRight, Eye,
} from "lucide-react";

interface DatasetTree {
  id: string;
  tree_name: string | null;
  species_common: string | null;
  species_scientific: string;
  province: string | null;
  locality_text: string;
  latitude: number | null;
  longitude: number | null;
  designation_type: string;
  description: string | null;
  height_m: number | null;
  source_program: string;
  source_row_ref: string | null;
}

interface Props {
  datasetKey: string;
  readinessNotes: string;
}

const StatTile = ({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) => (
  <Card className="border-primary/15 bg-card/60 backdrop-blur-sm">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xl font-serif font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

interface MappedTree {
  id: string;
  name: string;
  species: string | null;
  nation: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
}

const CandidateAtlasPage = ({ datasetKey, readinessNotes }: Props) => {
  const config = getDatasetConfig(datasetKey);
  useDocumentTitle(config?.portalTitle ?? "Candidate Region");
  const { focusMap } = useMapFocus();
  const [trees, setTrees] = useState<DatasetTree[]>([]);
  const [mappedTrees, setMappedTrees] = useState<MappedTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!config) return;
    (async () => {
      setLoading(true);
      // Fetch research trees and community-mapped trees in parallel
      const [researchResult, mappedResult] = await Promise.all([
        supabase
          .from("research_trees")
          .select("id,tree_name,species_common,species_scientific,province,locality_text,latitude,longitude,designation_type,description,height_m,source_program,source_row_ref")
          .eq("country", config.countryName)
          .not("latitude", "is", null)
          .order("tree_name"),
        supabase
          .from("trees")
          .select("id,name,species,nation,state,latitude,longitude")
          .ilike("nation", `%${config.countryName}%`)
          .not("latitude", "is", null)
          .order("name")
          .limit(200),
      ]);
      setTrees((researchResult.data as DatasetTree[]) || []);
      setMappedTrees((mappedResult.data as MappedTree[]) || []);
      setLoading(false);
    })();
  }, [config?.countryName]);

  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-8 text-muted-foreground">Dataset config not found: {datasetKey}</div>
      </div>
    );
  }

  const allSpecies = new Set([
    ...trees.map(t => t.species_scientific).filter(Boolean),
    ...mappedTrees.map(t => t.species).filter(Boolean),
  ]);
  const speciesCount = allSpecies.size;
  const regionSet = new Set([
    ...trees.map(t => t.province).filter(Boolean),
    ...mappedTrees.map(t => t.state).filter(Boolean),
  ]);
  const regionCount = regionSet.size;
  const regions = Array.from(regionSet).sort();
  const totalTreeCount = trees.length + mappedTrees.length;
  const hasTrees = totalTreeCount > 0;

  const bbox = {
    south: config.bbox[0],
    west: config.bbox[1],
    north: config.bbox[2],
    east: config.bbox[3],
  };

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <AtlasBreadcrumb segments={[
            { label: "Atlas", to: "/atlas" },
            { label: config.countryName },
          ]} />

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-card via-card/80 to-primary/5 p-8 md:p-12"
          >
            <div className="absolute top-4 right-4 flex gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                {config.flag} {config.descriptor}
              </Badge>
              {!hasTrees && !loading && (
                <Badge variant="outline" className="border-accent/40 text-accent-foreground text-xs">
                  Candidate Region
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
              {config.portalTitle}
            </h1>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              {config.portalSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                size="sm"
                onClick={() => focusMap({
                  type: "area",
                  id: config.countrySlug,
                  center: config.center,
                  bbox: config.bbox,
                  source: "country",
                  countrySlug: config.countrySlug,
                  researchLayer: "on",
                })}
              >
                <MapPin className="w-4 h-4 mr-1" /> Open on Map
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={config.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-1" /> {config.sourceOrg}
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Ancient Friends" value={loading ? "…" : totalTreeCount} icon={TreeDeciduous} />
            <StatTile label="Species" value={loading ? "…" : speciesCount} icon={Flower2} />
            <StatTile label="Regions" value={loading ? "…" : regionCount} icon={Compass} />
            <StatTile label="Circles" value={config.circles.length} icon={Layers} />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/80 border border-border/40">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="circles">Circles</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>

            {/* Overview — Trees & Regions first */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Tree list */}
              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <TreeDeciduous className="w-5 h-5 text-primary" />
                    Ancient Friends ({loading ? "…" : trees.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Loading trees…</p>
                  ) : trees.length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                      <TreeDeciduous className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                      <p className="text-sm text-muted-foreground">No Ancient Friends mapped here yet</p>
                      <p className="text-xs text-muted-foreground">Trees will appear once seed data is curated and reviewed.</p>
                    </div>
                  ) : (
                    trees.slice(0, 20).map((t) => (
                      <Link
                        key={t.id}
                        to={`/tree/research/${t.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/15"
                      >
                        <span className="text-lg">🌳</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.tree_name || t.species_common || "Unnamed tree"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.species_common} · {t.province} · {t.designation_type}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </Link>
                    ))
                  )}
                  {trees.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing 20 of {trees.length} trees. Open the map to explore all.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Regions */}
              {regions.length > 0 && (
                <Card className="border-primary/15 bg-card/70">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Compass className="w-5 h-5 text-primary" />
                      Regions ({regionCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {regions.map((r) => {
                        const count = trees.filter(t => t.province === r).length;
                        return (
                          <Badge
                            key={r}
                            variant="outline"
                            className="text-xs border-primary/20 text-foreground cursor-default"
                          >
                            {r} · {count}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Circles */}
            <TabsContent value="circles" className="space-y-6 mt-6">
              {config.circles.map((circle) => {
                const circleTrees = trees.filter(t => t.source_row_ref?.startsWith(circle.refPrefix));
                return (
                  <Card key={circle.key} className="border-primary/15 bg-card/70">
                    <CardHeader>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <span>{circle.icon}</span> {circle.label}
                        <Badge variant="outline" className="ml-auto text-xs">{circleTrees.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {circleTrees.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No trees in this circle yet.</p>
                      ) : (
                        circleTrees.map((t) => (
                          <Link
                            key={t.id}
                            to={`/tree/research/${t.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
                          >
                            <TreeDeciduous className="w-4 h-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{t.tree_name || t.species_common}</p>
                              <p className="text-xs text-muted-foreground">{t.species_common} · {t.province}</p>
                            </div>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Map */}
            <TabsContent value="map" className="mt-6">
              <Card className="border-primary/15 bg-card/70 overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-[400px] md:h-[500px]">
                    <PlaceMapPreview
                      bbox={bbox}
                      placeType="city"
                      placeCode={config.countrySlug}
                      countrySlug={config.countrySlug}
                      defaultFilters={{ researchLayer: "on" }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Status — readiness info moved here */}
            <TabsContent value="status" className="space-y-6 mt-6">
              {/* Region Status */}
              <Card className="border-border/40 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Compass className="w-4 h-4 text-primary" />
                    Region Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground">Phase</span>
                      <p className="font-medium text-foreground">{hasTrees ? "Data Seeded" : "Config Scaffolded"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Descriptor</span>
                      <p className="font-medium text-foreground">{config.descriptor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data Format</span>
                      <p className="font-medium text-foreground capitalize">{config.dataFormat.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Source Org</span>
                      <p className="font-medium text-foreground">{config.sourceOrg}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Readiness Notes */}
              <Card className="border-border/40 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Readiness Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{readinessNotes}</p>
                  {config.provenanceText && (
                    <p className="text-sm text-muted-foreground mt-2 italic">{config.provenanceText}</p>
                  )}
                </CardContent>
              </Card>

              {/* Key Sources */}
              {config.keySources && config.keySources.length > 0 && (
                <Card className="border-border/40 bg-card/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Telescope className="w-4 h-4 text-primary" />
                      Data Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {config.keySources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline"
                      >
                        {s.label} ↗
                      </a>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Dataset Provenance */}
              <Card className="border-border/40 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Dataset Provenance
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>{config.provenanceText || "Provenance details will be added as data sources are verified."}</p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant="outline" className="text-xs">Source: {config.sourceOrg}</Badge>
                    <Badge variant="outline" className="text-xs">Trees: {trees.length}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Seed Plan CTA */}
              {!hasTrees && (
                <Card className="bg-card/60 border-accent/20">
                  <CardContent className="py-8 text-center space-y-3">
                    <Sprout className="w-8 h-8 text-accent/60 mx-auto" />
                    <p className="text-muted-foreground text-sm">
                      Seed data has not yet been added for this region.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link to={`/seed-plan-generator?dataset=${datasetKey}`}>
                        <Sprout className="w-3.5 h-3.5 mr-1" /> Open Seed-Plan Generator
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Navigation */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/atlas-expansion">
              <Button variant="outline" size="sm" className="gap-1">
                <MapPin className="w-3.5 h-3.5" /> Expansion Map
              </Button>
            </Link>
            <Link to="/discovery-agent">
              <Button variant="outline" size="sm" className="gap-1">
                <Telescope className="w-3.5 h-3.5" /> Discovery Agent
              </Button>
            </Link>
            <Link to="/tree-data-commons">
              <Button variant="outline" size="sm" className="gap-1">
                <Layers className="w-3.5 h-3.5" /> Tree Data Commons
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default CandidateAtlasPage;
