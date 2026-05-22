/**
 * OfferingHero — sacred postcard view that appears at the top of the
 * tree page when a shared offering link is opened (?offering=<id>).
 *
 * The offering itself becomes the hero so the wanderer arrives directly
 * at what was shared with them, rather than scrolling to find it.
 */
import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Music, FileText, MessageSquare, Sparkles, Mic, BookOpen, Flower2, Share2, Heart, MapPin, Palette, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Offering, OfferingType } from "@/hooks/use-offerings";
import { getOfferingPhotos } from "@/utils/offeringPhotos";
import { shareOffering } from "./TreeDetailSubComponents";

const typeIcons: Record<OfferingType, JSX.Element> = {
  photo: <Camera className="w-3.5 h-3.5" />,
  song: <Music className="w-3.5 h-3.5" />,
  poem: <FileText className="w-3.5 h-3.5" />,
  story: <MessageSquare className="w-3.5 h-3.5" />,
  nft: <Sparkles className="w-3.5 h-3.5" />,
  voice: <Mic className="w-3.5 h-3.5" />,
  book: <BookOpen className="w-3.5 h-3.5" />,
  art: <Palette className="w-3.5 h-3.5" />,
  prayer: <HandHeart className="w-3.5 h-3.5" />,
};

const typeLabels: Record<OfferingType, string> = {
  photo: "Memory",
  song: "Song",
  poem: "Poem",
  story: "Musing",
  nft: "NFT",
  voice: "Whisper",
  book: "Book",
  art: "Art",
  prayer: "Prayer",
};


interface OfferingHeroProps {
  offering: Offering;
  treeName: string;
  treeLocation?: string | null;
  authorHandle?: string | null;
  onMakeOffering?: () => void;
  onCheckin?: () => void;
}

const OfferingHero = ({
  offering,
  treeName,
  treeLocation,
  authorHandle,
  onMakeOffering,
  onCheckin,
}: OfferingHeroProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const photos = useMemo(() => getOfferingPhotos(offering), [offering]);
  const heroImage = photos[0] || offering.media_url || offering.thumbnail_url;
  const date = new Date(offering.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  // Soft scroll into view on mount
  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(t);
  }, [offering.id]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6"
    >
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.35)]">
        {/* Hero image with floating share */}
        {heroImage && (
          <div className="relative w-full bg-secondary/30">
            <motion.img
              src={heroImage}
              alt={offering.title}
              initial={{ scale: 1.04, opacity: 0.85 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="w-full max-h-[60vh] object-cover"
              loading="eager"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
            {/* Floating share — gold glowing glyph */}
            <button
              onClick={() => shareOffering(offering, treeName)}
              aria-label="Share this offering"
              className="absolute top-3 right-3 inline-flex items-center justify-center w-11 h-11 rounded-full bg-background/40 backdrop-blur-md border border-primary/40 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_28px_hsl(var(--primary)/0.55)] hover:bg-background/60 active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span className="absolute inset-0 rounded-full animate-pulse bg-primary/10 pointer-events-none" />
            </button>
            {/* Type pill */}
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-md border border-border/40 text-[10px] font-serif tracking-widest uppercase text-foreground/80">
              {typeIcons[offering.type]}
              <span>{typeLabels[offering.type]}</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-5 md:p-6 space-y-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-serif tracking-[0.2em] uppercase text-primary/60">
              An offering left at
            </p>
            <h2 className="font-serif text-xl md:text-2xl text-foreground leading-tight">
              {treeName}
            </h2>
            {treeLocation && (
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground font-serif">
                <MapPin className="w-3 h-3" /> {treeLocation}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-lg text-primary italic">
              "{offering.title}"
            </h3>
            {offering.content && (
              <p className="text-sm font-serif text-foreground/75 leading-relaxed whitespace-pre-line">
                {offering.content}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 font-serif border-t border-border/30 pt-3">
            <span>{authorHandle ? `Left by ${authorHandle}` : "Left by a wanderer"}</span>
            <span>{date}</span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {onCheckin && (
              <Button
                onClick={onCheckin}
                className="flex-1 font-serif gap-1.5 min-h-[44px]"
              >
                <Heart className="w-4 h-4" /> Meet this Ancient Friend
              </Button>
            )}
            {onMakeOffering && (
              <Button
                variant="outline"
                onClick={onMakeOffering}
                className="flex-1 font-serif gap-1.5 min-h-[44px] border-primary/30"
              >
                <Flower2 className="w-4 h-4" /> Leave an offering
              </Button>
            )}
          </div>

          <p className="text-[10px] text-center text-muted-foreground/50 font-serif italic pt-1">
            Memories hang in the branches. Whispers travel through the roots.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default OfferingHero;
