/**
 * SubmissionReviewPanel — Curator interface for reviewing task submissions.
 * Approve/reject with notes. Hearts are auto-awarded via DB trigger on approval.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, Eye, Heart, Clock, Send,
  Loader2, ExternalLink, MessageSquare
} from "lucide-react";

interface Submission {
  id: string;
  task_id: string;
  submitted_by: string;
  proof_text: string;
  proof_url: string | null;
  status: string;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  hearts_awarded: number;
  created_at: string;
  reviewed_at: string | null;
}

interface Task {
  id: string;
  title: string;
  hearts_reward: number;
  category: string;
  system_area: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-accent/15 text-accent-foreground",
  under_review: "bg-secondary text-secondary-foreground",
  approved: "bg-primary/20 text-primary",
  rejected: "bg-destructive/15 text-destructive",
  rewarded: "bg-primary/20 text-primary",
};

export function SubmissionReviewPanel() {
  const [submissions, setSubmissions] = useState<(Submission & { task?: Task })[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "submitted" | "under_review" | "approved" | "rejected">("submitted");

  useEffect(() => {
    fetchSubmissions();

    const channel = supabase
      .channel("submission-reviews")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "task_submissions",
      }, () => fetchSubmissions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchSubmissions() {
    setLoading(true);
    const { data: subs } = await (supabase.from as any)("task_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: tasks } = await (supabase.from as any)("agent_garden_tasks")
      .select("id, title, hearts_reward, category, system_area");

    const taskMap = new Map((tasks || []).map((t: Task) => [t.id, t]));
    const enriched = (subs || []).map((s: Submission) => ({
      ...s,
      task: taskMap.get(s.task_id),
    }));

    setSubmissions(enriched);
    setLoading(false);
  }

  async function updateStatus(subId: string, newStatus: "under_review" | "approved" | "rejected") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); return; }

    setProcessing(subId);
    const updates: Record<string, unknown> = {
      status: newStatus,
      reviewed_by: user.id,
    };
    if (reviewNotes[subId]?.trim()) {
      updates.reviewer_notes = reviewNotes[subId].trim();
    }

    const { error } = await (supabase.from as any)("task_submissions")
      .update(updates)
      .eq("id", subId);

    setProcessing(null);

    if (error) {
      toast.error("Failed: " + error.message);
      return;
    }

    const messages: Record<string, string> = {
      under_review: "Marked as under review",
      approved: "Approved! Hearts will be awarded automatically 🌱",
      rejected: "Submission rejected",
    };
    toast.success(messages[newStatus]);
    fetchSubmissions();
  }

  const filtered = filter === "all"
    ? submissions
    : submissions.filter(s => s.status === filter);

  const counts = {
    submitted: submissions.filter(s => s.status === "submitted").length,
    under_review: submissions.filter(s => s.status === "under_review").length,
    approved: submissions.filter(s => s.status === "approved").length,
    rejected: submissions.filter(s => s.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "submitted", label: "Pending", count: counts.submitted, icon: <Send className="w-3 h-3" /> },
          { key: "under_review", label: "Reviewing", count: counts.under_review, icon: <Eye className="w-3 h-3" /> },
          { key: "approved", label: "Approved", count: counts.approved, icon: <CheckCircle className="w-3 h-3" /> },
          { key: "rejected", label: "Rejected", count: counts.rejected, icon: <XCircle className="w-3 h-3" /> },
          { key: "all", label: "All", count: submissions.length, icon: null },
        ].map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? "sacred" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key as typeof filter)}
            className="text-xs"
          >
            {f.icon}
            <span className="ml-1">{f.label}</span>
            {f.count > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{f.count}</Badge>}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-primary/15 bg-card/60">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No submissions in this category.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(sub => {
            const isActionable = sub.status === "submitted" || sub.status === "under_review";
            return (
              <Card key={sub.id} className="border-primary/15 bg-card/60">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-serif font-semibold text-foreground truncate">
                        {sub.task?.title || "Unknown task"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[sub.status] || ""}`}>
                          {sub.status.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </span>
                        {sub.task && (
                          <span className="text-[10px] text-muted-foreground">
                            • {sub.task.hearts_reward} ❤️ reward
                          </span>
                        )}
                      </div>
                    </div>
                    {sub.hearts_awarded > 0 && (
                      <span className="text-sm font-serif font-bold text-primary flex items-center gap-0.5 shrink-0">
                        <Heart className="w-3.5 h-3.5" /> +{sub.hearts_awarded}
                      </span>
                    )}
                  </div>

                  {/* Proof */}
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                    <p className="text-xs font-medium text-foreground mb-1">Proof of work</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{sub.proof_text}</p>
                    {sub.proof_url && (
                      <a
                        href={sub.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> {sub.proof_url}
                      </a>
                    )}
                  </div>

                  {/* Reviewer notes (existing) */}
                  {sub.reviewer_notes && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Reviewer notes
                      </p>
                      <p className="text-xs text-foreground">{sub.reviewer_notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {isActionable && (
                    <div className="space-y-2 pt-2 border-t border-border/20">
                      <Textarea
                        rows={2}
                        placeholder="Review notes (optional)…"
                        value={reviewNotes[sub.id] || ""}
                        onChange={e => setReviewNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                        className="text-xs"
                      />
                      <div className="flex items-center gap-2">
                        {sub.status === "submitted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(sub.id, "under_review")}
                            disabled={processing === sub.id}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Start Review
                          </Button>
                        )}
                        <Button
                          variant="sacred"
                          size="sm"
                          onClick={() => updateStatus(sub.id, "approved")}
                          disabled={processing === sub.id}
                        >
                          {processing === sub.id ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateStatus(sub.id, "rejected")}
                          disabled={processing === sub.id}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
