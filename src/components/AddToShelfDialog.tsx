import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Plus, Quote, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBookshelf, type BookshelfVisibility } from "@/hooks/use-bookshelf";
import OfferingVisibilityPicker, { type OfferingVisibility } from "@/components/OfferingVisibilityPicker";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AddToShelfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultTreeId?: string;
}

interface CatalogBook {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  cover_url: string | null;
  similarity: number;
}

type Step = "search" | "details" | "review";

const genreColors: Record<string, string> = {
  Nature: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  Fiction: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  Poetry: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  Science: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Philosophy: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Mythology: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
};

const AddToShelfDialog = ({ open, onOpenChange, userId, defaultTreeId }: AddToShelfDialogProps) => {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{ title: string; author: string; genre: string | null; coverUrl: string | null; catalogId: string | null } | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [quote, setQuote] = useState("");
  const [reflection, setReflection] = useState("");
  const [visibility, setVisibility] = useState<OfferingVisibility>("private");
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addEntry } = useBookshelf({ userId });

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase.rpc("search_books", { query: q.trim(), result_limit: 8 });
      setResults((data as CatalogBook[]) || []);
      setSearching(false);
    }, 300);
  }, []);

  const selectCatalog = (book: CatalogBook) => {
    setSelectedBook({ title: book.title, author: book.author, genre: book.genre, coverUrl: book.cover_url, catalogId: book.id });
    setStep("details");
  };

  const selectCustom = () => {
    if (!customTitle.trim() || !customAuthor.trim()) return;
    setSelectedBook({ title: customTitle.trim(), author: customAuthor.trim(), genre: null, coverUrl: null, catalogId: null });
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!selectedBook || submitting) return;
    setSubmitting(true);
    try {
      await addEntry({
        title: selectedBook.title,
        author: selectedBook.author,
        genre: selectedBook.genre,
        cover_url: selectedBook.coverUrl,
        quote: quote.trim() || null,
        reflection: reflection.trim() || null,
        visibility: visibility as BookshelfVisibility,
        linked_tree_ids: defaultTreeId ? [defaultTreeId] : [],
        catalog_book_id: selectedBook.catalogId,
      });
      toast.success("Book placed on your shelf", {
        description: visibility === "private" ? "Held in Heartwood" : "Shared with the forest",
      });
      resetAndClose();
    } catch (err: any) {
      toast.error("Failed to add book", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep("search");
    setQuery("");
    setResults([]);
    setSelectedBook(null);
    setCustomTitle("");
    setCustomAuthor("");
    setQuote("");
    setReflection("");
    setVisibility("private");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Add to Your Shelf
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "search" && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="Search for a book…" className="pl-9 font-serif" autoFocus />
              </div>

              <div className="max-h-[240px] overflow-y-auto space-y-1.5 pr-1">
                {searching && [1,2,3].map(i => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="w-10 h-14 rounded shrink-0" />
                    <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                  </div>
                ))}

                {!searching && results.map(book => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => selectCatalog(book)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-primary/5 transition-colors text-left group"
                  >
                    <div className="w-10 h-14 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <BookOpen className="h-4 w-4 text-primary/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-serif font-medium text-foreground/90 truncate group-hover:text-primary">{book.title}</p>
                      <p className="text-xs text-muted-foreground/70 truncate">{book.author}</p>
                      {book.genre && (
                        <Badge variant="outline" className={`mt-1 text-[10px] px-1.5 py-0 border ${genreColors[book.genre] || ""}`}>{book.genre}</Badge>
                      )}
                    </div>
                  </button>
                ))}

                {!searching && query.length >= 2 && results.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground/60 font-serif">No match — add your own below</p>
                  </div>
                )}

                {!searching && query.length < 2 && (
                  <div className="text-center py-4 space-y-2">
                    <BookOpen className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground/50 font-serif">Search by title or author</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {Object.keys(genreColors).map(g => (
                        <button key={g} type="button" onClick={() => handleSearch(g)}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-serif transition-all hover:scale-105 ${genreColors[g]}`}
                        >{g}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border/30 pt-3 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-serif flex items-center gap-1"><Plus className="h-3 w-3" /> Or add manually</p>
                <div className="flex gap-2">
                  <Input value={customTitle} onChange={e => setCustomTitle(e.target.value.slice(0, 200))} placeholder="Title" className="font-serif text-sm flex-1" />
                  <Input value={customAuthor} onChange={e => setCustomAuthor(e.target.value.slice(0, 200))} placeholder="Author" className="font-serif text-sm flex-1" />
                </div>
                <Button type="button" variant="outline" size="sm" disabled={!customTitle.trim() || !customAuthor.trim()} onClick={selectCustom} className="w-full font-serif text-xs gap-1">
                  <Plus className="h-3 w-3" /> Add Custom Book
                </Button>
              </div>
            </motion.div>
          )}

          {step === "details" && selectedBook && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex gap-3">
                <div className="w-12 h-16 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <BookOpen className="h-5 w-5 text-primary/40" />
                </div>
                <div>
                  <p className="text-sm font-serif font-medium">{selectedBook.title}</p>
                  <p className="text-xs text-muted-foreground/70">{selectedBook.author}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-serif text-[10px] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1">
                  <Quote className="h-3 w-3" /> Favorite quote (optional)
                </label>
                <Textarea value={quote} onChange={e => setQuote(e.target.value.slice(0, 1000))} placeholder="A passage that stayed with you…" rows={2} className="font-serif text-sm bg-secondary/10 border-border/30 resize-none italic" />
              </div>

              <div className="space-y-1.5">
                <label className="font-serif text-[10px] tracking-widest uppercase text-muted-foreground/60">
                  Why does this matter to you?
                </label>
                <Textarea value={reflection} onChange={e => setReflection(e.target.value.slice(0, 2000))} placeholder="What does this book mean in your life?" rows={3} className="font-serif text-sm bg-secondary/10 border-border/30 resize-none" />
              </div>

              <OfferingVisibilityPicker value={visibility} onChange={setVisibility} />

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => { setStep("search"); setSelectedBook(null); }} className="font-serif text-xs">Back</Button>
                <Button onClick={() => setStep("review")} className="flex-1 font-serif text-xs">Review</Button>
              </div>
            </motion.div>
          )}

          {step === "review" && selectedBook && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
                <div className="flex gap-3">
                  <div className="w-14 h-20 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <BookOpen className="h-6 w-6 text-primary/40" />
                  </div>
                  <div>
                    <p className="font-serif font-medium">{selectedBook.title}</p>
                    <p className="text-sm text-muted-foreground/70">{selectedBook.author}</p>
                  </div>
                </div>
                {quote.trim() && <blockquote className="border-l-2 border-primary/30 pl-3 italic text-sm font-serif text-foreground/70">"{quote.trim()}"</blockquote>}
                {reflection.trim() && <p className="text-sm font-serif text-foreground/60">{reflection.trim()}</p>}
                <p className="text-[10px] font-serif text-muted-foreground/50">{visibility === "private" ? "Held in Heartwood" : visibility === "public" ? "Shared with the forest" : `Shared with ${visibility}`}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("details")} className="font-serif text-xs">Back</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1 font-serif text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  {submitting ? "Placing…" : "Place on Shelf"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AddToShelfDialog;
