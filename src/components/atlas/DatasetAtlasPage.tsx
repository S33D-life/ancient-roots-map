/**
 * DatasetAtlasPage — Reusable atlas page template for heritage tree datasets.
 *
 * Renders a full atlas page for any dataset registered in DATASET_CONFIGS.
 * Used by HongKongAtlasPage, SingaporeAtlasPage, and future dataset pages.
 *
 * Usage:
 *   <DatasetAtlasPage datasetKey="sg-heritage-trees" narrativeSections={[...]} />
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMapFocus } from "@/hooks/use-map-focus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, TreeDeciduous, Eye, Compass, Globe,
  ArrowRight, Flower2,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";
import PlaceMapPreview from "@/components/atlas/PlaceMapPreview";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { type DatasetConfig, getDatasetConfig } from "@/config/datasetIntegration";

/* ── Types ── */
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

export interface NarrativeSection {
  title: string;
  icon: string | React.ReactNode;
  paragraphs: string[];
}

export interface StorySection {
  title: string;
  icon: string | React.ReactNode;
  paragraphs: string[];
}

interface Props {
  datasetKey: string;
  /** Narrative sections for the Overview tab */
  narrativeSections?: NarrativeSection[];
  /** Story sections for the Stories tab */
  storySections?: StorySection[];
  /** Extra stat to show (4th tile) */
  extraStat?: { label: string; value: number | string; icon: React.ElementType };
}

/* ── Stat Tile ── */
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

const DatasetAtlasPage = ({ datasetKey, narrativeSections = [], storySections = [], extraStat }: Props) => {
  const config = getDatasetConfig(datasetKey);
  if (!config) return <div className="p-8 text-muted-foreground">Dataset not found: {datasetKey}</div>;

  return <DatasetAtlasInner config={config} narrativeSections={narrativeSections} storySections={storySections} extraStat={extraStat} />;
};

const DatasetAtlasInner = ({
  config,
  narrativeSections,
  storySections,
  extraStat,
}: {
  config: DatasetConfig;
  narrativeSections: NarrativeSection[];
  storySections: StorySection[];
  extraStat?: Props["extraStat"];
}) => {
  useDocumentTitle(config.portalTitle);
  const { focusMap } = useMapFocus();
  const [trees, setTrees] = useState<DatasetTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("research_trees")
        .select("id,tree_name,species_common,species_scientific,province,locality_text,latitude,longitude,designation_type,description,height_m,source_program,source_row_ref")
        .eq("country", config.countryName)
        .not("latitude", "is", null)
        .order("tree_name");
      setTrees((data as DatasetTree[]) || []);
      setLoading(false);
    })();
  }, [config.countryName]);

  const speciesCount = useMemo(() => new Set(trees.map(t => t.species_scientific)).size, [trees]);
  const districtCount = useMemo(() => new Set(trees.map(t => t.province).filter(Boolean)).size, [trees]);

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
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                {config.flag} {config.descriptor}
              </Badge>
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
            <StatTile label="Heritage Trees" value={trees.length} icon={TreeDeciduous} />
            <StatTile label="Species" value={speciesCount} icon={Flower2} />
            <StatTile label="Districts" value={districtCount} icon={Compass} />
            {extraStat && <StatTile label={extraStat.label} value={extraStat.value} icon={extraStat.icon} />}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/80 border border-border/40">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="circles">Circles</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="stories">Stories</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {narrativeSections.map((section, i) => (
                <Card key={i} className="border-primary/15 bg-card/70">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      {typeof section.icon === "string" ? <span>{section.icon}</span> : section.icon}
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    {section.paragraphs.map((p, j) => (
                      <p key={j} dangerouslySetInnerHTML={{ __html: p }} />
                    ))}
                  </CardContent>
                </Card>
              ))}

              {/* Tree list */}
              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Ancient Friends ({trees.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Loading heritage trees…</p>
                  ) : trees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No trees seeded yet.</p>
                  ) : (
                    trees.map((t) => (
                      <Link
                        key={t.id}
                        to={`/tree/research/${t.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/15"
                      >
                        <span className="text-lg">🌳</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.tree_name || t.species_common}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.species_common} · {t.province} · {t.designation_type}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
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
                              <p className="text-sm font-medium text-foreground truncate">{t.tree_name}</p>
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

            {/* Stories */}
            <TabsContent value="stories" className="space-y-6 mt-6">
              {storySections.map((section, i) => (
                <Card key={i} className="border-primary/15 bg-card/70">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      {typeof section.icon === "string" ? <span>{section.icon}</span> : section.icon}
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    {section.paragraphs.map((p, j) => (
                      <p key={j} dangerouslySetInnerHTML={{ __html: p }} />
                    ))}
                  </CardContent>
                </Card>
              ))}

              {/* Provenance */}
              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" /> Dataset Provenance
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>{config.provenanceText}</p>
                  <p>
                    All trees enter the S33D system as research-layer records with <code>heritage_status = official_register</code>.
                    They become verified Ancient Friends through community visits, photo confirmations, and stewardship.
                  </p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant="outline" className="text-xs">Source: {config.sourceOrg}</Badge>
                    <Badge variant="outline" className="text-xs">Verification: official_register</Badge>
                    <Badge variant="outline" className="text-xs">Trees: {trees.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageShell>
  );
};

export default DatasetAtlasPage;
