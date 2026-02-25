import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SOURCE_TYPES = [
  { value: "academic_paper", label: "Academic Paper" },
  { value: "government_database", label: "Government Database" },
  { value: "book", label: "Book" },
  { value: "historical_archive", label: "Historical Archive" },
  { value: "news_article", label: "News Article" },
  { value: "personal_field_research", label: "Personal Field Research" },
  { value: "indigenous_oral_record", label: "Indigenous Oral Record" },
  { value: "other", label: "Other" },
] as const;

const sourceSchema = z.object({
  source_title: z.string().trim().min(1, "Title is required").max(500, "Title too long (max 500)"),
  source_type: z.string().min(1, "Select a source type"),
  url: z.string().trim().max(2000, "URL too long").refine(
    (v) => !v || /^https?:\/\/.+/.test(v),
    "Must be a valid URL starting with http:// or https://"
  ).optional().or(z.literal("")),
  description: z.string().trim().max(2000, "Description too long (max 2000)").optional().or(z.literal("")),
  contributor_name: z.string().trim().max(200).optional().or(z.literal("")),
  contributor_email: z.string().trim().max(255).refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Invalid email"
  ).optional().or(z.literal("")),
  confirmed: z.literal(true, { errorMap: () => ({ message: "Please confirm accuracy" }) }),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  treeName: string;
  researchTreeId?: string;
  onSourceAdded?: () => void;
}

export default function ContributeSourceModal({
  open, onOpenChange, treeId, treeName, researchTreeId, onSourceAdded,
}: Props) {
  const [form, setForm] = useState({
    source_title: "",
    source_type: "",
    url: "",
    description: "",
    contributor_name: "",
    contributor_email: "",
    confirmed: false as boolean,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm({ source_title: "", source_type: "", url: "", description: "", contributor_name: "", contributor_email: "", confirmed: false });
      setErrors({});
      setSubmitted(false);
      setDuplicateWarning(false);
    }
  }, [open]);

  // Duplicate detection on URL blur
  const checkDuplicate = async () => {
    if (!form.url.trim()) { setDuplicateWarning(false); return; }
    const { data } = await supabase
      .from("tree_sources")
      .select("id")
      .eq("tree_id", treeId)
      .eq("url", form.url.trim())
      .limit(1);
    setDuplicateWarning(!!(data && data.length > 0));
  };

  const handleSubmit = async () => {
    const result = sourceSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (!userId) {
      toast.error("Please sign in to contribute a source.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("tree_sources").insert({
      tree_id: treeId,
      research_tree_id: researchTreeId || null,
      source_title: form.source_title.trim(),
      source_type: form.source_type,
      url: form.url.trim() || null,
      description: form.description.trim() || null,
      contributor_name: form.contributor_name.trim() || null,
      contributor_email: form.contributor_email.trim() || null,
      submitted_by: userId,
    } as any);

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit source. Please try again.");
      console.error("Source submission error:", error);
      return;
    }

    setSubmitted(true);
    onSourceAdded?.();
    toast.success("Source submitted for review. Thank you!");
  };

  const setField = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-serif text-primary">Source Submitted</h3>
            <p className="text-sm text-muted-foreground font-serif max-w-xs">
              Your source for <strong>{treeName}</strong> has been submitted for review.
              A curator will verify it shortly.
            </p>
            <p className="text-xs text-muted-foreground/60 font-serif">
              Verified sources earn S33D Hearts.
            </p>
            <Button onClick={() => onOpenChange(false)} className="font-serif mt-2">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <DialogTitle className="font-serif text-primary tracking-wide">
              Contribute a Source
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground font-serif mt-1">
            Help strengthen the roots of this record.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Source Title */}
          <div className="space-y-1.5">
            <Label htmlFor="source_title" className="font-serif text-sm">Source Title *</Label>
            <Input
              id="source_title"
              placeholder="e.g. DFFE Champion Trees Report 2024"
              value={form.source_title}
              onChange={(e) => setField("source_title", e.target.value)}
              className="font-serif text-sm"
              maxLength={500}
            />
            {errors.source_title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.source_title}
              </p>
            )}
          </div>

          {/* Source Type */}
          <div className="space-y-1.5">
            <Label className="font-serif text-sm">Source Type *</Label>
            <Select value={form.source_type} onValueChange={(v) => setField("source_type", v)}>
              <SelectTrigger className="font-serif text-sm">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="font-serif text-sm">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source_type && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.source_type}
              </p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="source_url" className="font-serif text-sm">URL (optional)</Label>
            <Input
              id="source_url"
              placeholder="https://..."
              value={form.url}
              onChange={(e) => setField("url", e.target.value)}
              onBlur={checkDuplicate}
              className="font-serif text-sm"
              maxLength={2000}
            />
            {duplicateWarning && (
              <p className="text-xs text-amber-500 flex items-center gap-1 font-serif">
                <AlertCircle className="h-3 w-3" /> This source may already be listed.
              </p>
            )}
            {errors.url && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.url}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="source_desc" className="font-serif text-sm">Why this matters (optional)</Label>
            <Textarea
              id="source_desc"
              placeholder="Describe the relevance of this source…"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className="font-serif text-sm min-h-[80px] resize-none"
              maxLength={2000}
            />
            {errors.description && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.description}
              </p>
            )}
          </div>

          {/* Contributor info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contrib_name" className="font-serif text-sm">Your name (optional)</Label>
              <Input
                id="contrib_name"
                value={form.contributor_name}
                onChange={(e) => setField("contributor_name", e.target.value)}
                className="font-serif text-sm"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contrib_email" className="font-serif text-sm">Email (optional)</Label>
              <Input
                id="contrib_email"
                type="email"
                value={form.contributor_email}
                onChange={(e) => setField("contributor_email", e.target.value)}
                className="font-serif text-sm"
                maxLength={255}
              />
              {errors.contributor_email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.contributor_email}
                </p>
              )}
            </div>
          </div>

          {/* Confirmation */}
          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="confirm"
              checked={form.confirmed}
              onCheckedChange={(v) => setField("confirmed", v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="confirm" className="font-serif text-xs text-muted-foreground leading-relaxed cursor-pointer">
              I confirm this information is accurate to the best of my knowledge.
            </Label>
          </div>
          {errors.confirmed && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.confirmed}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-serif">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !userId}
            className="font-serif gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Source
          </Button>
        </DialogFooter>

        {!userId && (
          <p className="text-xs text-center text-muted-foreground font-serif mt-2">
            Please <a href="/auth" className="text-primary underline">sign in</a> to contribute a source.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
