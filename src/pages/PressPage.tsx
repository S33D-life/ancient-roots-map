/**
 * The Living Printing Press — A new chamber in Heartwood.
 * "Reading becomes publishing. Reflection becomes story."
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Feather, Plus, BookOpen, Clock, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeartwoodBackground from "@/components/HeartwoodBackground";
import PressEditor from "@/components/PressEditor";
import { usePressWorks, type PressWork } from "@/hooks/use-press-works";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

/* ── Dust motes for atmosphere ── */
const PressDustMotes = () => {
  const motes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 15 + Math.random() * 70,
        y: 20 + Math.random() * 60,
        size: 1.5 + Math.random() * 2,
        dur: 8 + Math.random() * 10,
        delay: Math.random() * 5,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            width: m.size,
            height: m.size,
            left: `${m.x}%`,
            top: `${m.y}%`,
            background: "hsl(42 60% 55% / 0.12)",
          }}
          animate={{ y: [0, -15, -5, -25], opacity: [0, 0.5, 0.2, 0] }}
          transition={{ duration: m.dur, repeat: Infinity, delay: m.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

const FORM_LABELS: Record<string, string> = {
  reflection: "Reflection",
  letter: "Letter",
  seasonal_weaving: "Seasonal Weaving",
  dialogue: "Dialogue",
  myth_retold: "Myth Retold",
  story: "Story",
  essay: "Essay",
  other: "Other",
};

export default function PressPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PressWork | null | "new">(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { works, loading, save, remove } = usePressWorks(userId);

  const drafts = works.filter((w) => !w.published_at);
  const published = works.filter((w) => !!w.published_at);

  const handleDelete = async (w: PressWork) => {
    if (!confirm(`Delete "${w.title}"? This cannot be undone.`)) return;
    await remove(w.id);
    toast.success("Work removed");
  };

  return (
    <div className="min-h-screen relative">
      <HeartwoodBackground />
      <Header />
      <main className="relative z-10 px-4 pb-20 max-w-2xl mx-auto" style={{ paddingTop: 'var(--content-top)' }}>
        <AnimatePresence mode="wait">
          {editing ? (
            <PressEditor
              key={editing === "new" ? "new" : editing.id}
              initial={editing === "new" ? null : editing}
              userId={userId}
              onSave={save}
              onBack={() => setEditing(null)}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Chamber header */}
              <div className="text-center py-10 relative">
                <PressDustMotes />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="relative z-10"
                >
                  <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
                    style={{ background: "radial-gradient(circle, hsl(42 50% 30% / 0.25), transparent 70%)" }}
                  >
                    <Feather className="h-6 w-6 text-primary/60" />
                  </div>
                  <h1 className="font-serif text-xl md:text-2xl tracking-widest text-foreground/80 mb-2">
                    The Living Printing Press
                  </h1>
                  <p className="text-xs text-muted-foreground/50 font-serif max-w-sm mx-auto leading-relaxed">
                    A quiet place where reading becomes writing. Shape something new from the seed of what you've read.
                  </p>
                </motion.div>
              </div>

              {/* New work button */}
              {userId && (
                <div className="flex justify-center mb-10">
                  <Button
                    onClick={() => setEditing("new")}
                    variant="outline"
                    className="font-serif text-sm gap-2 h-10 px-6 border-border/30 hover:border-primary/30 transition-all"
                  >
                    <Feather className="h-4 w-4" /> Begin a New Work
                  </Button>
                </div>
              )}

              {!userId && (
                <div className="text-center py-12 space-y-4">
                  <p className="text-sm font-serif text-muted-foreground/50">
                    Sign in to enter the Press.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-serif text-xs gap-2 border-border/30 hover:border-primary/30"
                    onClick={() => window.location.assign("/auth")}
                  >
                    Sign in
                  </Button>
                </div>
              )}

              {/* Drafts */}
              {drafts.length > 0 && (
                <section className="mb-10">
                  <h2 className="font-serif text-xs tracking-[0.2em] text-muted-foreground/40 uppercase mb-4">
                    Drafts
                  </h2>
                  <div className="space-y-3">
                    {drafts.map((w) => (
                      <WorkCard key={w.id} work={w} onEdit={() => setEditing(w)} onDelete={() => handleDelete(w)} />
                    ))}
                  </div>
                </section>
              )}

              {/* Published */}
              {published.length > 0 && (
                <section className="mb-10">
                  <h2 className="font-serif text-xs tracking-[0.2em] text-muted-foreground/40 uppercase mb-4">
                    Published
                  </h2>
                  <div className="space-y-3">
                    {published.map((w) => (
                      <WorkCard key={w.id} work={w} onEdit={() => setEditing(w)} onDelete={() => handleDelete(w)} />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty state */}
              {userId && !loading && works.length === 0 && (
                <div className="text-center py-16 relative">
                  <PressDustMotes />
                  <div className="relative z-10 space-y-3">
                    <BookOpen className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                    <p className="text-sm font-serif text-muted-foreground/40">
                      The press is quiet. Nothing has been set in type yet.
                    </p>
                    <p className="text-xs font-serif text-muted-foreground/30">
                      When a book moves you, come here and shape what it stirred.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

/* ── Work Card ── */
function WorkCard({
  work,
  onEdit,
  onDelete,
}: {
  work: PressWork;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPublished = !!work.published_at;
  const preview = work.body.slice(0, 140) + (work.body.length > 140 ? "…" : "");

  return (
    <motion.button
      type="button"
      onClick={onEdit}
      className="w-full text-left rounded-xl border border-border/20 p-5 transition-all hover:border-primary/20 group"
      style={{
        background: "linear-gradient(135deg, hsl(var(--card) / 0.5), hsl(var(--card) / 0.3))",
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-sm md:text-base text-foreground/85 tracking-wide truncate">
            {work.title}
          </h3>
          {work.epigraph && (
            <p className="text-[11px] text-muted-foreground/40 font-serif italic mt-1 truncate">
              "{work.epigraph}"
            </p>
          )}
          <p className="text-xs text-muted-foreground/50 font-serif mt-2 line-clamp-2 leading-relaxed">
            {preview}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className="text-[9px] font-serif border-border/20"
          >
            {FORM_LABELS[work.form] || work.form}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground/30">
            {isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span className="text-[10px] font-mono">
              {format(new Date(work.updated_at), "d MMM")}
            </span>
          </div>
        </div>
      </div>
      {/* Delete (hidden until hover) */}
      <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-muted-foreground/30 hover:text-destructive transition-colors p-1"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.button>
  );
}
