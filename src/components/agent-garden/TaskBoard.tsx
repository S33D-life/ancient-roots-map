/**
 * TaskBoard — Garden of Invitations for co-creators.
 * Lists open tasks, shows detail with proof requirements, handles submissions.
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CATEGORY_SKILLS, SKILLS } from "@/components/library/SkillViewer";
import {
  Heart, ListChecks, ChevronRight, ArrowLeft, Send,
  MapPin, Bug, GitBranch, Microscope, CheckCircle,
  Clock, Eye, Award, Loader2, Sprout, BookOpen
} from "lucide-react";

/* ── Types ── */
interface GardenTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  purpose: string | null;
  proof_requirements: string | null;
  system_area: string;
  hearts_reward: number;
  reward_min: number;
  reward_max: number;
  status: string;
  task_type: string;
  region: string | null;
  country: string | null;
  species: string | null;
  max_submissions: number;
  submissions_count: number;
  created_at: string;
}

interface TaskSubmission {
  id: string;
  task_id: string;
  submitted_by: string;
  proof_text: string;
  proof_url: string | null;
  status: string;
  reviewer_notes: string | null;
  hearts_awarded: number;
  created_at: string;
}

const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  tree_data:    { icon: <MapPin className="w-4 h-4" />,     label: "Tree Data",           color: "bg-primary/15 text-primary border-primary/30" },
  bug_qa:       { icon: <Bug className="w-4 h-4" />,        label: "Bug / QA",            color: "bg-destructive/15 text-destructive border-destructive/30" },
  roadmap:      { icon: <GitBranch className="w-4 h-4" />,  label: "Roadmap & Features",  color: "bg-accent/15 text-accent-foreground border-accent/30" },
  research:     { icon: <Microscope className="w-4 h-4" />, label: "Research Verification", color: "bg-secondary text-secondary-foreground border-border" },
};

const SYSTEM_AREAS: Record<string, string> = {
  map: "🗺️ Map",
  bug_garden: "🐛 Bug Garden",
  roadmap: "🌿 Roadmap",
  ecosystem: "🌍 Ecosystem",
  library: "📚 Library",
  agent_garden: "🤖 Agent Garden",
  council: "🏛️ Council",
};

const STATUS_DISPLAY: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  open:        { label: "Open",         icon: <Sprout className="w-3.5 h-3.5" />,      color: "bg-primary/15 text-primary" },
  submitted:   { label: "Submitted",    icon: <Send className="w-3.5 h-3.5" />,         color: "bg-accent/15 text-accent-foreground" },
  under_review:{ label: "Under Review", icon: <Eye className="w-3.5 h-3.5" />,          color: "bg-secondary text-secondary-foreground" },
  approved:    { label: "Approved",     icon: <CheckCircle className="w-3.5 h-3.5" />,  color: "bg-primary/20 text-primary" },
  rewarded:    { label: "Rewarded",     icon: <Award className="w-3.5 h-3.5" />,        color: "bg-primary/20 text-primary" },
  claimed:     { label: "Claimed",      icon: <Clock className="w-3.5 h-3.5" />,        color: "bg-muted text-muted-foreground" },
};

export function TaskBoard() {
  const [tasks, setTasks] = useState<GardenTask[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<GardenTask | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [userId, setUserId] = useState<string | null>(null);

  // Submission form state
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    fetchData();

    // Realtime subscription for live status updates
    const channel = supabase
      .channel("task-submissions-live")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "task_submissions",
      }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    setLoading(true);
    const [taskRes, subRes] = await Promise.all([
      (supabase.from as any)("agent_garden_tasks")
        .select("*")
        .in("status", ["open", "claimed"])
        .order("created_at", { ascending: false }),
      userId
        ? (supabase.from as any)("task_submissions")
            .select("*")
            .eq("submitted_by", userId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);
    setTasks(taskRes.data || []);
    setSubmissions(subRes.data || []);
    setLoading(false);
  }

  // Refetch when userId changes
  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const filteredTasks = useMemo(() => {
    if (categoryFilter === "all") return tasks;
    return tasks.filter(t => t.category === categoryFilter);
  }, [tasks, categoryFilter]);

  const mySubmissionForTask = (taskId: string) =>
    submissions.find(s => s.task_id === taskId);

  async function handleSubmit(task: GardenTask) {
    if (!userId) { toast.error("Please log in to submit work"); return; }
    if (!proofText.trim()) { toast.error("Please describe your proof of work"); return; }

    setSubmitting(true);
    const { error } = await (supabase.from as any)("task_submissions").insert({
      task_id: task.id,
      submitted_by: userId,
      proof_text: proofText.trim(),
      proof_url: proofUrl.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit — " + error.message);
      return;
    }

    toast.success("Proof submitted! Your work is now under review 🌱");
    setProofText("");
    setProofUrl("");
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // ── Detail View ──
  if (selectedTask) {
    const existing = mySubmissionForTask(selectedTask.id);
    const catMeta = CATEGORY_META[selectedTask.category] || CATEGORY_META.tree_data;
    const canSubmit = !existing && selectedTask.submissions_count < selectedTask.max_submissions;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="detail"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to tasks
          </Button>

          <Card className="border-primary/15 bg-card/60">
            <CardContent className="p-6 space-y-5">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${catMeta.color}`}>
                    {catMeta.icon}
                    <span className="ml-1">{catMeta.label}</span>
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {SYSTEM_AREAS[selectedTask.system_area] || selectedTask.system_area}
                  </Badge>
                  {selectedTask.region && (
                    <Badge variant="secondary" className="text-xs">{selectedTask.region}</Badge>
                  )}
                </div>
                <h2 className="text-xl font-serif font-bold text-foreground">{selectedTask.title}</h2>
                {selectedTask.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedTask.description}</p>
                )}
              </div>

              {/* Purpose */}
              {selectedTask.purpose && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium text-primary mb-1">Why this matters</p>
                  <p className="text-sm text-foreground">{selectedTask.purpose}</p>
                </div>
              )}

              {/* Proof Requirements */}
              {selectedTask.proof_requirements && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs font-medium text-foreground mb-1">📋 Proof of Work Required</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedTask.proof_requirements}</p>
                </div>
              )}

              {/* Reward */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
                  <Heart className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-lg font-serif font-bold text-primary">+{selectedTask.hearts_reward}</p>
                    <p className="text-[10px] text-muted-foreground">S33D Hearts on approval</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>{selectedTask.submissions_count} / {selectedTask.max_submissions} submissions</p>
                </div>
              </div>

              {/* Existing submission status */}
              {existing && (
                <div className="p-4 rounded-lg border border-primary/20 bg-card/80 space-y-2">
                  <div className="flex items-center gap-2">
                    {STATUS_DISPLAY[existing.status]?.icon}
                    <p className="text-sm font-medium text-foreground">
                      Your submission: {STATUS_DISPLAY[existing.status]?.label || existing.status}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{existing.proof_text}</p>
                  {existing.reviewer_notes && (
                    <p className="text-xs text-primary italic">Reviewer: {existing.reviewer_notes}</p>
                  )}
                  {existing.hearts_awarded > 0 && (
                    <p className="text-sm font-serif font-bold text-primary flex items-center gap-1">
                      <Heart className="w-4 h-4" /> +{existing.hearts_awarded} Hearts awarded
                    </p>
                  )}
                </div>
              )}

              {/* Submission form */}
              {canSubmit && (
                <div className="space-y-3 pt-2 border-t border-border/20">
                  <h3 className="text-sm font-serif font-semibold text-foreground flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary" /> Submit Your Work
                  </h3>
                  <div>
                    <Label className="text-xs">Proof of work *</Label>
                    <Textarea
                      rows={4}
                      value={proofText}
                      onChange={e => setProofText(e.target.value)}
                      placeholder="Describe what you did, include data, findings, or results…"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Link to evidence (optional)</Label>
                    <Input
                      type="url"
                      value={proofUrl}
                      onChange={e => setProofUrl(e.target.value)}
                      placeholder="https://github.com/… or Google Doc, etc."
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="sacred"
                    size="sm"
                    onClick={() => handleSubmit(selectedTask)}
                    disabled={submitting || !proofText.trim()}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                    {submitting ? "Submitting…" : "Submit Proof"}
                  </Button>
                </div>
              )}

              {!canSubmit && !existing && (
                <p className="text-xs text-muted-foreground italic">This task has reached its submission limit.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Task List ──
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-serif text-foreground flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" /> Garden of Invitations
        </h3>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="tree_data">🗺️ Tree Data</SelectItem>
            <SelectItem value="bug_qa">🐛 Bug / QA</SelectItem>
            <SelectItem value="roadmap">🌿 Roadmap</SelectItem>
            <SelectItem value="research">🔬 Research</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTasks.length === 0 ? (
        <Card className="border-primary/15 bg-card/60">
          <CardContent className="py-16 text-center">
            <Sprout className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No open tasks right now. New invitations bloom soon.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTasks.map(task => {
            const catMeta = CATEGORY_META[task.category] || CATEGORY_META.tree_data;
            const existing = mySubmissionForTask(task.id);
            const spotsLeft = task.max_submissions - task.submissions_count;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className="cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                <Card className="border-primary/15 bg-card/60 hover:border-primary/30 transition-all h-full">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={`text-[10px] ${catMeta.color}`}>
                          {catMeta.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {SYSTEM_AREAS[task.system_area] || task.system_area}
                        </Badge>
                      </div>
                      {existing && (
                        <Badge className={`text-[10px] ${STATUS_DISPLAY[existing.status]?.color || "bg-muted"}`}>
                          {STATUS_DISPLAY[existing.status]?.label || existing.status}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-serif font-semibold text-foreground line-clamp-2">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-sm font-serif font-bold text-primary flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> +{task.hearts_reward}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {spotsLeft > 0 ? (
                          <span className="text-primary/70">{spotsLeft} spot{spotsLeft > 1 ? "s" : ""} left</span>
                        ) : (
                          <span>Full</span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* My Submissions Summary */}
      {submissions.length > 0 && (
        <Card className="border-primary/15 bg-card/60 mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-serif flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Your Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submissions.slice(0, 10).map(sub => {
                const task = tasks.find(t => t.id === sub.task_id);
                const statusMeta = STATUS_DISPLAY[sub.status];
                return (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{task?.title || "Unknown task"}</p>
                      <p className="text-xs text-muted-foreground truncate">{sub.proof_text}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sub.hearts_awarded > 0 && (
                        <span className="text-sm font-serif font-bold text-primary flex items-center gap-0.5">
                          <Heart className="w-3 h-3" /> +{sub.hearts_awarded}
                        </span>
                      )}
                      <Badge className={`text-[10px] ${statusMeta?.color || "bg-muted"}`}>
                        {statusMeta?.icon}
                        <span className="ml-1">{statusMeta?.label || sub.status}</span>
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
