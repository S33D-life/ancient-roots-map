/**
 * Shared Spark Submit Dialog — used by Agent Garden and Tree Data Commons
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";

const SPARK_TYPES = [
  "issue", "duplicate", "incorrect_species", "invalid_coordinates",
  "missing_metadata", "broken_dataset", "dataset_update", "improvement",
];

const SPARK_TARGETS = ["tree", "dataset", "source", "agent"];

export function SparkSubmitDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    report_type: "issue", target_type: "tree", description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in to submit a Spark"); return; }
    setSubmitting(true);
    const { error } = await (supabase.from as any)("spark_reports").insert({
      report_type: form.report_type,
      target_type: form.target_type,
      description: form.description.trim(),
      submitted_by: user.id,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to submit Spark"); return; }
    toast.success("Spark submitted — thank you!");
    setOpen(false);
    setForm({ report_type: "issue", target_type: "tree", description: "" });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Zap className="w-4 h-4 mr-1 text-primary" /> Report Spark</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Submit a Spark
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Report issues, duplicates, or improvements. Confirmed Sparks earn Hearts.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Spark Type</Label>
              <Select value={form.report_type} onValueChange={v => setForm({ ...form, report_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPARK_TYPES.map(v => (
                    <SelectItem key={v} value={v} className="capitalize">{v.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Target</Label>
              <Select value={form.target_type} onValueChange={v => setForm({ ...form, target_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPARK_TARGETS.map(v => (
                    <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Description *</Label>
            <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What needs attention?" required />
          </div>
          <Button type="submit" variant="sacred" className="w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Spark"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
