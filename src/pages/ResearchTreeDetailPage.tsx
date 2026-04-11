/**
 * ResearchTreeDetailPage — Full page for research-layer trees.
 * Shows provenance, verification tasks, promotion readiness, and conversion status.
 */
import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Map, Share2, ExternalLink, TreeDeciduous, CheckCircle2, XCircle, ClipboardCheck, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { VerificationTaskCard } from "@/components/research-bridge/VerificationTaskCard";
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
import { useHasRole } from "@/hooks/use-role";
import { generateVerificationTasks, promoteResearchToAncientFriend } from "@/services/research-bridge";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

const PhenologyBadge = lazy(() => import("@/components/PhenologyBadge"));
const ConversionReviewPanel = lazy(() => import("@/components/tree-sections/ConversionReviewPanel"));

type ResearchTreeRow = Database["public"]["Tables"]["research_trees"]["Row"];
type VerificationTask = Database["public"]["Tables"]["verification_tasks"]["Row"];

const ResearchTreeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [researchRow, setResearchRow] = useState<ResearchTreeRow | null>(null);
  const [sectionTab, setSectionTab] = useState("overview");
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<VerificationTask[]>([]);
  const { hasRole: isKeeper } = useHasRole("keeper");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) =>
      setUserId(session?.user?.id ?? null)
    );
  }, []);

  // Fetch research tree + tasks
  useEffect(() => {
    if (!id) return;
    (async () => {
      const [treeRes, taskRes] = await Promise.all([
        supabase.from("research_trees").select("*").eq("id", id).maybeSingle(),
        supabase.from("verification_tasks").select("*").eq("research_tree_id", id).order("created_at", { ascending: false }),
      ]);
      if (treeRes.error) console.error("Error fetching research tree:", treeRes.error);
      setResearchRow(treeRes.data);
      setTasks((taskRes.data || []) as unknown as VerificationTask[]);
      setLoading(false);
    })();
  }, [id]);

  const adapted = useMemo(() => (researchRow ? mapResearchTreeToTreeRow(researchRow) : null), [researchRow]);
  const completeness = useMemo(() => (researchRow ? calculateCompleteness(researchRow) : null), [researchRow]);
  const conversionStatus = useMemo(() => (researchRow ? getConversionStatus(researchRow) : "research_only"), [researchRow]);

  // Promotion readiness
  const readiness = useMemo(() => {
    if (!researchRow) return { coordinates: false, species: false, verified: false, ready: false };
    const coordinates = researchRow.latitude != null && researchRow.longitude != null;
    const species = !!researchRow.species_scientific && researchRow.species_scientific !== "Unknown";
    const verified = tasks.some(t => t.status === "completed");
    return { coordinates, species, verified, ready: coordinates && species && verified };
  }, [researchRow, tasks]);

  const handleGenerateTasks = useCallback(async () => {
    if (!id || !userId) return;
    const { count, error } = await generateVerificationTasks(id, userId);
    if (error) { toast.error(error); return; }
    toast.success(`Created ${count} verification task(s)`);
    const { data } = await supabase.from("verification_tasks").select("*").eq("research_tree_id", id).order("created_at", { ascending: false });
    setTasks((data || []) as unknown as VerificationTask[]);
  }, [id, userId]);

  const handlePromote = useCallback(async () => {
    if (!id || !userId) return;
    const { treeId, error } = await promoteResearchToAncientFriend(id, userId);
    if (error) { toast.error(error); return; }
    toast.success("Promoted to Ancient Friend! 🌳");
    navigate(`/tree/${treeId}`);
  }, [id, userId, navigate]);

  const handleClaimTask = useCallback(async (taskId: string, uid: string) => {
    await supabase.from("verification_tasks").update({ claimed_by: uid, status: "claimed" }).eq("id", taskId);
    toast.success("Task claimed!");
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, claimed_by: uid, status: "claimed" } : t));
  }, []);

  const handleCompleteTask = useCallback(async (taskId: string, notes: string) => {
    await supabase.from("verification_tasks").update({ status: "completed", completed_at: new Date().toISOString(), completion_notes: notes }).eq("id", taskId);
    toast.success("Task completed! 🎉");
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "completed", completion_notes: notes } : t));
  }, []);

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

  if (!researchRow || !adapted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <TreeDeciduous className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-serif">This tree could not be found in the Research Grove.</p>
          <Link to="/map" className="block mt-4 text-primary hover:underline font-serif">Return to Map</Link>
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
    goToTreeOnMap(navigate, { treeId: tree.id, lat: tree.latitude, lng: tree.longitude, source: "tree" });
  };

  const handleShare = async () => {
    if (!tree) return;
    const { buildShareUrl, copyShareLink } = await import("@/utils/shareUtils");
    const entity: import("@/utils/shareUtils").ShareEntity = {
      type: "research_tree", id: tree.id, name: tree.name || "Research Tree",
      species: tree.species || undefined, location: tree.nation || undefined,
    };
    if (navigator.share) {
      const { nativeShare } = await import("@/utils/shareUtils");
      await nativeShare({ entity });
    } else {
      await copyShareLink({ entity });
    }
  };

  const openTasks = tasks.filter(t => t.status === "open").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pb-20 max-w-4xl" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 5rem)" }}>
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/map")}
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 font-serif text-sm tracking-wide transition-colors bg-transparent border-none cursor-pointer p-0">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </button>

        {/* Research indicator banner */}
        <div className="rounded-xl p-3 mb-4 flex items-center gap-3" style={{ background: "hsl(var(--secondary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.12)" }}>
          <Loader2 className="w-4 h-4 text-primary animate-pulse" />
          <p className="text-xs font-serif text-primary/80">
            This is a <strong>Research Grove</strong> tree — not yet confirmed as an Ancient Friend.
            Human verification is required before promotion.
          </p>
        </div>

        <TreePageHero tree={tree} photoUrl={null} onMakeOffering={() => {}} onAddWish={() => setSectionTab("overview")}
          onViewMap={handleViewMap} onShare={handleShare} ecoBelonging={[]}
          onNavigateHive={hive ? (slug) => navigate(`/hive/${slug}`) : undefined} />

        {/* Status + Completeness */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="flex items-center gap-3 mb-6 flex-wrap">
          <ConversionStatusBadge status={conversionStatus} />
          {completeness && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-border/30 overflow-hidden">
                <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${completeness.score}%` }} transition={{ duration: 0.8, delay: 0.4 }} />
              </div>
              <span className="text-[10px] font-serif text-muted-foreground">{completeness.score}% complete</span>
            </div>
          )}
          {isConverted && (researchRow as any).converted_tree_id && (
            <a href={`/tree/${(researchRow as any).converted_tree_id}`} className="text-xs font-serif text-primary hover:underline ml-auto">
              View Ancient Friend page →
            </a>
          )}
        </motion.div>

        {/* Section Tabs */}
        <Tabs value={sectionTab} onValueChange={setSectionTab} className="w-full">
          <TabsList className="w-full flex justify-start gap-1 bg-transparent border-b border-border/30 rounded-none px-0 mb-6 overflow-x-auto">
            {["overview", "verification", "conversion", "offerings", "map"].map((tab) => (
              <TabsTrigger key={tab} value={tab}
                className="font-serif text-xs tracking-wider capitalize data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent px-4 pb-2 shrink-0">
                {tab === "overview" ? "Tree" : tab === "verification" ? `Verify (${tasks.length})` : tab === "conversion" ? "Status" : tab === "map" ? "Map" : tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Tree Tab ── */}
          <TabsContent value="overview" className="space-y-8">
            <ResearchOriginBadge origin={research} />

            {/* Provenance block */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border p-5 space-y-3" style={{ borderColor: "hsl(var(--border) / 0.4)", background: "hsl(var(--card) / 0.5)" }}>
              <h3 className="text-xs font-serif uppercase tracking-[0.2em] text-muted-foreground">Provenance</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-serif">
                <span className="text-muted-foreground">Source</span>
                <span className="text-foreground">{researchRow.source_doc_title || "Unknown"}</span>
                {researchRow.source_doc_url && (
                  <><span className="text-muted-foreground">URL</span>
                  <a href={researchRow.source_doc_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{researchRow.source_doc_url}</a></>
                )}
                <span className="text-muted-foreground">Year</span>
                <span className="text-foreground">{researchRow.source_doc_year || "—"}</span>
                <span className="text-muted-foreground">Program</span>
                <span className="text-foreground">{researchRow.source_program || "—"}</span>
                <span className="text-muted-foreground">Geo Precision</span>
                <span className="text-foreground capitalize">{researchRow.geo_precision || "unknown"}</span>
                <span className="text-muted-foreground">Confidence</span>
                <span className="text-foreground">{researchRow.confidence_score != null ? `${researchRow.confidence_score}%` : "—"}</span>
                <span className="text-muted-foreground">Record Kind</span>
                <span className="text-foreground capitalize">{researchRow.record_kind?.replace(/_/g, " ") || "—"}</span>
              </div>
            </motion.div>

            {/* Promotion readiness */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-xl border p-5 space-y-3" style={{ borderColor: "hsl(var(--border) / 0.4)", background: "hsl(var(--card) / 0.5)" }}>
              <h3 className="text-xs font-serif uppercase tracking-[0.2em] text-muted-foreground">Promotion Readiness</h3>
              <div className="space-y-2">
                {[
                  { label: "Confirmed coordinates", ok: readiness.coordinates },
                  { label: "Confirmed species", ok: readiness.species },
                  { label: "Verification completed", ok: readiness.verified },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs font-serif">
                    {item.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground/40" />}
                    <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                  </div>
                ))}
              </div>
              {isKeeper && readiness.ready && !isConverted && (
                <Button size="sm" variant="sacred" className="mt-2 font-serif text-xs" onClick={handlePromote}>
                  🌳 Promote to Ancient Friend
                </Button>
              )}
              {isKeeper && !readiness.ready && !isConverted && (
                <p className="text-[10px] font-serif text-muted-foreground mt-1">
                  All checks must pass before promotion.
                </p>
              )}
            </motion.div>

            <TreeStorySection tree={tree} ecoBelonging={[]} />

            {(research.heightM || research.girthOrStem || research.crownSpread) && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border p-5 space-y-3" style={{ borderColor: "hsl(var(--border) / 0.4)", background: "hsl(var(--card) / 0.5)" }}>
                <h3 className="text-xs font-serif uppercase tracking-[0.2em] text-muted-foreground">Measurements</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {research.heightM != null && <div><p className="text-lg font-serif text-foreground">{research.heightM}m</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Height</p></div>}
                  {research.girthOrStem && <div><p className="text-lg font-serif text-foreground">{research.girthOrStem}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Girth</p></div>}
                  {research.crownSpread && <div><p className="text-lg font-serif text-foreground">{research.crownSpread}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Crown</p></div>}
                </div>
              </motion.div>
            )}

            <Suspense fallback={null}><TreeDiscoveryPaths species={tree.species} country={tree.nation} /></Suspense>
            <TreeHiveConnections species={tree.species} ecoBelonging={[]} />
            {tree.species && (
              <div className="flex justify-center">
                <Suspense fallback={null}><PhenologyBadge speciesKey={tree.species.toLowerCase().replace(/ /g, "_")} speciesName={tree.species} /></Suspense>
              </div>
            )}
            <EmptyWishes treeName={treeName} />
          </TabsContent>

          {/* ── Verification Tab ── */}
          <TabsContent value="verification" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif text-foreground flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" /> Verification Missions
              </h3>
              {isKeeper && userId && tasks.length === 0 && (
                <Button size="sm" variant="sacred" className="h-7 text-[10px] font-serif" onClick={handleGenerateTasks}>
                  Generate Tasks
                </Button>
              )}
            </div>

            {/* Stats */}
            {tasks.length > 0 && (
              <div className="flex gap-3 text-[10px] font-serif text-muted-foreground">
                <span>{openTasks} open</span>
                <span>{completedTasks} completed</span>
                <span>{tasks.length} total</span>
              </div>
            )}

            {tasks.length === 0 ? (
              <Card className="border-primary/10 bg-card/60">
                <CardContent className="py-8 text-center">
                  <ClipboardCheck className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-serif">
                    No verification tasks yet. {isKeeper ? "Generate tasks to invite wanderers." : "A keeper will create tasks soon."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <VerificationTaskCard
                    key={task.id}
                    task={task as any}
                    userId={userId}
                    onClaim={handleClaimTask}
                    onComplete={handleCompleteTask}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Conversion Tab ── */}
          <TabsContent value="conversion">
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}>
              <ConversionReviewPanel
                researchTree={researchRow}
                onStatusChange={(newStatus) => setResearchRow((prev) => prev ? ({ ...prev, conversion_status: newStatus } as any) : prev)}
                onConverted={(newTreeId) => setResearchRow((prev) => prev ? ({ ...prev, conversion_status: "converted", converted_tree_id: newTreeId } as any) : prev)}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="offerings"><EmptyOfferings treeName={treeName} /></TabsContent>

          <TabsContent value="map">
            <TreeMapJourneyAnchor treeId={tree.id} treeName={tree.name} lat={tree.latitude} lng={tree.longitude} />
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" size="sm" className="font-serif text-xs gap-1.5 border-primary/30" onClick={handleViewMap}>
            <Map className="h-3.5 w-3.5" /> View on Map
          </Button>
          <Button variant="outline" size="sm" className="font-serif text-xs gap-1.5 border-primary/30" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
          {research.sourceDocUrl && (
            <a href={research.sourceDocUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="font-serif text-xs gap-1.5 border-primary/30">
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
