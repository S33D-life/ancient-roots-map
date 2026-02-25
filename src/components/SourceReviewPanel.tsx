import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen, Search, Loader2, CheckCircle2, XCircle, MessageSquare,
  ExternalLink, Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { TreeSource } from "@/hooks/use-tree-sources";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  verified: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  clarification_needed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  academic_paper: "Academic Paper",
  government_database: "Government Database",
  book: "Book",
  historical_archive: "Historical Archive",
  news_article: "News Article",
  personal_field_research: "Field Research",
  indigenous_oral_record: "Oral Record",
  other: "Other",
};

export default function SourceReviewPanel() {
  const [sources, setSources] = useState<TreeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQ, setSearchQ] = useState("");

  // Review dialog
  const [reviewSource, setReviewSource] = useState<TreeSource | null>(null);
  const [reviewAction, setReviewAction] = useState<"verify" | "reject" | "clarify">("verify");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewHearts, setReviewHearts] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSources();
  }, [statusFilter]);

  const loadSources = async () => {
    setLoading(true);
    let q = supabase.from("tree_sources").select("*").order("submitted_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("verification_status", statusFilter);
    const { data } = await q.limit(200);
    setSources((data as TreeSource[]) || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return sources;
    const q = searchQ.toLowerCase();
    return sources.filter(
      (s) =>
        s.source_title.toLowerCase().includes(q) ||
        s.contributor_name?.toLowerCase().includes(q) ||
        s.url?.toLowerCase().includes(q)
    );
  }, [sources, searchQ]);

  const handleReview = async () => {
    if (!reviewSource) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setSaving(false); return; }

    const newStatus =
      reviewAction === "verify" ? "verified" :
      reviewAction === "reject" ? "rejected" : "clarification_needed";

    const { error } = await supabase
      .from("tree_sources")
      .update({
        verification_status: newStatus,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        verification_notes: reviewNote.trim() || null,
      } as any)
      .eq("id", reviewSource.id);

    if (error) {
      toast.error("Failed to update source");
      setSaving(false);
      return;
    }

    // Issue hearts if verified and submitter is known
    if (reviewAction === "verify" && reviewSource.submitted_by && reviewHearts > 0) {
      await supabase.from("heart_transactions").insert({
        user_id: reviewSource.submitted_by,
        tree_id: reviewSource.tree_id,
        heart_type: "source_verified",
        amount: reviewHearts,
      } as any);

      await supabase.from("influence_transactions").insert({
        user_id: reviewSource.submitted_by,
        tree_id: reviewSource.tree_id,
        amount: 1,
        action_type: "source_contribution",
        scope: "global",
        reason: `Source verified: ${reviewSource.source_title}`,
      } as any);
    }

    toast.success(
      reviewAction === "verify"
        ? `Source verified${reviewHearts > 0 ? ` — ${reviewHearts} Hearts awarded` : ""}`
        : reviewAction === "reject"
        ? "Source rejected"
        : "Clarification requested"
    );

    setSaving(false);
    setReviewSource(null);
    setReviewNote("");
    loadSources();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-serif text-primary tracking-wide">Source Review</h2>
        <Badge variant="outline" className="ml-auto font-mono text-xs">
          {filtered.length} source{filtered.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sources…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="pl-9 font-serif text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] font-serif text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="clarification_needed">Needs Clarification</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Source list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-serif text-sm text-muted-foreground">No sources match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((source) => (
            <Card key={source.id} className="border-border/40">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-serif text-sm text-foreground">{source.source_title}</span>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${STATUS_COLORS[source.verification_status] || ""}`}>
                        {source.verification_status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-serif text-muted-foreground">
                        {SOURCE_TYPE_LABELS[source.source_type] || source.source_type}
                      </Badge>
                    </div>
                    {source.description && (
                      <p className="text-xs text-muted-foreground font-serif line-clamp-2">{source.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/60 font-serif">
                      {source.contributor_name && <span>By {source.contributor_name}</span>}
                      <span>{new Date(source.submitted_at).toLocaleDateString()}</span>
                      {source.url && (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary inline-flex items-center gap-0.5">
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      )}
                    </div>
                    {source.verification_notes && (
                      <p className="text-[10px] text-muted-foreground/80 font-serif mt-1 italic border-l-2 border-primary/20 pl-2">
                        {source.verification_notes}
                      </p>
                    )}
                  </div>
                  {source.verification_status === "pending" && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs font-serif gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => { setReviewSource(source); setReviewAction("verify"); setReviewHearts(3); }}>
                        <CheckCircle2 className="h-3 w-3" /> Verify
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-serif gap-1 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                        onClick={() => { setReviewSource(source); setReviewAction("clarify"); }}>
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-serif gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => { setReviewSource(source); setReviewAction("reject"); }}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewSource} onOpenChange={(o) => !o && setReviewSource(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">
              {reviewAction === "verify" ? "Verify Source" : reviewAction === "reject" ? "Reject Source" : "Request Clarification"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
              <p className="font-serif text-sm">{reviewSource?.source_title}</p>
              {reviewSource?.url && (
                <a href={reviewSource.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/60 hover:text-primary font-serif">
                  {reviewSource.url}
                </a>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-serif text-sm text-muted-foreground">
                {reviewAction === "verify" ? "Verification note (optional)" : reviewAction === "reject" ? "Reason for rejection" : "What needs clarification?"}
              </label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="font-serif text-sm min-h-[60px] resize-none"
                placeholder={reviewAction === "clarify" ? "Please describe what additional information is needed…" : "Optional notes…"}
                maxLength={1000}
              />
            </div>

            {reviewAction === "verify" && (
              <div className="space-y-1.5">
                <label className="font-serif text-sm text-muted-foreground">Hearts to award</label>
                <Select value={String(reviewHearts)} onValueChange={(v) => setReviewHearts(Number(v))}>
                  <SelectTrigger className="w-[120px] font-serif text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Heart</SelectItem>
                    <SelectItem value="2">2 Hearts</SelectItem>
                    <SelectItem value="3">3 Hearts</SelectItem>
                    <SelectItem value="5">5 Hearts</SelectItem>
                    <SelectItem value="10">10 Hearts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewSource(null)} className="font-serif">Cancel</Button>
            <Button onClick={handleReview} disabled={saving} className="font-serif gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {reviewAction === "verify" ? "Verify & Award" : reviewAction === "reject" ? "Reject" : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
