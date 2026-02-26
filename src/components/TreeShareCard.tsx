/**
 * TreeShareCard — Share an Ancient Friend with referral-aware deep links.
 * Sharing always begins with a specific tree, never generic app promotion.
 * Share links behave exactly like invite links.
 *
 * Platforms: WhatsApp, Telegram, X, Native Share, Copy Link.
 * Optimised for mobile with thumb-zone button placement and 44px tap targets.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Copy, Heart, Check, Loader2, MapPin } from "lucide-react";
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
    heartCount?: number;
    city?: string | null;
    country?: string | null;
  };
  /** If provided, shows "invited by" context */
  referrerName?: string | null;
}

const SHARE_PLATFORMS = [
  { key: "whatsapp", label: "WhatsApp", icon: "💬" },
  { key: "telegram", label: "Telegram", icon: "✈️" },
  { key: "x", label: "X", icon: "𝕏" },
  { key: "copy", label: "Copy Link", icon: "🔗" },
] as const;

const TreeShareCard = ({ open, onOpenChange, tree, referrerName }: TreeShareCardProps) => {
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

  const buildShareText = () => {
    const locationPart = tree.city || tree.location || tree.country || "";
    return `🌳 Meet ${tree.name}${locationPart ? ` in ${locationPart}` : ""} · ${tree.species}\n\n${caption}`;
  };

  const handleShare = async (platform: string) => {
    if (!shareLink) return;

    const text = buildShareText();
    const fullText = `${text}\n\n${shareLink}`;

    setSparkle(true);
    setTimeout(() => setSparkle(false), 800);

    switch (platform) {
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(fullText)}`,
          "_blank"
        );
        break;
      case "telegram":
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`,
          "_blank"
        );
        break;
      case "x":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`,
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

  // Native share (preferred on mobile — surfaces WhatsApp, iMessage, Telegram etc.)
  const handleNativeShare = async () => {
    if (!shareLink || !navigator.share) return;
    try {
      await navigator.share({
        title: `${tree.name} · ${tree.species}`,
        text: buildShareText(),
        url: shareLink,
      });
      setSparkle(true);
      setTimeout(() => setSparkle(false), 800);
    } catch {
      // User cancelled or not supported
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share this Ancient Friend
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview card — enhanced with location + hearts */}
          <div className="rounded-xl border border-border/40 bg-secondary/10 overflow-hidden">
            {tree.imageUrl && (
              <div className="h-32 overflow-hidden">
                <img
                  src={tree.imageUrl}
                  alt={tree.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-3 space-y-1.5">
              <p className="font-serif font-medium text-sm">{tree.name}</p>
              <p className="text-xs text-muted-foreground italic">{tree.species}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                {(tree.city || tree.location || tree.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {tree.city || tree.location}{tree.country ? `, ${tree.country}` : ""}
                  </span>
                )}
                {tree.heartCount != null && tree.heartCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-primary/40 text-primary" />
                    {tree.heartCount}
                  </span>
                )}
              </div>
              {referrerName && (
                <p className="text-[10px] text-primary/70 font-serif">
                  Shared by {referrerName}
                </p>
              )}
            </div>
          </div>

          {/* Editable caption — shorter on mobile */}
          <div className="space-y-1">
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
              {/* Native share first on mobile — single prominent button */}
              {hasNativeShare && (
                <Button
                  onClick={handleNativeShare}
                  className="w-full font-serif text-sm tracking-wider gap-2 min-h-[44px]"
                >
                  <Share2 className="w-4 h-4" />
                  Share via device
                </Button>
              )}

              {/* Platform grid */}
              <div className="grid grid-cols-4 gap-2">
                {SHARE_PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handleShare(p.key)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/30 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all min-h-[56px] active:scale-95"
                  >
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-[10px] font-serif text-muted-foreground">{p.label}</span>
                    {p.key === "copy" && copied && (
                      <Check className="w-3 h-3 text-primary absolute" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Heart spark on share */}
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
