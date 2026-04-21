/**
 * PostCheckinReflection — soft, optional reflection prompt shown after a check-in.
 * Saves into existing tree_checkins.reflection. Skippable. One text box.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  checkinId: string | null;
  treeName: string;
  onClose: () => void;
  onSaved?: () => void;
}

const PROMPTS = [
  "What did this tree show you?",
  "What did you notice that you might forget?",
  "If this tree spoke, what did it say?",
  "What small thing wants to be remembered?",
  "What was here that wasn't here before?",
];

const PostCheckinReflection = ({ open, checkinId, treeName, onClose, onSaved }: Props) => {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  // Stable per-mount prompt
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  const handleSave = async () => {
    if (!checkinId) return onClose();
    const trimmed = text.trim();
    if (!trimmed) return onClose();

    setSaving(true);
    const { error } = await supabase
      .from("tree_checkins")
      .update({ reflection: trimmed })
      .eq("id", checkinId);
    setSaving(false);

    if (error) {
      toast.error("Could not save reflection");
      return;
    }
    toast.success("Reflection planted 🌿");
    setText("");
    onSaved?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 md:inset-x-auto md:right-6 md:bottom-6 md:max-w-sm z-[60]"
          style={{
            // Sit above mobile BottomNav (~56px + safe-area)
            bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div
            className="rounded-2xl border p-4 shadow-2xl backdrop-blur-xl"
            style={{
              background: "hsl(var(--card) / 0.96)",
              borderColor: "hsl(var(--primary) / 0.25)",
              boxShadow: "0 8px 40px hsl(var(--primary) / 0.15)",
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary/70" />
                <p className="text-[10px] font-serif tracking-[0.2em] uppercase text-muted-foreground">
                  Beneath {treeName}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors p-0.5 -m-0.5"
                aria-label="Skip"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-sm font-serif italic text-foreground/85 leading-relaxed mb-3">
              {prompt}
            </p>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 280))}
              placeholder="A small thing, in your own voice…"
              rows={2}
              className="font-serif text-sm resize-none border-border/40 bg-background/60 mb-3 focus-visible:ring-primary/30"
              autoFocus
            />

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-serif text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                Skip
              </button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !text.trim()}
                className="font-serif text-xs tracking-wider gap-1.5"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Plant it
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostCheckinReflection;
