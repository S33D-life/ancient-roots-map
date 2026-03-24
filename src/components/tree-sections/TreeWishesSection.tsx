/**
 * TreeDreamsSection — Dream Tree section for individual tree profiles.
 * Shows recent dreams with constellation-style light points.
 * Also known as TreeWishesSection for backward compatibility.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import WishTagSigils from "@/components/WishTagSigils";

interface Dream {
  id: string;
  notes: string | null;
  created_at: string;
  status?: string;
}

interface Props {
  treeId: string;
  treeName: string;
  wishTags?: string[] | null;
  isAnchorNode?: boolean;
}

const STATUS_LABELS: Record<string, { emoji: string; label: string }> = {
  dreamed: { emoji: "🌱", label: "Dreamed" },
  planned: { emoji: "🌿", label: "Planned" },
  visited: { emoji: "🌳", label: "Visited" },
};

const TreeWishesSection = ({ treeId, treeName, wishTags, isAnchorNode }: Props) => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [dreamText, setDreamText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [dreamerCount, setDreamerCount] = useState(0);

  const fetchDreams = useCallback(async () => {
    const { data, count } = await supabase
      .from("tree_wishlist")
      .select("id, notes, created_at, status", { count: "exact" })
      .eq("tree_id", treeId)
      .order("created_at", { ascending: false })
      .limit(8);
    setDreams((data as Dream[]) || []);
    setDreamerCount(count || 0);
    setLoading(false);
  }, [treeId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    fetchDreams();
  }, [fetchDreams]);

  const handleSubmitDream = async () => {
    if (!userId || !dreamText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("tree_wishlist").insert({
      user_id: userId,
      tree_id: treeId,
      notes: dreamText.trim(),
      status: "dreamed",
    } as any);
    if (error) {
      if (error.code === "23505") {
        toast.info("You're already dreaming of this tree.");
      } else {
        toast.error("Could not save dream.");
      }
    } else {
      setSparkle(true);
      setTimeout(() => setSparkle(false), 1500);
      toast.success("🌟 Dream woven into the canopy");
      setDreamText("");
      setShowForm(false);
      fetchDreams();
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
          <Sparkles className="w-4 h-4" /> Dreams
        </h2>
        <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.3), transparent)" }} />
      </div>

      {/* Dreamer count */}
      {dreamerCount > 0 && (
        <p className="text-center text-xs text-muted-foreground/60 font-serif">
          {dreamerCount} {dreamerCount === 1 ? "person" : "people"} dreaming of this tree
        </p>
      )}

      {/* Dream Tags (for anchor nodes) */}
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
            <Sparkles className="w-8 h-8 text-primary" style={{ filter: "drop-shadow(0 0 12px hsl(42 90% 55% / 0.6))" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dreams list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : dreams.length > 0 ? (
        <div className="space-y-2 relative z-10">
          {dreams.map((d) => {
            const statusInfo = STATUS_LABELS[d.status || "dreamed"] || STATUS_LABELS.dreamed;
            return (
              <div
                key={d.id}
                className="rounded-lg border border-border/20 bg-card/30 backdrop-blur px-4 py-2.5 text-sm font-serif text-foreground/70"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{statusInfo.emoji}</span>
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{statusInfo.label}</span>
                </div>
                {d.notes || <span className="italic text-muted-foreground/50">A quiet dream…</span>}
                <p className="text-[10px] text-muted-foreground/40 mt-1 font-mono">
                  {new Date(d.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground/50 font-serif py-4 relative z-10">
          No dreams yet. Be the first to dream of {treeName}.
        </p>
      )}

      {/* Add dream form */}
      <AnimatePresence>
        {showForm && userId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden relative z-10"
          >
            <Textarea
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder="What draws you to this tree?"
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
                onClick={handleSubmitDream}
                disabled={!dreamText.trim() || submitting}
                className="font-serif text-xs gap-1"
              >
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Dream this Tree
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
            <Sparkles className="h-4 w-4" /> Dream this Tree
          </Button>
        </div>
      )}
    </section>
  );
};

export default TreeWishesSection;
