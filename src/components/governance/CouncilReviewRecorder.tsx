/**
 * CouncilReviewRecorder — allows council participants to record
 * review outcomes for governance proposals. Results link to the Library.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const OUTCOMES = [
  { value: "discussed", label: "Discussed", desc: "Proposal was discussed but no decision made" },
  { value: "endorsed", label: "Endorsed", desc: "Council supports moving forward" },
  { value: "deferred", label: "Deferred", desc: "Decision delayed for further input" },
  { value: "declined", label: "Declined", desc: "Council does not support at this time" },
  { value: "needs_revision", label: "Needs Revision", desc: "Proposal needs changes before reconsideration" },
];

interface Props {
  proposalId: string;
  proposalTitle: string;
  userId: string;
  councilId?: string;
}

const CouncilReviewRecorder = ({ proposalId, proposalTitle, userId, councilId }: Props) => {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState("discussed");
  const [summary, setSummary] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();

  const handleSubmit = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("proposal_council_reviews" as any).insert({
      proposal_id: proposalId,
      council_id: councilId || null,
      outcome,
      summary: summary.trim() || null,
      next_steps: nextSteps.trim() || null,
      recorded_by: userId,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Could not record review");
    } else {
      toast.success("Council review recorded");
      setOpen(false);
      setSummary(""); setNextSteps("");
      qc.invalidateQueries({ queryKey: ["governance-proposals"] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-[10px] font-serif gap-1">
          <CheckCircle className="w-3 h-3" /> Record Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-base">Council Review</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground font-serif italic">"{proposalTitle}"</p>
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Outcome</label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger className="mt-1 text-xs font-serif">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs font-serif">
                    {o.label} — {o.desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Summary</label>
            <Textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="What was discussed?" className="mt-1 text-sm min-h-[60px]" maxLength={2000} />
          </div>
          <div>
            <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Next Steps</label>
            <Textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} placeholder="What actions follow?" className="mt-1 text-sm min-h-[48px]" maxLength={2000} />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full font-serif">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
            Record Review & Archive to Library
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CouncilReviewRecorder;
