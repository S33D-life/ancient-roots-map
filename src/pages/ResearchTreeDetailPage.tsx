/**
 * ResearchTreeDetailPage — Full Ancient Friend page for research-layer trees.
 *
 * Fetches from research_trees, adapts to Tree shape, renders with shared
 * tree-section components, and provides the conversion review flow.
 */
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Map, Share2, ExternalLink, TreeDeciduous } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TreePageHero,
  TreeStorySection,
  TreeHiveConnections,
  TreeMapJourneyAnchor,
} from "@/components/tree-sections";
import ResearchOriginBadge from "@/components/tree-sections/ResearchOriginBadge";
import ConversionStatusBadge from "@/components/tree-sections/ConversionStatusBadge";
import {
  EmptyOfferings,
  EmptyWishes,
  EmptyWhispers,
} from "@/components/tree-sections/ResearchEmptyStates";
const TreeDiscoveryPaths = lazy(() => import("@/components/tree-sections/TreeDiscoveryPaths"));
import {
  mapResearchTreeToTreeRow,
  type ResearchOrigin,
} from "@/utils/researchTreeToTreeRow";
import {
  getConversionStatus,
  calculateCompleteness,
} from "@/utils/researchConversion";
import { goToTreeOnMap } from "@/utils/mapNavigation";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import type { Database } from "@/integrations/supabase/types";

const PhenologyBadge = lazy(() => import("@/components/PhenologyBadge"));
const ConversionReviewPanel = lazy(() => import("@/components/tree-sections/ConversionReviewPanel"));

type ResearchTreeRow = Database["public"]["Tables"]["research_trees"]["Row"];

const ResearchTreeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [researchRow, setResearchRow] = useState<ResearchTreeRow | null>(null);
  const [sectionTab, setSectionTab] = useState("overview");
  const [userId, setUserId] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) =>
      setUserId(session?.user?.id ?? null)
    );
  }, []);

  // Fetch research tree
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("research_trees")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) console.error("Error fetching research tree:", error);
      setResearchRow(data);
      setLoading(false);
    })();
  }, [id]);

  // Memoized adapters
  const adapted = useMemo(
    () => (researchRow ? mapResearchTreeToTreeRow(researchRow) : null),
    [researchRow]
  );
  const completeness = useMemo(
    () => (researchRow ? calculateCompleteness(researchRow) : null),
    [researchRow]
  );
  const conversionStatus = useMemo(
    () => (researchRow ? getConversionStatus(researchRow) : "research_only"),
    [researchRow]
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!researchRow || !adapted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <TreeDeciduous className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-serif">
            This Ancient Friend could not be found in the Research Grove.
          </p>
          <Link
            to="/map"
            className="block mt-4 text-primary hover:underline font-serif"
          >
            Return to Map
          </Link>
        </div>
      </div>
    );
  }

  const tree = adapted;
  const research: ResearchOrigin = adapted.__research;
  const treeName = tree.name;
  const hive = getHiveForSpecies(tree.species);
  const isConverted = conversionStatus === "converted" || conversionStatus === "featured";

  const handleViewMap = () => {
    goToTreeOnMap(navigate, {
      treeId: tree.id,
      lat: tree.latitude,
      lng: tree.longitude,
      source: "tree",
    });
  };

  const handleShare = async () => {
    if (!tree) return;
    const { buildShareUrl, copyShareLink } = await import("@/utils/shareUtils");
    const entity: import("@/utils/shareUtils").ShareEntity = {
      type: "research_tree",
      id: tree.id,
      name: tree.name || "Research Tree",
      species: tree.species || undefined,
      location: tree.nation || undefined,
    };
    if (navigator.share) {
      const { nativeShare } = await import("@/utils/shareUtils");
      await nativeShare({ entity });
    } else {
      await copyShareLink({ entity });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-20 max-w-4xl">
        {/* Back */}
        <button
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/map")
          }
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 font-serif text-sm tracking-wide transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        {/* ═══ Hero ═══ */}
        <TreePageHero
          tree={tree}
          photoUrl={null}
          onMakeOffering={() => {}}
          onAddWish={() => setSectionTab("overview")}
          onViewMap={handleViewMap}
          onShare={handleShare}
          ecoBelonging={[]}
          onNavigateHive={
            hive ? (slug) => navigate(`/hive/${slug}`) : undefined
          }
        />

        {/* ═══ Status + Completeness bar ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center gap-3 mb-6 flex-wrap"
        >
          <ConversionStatusBadge status={conversionStatus} />
          {completeness && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-border/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness.score}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
              </div>
              <span className="text-[10px] font-serif text-muted-foreground">
                {completeness.score}% complete
              </span>
            </div>
          )}
          {isConverted && (researchRow as any).converted_tree_id && (
            <a
              href={`/tree/${(researchRow as any).converted_tree_id}`}
              className="text-xs font-serif text-primary hover:underline ml-auto"
            >
              View full Ancient Friend page →
            </a>
          )}
        </motion.div>

        {/* ═══ Section Tabs ═══ */}
        <Tabs value={sectionTab} onValueChange={setSectionTab} className="w-full">
          <TabsList className="w-full flex justify-start gap-1 bg-transparent border-b border-border/30 rounded-none px-0 mb-6 overflow-x-auto">
            {["overview", "conversion", "offerings", "whispers", "map"].map(
              (tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="font-serif text-xs tracking-wider capitalize data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent px-4 pb-2 shrink-0"
                >
                  {tab === "overview"
                    ? "Tree"
                    : tab === "conversion"
                    ? "Status"
                    : tab === "map"
                    ? "Map"
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              )
            )}
          </TabsList>

          {/* ── Tree Tab ── */}
          <TabsContent value="overview" className="space-y-8">
            {/* Research origin */}
            <ResearchOriginBadge origin={research} />

            {/* Story */}
            <TreeStorySection tree={tree} ecoBelonging={[]} />

            {/* Measurements */}
            {(research.heightM ||
              research.girthOrStem ||
              research.crownSpread) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border p-5 space-y-3"
                style={{
                  borderColor: "hsl(var(--border) / 0.4)",
                  background: "hsl(var(--card) / 0.5)",
                }}
              >
                <h3 className="text-xs font-serif uppercase tracking-[0.2em] text-muted-foreground">
                  Measurements
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {research.heightM != null && (
                    <div>
                      <p className="text-lg font-serif text-foreground">
                        {research.heightM}m
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Height
                      </p>
                    </div>
                  )}
                  {research.girthOrStem && (
                    <div>
                      <p className="text-lg font-serif text-foreground">
                        {research.girthOrStem}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Girth
                      </p>
                    </div>
                  )}
                  {research.crownSpread && (
                    <div>
                      <p className="text-lg font-serif text-foreground">
                        {research.crownSpread}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Crown
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Hive connections */}
            <TreeHiveConnections species={tree.species} ecoBelonging={[]} />

            {/* Phenology */}
            {tree.species && (
              <div className="flex justify-center">
                <Suspense fallback={null}>
                  <PhenologyBadge
                    speciesKey={tree.species
                      .toLowerCase()
                      .replace(/ /g, "_")}
                    speciesName={tree.species}
                  />
                </Suspense>
              </div>
            )}

            {/* Wishes placeholder */}
            <EmptyWishes treeName={treeName} />
          </TabsContent>

          {/* ── Conversion / Status Tab ── */}
          <TabsContent value="conversion">
            <Suspense
              fallback={
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              }
            >
              <ConversionReviewPanel
                researchTree={researchRow}
                onStatusChange={(newStatus) => {
                  // Optimistic local update
                  setResearchRow((prev) =>
                    prev
                      ? ({ ...prev, conversion_status: newStatus } as any)
                      : prev
                  );
                }}
                onConverted={(newTreeId) => {
                  setResearchRow((prev) =>
                    prev
                      ? ({
                          ...prev,
                          conversion_status: "converted",
                          converted_tree_id: newTreeId,
                        } as any)
                      : prev
                  );
                }}
              />
            </Suspense>
          </TabsContent>

          {/* ── Offerings Tab ── */}
          <TabsContent value="offerings">
            <EmptyOfferings treeName={treeName} />
          </TabsContent>

          {/* ── Whispers Tab ── */}
          <TabsContent value="whispers">
            <EmptyWhispers treeName={treeName} />
          </TabsContent>

          {/* ── Map Tab ── */}
          <TabsContent value="map">
            <TreeMapJourneyAnchor
              treeId={tree.id}
              treeName={tree.name}
              lat={tree.latitude}
              lng={tree.longitude}
            />
          </TabsContent>
        </Tabs>

        {/* ═══ Footer Actions ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            variant="outline"
            size="sm"
            className="font-serif text-xs gap-1.5 border-primary/30"
            onClick={handleViewMap}
          >
            <Map className="h-3.5 w-3.5" /> View on Map
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="font-serif text-xs gap-1.5 border-primary/30"
            onClick={handleShare}
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
          {research.sourceDocUrl && (
            <a
              href={research.sourceDocUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="font-serif text-xs gap-1.5 border-primary/30"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Original Source
              </Button>
            </a>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResearchTreeDetailPage;
