import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Lock, Users, Globe, Beaker, Plus, Save, TreeDeciduous, HelpCircle, Link, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CollaboratorVolume, CollaboratorExperiment } from "@/hooks/use-collaborator-volumes";

interface Props {
  volume: CollaboratorVolume | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<CollaboratorVolume>) => Promise<void>;
  isOwner: boolean;
}

const CollaboratorVolumeDetail = ({ volume, open, onClose, onUpdate, isOwner }: Props) => {
  const [experiments, setExperiments] = useState<CollaboratorExperiment[]>([]);
  const [newExpDesc, setNewExpDesc] = useState("");
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [wandererSummary, setWandererSummary] = useState("");

  useEffect(() => {
    if (!volume) return;
    setQuestions(volume.open_questions || []);
    setWandererSummary(volume.wanderer_summary || "");

    // Fetch experiments
    if (volume.integration_intent === "prototype" || volume.integration_intent === "experiment") {
      supabase
        .from("collaborator_experiments")
        .select("*")
        .eq("volume_id", volume.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setExperiments((data as CollaboratorExperiment[]) || []));
    }
  }, [volume]);

  if (!volume) return null;

  const canAddExperiment = isOwner && (volume.integration_intent === "prototype" || volume.integration_intent === "experiment");

  const addExperiment = async () => {
    if (!newExpDesc.trim()) return;
    const { error } = await supabase.from("collaborator_experiments").insert({
      volume_id: volume.id,
      user_id: volume.user_id,
      description: newExpDesc.trim(),
    } as any);
    if (error) { toast.error("Could not create experiment"); return; }
    setNewExpDesc("");
    const { data } = await supabase
      .from("collaborator_experiments")
      .select("*")
      .eq("volume_id", volume.id)
      .order("created_at", { ascending: false });
    setExperiments((data as CollaboratorExperiment[]) || []);
    toast.success("Experiment linked to volume");
  };

  const saveRingFields = async () => {
    await onUpdate(volume.id, {
      wanderer_summary: wandererSummary,
      open_questions: questions.filter(Boolean),
    });
    setEditingQuestions(false);
    toast.success("Ring fields updated");
  };

  const linkedTreeCount = volume.linked_tree_ids?.length || 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto border-primary/20 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {volume.document_title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-serif">
            {volume.collaborator_name}
            {volume.collaborator_project && ` · ${volume.collaborator_project}`}
            {" · v"}{volume.document_version}
          </p>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-serif text-[10px] gap-1">
              {volume.visibility_state === "root" && <Lock className="w-2.5 h-2.5" />}
              {volume.visibility_state === "ring" && <Users className="w-2.5 h-2.5" />}
              {volume.visibility_state === "ripple" && <Globe className="w-2.5 h-2.5" />}
              {volume.visibility_state}
            </Badge>
            <Badge variant="secondary" className="font-serif text-[10px] capitalize">
              {volume.integration_intent}
            </Badge>
            <Badge variant="secondary" className="font-serif text-[10px] capitalize">
              {volume.experiment_status}
            </Badge>
            {linkedTreeCount > 0 && (
              <Badge variant="outline" className="font-serif text-[10px] gap-1">
                <TreeDeciduous className="w-2.5 h-2.5" />
                {linkedTreeCount} tree{linkedTreeCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Themes */}
          {volume.themes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {volume.themes.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] font-serif">{t}</Badge>
              ))}
            </div>
          )}

          {/* Essence */}
          {volume.essence_summary && (
            <div className="space-y-1">
              <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Essence</p>
              <p className="text-sm font-serif text-foreground/90 leading-relaxed">
                {volume.essence_summary}
              </p>
            </div>
          )}

          {/* Document Attachments */}
          {(volume.document_url || volume.document_file_url) && (
            <div className="space-y-2">
              <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Attached Document</p>
              <div className="flex flex-wrap gap-2">
                {volume.document_url && (
                  <a
                    href={volume.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-serif text-primary hover:text-primary/80 transition-colors rounded-md border border-primary/20 px-3 py-1.5"
                  >
                    <Link className="w-3 h-3" />
                    View Link
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {volume.document_file_url && (
                  <a
                    href={volume.document_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-serif text-primary hover:text-primary/80 transition-colors rounded-md border border-primary/20 px-3 py-1.5"
                  >
                    <FileText className="w-3 h-3" />
                    View File
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          <Separator className="bg-border/30" />

          {/* Resonance Map */}
          {volume.resonance_map && (
            <div className="space-y-1">
              <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Resonance Map</p>
              <p className="text-xs font-serif text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {volume.resonance_map}
              </p>
            </div>
          )}

          {/* Divergence Map */}
          {volume.divergence_map && (
            <div className="space-y-1">
              <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Divergence Map</p>
              <p className="text-xs font-serif text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {volume.divergence_map}
              </p>
            </div>
          )}

          {/* Ring layer: Open Questions */}
          {(volume.visibility_state === "ring" || volume.visibility_state === "ripple") && (
            <>
              <Separator className="bg-border/30" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Open Questions</p>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-6 text-[10px] font-serif"
                      onClick={() => setEditingQuestions(!editingQuestions)}
                    >
                      {editingQuestions ? "Cancel" : "Edit"}
                    </Button>
                  )}
                </div>

                {editingQuestions ? (
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <Input
                        key={i}
                        value={q}
                        onChange={(e) => {
                          const next = [...questions];
                          next[i] = e.target.value;
                          setQuestions(next);
                        }}
                        className="font-serif text-xs"
                        placeholder={`Question ${i + 1}`}
                      />
                    ))}
                    {questions.length < 7 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-serif gap-1"
                        onClick={() => setQuestions([...questions, ""])}
                      >
                        <Plus className="w-3 h-3" /> Add question
                      </Button>
                    )}
                    <Button size="sm" className="font-serif text-xs gap-1" onClick={saveRingFields}>
                      <Save className="w-3 h-3" /> Save
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {(volume.open_questions || []).map((q, i) => (
                      <li key={i} className="text-xs font-serif text-foreground/80 flex gap-2">
                        <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                    {(!volume.open_questions || volume.open_questions.length === 0) && (
                      <p className="text-xs text-muted-foreground font-serif italic">No questions added yet</p>
                    )}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* Experiments */}
          {(volume.integration_intent === "prototype" || volume.integration_intent === "experiment") && (
            <>
              <Separator className="bg-border/30" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Beaker className="w-3.5 h-3.5 text-primary" />
                  <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">
                    Linked Experiments ({experiments.length})
                  </p>
                </div>

                {experiments.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded-lg border border-border/30 p-3 text-xs font-serif space-y-1"
                  >
                    <p className="text-foreground/90">{exp.description}</p>
                    <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                      <Badge variant="outline" className="text-[9px] capitalize">{exp.status}</Badge>
                      {exp.timeline && <span>📅 {exp.timeline}</span>}
                    </div>
                  </div>
                ))}

                {canAddExperiment && (
                  <div className="flex gap-2">
                    <Input
                      value={newExpDesc}
                      onChange={(e) => setNewExpDesc(e.target.value)}
                      placeholder="Describe experiment…"
                      className="font-serif text-xs flex-1"
                      onKeyDown={(e) => e.key === "Enter" && addExperiment()}
                    />
                    <Button size="sm" variant="outline" onClick={addExperiment} className="font-serif text-xs">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollaboratorVolumeDetail;
