/**
 * PressEditor — The Living Printing Press writing interface.
 * Calm. Spacious. Intentional.
 * "A quiet place where language is shaped."
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Send, Feather, ChevronDown, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PressChapterList from "@/components/PressChapterList";
import { usePressChapters } from "@/hooks/use-press-chapters";
import type { PressWork, PressWorkForm } from "@/hooks/use-press-works";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FORMS: { value: PressWorkForm; label: string; hint: string }[] = [
  { value: "reflection", label: "Reflection", hint: "A meditation born from reading" },
  { value: "letter", label: "Letter", hint: "Addressed to the author, a tree, or yourself" },
  { value: "seasonal_weaving", label: "Seasonal Weaving", hint: "Woven into the rhythm of the year" },
  { value: "dialogue", label: "Dialogue", hint: "A conversation with the author" },
  { value: "myth_retold", label: "Myth Retold", hint: "An old story given new roots" },
  { value: "story", label: "Story", hint: "A new tale born from the seed of another" },
  { value: "essay", label: "Essay", hint: "Thought shaped with care" },
  { value: "other", label: "Other", hint: "Something unnamed" },
];

interface PressEditorProps {
  initial?: PressWork | null;
  userId: string | null;
  onSave: (work: Partial<PressWork>) => Promise<any>;
  onBack: () => void;
}

export default function PressEditor({ initial, userId, onSave, onBack }: PressEditorProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [body, setBody] = useState(initial?.body || "");
  const [form, setForm] = useState<PressWorkForm>(initial?.form || "reflection");
  const [epigraph, setEpigraph] = useState(initial?.epigraph || "");
  const [sourceBookId, setSourceBookId] = useState<string | null>(initial?.source_book_id || null);
  const [sourceBookLabel, setSourceBookLabel] = useState<string | null>(null);
  const [userBooks, setUserBooks] = useState<Array<{ id: string; title: string; author: string }>>([]);
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the body after a brief moment
    const t = setTimeout(() => bodyRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  // Fetch user's bookshelf entries for the "Born from…" selector
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("bookshelf_entries")
      .select("id, title, author")
      .eq("user_id", userId)
      .order("title")
      .then(({ data }) => {
        setUserBooks((data || []) as Array<{ id: string; title: string; author: string }>);
        // Resolve initial label
        if (initial?.source_book_id && data) {
          const match = data.find((b: any) => b.id === initial.source_book_id);
          if (match) setSourceBookLabel(`${(match as any).title} — ${(match as any).author}`);
        }
      });
  }, [userId, initial?.source_book_id]);

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !body.trim()) {
      toast.error("A title and body are needed");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        id: initial?.id,
        title: title.trim(),
        body: body.trim(),
        form,
        epigraph: epigraph.trim() || null,
        source_book_id: sourceBookId,
        visibility: publish ? "public" : (initial?.visibility || "private"),
        published_at: publish ? new Date().toISOString() : (initial?.published_at || null),
      });
      toast.success(publish ? "Published to the Press" : "Draft saved");
      onBack();
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[80vh] flex flex-col"
    >
      {/* Top bar — minimal */}
      <div className="flex items-center justify-between py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-serif"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground/50 font-mono tabular-nums">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="font-serif text-xs gap-1 h-8"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="font-serif text-xs gap-1 h-8"
          >
            <Send className="h-3.5 w-3.5" /> Publish
          </Button>
        </div>
      </div>

      {/* Form selector */}
      <div className="mb-6">
        <Select value={form} onValueChange={(v) => setForm(v as PressWorkForm)}>
          <SelectTrigger className="w-48 h-8 text-xs font-serif border-border/30 bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMS.map((f) => (
              <SelectItem key={f.value} value={f.value} className="font-serif text-xs">
                <span>{f.label}</span>
                <span className="ml-2 text-muted-foreground/50">— {f.hint}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* "Born from…" book link */}
      {userBooks.length > 0 && (
        <div className="mb-6">
          {sourceBookId ? (
            <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground border border-border/20 rounded-lg px-3 py-2 bg-card/30">
              <BookOpen className="h-3.5 w-3.5 text-primary/50 shrink-0" />
              <span className="flex-1 truncate italic">Born from: {sourceBookLabel || "a book"}</span>
              <button onClick={() => { setSourceBookId(null); setSourceBookLabel(null); }} className="p-0.5 hover:text-foreground transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <Select onValueChange={(v) => {
              setSourceBookId(v);
              const match = userBooks.find(b => b.id === v);
              if (match) setSourceBookLabel(`${match.title} — ${match.author}`);
            }}>
              <SelectTrigger className="h-8 text-xs font-serif border-border/20 bg-transparent text-muted-foreground/50">
                <BookOpen className="h-3.5 w-3.5 mr-1.5 text-primary/40" />
                <SelectValue placeholder="Born from a book… (optional)" />
              </SelectTrigger>
              <SelectContent>
                {userBooks.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="font-serif text-xs">
                    {b.title} — <span className="text-muted-foreground">{b.author}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Epigraph — optional seed quote */}
      <div className="mb-6">
        <Input
          value={epigraph}
          onChange={(e) => setEpigraph(e.target.value)}
          placeholder="An epigraph — a seed phrase that sparked this work (optional)"
          className="border-0 border-b border-border/20 rounded-none bg-transparent font-serif text-sm italic text-muted-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:border-primary/30 px-0"
        />
      </div>

      {/* Title */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="border-0 bg-transparent text-2xl md:text-3xl font-serif tracking-wide placeholder:text-muted-foreground/20 focus-visible:ring-0 px-0 mb-4 h-auto py-2"
      />

      {/* Body — the heart */}
      <div className="flex-1 relative">
        <Textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Begin writing…"
          className="border-0 bg-transparent font-serif text-base md:text-lg leading-[1.9] placeholder:text-muted-foreground/15 focus-visible:ring-0 px-0 resize-none min-h-[50vh]"
          style={{ lineHeight: "1.9" }}
        />
        {/* Faint ruled lines background */}
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 30px, hsl(var(--border) / 0.06) 30px, hsl(var(--border) / 0.06) 31px)",
          }}
        />
      </div>

      {/* Chapters — only for saved works */}
      {initial?.id && (
        <ChaptersSection workId={initial.id} userId={userId} />
      )}
    </motion.div>
  );
}

/** Isolated section so the chapter hook only runs for saved works */
function ChaptersSection({ workId, userId }: { workId: string; userId: string | null }) {
  const { chapters, saveChapter, removeChapter } = usePressChapters(workId, userId);
  return (
    <PressChapterList
      chapters={chapters}
      isAuthor={true}
      onSave={saveChapter}
      onRemove={removeChapter}
    />
  );
}
