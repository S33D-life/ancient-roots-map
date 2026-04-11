/**
 * SendWhisperModal — Send a whisper through an Ancient Friend.
 * Ceremonial, organic, not like chat.
 */
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { sendWhisper } from "@/hooks/use-whispers";
import { emitMycelialThread } from "@/lib/mycelial-network";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, TreeDeciduous, Users, Globe, User, Share2, Copy, Check, Wind } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  type ShareEntity,
  type ShareOptions,
  shareByPlatform,
  getShareUrl,
} from "@/utils/shareUtils";
import { useInvitationAllowance } from "@/hooks/use-invitation-allowance";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  treeName: string;
  treeSpecies: string;
  contextLabel?: string;
}

export default function SendWhisperModal({
  open, onOpenChange, treeId, treeName, treeSpecies,
  contextLabel,
}: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [recipientScope, setRecipientScope] = useState<"PRIVATE" | "CIRCLE" | "PUBLIC">("PUBLIC");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientUserId, setRecipientUserId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; full_name: string }>>([]);
  const [message, setMessage] = useState("");
  const [deliveryScope, setDeliveryScope] = useState<"ANY_TREE" | "SPECIFIC_TREE" | "SPECIES_MATCH">("ANY_TREE");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [inviteEnabled, setInviteEnabled] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [sentWhisperId, setSentWhisperId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { allowance } = useInvitationAllowance(userId);
  const canInvite = (allowance?.invitesRemaining ?? 0) > 0;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (open) {
      setStep(1);
      setRecipientScope("PUBLIC");
      setRecipientSearch("");
      setRecipientUserId(null);
      setRecipientName("");
      setMessage("");
      setDeliveryScope("ANY_TREE");
      setSent(false);
      setInviteEnabled(false);
      setInviteCode(null);
      setSentWhisperId(null);
      setCopied(false);
    }
  }, [open]);

  // Create a fresh single-use invite link when invite toggle is enabled
  useEffect(() => {
    if (!inviteEnabled || inviteCode) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Always create a new single-use invite link for each whisper invitation
      const { data: newLink } = await supabase
        .from("invite_links")
        .insert({ created_by: user.id, max_uses: 1 } as any)
        .select("code")
        .single();
      setInviteCode(newLink?.code || null);
    })();
  }, [inviteEnabled, inviteCode]);

  // Auto-close only if invite is NOT enabled (otherwise show share step)
  useEffect(() => {
    if (!sent || inviteEnabled) return;
    toast.success("Whisper sent.");
    const timer = setTimeout(() => onOpenChange(false), 900);
    return () => clearTimeout(timer);
  }, [sent, onOpenChange, inviteEnabled]);

  // Search wanderers for private whispers
  useEffect(() => {
    if (recipientScope !== "PRIVATE" || recipientSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("search_discoverable_profiles", {
        search_query: recipientSearch,
        result_limit: 5,
      });
      setSearchResults((data || []).filter((p: any) => p.id !== userId));
    }, 300);
    return () => clearTimeout(t);
  }, [recipientSearch, recipientScope, userId]);

  const handleSend = async () => {
    if (!userId) { toast.error("Please sign in to send a whisper."); return; }
    if (!message.trim()) { toast.error("Write a message first."); return; }
    if (recipientScope === "PRIVATE" && !recipientUserId) {
      toast.error("Select a recipient.");
      return;
    }

    setSending(true);
    const speciesKey = treeSpecies?.toLowerCase().replace(/\s+/g, "_");

    const { error, data: whisperData } = await sendWhisper({
      senderUserId: userId,
      recipientScope,
      recipientUserId: recipientScope === "PRIVATE" ? recipientUserId! : undefined,
      treeAnchorId: treeId,
      messageContent: message.trim(),
      deliveryScope,
      deliveryTreeId: deliveryScope === "SPECIFIC_TREE" ? treeId : undefined,
      deliverySpeciesKey: deliveryScope === "SPECIES_MATCH" ? speciesKey : undefined,
    });

    if (error) {
      toast.error("Failed to send whisper.");
      console.error(error);
    } else {
      if (whisperData && typeof whisperData === "object" && whisperData !== null && "id" in (whisperData as Record<string, unknown>)) {
        setSentWhisperId((whisperData as any).id);
      }
      let senderLocation: { lat: number; lng: number } | null = null;
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        try {
          senderLocation = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => resolve(null),
              { enableHighAccuracy: false, timeout: 2200, maximumAge: 120000 },
            );
          });
        } catch {
          senderLocation = null;
        }
      }
      emitMycelialThread({
        source: "whisper",
        targetTreeId: treeId,
        targetTreeName: treeName,
        from: senderLocation,
      });
      setSent(true);
      if (inviteEnabled) {
        toast.success("Whisper sent — now share the invitation!");
      }
      window.dispatchEvent(new CustomEvent("whisper-sent", { detail: { treeId } }));
    }
    setSending(false);
  };

  /* ── Share helpers for invite flow ── */
  const INVITE_PLATFORMS = [
    { key: "whatsapp", label: "WhatsApp", icon: "💬" },
    { key: "telegram", label: "Telegram", icon: "✈️" },
    { key: "copy", label: "Copy Link", icon: "🔗" },
  ] as const;

  const whisperShareEntity: ShareEntity = {
    type: "tree",
    id: treeId,
    name: treeName,
    species: treeSpecies,
  };

  const whisperShareCaption = "I left you a whisper through this tree 🌳\nCome and find it…";

  const whisperShareOpts: ShareOptions = {
    entity: whisperShareEntity,
    caption: whisperShareCaption,
    inviteCode,
  };

  const handleInviteShare = async (platform: string) => {
    const success = await shareByPlatform(platform, whisperShareOpts);
    if (platform === "copy" && success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied!");
    }
  };

  const handleNativeInviteShare = async () => {
    await shareByPlatform("native", whisperShareOpts);
  };

  const hasNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.15, 1], opacity: 1 }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.15))",
                  boxShadow: "0 0 30px hsl(var(--primary) / 0.15)",
                }}
              >
                <TreeDeciduous className="w-8 h-8 text-primary" />
              </div>
            </motion.div>

            <motion.h3
              className="text-xl font-serif text-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Whisper Sent
            </motion.h3>

            <motion.p
              className="text-sm text-muted-foreground font-serif max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Your message now rests within <strong>{treeName}</strong>, waiting to be collected.
            </motion.p>

            {/* Invite share flow */}
            {inviteEnabled && (
              <motion.div
                className="w-full space-y-3 pt-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <p className="text-xs font-serif text-primary/80 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />
                    Share this whisper as an invitation
                  </p>
                </div>

                {hasNativeShare && (
                  <Button
                    onClick={handleNativeInviteShare}
                    className="w-full font-serif text-sm tracking-wider gap-2 min-h-[44px]"
                  >
                    <Share2 className="w-4 h-4" /> Share invitation
                  </Button>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {INVITE_PLATFORMS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handleInviteShare(p.key)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/30 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all min-h-[56px] active:scale-95 relative"
                    >
                      <span className="text-lg">{p.icon}</span>
                      <span className="text-[10px] font-serif text-muted-foreground">{p.label}</span>
                      {p.key === "copy" && copied && (
                        <Check className="w-3 h-3 text-primary absolute top-1 right-1" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: inviteEnabled ? 0.9 : 0.7 }}
            >
              <Button onClick={() => onOpenChange(false)} variant="outline" className="font-serif mt-2">
                {inviteEnabled ? "Done" : "Return"}
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <TreeDeciduous className="h-5 w-5 text-primary" />
            <DialogTitle className="font-serif text-primary tracking-wide">
              Send a Whisper Through This Tree
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground font-serif mt-1">
            Leave a message within <strong>{treeName}</strong>.
          </p>
          {contextLabel && (
            <p className="text-xs text-muted-foreground/80 font-serif mt-1">
              Context: {contextLabel}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Step 1: Recipient */}
          <div className="space-y-3">
            <Label className="font-serif text-sm">Who can collect this whisper?</Label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "PUBLIC" as const, label: "Any Wanderer", icon: <Globe className="w-3.5 h-3.5" /> },
                { value: "PRIVATE" as const, label: "A Specific Wanderer", icon: <User className="w-3.5 h-3.5" /> },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setRecipientScope(opt.value);
                    if (opt.value !== "PRIVATE") { setRecipientUserId(null); setRecipientName(""); }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-serif border transition-all ${
                    recipientScope === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            {recipientScope === "PRIVATE" && (
              <div className="space-y-2">
                <Input
                  placeholder="Search for a Wanderer…"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="font-serif text-sm"
                />
                {recipientUserId && (
                  <Badge variant="outline" className="font-serif text-xs gap-1">
                    <User className="w-3 h-3" /> {recipientName}
                  </Badge>
                )}
                {searchResults.length > 0 && !recipientUserId && (
                  <div className="border border-border/40 rounded-lg divide-y divide-border/20 max-h-32 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setRecipientUserId(p.id);
                          setRecipientName(p.full_name || "Wanderer");
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-serif hover:bg-primary/5 transition-colors"
                      >
                        {p.full_name || "Wanderer"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Message */}
          <div className="space-y-2">
            <Label className="font-serif text-sm">Your Whisper</Label>
            <Textarea
              placeholder="What do you wish to say through this tree?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-serif text-sm min-h-[100px] resize-none"
              maxLength={2000}
            />
            <p className="text-[10px] text-muted-foreground/50 text-right font-serif">
              {message.length}/2000
            </p>
          </div>

          {/* Step 3: Delivery Rule */}
          <div className="space-y-3">
            <Label className="font-serif text-sm">Where can it be collected?</Label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "ANY_TREE" as const, label: "Any Ancient Friend", desc: "Collected at the next check-in" },
                { value: "SPECIFIC_TREE" as const, label: `Only at ${treeName}`, desc: "Must visit this tree" },
                { value: "SPECIES_MATCH" as const, label: `Any ${treeSpecies}`, desc: `Must visit a ${treeSpecies}` },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDeliveryScope(opt.value)}
                  className={`flex flex-col items-start px-3 py-2 rounded-lg text-xs font-serif border transition-all ${
                    deliveryScope === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px] opacity-60">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Invite toggle */}
          {userId && (
            <div className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${canInvite ? "border-border/40 bg-secondary/10" : "border-border/20 bg-muted/30 opacity-60"}`}>
              <div className="space-y-0.5">
                <Label className="font-serif text-sm cursor-pointer" htmlFor="invite-toggle">
                  Invite someone with this whisper
                </Label>
                <p className="text-[10px] text-muted-foreground/60 font-serif">
                  {canInvite
                    ? `${allowance?.invitesRemaining ?? 0} invitations remaining`
                    : "No invitations remaining"
                  }
                </p>
              </div>
              <Switch
                id="invite-toggle"
                checked={inviteEnabled}
                onCheckedChange={setInviteEnabled}
                disabled={!canInvite}
              />
            </div>
          )}

          {!userId && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-serif text-muted-foreground">
              You can compose freely. Sign in is required to send.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={sending || !userId || !message.trim() || (recipientScope === "PRIVATE" && !recipientUserId)}
            className="font-serif tracking-wider gap-2 w-full sm:w-auto"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Whisper
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
