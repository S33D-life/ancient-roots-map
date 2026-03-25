/**
 * BugGardenPage → "Council Spark Board"
 * Collective Build Layer — participatory refinement of the ecosystem.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThumbsUp, ChevronRight, Filter, Loader2, Bug, Eye, Lightbulb, Heart, Image as ImageIcon, Sparkles, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BugReportDialog from "@/components/BugReportDialog";
import CouncilSparkIcon from "@/components/CouncilSparkIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import RoadmapLinker from "@/components/bugs/RoadmapLinker";
import { ROADMAP_FEATURES, STAGE_META } from "@/data/roadmap-forest";

type BugReport = {
  id: string;
  created_at: string;
  title: string;
  actual: string;
  expected: string;
  steps: string;
  suggestion: string | null;
  severity: string;
  frequency: string;
  feature_area: string;
  report_type: string;
  status: string;
  upvotes_count: number;
  hearts_awarded_total: number;
  reward_state: string;
  user_id: string;
  triage_notes: string | null;
  screenshot_urls: string[] | null;
  roadmap_feature_slug: string | null;
};

const SEVERITY_COLORS: Record<string, string> = {
  blocker: "bg-destructive/20 text-destructive border-destructive/30",
  major: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  minor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  cosmetic: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  new: "🌱 Planted",
  triaged: "📋 Reviewed",
  in_progress: "🔨 Growing",
  fixed: "✅ Integrated",
  released: "🚀 Released",
  duplicate: "🔗 Duplicate",
  wont_fix: "🚫 Won't Fix",
  need_info: "❓ Need Info",
};

const TYPE_ICONS: Record<string, typeof Bug> = {
  bug: Bug,
  ux_improvement: Eye,
  insight: Lightbulb,
};

const TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  ux_improvement: "Flow",
  insight: "Insight",
};

const BugGardenPage = () => {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [filterArea, setFilterArea] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isCurator, setIsCurator] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [customHearts, setCustomHearts] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "curator")
        .maybeSingle();
      setIsCurator(!!roleData);

      const { data: upvotes } = await supabase
        .from("bug_upvotes")
        .select("bug_id")
        .eq("user_id", user.id);
      setUserUpvotes(new Set((upvotes || []).map((u: any) => u.bug_id)));
    }

    const { data } = await supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setBugs((data as BugReport[]) || []);
    setLoading(false);
  };

  const toggleUpvote = async (bugId: string) => {
    if (!userId) { toast.error("Sign in to upvote"); return; }
    const hasUpvoted = userUpvotes.has(bugId);
    if (hasUpvoted) {
      await supabase.from("bug_upvotes").delete().eq("bug_id", bugId).eq("user_id", userId);
      setUserUpvotes((prev) => { const n = new Set(prev); n.delete(bugId); return n; });
      setBugs((prev) => prev.map((b) => b.id === bugId ? { ...b, upvotes_count: b.upvotes_count - 1 } : b));
    } else {
      await supabase.from("bug_upvotes").insert({ bug_id: bugId, user_id: userId });
      setUserUpvotes((prev) => new Set(prev).add(bugId));
      setBugs((prev) => prev.map((b) => b.id === bugId ? { ...b, upvotes_count: b.upvotes_count + 1 } : b));
    }
  };

  const loadComments = async (bugId: string) => {
    const { data } = await supabase
      .from("bug_comments")
      .select("*")
      .eq("bug_id", bugId)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !userId || !selectedBug) return;
    await supabase.from("bug_comments").insert({
      bug_id: selectedBug.id,
      user_id: userId,
      comment: commentText.trim().slice(0, 2000),
    });
    setCommentText("");
    loadComments(selectedBug.id);
    toast.success("Comment added");
  };

  const updateBugStatus = async (bugId: string, status: string) => {
    await supabase.from("bug_reports").update({ status } as any).eq("id", bugId);
    setBugs((prev) => prev.map((b) => b.id === bugId ? { ...b, status } : b));
    if (selectedBug?.id === bugId) setSelectedBug({ ...selectedBug, status });
    toast.success(`Status → ${STATUS_LABELS[status] || status}`);
  };

  const awardHearts = async (bugId: string, amount: number) => {
    if (!userId || amount < 1) return;
    const { error } = await supabase.rpc("award_bug_hearts", {
      p_bug_id: bugId,
      p_amount: amount,
      p_curator_id: userId,
    });
    if (error) { toast.error(error.message); return; }
    setBugs((prev) => prev.map((b) => b.id === bugId
      ? { ...b, hearts_awarded_total: b.hearts_awarded_total + amount, reward_state: "awarded" } : b));
    if (selectedBug?.id === bugId) {
      setSelectedBug({ ...selectedBug, hearts_awarded_total: selectedBug.hearts_awarded_total + amount, reward_state: "awarded" });
    }
    toast.success(`✨ ${amount} Hearts awarded`);
    setCustomHearts("");
  };

  const filterBugs = (tab: string) => {
    let filtered = bugs;
    if (filterArea !== "all") filtered = filtered.filter((b) => b.feature_area === filterArea);
    if (filterType !== "all") filtered = filtered.filter((b) => b.report_type === filterType);
    switch (tab) {
      case "new": return filtered.filter((b) => ["new", "need_info"].includes(b.status));
      case "progress": return filtered.filter((b) => ["triaged", "in_progress"].includes(b.status));
      case "fixed": return filtered.filter((b) => ["fixed", "released"].includes(b.status));
      case "mine": return filtered.filter((b) => b.user_id === userId);
      default: return filtered;
    }
  };

  // Aggregate stats
  const totalReports = bugs.length;
  const totalHeartsAwarded = bugs.reduce((s, b) => s + b.hearts_awarded_total, 0);
  const fixedCount = bugs.filter(b => ["fixed", "released"].includes(b.status)).length;

  const SparkCard = ({ bug }: { bug: BugReport }) => {
    const TypeIcon = TYPE_ICONS[bug.report_type] || Bug;
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border/40 rounded-lg p-3 hover:border-primary/30 transition-colors cursor-pointer bg-card/40"
        onClick={() => { setSelectedBug(bug); loadComments(bug.id); }}
      >
        <div className="flex items-start gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); toggleUpvote(bug.id); }}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded transition-colors min-w-[36px] min-h-[44px] justify-center ${
              userUpvotes.has(bug.id) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono">{bug.upvotes_count}</span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <TypeIcon className="w-3 h-3 text-muted-foreground shrink-0" />
              <h3 className="text-sm font-medium truncate">{bug.title}</h3>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[bug.severity] || ""}`}>
                {bug.severity}
              </Badge>
              <Badge variant="outline" className="text-[10px]">{bug.feature_area}</Badge>
              {bug.report_type !== "bug" && (
                <Badge variant="outline" className="text-[10px] bg-primary/5">{TYPE_LABELS[bug.report_type]}</Badge>
              )}
              {bug.hearts_awarded_total > 0 && (
                <span className="text-[10px] text-primary flex items-center gap-0.5">
                  <Heart className="w-2.5 h-2.5 fill-primary/40" /> {bug.hearts_awarded_total}
                </span>
              )}
              {bug.roadmap_feature_slug && (() => {
                const rf = ROADMAP_FEATURES.find(f => f.id === bug.roadmap_feature_slug);
                return rf ? (
                  <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                    {rf.symbol || STAGE_META[rf.stage].emoji} {rf.name}
                  </Badge>
                ) : null;
              })()}
              {bug.screenshot_urls && bug.screenshot_urls.length > 0 && (
                <ImageIcon className="w-3 h-3 text-muted-foreground/50" />
              )}
              <span className="text-[10px] text-muted-foreground/60 ml-auto">
                {STATUS_LABELS[bug.status] || bug.status}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1" />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 pb-24 space-y-6" style={{ paddingTop: 'var(--content-top)' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-primary tracking-wide flex items-center gap-2">
              <CouncilSparkIcon className="w-6 h-6" /> Council Sparks
            </h1>
            <p className="text-sm text-muted-foreground/70 font-serif italic">
              Help the garden flow more beautifully.
            </p>
          </div>
          <BugReportDialog />
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sparks", value: totalReports, icon: Sparkles },
            { label: "Integrated", value: fixedCount, icon: Leaf },
            { label: "Hearts Awarded", value: totalHeartsAwarded, icon: Heart },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card/50 border border-border/30 rounded-lg p-3 text-center">
                <div className="text-lg font-serif text-foreground flex items-center justify-center gap-1">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {s.value}
                </div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Habitat Pool teaser */}
        <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-3 text-center">
          <p className="text-xs text-primary/70 font-serif italic">
            Each refinement strengthens both the digital garden and the living one.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="All areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="map">Map</SelectItem>
              <SelectItem value="atlas">Atlas</SelectItem>
              <SelectItem value="hearts">Hearts</SelectItem>
              <SelectItem value="hearth">Hearth</SelectItem>
              <SelectItem value="council">Council</SelectItem>
              <SelectItem value="time_tree">Time Tree</SelectItem>
              <SelectItem value="offerings">Offerings</SelectItem>
              <SelectItem value="library">Library</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bug">🐞 Bugs</SelectItem>
              <SelectItem value="ux_improvement">🌿 Flow</SelectItem>
              <SelectItem value="insight">🌞 Ideas</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[10px] text-muted-foreground/50 ml-auto">
            {bugs.length} total
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="new">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="new" className="text-xs">Planted</TabsTrigger>
              <TabsTrigger value="progress" className="text-xs">Growing</TabsTrigger>
              <TabsTrigger value="fixed" className="text-xs">Integrated</TabsTrigger>
              <TabsTrigger value="mine" className="text-xs">My Sparks</TabsTrigger>
            </TabsList>
            {["new", "progress", "fixed", "mine"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-2 mt-3">
                {filterBugs(tab).length === 0 ? (
                  <p className="text-sm text-muted-foreground/50 text-center py-8 font-serif italic">
                    {tab === "mine" ? "You haven't planted any sparks yet" : "No sparks here — the garden flows smoothly ✨"}
                  </p>
                ) : (
                  filterBugs(tab).map((bug) => <SparkCard key={bug.id} bug={bug} />)
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedBug} onOpenChange={(o) => !o && setSelectedBug(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            {selectedBug && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-serif text-lg flex items-center gap-2">
                    {(() => { const I = TYPE_ICONS[selectedBug.report_type] || Bug; return <I className="w-4 h-4 text-primary" />; })()}
                    {selectedBug.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={SEVERITY_COLORS[selectedBug.severity]}>
                      {selectedBug.severity}
                    </Badge>
                    <Badge variant="outline">{selectedBug.feature_area}</Badge>
                    <Badge variant="outline">{selectedBug.frequency}</Badge>
                    <Badge variant="outline" className="bg-primary/5">{TYPE_LABELS[selectedBug.report_type] || "Bug"}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {STATUS_LABELS[selectedBug.status]}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      {selectedBug.report_type === "bug" ? "What happened" : "Observation"}
                    </p>
                    <p className="text-foreground/80">{selectedBug.actual}</p>
                  </div>
                  {selectedBug.expected && selectedBug.expected !== "N/A" && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Expected</p>
                      <p className="text-foreground/80">{selectedBug.expected}</p>
                    </div>
                  )}
                  {selectedBug.steps && selectedBug.steps !== "Not provided" && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Steps</p>
                      <p className="text-foreground/80 whitespace-pre-wrap">{selectedBug.steps}</p>
                    </div>
                  )}
                  {selectedBug.suggestion && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Suggestion
                      </p>
                      <p className="text-foreground/80">{selectedBug.suggestion}</p>
                    </div>
                  )}

                  {/* Screenshots */}
                  {selectedBug.screenshot_urls && selectedBug.screenshot_urls.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Screenshots</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedBug.screenshot_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="w-20 h-20 rounded-lg overflow-hidden border border-border/40 hover:border-primary/50 transition-colors">
                            <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hearts awarded */}
                  {selectedBug.hearts_awarded_total > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-primary bg-primary/5 rounded-lg px-3 py-2">
                      <Heart className="w-4 h-4 fill-primary/30" />
                      <span className="font-serif">{selectedBug.hearts_awarded_total} Hearts awarded</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">Council Spark</span>
                    </div>
                  )}

                  {/* Roadmap link */}
                  {isCurator && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground font-medium mb-1.5">Roadmap Link</p>
                      <RoadmapLinker
                        bugId={selectedBug.id}
                        currentSlug={selectedBug.roadmap_feature_slug}
                        onLinked={(slug) => {
                          setBugs((prev) => prev.map((b) => b.id === selectedBug.id ? { ...b, roadmap_feature_slug: slug } : b));
                          setSelectedBug({ ...selectedBug, roadmap_feature_slug: slug });
                        }}
                      />
                    </div>
                  )}

                  {/* Curator tools */}
                  {isCurator && (
                    <div className="border-t border-border/40 pt-3 space-y-3">
                      <p className="text-xs font-medium text-primary font-serif">Curator Tools</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["triaged", "in_progress", "fixed", "released", "duplicate", "wont_fix", "need_info"].map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={selectedBug.status === s ? "default" : "outline"}
                            className="text-[10px] h-7"
                            onClick={() => updateBugStatus(selectedBug.id, s)}
                          >
                            {STATUS_LABELS[s]}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2 flex-wrap items-center">
                        <p className="text-[10px] text-muted-foreground">Award Hearts:</p>
                        {[3, 5, 10, 20].map((amt) => (
                          <Button key={amt} size="sm" variant="outline" className="text-xs h-7" onClick={() => awardHearts(selectedBug.id, amt)}>
                            +{amt} ✨
                          </Button>
                        ))}
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={customHearts}
                            onChange={(e) => setCustomHearts(e.target.value)}
                            placeholder="Custom"
                            className="w-16 h-7 text-xs"
                          />
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            disabled={!customHearts || parseInt(customHearts) < 1}
                            onClick={() => awardHearts(selectedBug.id, parseInt(customHearts))}>
                            Award
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  <div className="border-t border-border/40 pt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Comments</p>
                    {comments.map((c: any) => (
                      <div key={c.id} className="text-xs bg-muted/30 rounded p-2">
                        <p>{c.comment}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1">
                          {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {userId && (
                      <div className="flex gap-2">
                        <Textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add a comment…"
                          className="min-h-[40px] text-xs"
                          maxLength={2000}
                        />
                        <Button size="sm" onClick={submitComment} disabled={!commentText.trim()} className="min-h-[44px]">
                          Post
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default BugGardenPage;
