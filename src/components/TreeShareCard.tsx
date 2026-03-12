/**
 * TreeShareCard — Share an Ancient Friend with referral-aware deep links.
 * Uses the centralised share utility to route through og-proxy for
 * crawler-safe social previews.
 *
 * Platforms: WhatsApp, Telegram, X, Native Share, Copy Link.
 * Optimised for mobile with thumb-zone button placement and 44px tap targets.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Copy, Heart, Check, Loader2, MapPin, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  type ShareEntity,
  type ShareOptions,
  shareByPlatform,
  getShareUrl,
} from "@/utils/shareUtils";

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
    /** If true, shows NFTree badge on preview */
    isMinted?: boolean;
    /** Staff code that minted it */
    mintedByStaff?: string | null;
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
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const { toast } = useToast();

  // Build the share entity
  const shareEntity: ShareEntity = {
    type: tree.isMinted ? "nftree" : "tree",
    id: tree.id,
    name: tree.name,
    species: tree.species,
    location: tree.city || tree.location || tree.country || undefined,
    imageUrl: tree.imageUrl,
    isMinted: tree.isMinted,
    mintedByStaff: tree.mintedByStaff,
  };

  // Get or create invite code when dialog opens
  useEffect(() => {
    if (!open) return;
    const fetchInviteCode = async () => {
      setGenerating(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setGenerating(false);
          return;
        }

        const { data: existing } = await supabase
          .from("invite_links")
          .select("code")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          setInviteCode(existing.code);
        } else {
          const { data: newLink } = await supabase
            .from("invite_links")
            .insert({ created_by: user.id })
            .select("code")
            .single();
          setInviteCode(newLink?.code || null);
        }
      } catch {
        // Continue without invite code
      } finally {
        setGenerating(false);
      }
    };
    fetchInviteCode();
  }, [open]);

  const shareOpts: ShareOptions = {
    entity: shareEntity,
    caption,
    inviteCode,
  };

  const handleShare = useCallback(async (platform: string) => {
    setSparkle(true);
    setTimeout(() => setSparkle(false), 800);

    const success = await shareByPlatform(platform, shareOpts);
    if (platform === "copy" && success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!" });
    }
  }, [shareOpts, toast]);

  const handleNativeShare = useCallback(async () => {
    setSparkle(true);
    setTimeout(() => setSparkle(false), 800);
    await shareByPlatform("native", shareOpts);
  }, [shareOpts]);

  const hasNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  const shareUrl = getShareUrl(shareEntity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share this {tree.isMinted ? "NFTree" : "Ancient Friend"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview card */}
          <div className="rounded-xl border border-border/40 bg-secondary/10 overflow-hidden">
            {tree.imageUrl && (
              <div className="h-32 overflow-hidden relative">
                <img
                  src={tree.imageUrl}
                  alt={tree.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* NFTree / Minted badge overlay */}
                {tree.isMinted && (
                  <Badge
                    variant="outline"
                    className="absolute top-2 right-2 bg-card/80 backdrop-blur-sm border-primary/40 text-primary text-[10px] gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> NFTree
                  </Badge>
                )}
              </div>
            )}
            <div className="p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <p className="font-serif font-medium text-sm flex-1">{tree.name}</p>
                {!tree.imageUrl && tree.isMinted && (
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-primary text-[10px] gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> NFTree
                  </Badge>
                )}
              </div>
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
              {tree.mintedByStaff && (
                <p className="text-[10px] text-primary/70 font-serif">
                  Minted with {tree.mintedByStaff}
                </p>
              )}
              {referrerName && (
                <p className="text-[10px] text-primary/70 font-serif">
                  Shared by {referrerName}
                </p>
              )}
            </div>
          </div>

          {/* Editable caption */}
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
              {/* Native share first on mobile */}
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
