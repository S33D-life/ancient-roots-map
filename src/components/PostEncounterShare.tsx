/**
 * PostEncounterShare — lightweight overlay after a check-in.
 * "You met this Ancient Friend." + share options.
 * Now includes ref param from useInviteIdentity.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, X, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInviteIdentity } from "@/hooks/use-invite-identity";

interface PostEncounterShareProps {
  visible: boolean;
  onDismiss: () => void;
  treeName: string;
  treeSpecies: string;
  shareLink: string;
  city?: string | null;
}

const PostEncounterShare = ({
  visible,
  onDismiss,
  treeName,
  treeSpecies,
  shareLink,
  city,
}: PostEncounterShareProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { ref, displayHandle, treeInviteText } = useInviteIdentity();

  // Append ref param to shareLink if available
  const refLink = ref
    ? `${shareLink}${shareLink.includes("?") ? "&" : "?"}ref=${encodeURIComponent(ref)}`
    : shareLink;

  const text = `🌳 I found ${treeName}${city ? ` in ${city}` : ""} — come walk with me`;
  const fullText = `${text}\n${refLink}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = fullText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, "_blank");
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: `${treeName} · ${treeSpecies}`, text, url: refLink });
    } catch { /* cancelled */ }
  };

  const hasNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:max-w-sm"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-2xl space-y-4">
            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary fill-primary/30" />
              </div>
              <div>
                <p className="font-serif text-sm font-medium text-foreground">You met this Ancient Friend.</p>
                <p className="text-xs text-muted-foreground italic">{treeName} · {treeSpecies}</p>
              </div>
            </div>

            {/* Sharing as handle */}
            {displayHandle && (
              <p className="text-[10px] text-muted-foreground/60 font-serif text-center">
                Sharing as {displayHandle}
              </p>
            )}

            {/* Action row */}
            <div className="flex gap-2">
              {hasNativeShare ? (
                <Button onClick={nativeShare} className="flex-1 font-serif text-xs gap-1.5 min-h-[44px]">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
              ) : (
                <>
                  <button
                    onClick={shareWhatsApp}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border/30 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-xs font-serif min-h-[44px] active:scale-95"
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    onClick={shareTelegram}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border/30 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-xs font-serif min-h-[44px] active:scale-95"
                  >
                    ✈️ Telegram
                  </button>
                </>
              )}
              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border/30 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-xs font-serif min-h-[44px] active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Skip hint */}
            <p className="text-[10px] text-center text-muted-foreground/50 font-serif">
              Tap anywhere outside to skip
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostEncounterShare;
