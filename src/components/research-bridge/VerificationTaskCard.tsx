/**
 * VerificationTaskCard — Actionable mission card for verification tasks.
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MapPin, Leaf, Camera, Footprints, Search, Clock, User, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type VerificationTask = Database["public"]["Tables"]["verification_tasks"]["Row"];

const TASK_TYPE_META: Record<string, { icon: React.ReactNode; label: string }> = {
  confirm_location: { icon: <MapPin className="w-3.5 h-3.5" />, label: "Confirm Location" },
  confirm_species: { icon: <Leaf className="w-3.5 h-3.5" />, label: "Confirm Species" },
  add_photo: { icon: <Camera className="w-3.5 h-3.5" />, label: "Add Photo" },
  visit_in_person: { icon: <Footprints className="w-3.5 h-3.5" />, label: "Visit In Person" },
  general_review: { icon: <Search className="w-3.5 h-3.5" />, label: "General Review" },
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  claimed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  expired: "bg-muted text-muted-foreground border-border",
};

interface Props {
  task: VerificationTask & { research_trees?: { tree_name: string | null; species_scientific: string } | null };
  userId: string | null;
  onClaim: (taskId: string, userId: string) => void;
  onComplete: (taskId: string, notes: string) => void;
}

export function VerificationTaskCard({ task, userId, onClaim, onComplete }: Props) {
  const [showComplete, setShowComplete] = useState(false);
  const [notes, setNotes] = useState("");
  const meta = TASK_TYPE_META[task.task_type] || TASK_TYPE_META.general_review;
  const isExpired = task.expires_at && new Date(task.expires_at) < new Date();
  const effectiveStatus = isExpired && task.status === "open" ? "expired" : task.status;
  const canClaim = userId && effectiveStatus === "open";
  const canComplete = userId && effectiveStatus === "claimed" && task.claimed_by === userId;
  const treeName = (task as any).research_trees?.tree_name || (task as any).research_trees?.species_scientific || "Research Tree";

  return (
    <div
      className="rounded-xl p-4 space-y-3 transition-colors"
      style={{ background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--border) / 0.15)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-primary">
          {meta.icon}
          <div>
            <p className="text-sm font-serif text-foreground leading-tight">{task.title}</p>
            <p className="text-[10px] font-serif text-muted-foreground mt-0.5">
              {meta.label} · <Link to={`/tree/research/${task.research_tree_id}`} className="text-primary hover:underline">{treeName}</Link>
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`text-[9px] shrink-0 ${STATUS_STYLES[effectiveStatus] || ""}`}>
          {effectiveStatus}
        </Badge>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs font-serif text-muted-foreground leading-relaxed">{task.description}</p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-[10px] font-serif text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3 text-primary" /> {task.hearts_reward} hearts
        </span>
        {task.claimed_by && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" /> Claimed
          </span>
        )}
        {task.expires_at && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Expires {new Date(task.expires_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Completion notes */}
      {task.completion_notes && effectiveStatus === "completed" && (
        <div className="text-xs font-serif text-green-600 bg-green-500/5 rounded-md p-2">
          <CheckCircle2 className="w-3 h-3 inline mr-1" />
          {task.completion_notes}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {canClaim && (
          <Button size="sm" variant="sacred" className="h-7 text-[10px] font-serif" onClick={() => onClaim(task.id, userId)}>
            🤲 Claim Mission
          </Button>
        )}
        {canComplete && !showComplete && (
          <Button size="sm" variant="sacred" className="h-7 text-[10px] font-serif" onClick={() => setShowComplete(true)}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
          </Button>
        )}
      </div>

      {/* Completion form */}
      {showComplete && (
        <div className="space-y-2 pt-1 border-t border-border/10">
          <Textarea
            placeholder="Describe what you verified or found…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs min-h-[60px] font-serif"
          />
          <p className="text-[9px] text-muted-foreground font-serif">📷 Photo evidence upload coming soon</p>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-[10px] font-serif" onClick={() => { onComplete(task.id, notes); setShowComplete(false); }} disabled={!notes.trim()}>
              Submit Verification
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-[10px] font-serif" onClick={() => setShowComplete(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
