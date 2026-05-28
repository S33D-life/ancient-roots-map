/**
 * OfferingWhisperDrawer — bottom sheet for sending an offering as a whisper.
 *
 * Lets the wanderer choose:
 *   1. Who receives this whisper (4 delivery scopes)
 *   2. An optional personal message
 *   3. Whether to send signed or anonymous-until-encounter
 *
 * The offering itself is NEVER duplicated.
 * This creates a tree_whispers row with offering_id referencing the offering.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wind, TreePine, User, Sparkles, Loader2, EyeOff, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  sendOfferingWhisper,
  type OfferingWhisperScope,
  type SenderVisibility,
} from "@/hooks/use-offering-whisper";
import { useWandererSearch, type WandererProfile } from "@/hooks/use-fellow-wanderers";
import OfferingWhisperPreview from "./OfferingWhisperPreview";

// ─── Scope options ──────────────────────────────────────────────────────────

interface ScopeOption {
  value: OfferingWhisperScope;
  icon: React.ReactNode;
  label: string;
  hint: string;
}

// v1 scopes — FOREST_WIDE reserved for future when collection logic is ready
const SCOPE_OPTIONS: ScopeOption[] = [
  {
    value: "SPECIFIC_WANDERER",
    icon: <User className="w-4 h-4" />,
    label: "Someone I was thinking of",
    hint: "Send directly to a wanderer who came to mind while you were here.",
  },
  {
    value: "SPECIFIC_TREE",
    icon: <TreePine className="w-4 h-4" />,
    label: "Whoever meets this tree",
    hint: "Held here until the next wanderer encounters this Ancient Friend.",
  },
  {
    value: "SPECIES_MATCH",
    icon: <Wind className="w-4 h-4" />,
    label: "Whoever meets this species",
    hint: "Travels the mycelium — finds whoever next encounters this kind of tree.",
  },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  offeringId: string;
  treeId: string;
  treeName?: string;
  treeSpecies?: string;
  treeSpeciesKey?: string | null;
  /** Called when whisper is successfully sent */
  onSent?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OfferingWhisperDrawer({
  open,
  onClose,
  offeringId,
  treeId,
  treeName,
  treeSpecies,
  treeSpeciesKey,
  onSent,
}: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [scope, setScope] = useState<OfferingWhisperScope>("SPECIFIC_WANDERER");
  const [personalMessage, setPersonalMessage] = useState("");
  const [senderVisibility, setSenderVisibility] = useState<SenderVisibility>("signed");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipient, setRecipient] = useState<WandererProfile | null>(null);
  const [sending, setSending] = useState(false);

  const { results: searchResults, searching, search: searchWanderers } = useWandererSearch();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (scope !== "SPECIFIC_WANDERER") { setRecipient(null); setRecipientSearch(""); }
  }, [scope]);

  useEffect(() => {
    if (recipientSearch.trim().length >= 2) {
      searchWanderers(recipientSearch);
    }
  }, [recipientSearch, searchWanderers]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setScope("SPECIFIC_WANDERER");
      setPersonalMessage("");
      setSenderVisibility("signed");
      setRecipient(null);
      setRecipientSearch("");
    }
  }, [open]);

  const canSend =
    !!userId &&
    (scope !== "SPECIFIC_WANDERER" || !!recipient);

  async function handleSend() {
    if (!userId || !canSend) return;
    setSending(true);
    try {
      const { error } = await sendOfferingWhisper({
        senderUserId: userId,
        offeringId,
        treeAnchorId: treeId,
        treeSpeciesKey: treeSpeciesKey || treeSpecies?.toLowerCase().replace(/\s+/g, "_") || null,
        scope,
        recipientUserId: scope === "SPECIFIC_WANDERER" ? recipient?.id ?? null : null,
        personalMessage: personalMessage.trim() || undefined,
        senderVisibility,
      });
      if (error) throw error;
      toast.success("Your resonance is on its way 🌿");
      onSent?.();
      onClose();
    } catch (err: any) {
      console.error("Offering whisper failed:", err);
      toast.error("The whisper didn't reach the roots — try again");
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl border-t border-border shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="p-5 space-y-5 pb-8">

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-serif uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                    Pass a Resonance
                  </p>
                  <h3 className="font-serif text-lg text-foreground leading-tight">
                    {treeName ? `From ${treeName}` : "From this Ancient Friend"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Offering preview */}
              <div className="space-y-1">
                <p className="text-[10px] font-serif uppercase tracking-widest text-muted-foreground/60">
                  The offering
                </p>
                <OfferingWhisperPreview offeringId={offeringId} linkToTree={false} />
              </div>

              {/* Scope selector */}
              <div className="space-y-2">
                <p className="text-[10px] font-serif uppercase tracking-widest text-muted-foreground/60">
                  Who were you thinking of?
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {SCOPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setScope(opt.value)}
                      className={[
                        "flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                        scope === opt.value
                          ? "border-primary bg-primary/8 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                      ].join(" ")}
                    >
                      <span className="mt-0.5 shrink-0 text-primary/70">{opt.icon}</span>
                      <div>
                        <p className="text-[12px] font-serif font-medium leading-snug">{opt.label}</p>
                        <p className="text-[11px] font-serif text-muted-foreground/70 mt-0.5 leading-relaxed">{opt.hint}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific wanderer search */}
              <AnimatePresence>
                {scope === "SPECIFIC_WANDERER" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-2"
                  >
                    <Label className="text-[10px] font-serif uppercase tracking-widest text-muted-foreground/60">
                      Find them
                    </Label>
                    {recipient ? (
                      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span className="text-sm font-serif text-foreground flex-1">{recipient.full_name}</span>
                        <button
                          type="button"
                          onClick={() => setRecipient(null)}
                          className="text-muted-foreground/50 hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Input
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          placeholder="Search by name…"
                          className="font-serif text-sm"
                        />
                        {searching && (
                          <p className="text-[11px] font-serif text-muted-foreground/60 px-1">Searching…</p>
                        )}
                        {!searching && searchResults.length > 0 && (
                          <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
                            {searchResults.slice(0, 5).map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => { setRecipient(r); setRecipientSearch(""); }}
                                className="w-full text-left px-3 py-2.5 text-sm font-serif hover:bg-muted/50 transition-colors border-b border-border/20 last:border-b-0"
                              >
                                {r.full_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Personal message */}
              <div className="space-y-2">
                <Label className="text-[10px] font-serif uppercase tracking-widest text-muted-foreground/60">
                  A word for them <span className="normal-case tracking-normal">(optional)</span>
                </Label>
                <Textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  rows={3}
                  placeholder="I offered something to an Ancient Friend and thought of you."
                  className="font-serif text-sm resize-none rounded-xl"
                  maxLength={500}
                />
                {personalMessage.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/50 font-mono text-right">
                    {500 - personalMessage.length} left
                  </p>
                )}
              </div>

              {/* Sender visibility */}
              <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  {senderVisibility === "signed"
                    ? <Eye className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    : <EyeOff className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  }
                  <div>
                    <p className="text-[12px] font-serif text-foreground">
                      {senderVisibility === "signed" ? "Signed" : "Anonymous until encounter"}
                    </p>
                    <p className="text-[11px] font-serif text-muted-foreground/60 leading-snug">
                      {senderVisibility === "signed"
                        ? "Recipient sees your name with this whisper."
                        : "Your identity is revealed when they next meet this tree."}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={senderVisibility === "anonymous_until_encounter"}
                  onCheckedChange={(v) =>
                    setSenderVisibility(v ? "anonymous_until_encounter" : "signed")
                  }
                />
              </div>

              {/* Send */}
              <Button
                type="button"
                onClick={handleSend}
                disabled={!canSend || sending}
                className="w-full rounded-xl font-serif"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending through the roots…</>
                ) : (
                  <><Wind className="w-4 h-4 mr-2" /> Send this resonance</>
                )}
              </Button>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
