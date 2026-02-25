import { useState } from "react";
import { BookOpen, Plus, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCollaboratorVolumes, type CollaboratorVolume } from "@/hooks/use-collaborator-volumes";
import CollaboratorVolumeWizard, { type WizardData } from "@/components/CollaboratorVolumeWizard";
import CollaboratorVolumeCard from "@/components/CollaboratorVolumeCard";
import CollaboratorVolumeDetail from "@/components/CollaboratorVolumeDetail";

interface Props {
  userId: string;
}

const CollaboratorShelf = ({ userId }: Props) => {
  const { volumes, loading, createVolume, updateVolume, deleteVolume } = useCollaboratorVolumes(userId);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailVolume, setDetailVolume] = useState<CollaboratorVolume | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const handleCreate = async (data: WizardData) => {
    await createVolume({
      collaborator_name: data.collaborator_name,
      collaborator_project: data.collaborator_project || null,
      document_title: data.document_title,
      document_version: data.document_version,
      themes: data.themes,
      essence_summary: data.essence_summary || null,
      resonance_map: data.resonance_map || null,
      divergence_map: data.divergence_map || null,
      integration_intent: data.integration_intent,
    } as any);
  };

  const handleVisibilityChange = async (id: string, newState: "root" | "ring" | "ripple") => {
    const vol = volumes.find(v => v.id === id);
    if (!vol) return;

    // Enforce progression: root -> ring -> ripple
    if (newState === "ring" && vol.visibility_state !== "root") return;
    if (newState === "ripple" && vol.visibility_state !== "ring") return;

    // For ripple, must have at least one linked tree/pod/council
    if (newState === "ripple") {
      const hasAnchor = (vol.linked_tree_ids?.length || 0) > 0
        || (vol.linked_pod_ids?.length || 0) > 0
        || (vol.linked_council_sessions?.length || 0) > 0;
      if (!hasAnchor) {
        toast.error("Link to at least one Tree, Pod, or Council session before extending to Ripple");
        return;
      }
    }

    const updates: any = { visibility_state: newState };

    // Auto-generate wanderer summary for Ring
    if (newState === "ring" && vol.essence_summary) {
      updates.wanderer_summary = vol.essence_summary.slice(0, 300) +
        (vol.essence_summary.length > 300 ? "…" : "");
    }

    await updateVolume(id, updates);

    // Award hearts (only if linked to at least one tree)
    const anchorTreeId = vol.linked_tree_ids?.[0];

    if (newState === "ring" && !vol.ring_hearts_awarded && anchorTreeId) {
      await supabase.from("heart_transactions").insert({
        user_id: userId,
        tree_id: anchorTreeId,
        heart_type: "volume_ring",
        amount: 2,
      } as any);
      await updateVolume(id, { ring_hearts_awarded: true } as any);
      toast.success("💚 +2 Hearts for sharing to Ring");
    } else if (newState === "ring") {
      toast.success("Volume shared to Ring");
    }

    if (newState === "ripple" && !vol.ripple_hearts_awarded && anchorTreeId) {
      const hasExperiment = vol.integration_intent === "prototype" || vol.integration_intent === "experiment";
      if (hasExperiment) {
        await supabase.from("heart_transactions").insert({
          user_id: userId,
          tree_id: anchorTreeId,
          heart_type: "volume_ripple",
          amount: 5,
        } as any);
        await updateVolume(id, { ripple_hearts_awarded: true } as any);
        toast.success("💛 +5 Hearts for rippling with experiment");
      } else {
        toast.success("Volume extended to Ripple");
      }
    } else if (newState === "ripple") {
      toast.success("Volume extended to Ripple");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this volume from your shelf?")) return;
    await deleteVolume(id);
    toast.success("Volume removed");
  };

  const filteredVolumes = filter === "all"
    ? volumes
    : volumes.filter(v => v.visibility_state === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        <h3 className="font-serif text-sm text-primary tracking-wide flex-1">
          Collaborator Volumes
        </h3>
        <Badge variant="outline" className="font-serif text-[10px]">{volumes.length}</Badge>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-28 h-7 text-[10px] font-serif">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs font-serif">All</SelectItem>
            <SelectItem value="root" className="text-xs font-serif">Root</SelectItem>
            <SelectItem value="ring" className="text-xs font-serif">Ring</SelectItem>
            <SelectItem value="ripple" className="text-xs font-serif">Ripple</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto font-serif text-xs gap-1 h-7 border-primary/20"
          onClick={() => setWizardOpen(true)}
        >
          <Plus className="w-3 h-3" /> Add Volume
        </Button>
      </div>

      {/* Volume list */}
      {filteredVolumes.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground font-serif">
            {volumes.length === 0
              ? "Your shelf awaits. Add a collaborator volume to begin."
              : "No volumes match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredVolumes.map((vol) => (
            <CollaboratorVolumeCard
              key={vol.id}
              volume={vol}
              isOwner
              onVisibilityChange={handleVisibilityChange}
              onDelete={handleDelete}
              onOpenDetail={setDetailVolume}
            />
          ))}
        </div>
      )}

      {/* Wizard */}
      <CollaboratorVolumeWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Detail view */}
      <CollaboratorVolumeDetail
        volume={detailVolume}
        open={!!detailVolume}
        onClose={() => setDetailVolume(null)}
        onUpdate={updateVolume}
        isOwner
      />
    </div>
  );
};

export default CollaboratorShelf;
