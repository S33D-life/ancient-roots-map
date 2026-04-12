import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Sparkles, Plus, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { searchBooks, type BookResult } from "@/utils/bookSearch";

/* ---------- Types ---------- */

export interface BookOfferingData {
  title: string;
  author: string;
  genre: string | null;
  coverUrl: string | null;
  quote: string;
  reflection: string;
  isCustom: boolean;
}

interface BookOfferingFlowProps {
  treeId: string;
  onComplete: (data: BookOfferingData) => void;
  onCancel: () => void;
}

type FlowStep = "search" | "details" | "review";

/* ---------- Component ---------- */

const BookOfferingFlow = ({ treeId, onComplete, onCancel }: BookOfferingFlowProps) => {
  const [step, setStep] = useState<FlowStep>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{
    title: string;
    author: string;
    genre: string | null;
    coverUrl: string | null;
    isCustom: boolean;
  } | null>(null);
  const [quote, setQuote] = useState("");
  const [reflection, setReflection] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [recentBooks, setRecentBooks] = useState<{ title: string; author: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reflectionRef = useRef<HTMLTextAreaElement>(null);

  // Fetch recently offered books for this tree
  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("offerings")
        .select("title, content")
        .eq("tree_id", treeId)
        .eq("type", "book")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) {
        setRecentBooks(data.map(d => ({ title: d.title || "", author: d.content?.split("\n")[0] || "" })));
      }
    };
    fetchRecent();
  }, [treeId]);

  // Auto-focus reflection when selecting from search
  useEffect(() => {
    if (step === "details" && selectedBook && !selectedBook.isCustom) {
      setTimeout(() => reflectionRef.current?.focus(), 350);
    }
  }, [step, selectedBook]);

  // Debounced hybrid search (Google Books + Open Library)
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
    setSelectedBook({
      title: book.title,
      author: book.authors.join(", "),
      genre: null,
      coverUrl: book.coverUrl,
      isCustom: false,
    });
    setStep("details");
  };

  const selectCustomBook = () => {
    if (!customTitle.trim() || !customAuthor.trim()) return;
    setSelectedBook({
      title: customTitle.trim(),
      author: customAuthor.trim(),
      genre: null,
      coverUrl: null,
      isCustom: true,
    });
    setStep("details");
  };

  const handleSubmit = () => {
    if (!selectedBook) return;
    onComplete({
      title: selectedBook.title,
      author: selectedBook.author,
      genre: selectedBook.genre,
      coverUrl: selectedBook.coverUrl,
      quote: quote.trim(),
      reflection: reflection.trim(),
      isCustom: selectedBook.isCustom,
    });
  };

  const authorLine = (book: BookResult) => {
    const parts = [book.authors.join(", ")];
    if (book.publishedYear) parts.push(book.publishedYear);
    return parts.join(" · ");
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* ===== SEARCH ===== */}
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

            <div className="max-h-[280px] overflow-y-auto space-y-0.5 pr-1">
              {searching && (
                <>
                  <p className="text-[11px] font-serif text-muted-foreground/40 text-center pt-1 pb-2 italic">
                    Searching the forest of books…
                  </p>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 p-2">
                      <Skeleton className="w-10 h-14 rounded shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!searching && results.length > 0 && results.map((book, idx) => (
                <motion.button
                  key={`${book.source}-${book.externalId}-${idx}`}
                  type="button"
                  onClick={() => selectResult(book)}
                  className="w-full flex items-start gap-3 px-2.5 py-2 rounded-lg hover:bg-primary/5 transition-colors text-left group"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
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
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-sm font-serif font-medium text-foreground/90 truncate group-hover:text-primary transition-colors leading-tight">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                      {authorLine(book)}
                    </p>
                  </div>
                </motion.button>
              ))}

              {!searching && query.length >= 2 && results.length === 0 && (
                <div className="text-center py-6 space-y-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground/25 mx-auto" />
                  <p className="text-xs text-muted-foreground/50 font-serif">
                    We couldn't find it in the forest of books.
                  </p>
                  <p className="text-[11px] text-muted-foreground/40 font-serif">
                    Add it by hand below.
                  </p>
                </div>
              )}

              {/* Empty state with recent books */}
              {!searching && query.length < 2 && results.length === 0 && (
                <div className="text-center py-4 space-y-3">
                  <BookOpen className="h-6 w-6 text-muted-foreground/20 mx-auto" />
                  <p className="text-xs text-muted-foreground/40 font-serif">
                    Search by title, author, or ISBN
                  </p>

                  {recentBooks.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-serif">
                        Recently offered here
                      </p>
                      {recentBooks.map((b, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSearch(b.title)}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-primary/5 transition-colors"
                        >
                          <p className="text-xs font-serif text-foreground/70 truncate">{b.title}</p>
                          <p className="text-[10px] text-muted-foreground/50 truncate">{b.author}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual fallback */}
            <div className="border-t border-border/30 pt-3 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-serif flex items-center gap-1">
                <Plus className="h-3 w-3" /> Or add manually
              </p>
              <div className="flex gap-2">
                <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value.slice(0, 200))} placeholder="Title" className="font-serif text-sm flex-1" />
                <Input value={customAuthor} onChange={(e) => setCustomAuthor(e.target.value.slice(0, 200))} placeholder="Author" className="font-serif text-sm flex-1" />
              </div>
              <Button type="button" variant="outline" size="sm" disabled={!customTitle.trim() || !customAuthor.trim()} onClick={selectCustomBook} className="w-full font-serif text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Custom Book
              </Button>
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="w-full font-serif text-xs text-muted-foreground">
              Cancel
            </Button>
          </motion.div>
        )}

        {/* ===== DETAILS ===== */}
        {step === "details" && selectedBook && (
          <motion.div key="details" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex gap-3">
              {selectedBook.coverUrl ? (
                <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-12 h-16 rounded object-cover shrink-0 border border-border/30" />
              ) : (
                <div className="w-12 h-16 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <BookOpen className="h-5 w-5 text-primary/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif font-medium text-foreground/90 truncate">{selectedBook.title}</p>
                <p className="text-xs text-muted-foreground/70 truncate">{selectedBook.author}</p>
                {selectedBook.isCustom && (
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5 italic">Added by hand</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-serif text-[10px] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1">
                <Quote className="h-3 w-3" /> Favorite quote (optional)
              </label>
              <Textarea value={quote} onChange={(e) => setQuote(e.target.value.slice(0, 1000))} placeholder="A passage that stayed with you…" rows={2} className="font-serif text-sm bg-secondary/10 border-border/30 resize-none italic" />
            </div>

            <div className="space-y-1.5">
              <label className="font-serif text-[10px] tracking-widest uppercase text-muted-foreground/60">
                What connects this book to this Ancient Friend?
              </label>
              <Textarea ref={reflectionRef} value={reflection} onChange={(e) => setReflection(e.target.value.slice(0, 2000))} placeholder="What does this book hold for you?" rows={3} className="font-serif text-sm bg-secondary/10 border-border/30 resize-none" />
              <p className="text-[10px] text-right text-muted-foreground/30">{reflection.length} / 2000</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => { setStep("search"); setSelectedBook(null); }} className="font-serif text-xs">
                Back
              </Button>
              <Button type="button" onClick={() => setStep("review")} className="flex-1 font-serif text-xs">
                Review
              </Button>
            </div>
          </motion.div>
        )}

        {/* ===== REVIEW ===== */}
        {step === "review" && selectedBook && (
          <motion.div key="review" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
              <div className="flex gap-3">
                {selectedBook.coverUrl ? (
                  <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-14 h-20 rounded object-cover shrink-0 border border-border/30" />
                ) : (
                  <div className="w-14 h-20 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <BookOpen className="h-6 w-6 text-primary/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-medium text-foreground/90">{selectedBook.title}</p>
                  <p className="text-sm text-muted-foreground/70">{selectedBook.author}</p>
                </div>
              </div>

              {quote.trim() && (
                <blockquote className="border-l-2 border-primary/30 pl-3 italic text-sm font-serif text-foreground/70">
                  "{quote.trim()}"
                </blockquote>
              )}

              {reflection.trim() && (
                <p className="text-sm font-serif text-foreground/60 leading-relaxed">{reflection.trim()}</p>
              )}
            </div>

            <p className="text-[10px] font-serif text-muted-foreground/40 text-center">
              This will become part of this tree's living archive.
            </p>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setStep("details")} className="font-serif text-xs">
                Edit
              </Button>
              <Button type="button" onClick={handleSubmit} className="flex-1 font-serif text-xs gap-1.5">
                <Sparkles className="h-3 w-3" />
                Place this Book
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookOfferingFlow;
