/**
 * MycelialWhisperOpenModal — Soft full-screen reveal for opening a group whisper.
 *
 * Flow:
 *   preview → (user confirms) → opening → revealed | error
 *
 * The preview stage shows audience + recipient group details (channel, group
 * name & member count, anchor tree, sender, expected heart reward) so the
 * wanderer can decide consciously before claiming the open reward.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, TreeDeciduous, Loader2, Users, User as UserIcon } from "lucide-react";
import {
  openGroupWhisper,
  CHANNEL_REWARD,
  type MycelialWhisper,
  type WhisperChannelType,
} from "@/hooks/use-mycelial-whispers";
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

const CHANNEL_DESCRIPTION: Record<WhisperChannelType, string> = {
  tree: "Bound to a single tree's soil.",
  species: "Rippling through one species family.",
  mycelium: "Travelling the wider forest network.",
};

interface GroupDetails {
  name: string;
  type: string;
  memberCount: number;
}

export default function MycelialWhisperOpenModal({
  open, onOpenChange, whisper, currentTreeId, onOpened,
}: Props) {
  const [stage, setStage] = useState<"preview" | "opening" | "revealed" | "error">("preview");
  const [message, setMessage] = useState<string>("");
  const [reward, setReward] = useState(0);
  const [capped, setCapped] = useState(false);
  const [senderName, setSenderName] = useState<string>("a wanderer");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Preview-stage data
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [anchorTreeName, setAnchorTreeName] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(true);

  const expectedReward = CHANNEL_REWARD[whisper.channel_type] ?? 0;

  // Reset to preview each time it opens; load preview metadata in parallel.
  useEffect(() => {
    if (!open) return;
    setStage("preview");
    setReward(0);
    setMessage("");
    setCapped(false);
    setErrorMsg("");
    setGroupDetails(null);
    setAnchorTreeName("");
    setPreviewLoading(true);

    (async () => {
      const [senderRes, groupRes, treeRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", whisper.sender_user_id)
          .maybeSingle(),
        whisper.group_id
          ? supabase
              .from("whisper_groups")
              .select("name, group_type")
              .eq("id", whisper.group_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        whisper.tree_anchor_id
          ? supabase
              .from("trees")
              .select("name, species_common")
              .eq("id", whisper.tree_anchor_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setSenderName((senderRes.data as any)?.full_name || "a wanderer");

      if (whisper.group_id) {
        const { count } = await supabase
          .from("whisper_group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", whisper.group_id);
        const g = (groupRes as any)?.data;
        setGroupDetails({
          name: g?.name || "Unnamed circle",
          type: g?.group_type || "circle",
          memberCount: count ?? 0,
        });
      }

      const t = (treeRes as any)?.data;
      setAnchorTreeName(t?.name || t?.species_common || "an ancient friend");
      setPreviewLoading(false);
    })();
  }, [open, whisper.id, whisper.sender_user_id, whisper.group_id, whisper.tree_anchor_id, whisper.channel_type]);

  const handleConfirmOpen = async () => {
    setStage("opening");
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

    // Refresh sender name from server-confirmed id (best-effort).
    if (data.sender_user_id && data.sender_user_id !== whisper.sender_user_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.sender_user_id)
        .maybeSingle();
      setSenderName((prof as any)?.full_name || senderName);
    }

    setStage("revealed");
    if ((data.reward || 0) > 0) {
      toast.success(`+${data.reward} hearts received`, { icon: "❤️" });
    }
    onOpened?.();
  };

  const audienceLabel =
    whisper.audience_type === "group"
      ? "A circle of wanderers"
      : "A single wanderer";
  const AudienceIcon = whisper.audience_type === "group" ? Users : UserIcon;

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
          {stage === "preview" && (
            <motion.div
              key="preview"
              className="flex flex-col py-8 px-7 min-h-[360px]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-5">
                <p className="text-[10px] font-serif tracking-[0.2em] uppercase text-primary/60">
                  A whisper waits beneath the roots
                </p>
                <p className="text-xs font-serif text-muted-foreground mt-2 italic">
                  Confirm to open and receive the reward.
                </p>
              </div>

              <div className="space-y-2.5 rounded-xl border border-primary/15 bg-background/50 p-4">
                {/* Channel */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-serif uppercase tracking-wider text-muted-foreground/60">
                      Channel
                    </p>
                    <p className="text-sm font-serif text-foreground/90">
                      {CHANNEL_LABEL[whisper.channel_type]}
                    </p>
                    <p className="text-[10px] font-serif text-muted-foreground italic">
                      {CHANNEL_DESCRIPTION[whisper.channel_type]}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border/40" />

                {/* Audience + recipient group */}
                <div className="flex items-start gap-3">
                  <AudienceIcon className="w-4 h-4 mt-0.5 text-primary/70 shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-[10px] font-serif uppercase tracking-wider text-muted-foreground/60">
                      Audience
                    </p>
                    <p className="text-sm font-serif text-foreground/90">
                      {audienceLabel}
                    </p>
                    {previewLoading && whisper.group_id && (
                      <p className="text-[10px] font-serif text-muted-foreground/60 italic flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> reading the circle…
                      </p>
                    )}
                    {!previewLoading && groupDetails && (
                      <p className="text-[11px] font-serif text-muted-foreground">
                        <span className="text-foreground/80">{groupDetails.name}</span>
                        <span className="opacity-60"> · {groupDetails.type}</span>
                        <span className="opacity-60"> · {groupDetails.memberCount} {groupDetails.memberCount === 1 ? "member" : "members"}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border/40" />

                {/* Sender + anchor tree */}
                <div className="flex items-start gap-3">
                  <TreeDeciduous className="w-4 h-4 mt-0.5 text-primary/70 shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-[10px] font-serif uppercase tracking-wider text-muted-foreground/60">
                      Sent by
                    </p>
                    <p className="text-sm font-serif text-foreground/90">
                      {previewLoading ? "…" : senderName}
                      <span className="text-muted-foreground"> from </span>
                      <span className="text-foreground/80">{anchorTreeName || "…"}</span>
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border/40" />

                {/* Reward */}
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary fill-primary/30" />
                    <span className="text-sm font-serif text-foreground/90">
                      Open reward
                    </span>
                  </div>
                  <span className="text-sm font-serif text-primary">
                    +{expectedReward} {expectedReward === 1 ? "heart" : "hearts"}
                  </span>
                </div>
                <p className="text-[10px] font-serif text-muted-foreground/70 italic leading-relaxed">
                  Daily caps may apply. The whisper still travels with you either way.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="font-serif"
                >
                  Not now
                </Button>
                <Button
                  onClick={handleConfirmOpen}
                  disabled={previewLoading}
                  className="font-serif gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Open whisper
                </Button>
              </div>
            </motion.div>
          )}

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
                  {groupDetails && (
                    <span className="opacity-70"> · {groupDetails.name}</span>
                  )}
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
