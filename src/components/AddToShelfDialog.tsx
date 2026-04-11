import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Plus, Quote, Sparkles } from "lucide-react";
import { useBookshelf, type BookshelfVisibility } from "@/hooks/use-bookshelf";
import OfferingVisibilityPicker, { type OfferingVisibility } from "@/components/OfferingVisibilityPicker";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { searchBooks, type BookResult } from "@/utils/bookSearch";

interface AddToShelfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultTreeId?: string;
}

type Step = "search" | "details" | "review";

const AddToShelfDialog = ({ open, onOpenChange, userId, defaultTreeId }: AddToShelfDialogProps) => {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);
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
      const books = await searchBooks(q.trim(), 8);
      setResults(books);
      setSearching(false);
    }, 350);
  }, []);

  const selectResult = (book: BookResult) => {
    setSelectedBook(book);
    setStep("details");
  };

  const selectCustom = () => {
    if (!customTitle.trim() || !customAuthor.trim()) return;
    setSelectedBook({
      title: customTitle.trim(),
      authors: [customAuthor.trim()],
      publishedYear: null,
      isbn: null,
      coverUrl: null,
      description: null,
      source: "catalog",
      externalId: "",
    });
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!selectedBook || submitting) return;
    setSubmitting(true);
    try {
      await addEntry({
        title: selectedBook.title,
        author: selectedBook.authors.join(", "),
        genre: null,
        cover_url: selectedBook.coverUrl,
        quote: quote.trim() || null,
        reflection: reflection.trim() || null,
        visibility: visibility as BookshelfVisibility,
        linked_tree_ids: defaultTreeId ? [defaultTreeId] : [],
        catalog_book_id: null,
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

  const authorLine = (b: BookResult) => {
    const parts = [b.authors.join(", ")];
    if (b.publishedYear) parts.push(b.publishedYear);
    return parts.join(" · ");
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
          {/* ── STEP 1: Search ───────────────────────── */}
          {step === "search" && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by title, author, or ISBN…"
                  className="pl-9 font-serif"
                  autoFocus
                />
              </div>

              <div className="max-h-[260px] overflow-y-auto space-y-1 pr-1">
                {searching && [1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="w-10 h-14 rounded shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}

                {!searching && results.map((book, idx) => (
                  <button
                    key={`${book.source}-${book.externalId}-${idx}`}
                    type="button"
                    onClick={() => selectResult(book)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-primary/5 transition-colors text-left group"
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-10 h-14 rounded object-cover shrink-0 border border-border/30"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-14 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <BookOpen className="h-4 w-4 text-primary/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-serif font-medium text-foreground/90 truncate group-hover:text-primary transition-colors">
                        {book.title}
                      </p>
                      <p className="text-xs text-muted-foreground/70 truncate">
                        {authorLine(book)}
                      </p>
                    </div>
                  </button>
                ))}

                {!searching && query.length >= 2 && results.length === 0 && (
                  <div className="text-center py-6">
                    <BookOpen className="h-5 w-5 text-muted-foreground/30 mx-auto mb-1.5" />
                    <p className="text-xs text-muted-foreground/60 font-serif">No match — add your own below</p>
                  </div>
                )}

                {!searching && query.length < 2 && (
                  <div className="text-center py-6">
                    <BookOpen className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1.5" />
                    <p className="text-xs text-muted-foreground/50 font-serif">Search by title, author, or ISBN</p>
                  </div>
                )}
              </div>

              {/* Manual fallback */}
              <div className="border-t border-border/30 pt-3 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-serif flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Or add manually
                </p>
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

          {/* ── STEP 2: Details ──────────────────────── */}
          {step === "details" && selectedBook && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex gap-3">
                {selectedBook.coverUrl ? (
                  <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-12 h-16 rounded object-cover shrink-0 border border-border/30" />
                ) : (
                  <div className="w-12 h-16 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <BookOpen className="h-5 w-5 text-primary/40" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-serif font-medium truncate">{selectedBook.title}</p>
                  <p className="text-xs text-muted-foreground/70 truncate">{authorLine(selectedBook)}</p>
                  {selectedBook.isbn && (
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">ISBN {selectedBook.isbn}</p>
                  )}
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

          {/* ── STEP 3: Review ───────────────────────── */}
          {step === "review" && selectedBook && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
                <div className="flex gap-3">
                  {selectedBook.coverUrl ? (
                    <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-14 h-20 rounded object-cover shrink-0 border border-border/30" />
                  ) : (
                    <div className="w-14 h-20 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <BookOpen className="h-6 w-6 text-primary/40" />
                    </div>
                  )}
                  <div>
                    <p className="font-serif font-medium">{selectedBook.title}</p>
                    <p className="text-sm text-muted-foreground/70">{authorLine(selectedBook)}</p>
                  </div>
                </div>
                {quote.trim() && <blockquote className="border-l-2 border-primary/30 pl-3 italic text-sm font-serif text-foreground/70">"{quote.trim()}"</blockquote>}
                {reflection.trim() && <p className="text-sm font-serif text-foreground/60">{reflection.trim()}</p>}
                <p className="text-[10px] font-serif text-muted-foreground/50">
                  {visibility === "private" ? "Held in Heartwood" : visibility === "public" ? "Shared with the forest" : `Shared with ${visibility}`}
                </p>
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
