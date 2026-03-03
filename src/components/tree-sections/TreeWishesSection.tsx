/**
 * TreeWishesSection — Wishing tree section for individual tree profiles.
 * Shows recent wishes with constellation-style light points.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import WishTagSigils from "@/components/WishTagSigils";

interface Wish {
  id: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  treeId: string;
  treeName: string;
  wishTags?: string[] | null;
  isAnchorNode?: boolean;
}

const TreeWishesSection = ({ treeId, treeName, wishTags, isAnchorNode }: Props) => {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [wishText, setWishText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sparkle, setSparkle] = useState(false);

  const fetchWishes = useCallback(async () => {
    const { data } = await supabase
      .from("tree_wishlist")
      .select("id, notes, created_at")
      .eq("tree_id", treeId)
      .order("created_at", { ascending: false })
      .limit(8);
    setWishes(data || []);
    setLoading(false);
  }, [treeId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    fetchWishes();
  }, [fetchWishes]);

  const handleSubmitWish = async () => {
    if (!userId || !wishText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("tree_wishlist").insert({
      user_id: userId,
      tree_id: treeId,
      notes: wishText.trim(),
    });
    if (error) {
      if (error.code === "23505") {
        toast.info("You've already wished upon this tree.");
      } else {
        toast.error("Could not save wish.");
      }
    } else {
      setSparkle(true);
      setTimeout(() => setSparkle(false), 1500);
      toast.success("🌟 Wish added to the canopy");
      setWishText("");
      setShowForm(false);
      fetchWishes();
    }
    setSubmitting(false);
  };

  return (
    <section className="space-y-5 relative">
      {/* Constellation background dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/10 pulse-live"
            style={{
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 relative z-10">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent)" }} />
        <h2 className="text-lg font-serif text-primary tracking-[0.2em] uppercase flex items-center gap-2">
          <Star className="w-4 h-4" /> Wishes
        </h2>
        <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.3), transparent)" }} />
      </div>

      {/* Wish Tags (for anchor nodes) */}
      {isAnchorNode && wishTags && wishTags.length > 0 && (
        <div className="text-center">
          <WishTagSigils tags={wishTags} />
        </div>
      )}

      {/* Sparkle animation */}
      <AnimatePresence>
        {sparkle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <Star className="w-8 h-8 text-primary" style={{ filter: "drop-shadow(0 0 12px hsl(42 90% 55% / 0.6))" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wishes list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : wishes.length > 0 ? (
        <div className="space-y-2 relative z-10">
          {wishes.map((w) => (
            <div
              key={w.id}
              className="rounded-lg border border-border/20 bg-card/30 backdrop-blur px-4 py-2.5 text-sm font-serif text-foreground/70"
            >
              {w.notes || <span className="italic text-muted-foreground/50">A silent wish…</span>}
              <p className="text-[10px] text-muted-foreground/40 mt-1 font-mono">
                {new Date(w.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground/50 font-serif py-4 relative z-10">
          No wishes yet. Be the first to wish upon {treeName}.
        </p>
      )}

      {/* Add wish form */}
      <AnimatePresence>
        {showForm && userId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden relative z-10"
          >
            <Textarea
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              placeholder="What do you wish for this tree?"
              className="font-serif text-sm mb-2 bg-card/50"
              rows={3}
              maxLength={500}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="font-serif text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitWish}
                disabled={!wishText.trim() || submitting}
                className="font-serif text-xs gap-1"
              >
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                Leave Wish
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && userId && (
        <div className="text-center relative z-10">
          <Button
            variant="outline"
            onClick={() => setShowForm(true)}
            className="font-serif tracking-wider gap-2 border-primary/30 hover:bg-primary/10 text-sm"
          >
            <Star className="h-4 w-4" /> Add a Wish
          </Button>
        </div>
      )}
    </section>
  );
};

export default TreeWishesSection;
