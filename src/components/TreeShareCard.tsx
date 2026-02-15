/**
 * TreeShareCard — Share an Ancient Friend with referral-aware deep links.
 * Sharing always begins with a specific tree, never generic app promotion.
 * Share links behave exactly like invite links.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Copy, Heart, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TreeShareCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tree: {
    id: string;
    name: string;
    species: string;
    imageUrl?: string | null;
    location?: string | null;
  };
}

const SHARE_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: "📸" },
  { key: "x", label: "X", icon: "𝕏" },
  { key: "facebook", label: "Facebook", icon: "📘" },
  { key: "copy", label: "Copy Link", icon: "🔗" },
] as const;

const TreeShareCard = ({ open, onOpenChange, tree }: TreeShareCardProps) => {
  const [caption, setCaption] = useState("I paused here. An ancient friend still standing.");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const { toast } = useToast();

  // Generate referral-aware share link when dialog opens
  useEffect(() => {
    if (!open) return;
    const generateLink = async () => {
      setGenerating(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Anonymous share — no referral binding
          setShareLink(`${window.location.origin}/tree/${tree.id}`);
          setGenerating(false);
          return;
        }

        // Get or create invite code for this user
        let code: string | null = null;
        const { data: existing } = await supabase
          .from("invite_links")
          .select("code")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          code = existing.code;
        } else {
          const { data: newLink } = await supabase
            .from("invite_links")
            .insert({ created_by: user.id })
            .select("code")
            .single();
          code = newLink?.code || null;
        }

        // Build referral-aware deep link
        const params = new URLSearchParams();
        if (code) params.set("invite", code);
        params.set("from", "share");
        params.set("tree", tree.id);

        setShareLink(`${window.location.origin}/tree/${tree.id}?${params.toString()}`);
      } catch {
        setShareLink(`${window.location.origin}/tree/${tree.id}`);
      } finally {
        setGenerating(false);
      }
    };
    generateLink();
  }, [open, tree.id]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
  };

  const handleShare = async (platform: string) => {
    if (!shareLink) return;

    const text = `${caption}\n\n🌳 ${tree.name} · ${tree.species}`;
    const fullText = `${text}\n\n${shareLink}`;

    // Trigger visual spark
    setSparkle(true);
    setTimeout(() => setSparkle(false), 800);

    switch (platform) {
      case "instagram":
        // Instagram doesn't support direct URL sharing — copy for them
        await copyToClipboard(fullText);
        toast({ title: "Copied for Instagram!", description: "Paste into your Story or caption" });
        break;
      case "x":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}&quote=${encodeURIComponent(text)}`,
          "_blank"
        );
        break;
      case "copy":
        await copyToClipboard(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Link copied!" });
        break;
    }
  };

  // Also try native share if available
  const handleNativeShare = async () => {
    if (!shareLink || !navigator.share) return;
    try {
      await navigator.share({
        title: `${tree.name} · ${tree.species}`,
        text: caption,
        url: shareLink,
      });
      setSparkle(true);
      setTimeout(() => setSparkle(false), 800);
    } catch {
      // User cancelled or not supported
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share this Ancient Friend
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Preview card */}
          <div className="rounded-xl border border-border/40 bg-secondary/10 overflow-hidden">
            {tree.imageUrl && (
              <div className="h-32 overflow-hidden">
                <img
                  src={tree.imageUrl}
                  alt={tree.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-3 space-y-1">
              <p className="font-serif font-medium text-sm">{tree.name}</p>
              <p className="text-xs text-muted-foreground">{tree.species}{tree.location ? ` · ${tree.location}` : ""}</p>
            </div>
          </div>

          {/* Editable caption */}
          <div className="space-y-1.5">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 200))}
              placeholder="Write something poetic..."
              rows={2}
              maxLength={200}
              className="font-serif text-sm resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">{caption.length}/200</p>
          </div>

          {/* Share destinations */}
          {generating ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {SHARE_PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handleShare(p.key)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/30 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all"
                  >
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-[10px] font-serif text-muted-foreground">{p.label}</span>
                    {p.key === "copy" && copied && (
                      <Check className="w-3 h-3 text-primary absolute" />
                    )}
                  </button>
                ))}
              </div>

              {/* Native share button for mobile */}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <Button
                  onClick={handleNativeShare}
                  variant="outline"
                  className="w-full font-serif text-xs tracking-wider gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share via device
                </Button>
              )}
            </div>
          )}

          {/* Tiny heart spark on share */}
          <AnimatePresence>
            {sparkle && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex justify-center"
              >
                <Heart className="w-5 h-5 text-primary fill-primary/40" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TreeShareCard;
