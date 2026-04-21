/**
 * MycelialWhisperOpenModal — Soft full-screen reveal for opening a group whisper.
 * Validates channel match server-side, awards hearts, and echoes sender.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, TreeDeciduous, Loader2 } from "lucide-react";
import { openGroupWhisper, type MycelialWhisper, type WhisperChannelType } from "@/hooks/use-mycelial-whispers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whisper: MycelialWhisper;
  currentTreeId: string;
  onOpened?: () => void;
}

const CHANNEL_LABEL: Record<WhisperChannelType, string> = {
  tree: "🌳 Through this tree",
  species: "🌿 Through this species",
  mycelium: "🍄 Through the mycelial network",
};

export default function MycelialWhisperOpenModal({
  open, onOpenChange, whisper, currentTreeId, onOpened,
}: Props) {
  const [stage, setStage] = useState<"opening" | "revealed" | "error">("opening");
  const [message, setMessage] = useState<string>("");
  const [reward, setReward] = useState(0);
  const [capped, setCapped] = useState(false);
  const [senderName, setSenderName] = useState<string>("a wanderer");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setStage("opening");
    setReward(0);
    setMessage("");
    setCapped(false);
    setErrorMsg("");

    (async () => {
      const { data, error } = await openGroupWhisper(whisper.id, currentTreeId);
      if (error || !data?.ok) {
        if (data?.error === "channel_mismatch") {
          setErrorMsg("This whisper waits at a different tree.");
        } else {
          setErrorMsg("The roots stir, but the whisper does not open.");
        }
        setStage("error");
        return;
      }
      setMessage(data.message || "");
      setReward(data.reward || 0);
      setCapped(!!data.capped);

      // Look up sender name (best-effort)
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.sender_user_id || whisper.sender_user_id)
        .maybeSingle();
      setSenderName((prof as any)?.full_name || "a wanderer");

      setStage("revealed");
      if ((data.reward || 0) > 0) {
        toast.success(`+${data.reward} hearts received`, { icon: "❤️" });
      }
      onOpened?.();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, whisper.id, currentTreeId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden border-primary/20"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.4) 100%)",
        }}
      >
        <AnimatePresence mode="wait">
          {stage === "opening" && (
            <motion.div
              key="opening"
              className="flex flex-col items-center justify-center py-16 px-8 text-center min-h-[360px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: "hsl(var(--primary) / 0.08)" }}
              >
                <Sparkles className="w-6 h-6 text-primary/60" />
              </motion.div>
              <p className="text-sm font-serif text-muted-foreground italic">
                The roots stir…
              </p>
            </motion.div>
          )}

          {stage === "error" && (
            <motion.div
              key="error"
              className="flex flex-col items-center justify-center py-16 px-8 text-center min-h-[360px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TreeDeciduous className="w-10 h-10 text-muted-foreground/40 mb-4" />
              <p className="text-sm font-serif text-muted-foreground italic max-w-xs">
                {errorMsg}
              </p>
              <p className="text-[11px] font-serif text-muted-foreground/60 mt-2">
                {CHANNEL_LABEL[whisper.channel_type]}
              </p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="font-serif mt-6"
              >
                Return
              </Button>
            </motion.div>
          )}

          {stage === "revealed" && (
            <motion.div
              key="revealed"
              className="flex flex-col py-10 px-8 min-h-[360px]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.div
                className="text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-[10px] font-serif tracking-[0.2em] uppercase text-primary/60">
                  {CHANNEL_LABEL[whisper.channel_type]}
                </p>
                <p className="text-xs font-serif text-muted-foreground mt-2">
                  from <span className="text-primary">{senderName}</span>
                </p>
              </motion.div>

              <motion.div
                className="flex-1 flex items-center justify-center my-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 1.2 }}
              >
                <p className="text-lg font-serif text-foreground/90 leading-relaxed italic text-center">
                  "{message}"
                </p>
              </motion.div>

              <motion.div
                className="flex flex-col items-center gap-3 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {reward > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-serif text-primary">
                    <Heart className="w-3.5 h-3.5 fill-primary/30" />
                    <span>+{reward} hearts received</span>
                  </div>
                )}
                {capped && (
                  <p className="text-[10px] font-serif text-muted-foreground/60 italic">
                    Daily reward limit reached — the whisper still travels with you.
                  </p>
                )}
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="font-serif mt-2"
                >
                  Carry it with me
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
