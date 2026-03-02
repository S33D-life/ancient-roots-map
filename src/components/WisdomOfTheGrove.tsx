import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, TreeDeciduous, Globe, Leaf, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useGroveQuotes, useExternalWisdom, type GroveQuote } from "@/hooks/use-grove-quotes";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

/* ─── Slide types ─── */
interface Slide {
  type: "heart_balance" | "grove_quote" | "world_wisdom";
  label: string;
  icon: React.ReactNode;
  quoteText: string;
  author?: string | null;
  source?: string | null;
  meta?: {
    likeCount?: number;
    influenceScore?: number;
    liked?: boolean;
    offeringId?: string;
    treeId?: string;
    creatorName?: string | null;
  };
}

/* ─── Quote Detail Modal ─── */
const QuoteDetail = ({
  slide,
  onClose,
  onToggleLike,
}: {
  slide: Slide;
  onClose: () => void;
  onToggleLike?: (id: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
      className="relative w-full max-w-md rounded-2xl border border-primary/20 bg-card p-6 md:p-8 space-y-5"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-muted/40 hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-serif uppercase tracking-[0.2em]">
        {slide.icon}
        {slide.label}
      </div>

      <p className="font-serif text-lg leading-relaxed text-foreground/90 italic">
        "{slide.quoteText}"
      </p>

      {slide.author && (
        <p className="text-sm text-muted-foreground font-serif">— {slide.author}</p>
      )}
      {slide.source && (
        <p className="text-xs text-muted-foreground/50 italic">{slide.source}</p>
      )}

      {slide.meta?.treeId && (
        <Link
          to={`/tree/${slide.meta.treeId}`}
          className="inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary font-serif transition-colors"
        >
          <TreeDeciduous className="w-3 h-3" /> View linked tree →
        </Link>
      )}

      {slide.meta?.creatorName && (
        <p className="text-xs text-muted-foreground/40 font-serif">
          Offered by {slide.meta.creatorName}
        </p>
      )}

      {/* Actions */}
      {slide.type === "grove_quote" && slide.meta?.offeringId && (
        <div className="flex items-center gap-4 pt-2 border-t border-border/20">
          <button
            onClick={() => onToggleLike?.(slide.meta!.offeringId!)}
            className="flex items-center gap-1.5 text-xs font-serif transition-colors"
            style={{
              color: slide.meta.liked
                ? "hsl(var(--primary))"
                : "hsl(var(--muted-foreground) / 0.6)",
            }}
          >
            <Heart
              className="w-4 h-4"
              fill={slide.meta.liked ? "currentColor" : "none"}
            />
            {slide.meta.likeCount || 0}
          </button>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground/50 font-serif">
            <Sparkles className="w-3.5 h-3.5" />
            {slide.meta.influenceScore || 0} influence
          </span>
        </div>
      )}
    </motion.div>
  </motion.div>
);

/* ─── Main Component ─── */
export const WisdomOfTheGrove = () => {
  const { quotes, loading: quotesLoading, toggleLike } = useGroveQuotes("moon_cycle");
  const { wisdom, loading: wisdomLoading } = useExternalWisdom();
  const [activeIdx, setActiveIdx] = useState(0);
  const [detailSlide, setDetailSlide] = useState<Slide | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const [heartCount, setHeartCount] = useState<number | null>(null);

  // Fetch heart balance for first slide
  useEffect(() => {
    const fetchHearts = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        // Show global count for unauthenticated
        const { count } = await supabase
          .from("heart_transactions")
          .select("*", { count: "exact", head: true });
        setHeartCount(count || 0);
        return;
      }
      const { data } = await supabase
        .from("user_heart_balances")
        .select("s33d_hearts")
        .eq("user_id", user.user.id)
        .single();
      setHeartCount(data?.s33d_hearts ?? 0);
    };
    fetchHearts();
  }, []);

  // Build slides
  const slides: Slide[] = [];

  // 1. Heart Balance
  const moonPhase = getMoonPhase();
  slides.push({
    type: "heart_balance",
    label: "Heart Balance",
    icon: <Heart className="w-4 h-4 text-primary" />,
    quoteText:
      heartCount !== null
        ? `${heartCount} hearts gathered this ${moonPhase.name.toLowerCase()}. The grove grows stronger with each offering.`
        : "The grove is gathering its warmth…",
  });

  // 2. Community quotes
  quotes.slice(0, 2).forEach((q) => {
    slides.push({
      type: "grove_quote",
      label: "🌿 Grove Wisdom",
      icon: <Leaf className="w-4 h-4 text-primary" />,
      quoteText: q.quote_text,
      author: q.quote_author,
      source: q.quote_source,
      meta: {
        likeCount: q.like_count,
        influenceScore: q.influence_score,
        liked: q.liked_by_me,
        offeringId: q.offering_id,
        treeId: q.tree_id,
        creatorName: q.creator_name,
      },
    });
  });

  // 3. External wisdom
  if (wisdom) {
    slides.push({
      type: "world_wisdom",
      label: "🌍 World Wisdom",
      icon: <Globe className="w-4 h-4 text-primary" />,
      quoteText: wisdom.quote_text,
      author: wisdom.author_name,
      source: wisdom.source_title,
    });
  }

  // If no community quotes yet, add static fallback
  if (quotes.length === 0 && !quotesLoading) {
    slides.push({
      type: "grove_quote",
      label: "🌿 Grove Wisdom",
      icon: <Leaf className="w-4 h-4 text-primary" />,
      quoteText:
        "Every seed carries a memory of the forest it came from and a dream of the forest it will become.",
      author: "Ancient Proverb",
    });
  }

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(intervalRef.current);
  }, [slides.length]);

  // Clamp index
  const safeIdx = activeIdx % Math.max(1, slides.length);
  const current = slides[safeIdx];

  const navigate = (dir: -1 | 1) => {
    clearInterval(intervalRef.current);
    setActiveIdx((prev) => (prev + dir + slides.length) % slides.length);
  };

  const isLoading = quotesLoading && wisdomLoading && heartCount === null;

  if (isLoading) {
    return (
      <section id="wisdom" className="py-12 md:py-18">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-10">
            Wisdom of the Grove
          </h2>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </section>
    );
  }

  if (!current) return null;

  return (
    <>
      <section id="wisdom" className="py-12 md:py-18">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-10">
            Wisdom of the Grove
          </h2>

          <div className="relative">
            {/* Nav arrows */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-card/60 border border-border/30 flex items-center justify-center hover:bg-card transition-colors backdrop-blur-sm"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-card/60 border border-border/30 flex items-center justify-center hover:bg-card transition-colors backdrop-blur-sm"
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={safeIdx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm px-6 py-8 md:px-10 md:py-10 text-center space-y-4 cursor-pointer"
                onClick={() => setDetailSlide(current)}
              >
                {/* Icon */}
                <div className="flex justify-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "hsl(var(--primary) / 0.12)" }}
                  >
                    {current.icon}
                  </div>
                </div>

                {/* Label */}
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-serif">
                  {current.label}
                </p>

                {/* Quote */}
                <p className="font-serif text-base md:text-lg text-foreground/85 leading-relaxed italic max-w-xl mx-auto">
                  "{current.quoteText}"
                </p>

                {/* Author */}
                {current.author && (
                  <p className="text-xs text-muted-foreground/50 font-serif">
                    — {current.author}
                  </p>
                )}

                {/* Engagement line */}
                {current.type === "grove_quote" && current.meta && (
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-serif">
                      <Heart
                        className="w-3 h-3"
                        fill={current.meta.liked ? "hsl(var(--primary))" : "none"}
                        stroke={current.meta.liked ? "hsl(var(--primary))" : "currentColor"}
                      />
                      {current.meta.likeCount || 0}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-serif">
                      <Sparkles className="w-3 h-3" />
                      {current.meta.influenceScore || 0}
                    </span>
                  </div>
                )}

                {/* Dots */}
                <div className="flex justify-center gap-1.5 pt-3">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearInterval(intervalRef.current);
                        setActiveIdx(i);
                      }}
                      className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        background:
                          i === safeIdx
                            ? "hsl(var(--primary))"
                            : "hsl(var(--muted-foreground) / 0.25)",
                        transform: i === safeIdx ? "scale(1.4)" : "scale(1)",
                      }}
                      aria-label={`Show wisdom ${i + 1}`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Detail modal */}
      <AnimatePresence>
        {detailSlide && (
          <QuoteDetail
            slide={detailSlide}
            onClose={() => setDetailSlide(null)}
            onToggleLike={(id) => {
              toggleLike(id);
              // Update the detail slide optimistically
              setDetailSlide((prev) =>
                prev && prev.meta
                  ? {
                      ...prev,
                      meta: {
                        ...prev.meta,
                        liked: !prev.meta.liked,
                        likeCount: prev.meta.liked
                          ? (prev.meta.likeCount || 1) - 1
                          : (prev.meta.likeCount || 0) + 1,
                      },
                    }
                  : prev
              );
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Moon phase helper ─── */
function getMoonPhase() {
  const now = new Date();
  const synodicMonth = 29.53059;
  const knownNewMoon = new Date(2024, 0, 11, 11, 57);
  const daysSince = (now.getTime() - knownNewMoon.getTime()) / 86400000;
  const phase = ((daysSince % synodicMonth) / synodicMonth) * 100;
  if (phase < 6.25) return { name: "New Moon", emoji: "🌑" };
  if (phase < 18.75) return { name: "Waxing Crescent", emoji: "🌒" };
  if (phase < 31.25) return { name: "First Quarter", emoji: "🌓" };
  if (phase < 43.75) return { name: "Waxing Gibbous", emoji: "🌔" };
  if (phase < 56.25) return { name: "Full Moon", emoji: "🌕" };
  if (phase < 68.75) return { name: "Waning Gibbous", emoji: "🌖" };
  if (phase < 81.25) return { name: "Last Quarter", emoji: "🌗" };
  if (phase < 93.75) return { name: "Waning Crescent", emoji: "🌘" };
  return { name: "New Moon", emoji: "🌑" };
}

export default WisdomOfTheGrove;
