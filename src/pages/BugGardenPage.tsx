import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bug, ThumbsUp, ChevronRight, Filter, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BugReportDialog from "@/components/BugReportDialog";
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

type BugReport = {
  id: string;
  created_at: string;
  title: string;
  actual: string;
  expected: string;
  steps: string;
  severity: string;
  frequency: string;
  feature_area: string;
  status: string;
  upvotes_count: number;
  hearts_awarded_total: number;
  reward_state: string;
  user_id: string;
  triage_notes: string | null;
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
  new: "🌱 New",
  triaged: "📋 Triaged",
  in_progress: "🔨 In Progress",
  fixed: "✅ Fixed",
  released: "🚀 Released",
  duplicate: "🔗 Duplicate",
  wont_fix: "🚫 Won't Fix",
  need_info: "❓ Need Info",
};

const BugGardenPage = () => {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [filterArea, setFilterArea] = useState("all");
  const [isCurator, setIsCurator] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      // Check curator role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "curator")
        .maybeSingle();
      setIsCurator(!!roleData);

      // Load user upvotes
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

  // Curator actions
  const updateBugStatus = async (bugId: string, status: string) => {
    await supabase.from("bug_reports").update({ status } as any).eq("id", bugId);
    setBugs((prev) => prev.map((b) => b.id === bugId ? { ...b, status } : b));
    if (selectedBug?.id === bugId) setSelectedBug({ ...selectedBug, status });
    toast.success(`Status → ${STATUS_LABELS[status] || status}`);
  };

  const awardHearts = async (bugId: string, amount: number) => {
    if (!userId) return;
    const { error } = await supabase.rpc("award_bug_hearts", {
      p_bug_id: bugId,
      p_amount: amount,
      p_curator_id: userId,
    });
    if (error) { toast.error(error.message); return; }
    setBugs((prev) => prev.map((b) => b.id === bugId
      ? { ...b, hearts_awarded_total: b.hearts_awarded_total + amount, reward_state: "awarded" } : b));
    toast.success(`💚 ${amount} Hearts awarded`);
  };

  const filterBugs = (tab: string) => {
    let filtered = bugs;
    if (filterArea !== "all") filtered = filtered.filter((b) => b.feature_area === filterArea);
    switch (tab) {
      case "new": return filtered.filter((b) => ["new", "need_info"].includes(b.status));
      case "progress": return filtered.filter((b) => ["triaged", "in_progress"].includes(b.status));
      case "fixed": return filtered.filter((b) => ["fixed", "released"].includes(b.status));
      case "mine": return filtered.filter((b) => b.user_id === userId);
      default: return filtered;
    }
  };

  const BugCard = ({ bug }: { bug: BugReport }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border/40 rounded-lg p-3 hover:border-primary/30 transition-colors cursor-pointer bg-card/40"
      onClick={() => { setSelectedBug(bug); loadComments(bug.id); }}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); toggleUpvote(bug.id); }}
          className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded transition-colors min-w-[36px] ${
            userUpvotes.has(bug.id) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span className="text-[10px] font-mono">{bug.upvotes_count}</span>
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{bug.title}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[bug.severity] || ""}`}>
              {bug.severity}
            </Badge>
            <Badge variant="outline" className="text-[10px]">{bug.feature_area}</Badge>
            <span className="text-[10px] text-muted-foreground/60">
              {STATUS_LABELS[bug.status] || bug.status}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1" />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 pt-24 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-primary tracking-wide flex items-center gap-2">
              <Bug className="w-6 h-6" /> Bug Garden
            </h1>
            <p className="text-sm text-muted-foreground/70 font-serif">
              Help us grow a healthier ecosystem
            </p>
          </div>
          <BugReportDialog />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="map">Map</SelectItem>
              <SelectItem value="atlas">Atlas</SelectItem>
              <SelectItem value="hearts">Hearts</SelectItem>
              <SelectItem value="hearth">Hearth</SelectItem>
              <SelectItem value="time_tree">Time Tree</SelectItem>
              <SelectItem value="offerings">Offerings</SelectItem>
              <SelectItem value="library">Library</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[10px] text-muted-foreground/50 ml-auto">
            {bugs.length} reports
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="new">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="new" className="text-xs">New</TabsTrigger>
              <TabsTrigger value="progress" className="text-xs">In Progress</TabsTrigger>
              <TabsTrigger value="fixed" className="text-xs">Fixed</TabsTrigger>
              <TabsTrigger value="mine" className="text-xs">My Reports</TabsTrigger>
            </TabsList>
            {["new", "progress", "fixed", "mine"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-2 mt-3">
                {filterBugs(tab).length === 0 ? (
                  <p className="text-sm text-muted-foreground/50 text-center py-8 font-serif">
                    No bugs here — the garden is clear 🌿
                  </p>
                ) : (
                  filterBugs(tab).map((bug) => <BugCard key={bug.id} bug={bug} />)
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Bug Detail Dialog */}
        <Dialog open={!!selectedBug} onOpenChange={(o) => !o && setSelectedBug(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            {selectedBug && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-serif text-lg">{selectedBug.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={SEVERITY_COLORS[selectedBug.severity]}>
                      {selectedBug.severity}
                    </Badge>
                    <Badge variant="outline">{selectedBug.feature_area}</Badge>
                    <Badge variant="outline">{selectedBug.frequency}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {STATUS_LABELS[selectedBug.status]}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">What happened</p>
                    <p className="text-foreground/80">{selectedBug.actual}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Expected</p>
                    <p className="text-foreground/80">{selectedBug.expected}</p>
                  </div>
                  {selectedBug.steps && selectedBug.steps !== "Not provided" && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Steps</p>
                      <p className="text-foreground/80 whitespace-pre-wrap">{selectedBug.steps}</p>
                    </div>
                  )}

                  {selectedBug.hearts_awarded_total > 0 && (
                    <div className="text-xs text-primary">
                      💚 {selectedBug.hearts_awarded_total} Hearts awarded
                    </div>
                  )}

                  {/* Curator triage tools */}
                  {isCurator && (
                    <div className="border-t border-border/40 pt-3 space-y-3">
                      <p className="text-xs font-medium text-primary">Curator Tools</p>
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
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => awardHearts(selectedBug.id, 3)}>
                          +3 💚
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => awardHearts(selectedBug.id, 5)}>
                          +5 💚
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => awardHearts(selectedBug.id, 10)}>
                          +10 💚
                        </Button>
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
                        <Button size="sm" onClick={submitComment} disabled={!commentText.trim()}>
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
