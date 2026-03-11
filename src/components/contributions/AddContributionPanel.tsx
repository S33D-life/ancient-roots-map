/**
 * AddContributionPanel — Universal "Add to this tree" entry point.
 * Lightweight: pick a type, write a note, submit.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTRIBUTION_META,
  useAddContribution,
  type ContributionType,
} from "@/hooks/use-tree-contributions";

interface Props {
  treeId: string;
  treeName: string;
}

const TYPES: ContributionType[] = [
  "photo",
  "seasonal_observation",
  "offering",
  "stewardship_note",
  "harvest_record",
  "local_story",
  "correction",
];

const AddContributionPanel = ({ treeId, treeName }: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ContributionType>("seasonal_observation");
  const [content, setContent] = useState("");
  const addMutation = useAddContribution();

  const meta = CONTRIBUTION_META[selectedType];

  const handleSubmit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sign in to contribute");
      return;
    }
    if (!content.trim()) {
      toast.error("Please add a note");
      return;
    }
    try {
      await addMutation.mutateAsync({
        tree_id: treeId,
        user_id: user.id,
        contribution_type: selectedType,
        content: content.trim(),
      });
      toast.success("🌿 Contribution added", {
        description: `Your ${meta.label.toLowerCase()} has been received by ${treeName}.`,
      });
      setContent("");
      setOpen(false);
    } catch {
      toast.error("Failed to add contribution");
    }
  };

  return (
    <section className="relative">
      {/* Collapsed CTA */}
      {!open && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Button
            onClick={() => setOpen(true)}
            variant="outline"
            className="font-serif tracking-wider gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all h-12 px-8"
            style={{ boxShadow: "0 2px 16px hsl(var(--primary) / 0.1)" }}
          >
            <Plus className="h-4 w-4" /> Add to this tree
          </Button>
        </motion.div>
      )}

      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur p-5 space-y-4">
              {/* Type selector */}
              <div className="flex flex-wrap gap-2">
                {TYPES.map((type) => {
                  const m = CONTRIBUTION_META[type];
                  const active = type === selectedType;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif transition-all
                        ${
                          active
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-muted/40 text-muted-foreground border border-border/30 hover:border-primary/20"
                        }
                      `}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content input */}
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={meta.placeholder}
                className="min-h-[80px] font-serif text-sm bg-background/50 border-border/40 resize-none focus:border-primary/40"
                maxLength={5000}
              />

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    setContent("");
                  }}
                  className="text-muted-foreground font-serif text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={addMutation.isPending || !content.trim()}
                  size="sm"
                  className="font-serif gap-2 bg-primary/90 hover:bg-primary text-primary-foreground"
                >
                  {addMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Submit
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default AddContributionPanel;
