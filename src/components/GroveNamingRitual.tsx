/**
 * GroveNamingRitual — ceremonial dialog for blessing and naming a grove.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TreeDeciduous, Sparkles, Leaf, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { GroveCandidate, GroveStrength } from "@/utils/groveDetection";
import { STRENGTH_LABELS, STRENGTH_COLORS } from "@/utils/groveDetection";

interface GroveNamingRitualProps {
  grove: GroveCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GroveNamingRitual({ grove, open, onOpenChange }: GroveNamingRitualProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [blessing, setBlessing] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!grove) return null;

  const isSpecies = grove.grove_type === "species_grove";

  const handleBless = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      // Create the grove record
      const { data: groveRecord, error } = await supabase.from("groves").insert({
        grove_type: grove.grove_type,
        grove_name: name.trim(),
        grove_status: "blessed",
        grove_strength: grove.grove_strength,
        grove_strength_score: grove.grove_strength_score,
        species_common: grove.species_common || null,
        species_scientific: grove.species_scientific || null,
        tree_count: grove.trees.length,
        verified_tree_count: grove.trees.filter(t => t.verified).length,
        center_latitude: grove.center.lat,
        center_longitude: grove.center.lng,
        radius_m: grove.radius_m,
        compactness_score: grove.compactness_score,
        formation_method: "community_blessed",
        blessed_by: userId || null,
      } as any).select("id").single();

      if (error) throw error;

      // Add member trees
      if (groveRecord) {
        const treeRows = grove.trees.map(t => ({
          grove_id: groveRecord.id,
          tree_id: t.id,
          tree_source: t.source,
        }));
        await supabase.from("grove_trees").insert(treeRows as any);
      }

      // Leave blessing as a whisper if provided
      if (blessing.trim() && userId && groveRecord) {
        // Store as the first grove interaction via offerings
        await supabase.from("offerings").insert({
          tree_id: grove.trees[0]?.id,
          type: "story",
          title: `Grove Blessing: ${name.trim()}`,
          content: blessing.trim(),
          created_by: userId,
        } as any);
      }

      toast({ title: "Grove Blessed ✨", description: `${name.trim()} has been named and blessed.` });
      queryClient.invalidateQueries({ queryKey: ["groves-saved"] });
      onOpenChange(false);
      setStep(0);
      setName("");
      setBlessing("");
    } catch (err: any) {
      toast({ title: "Could not bless grove", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-primary/20 bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> Grove Naming Ritual
          </DialogTitle>
          <DialogDescription className="text-xs">
            Give this grove a name and blessing to make it a living place.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Grove preview */}
              <div className="p-4 rounded-lg bg-muted/30 border border-primary/10 text-center space-y-2">
                <div className="text-2xl">{isSpecies ? "🌿" : "🌳"}</div>
                <p className="font-serif text-foreground">{grove.suggested_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {grove.trees.length} trees · {Math.round(grove.radius_m)}m radius · {Math.round(grove.compactness_score * 100)}% compact
                </p>
                <Badge variant="outline" className={`text-[9px] ${STRENGTH_COLORS[grove.grove_strength]}`}>
                  {STRENGTH_LABELS[grove.grove_strength]}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground text-center italic">
                A grove is forming here. {grove.trees.length} trees are gathering in quiet proximity.
                Would you like to give this place a name?
              </p>

              <Button onClick={() => { setName(grove.suggested_name); setStep(1); }} className="w-full" size="sm">
                <TreeDeciduous className="w-4 h-4 mr-2" /> Begin Naming Ritual
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="naming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Grove Name</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Trevi Olive Grove"
                  className="font-serif"
                  maxLength={100}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Suggested pattern: Species + Place or Place + Grove
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Blessing (optional)</label>
                <Textarea
                  value={blessing}
                  onChange={e => setBlessing(e.target.value)}
                  placeholder="Leave a whisper for this grove…"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} size="sm" className="flex-1">Back</Button>
                <Button onClick={handleBless} disabled={!name.trim() || saving} size="sm" className="flex-1">
                  {saving ? "Blessing…" : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Bless this Grove</>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
