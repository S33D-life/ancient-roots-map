import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Sparkles, Loader2, Plus, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

/* ---------- Types ---------- */

interface CatalogBook {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  cover_url: string | null;
  similarity: number;
}

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

/* ---------- Genre colors ---------- */

const genreColors: Record<string, string> = {
  Nature: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  Fiction: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  Poetry: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  Science: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Philosophy: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Mythology: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  Memoir: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  History: "bg-stone-500/10 text-stone-700 dark:text-stone-400 border-stone-500/20",
  Biography: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
};

/* ---------- Component ---------- */

const BookOfferingFlow = ({ treeId, onComplete, onCancel }: BookOfferingFlowProps) => {
  const [step, setStep] = useState<FlowStep>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{ title: string; author: string; genre: string | null; coverUrl: string | null; isCustom: boolean } | null>(null);
  const [quote, setQuote] = useState("");
  const [reflection, setReflection] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [recentBooks, setRecentBooks] = useState<{ title: string; author: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setRecentBooks(data.map(d => ({ title: d.title, author: d.content?.split("\n")[0] || "" })));
      }
    };
    fetchRecent();
  }, [treeId]);

  // Debounced search
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

  const selectCatalogBook = (book: CatalogBook) => {
    setSelectedBook({
      title: book.title,
      author: book.author,
      genre: book.genre,
      coverUrl: book.cover_url,
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

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* ===== SEARCH ===== */}
        {step === "search" && (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for a story…"
                className="pl-9 font-serif"
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
              {searching && (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 p-2">
                      <Skeleton className="w-10 h-14 rounded shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!searching && results.length > 0 && results.map((book) => (
                <motion.button
                  key={book.id}
                  type="button"
                  onClick={() => selectCatalogBook(book)}
                  className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-primary/5 transition-colors text-left group"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-14 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <BookOpen className="h-4 w-4 text-primary/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-serif font-medium text-foreground/90 truncate group-hover:text-primary transition-colors">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground/70 truncate">{book.author}</p>
                    {book.genre && (
                      <Badge variant="outline" className={`mt-1 text-[10px] px-1.5 py-0 border ${genreColors[book.genre] || "bg-muted/30 text-muted-foreground"}`}>
                        {book.genre}
                      </Badge>
                    )}
                  </div>
                </motion.button>
              ))}

              {!searching && query.length >= 2 && results.length === 0 && (
                <div className="text-center py-6 space-y-2">
                  <BookOpen className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground/60 font-serif">
                    No matching books found — add your own below
                  </p>
                </div>
              )}

              {/* Empty state */}
              {!searching && query.length < 2 && results.length === 0 && (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary/50" />
                  </div>
                  <p className="text-xs text-muted-foreground/60 font-serif">
                    Search by title or author to discover stories
                  </p>

                  {/* Recent books */}
                  {recentBooks.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-serif">
                        Recently offered
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

            {/* Custom entry */}
            <div className="border-t border-border/30 pt-4 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-serif flex items-center gap-1.5">
                <Plus className="h-3 w-3" /> Add your own book
              </p>
              <div className="flex gap-2">
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value.slice(0, 200))}
                  placeholder="Book title"
                  className="font-serif text-sm flex-1"
                />
                <Input
                  value={customAuthor}
                  onChange={(e) => setCustomAuthor(e.target.value.slice(0, 200))}
                  placeholder="Author"
                  className="font-serif text-sm flex-1"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!customTitle.trim() || !customAuthor.trim()}
                onClick={selectCustomBook}
                className="w-full font-serif text-xs tracking-wider gap-1.5"
              >
                <Plus className="h-3 w-3" />
                Add Custom Book
              </Button>
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="w-full font-serif text-xs text-muted-foreground">
              Cancel
            </Button>
          </motion.div>
        )}

        {/* ===== DETAILS ===== */}
        {step === "details" && selectedBook && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Selected book card */}
            <div className="rounded-xl border border-primary/30 overflow-hidden">
              <div
                className="h-0.5"
                style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent)" }}
              />
              <div className="p-4 bg-primary/5 flex gap-3">
                <div className="w-12 h-16 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <BookOpen className="h-5 w-5 text-primary/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-serif font-medium text-foreground/90">{selectedBook.title}</p>
                  <p className="text-xs text-muted-foreground/70">{selectedBook.author}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {selectedBook.genre && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${genreColors[selectedBook.genre] || "bg-muted/30 text-muted-foreground"}`}>
                        {selectedBook.genre}
                      </Badge>
                    )}
                    {selectedBook.isCustom && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border border-primary/30 bg-primary/5 text-primary/70">
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite quote */}
            <div className="space-y-1.5">
              <label className="font-serif text-[10px] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1">
                <Quote className="h-3 w-3" /> Favorite quote (optional)
              </label>
              <Textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value.slice(0, 1000))}
                placeholder="A passage that stayed with you…"
                rows={2}
                className="font-serif text-sm leading-relaxed bg-secondary/10 border-border/30 resize-none italic"
              />
            </div>

            {/* Reflection */}
            <div className="space-y-1.5">
              <label className="font-serif text-[10px] tracking-widest uppercase text-muted-foreground/60">
                Why are you offering this story?
              </label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value.slice(0, 2000))}
                placeholder="What connects this book to this Ancient Friend?"
                rows={3}
                className="font-serif text-sm leading-relaxed bg-secondary/10 border-border/30 resize-none"
              />
              <p className="text-[10px] text-right text-muted-foreground/30">{reflection.length} / 2000</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => { setStep("search"); setSelectedBook(null); }} className="font-serif text-xs tracking-wider">
                Back
              </Button>
              <Button type="button" onClick={() => setStep("review")} className="flex-1 font-serif text-xs tracking-wider gap-1.5">
                Review Offering
              </Button>
            </div>
          </motion.div>
        )}

        {/* ===== REVIEW ===== */}
        {step === "review" && selectedBook && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Review card */}
            <div className="rounded-xl border border-primary/30 overflow-hidden">
              <div
                className="h-0.5"
                style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent)" }}
              />
              <div className="p-5 bg-primary/5 space-y-4">
                <div className="flex gap-3">
                  <div className="w-14 h-20 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <BookOpen className="h-6 w-6 text-primary/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-medium text-foreground/90">{selectedBook.title}</p>
                    <p className="text-sm text-muted-foreground/70">{selectedBook.author}</p>
                    {selectedBook.genre && (
                      <Badge variant="outline" className={`mt-1.5 text-[10px] px-1.5 py-0 border ${genreColors[selectedBook.genre] || ""}`}>
                        {selectedBook.genre}
                      </Badge>
                    )}
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
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setStep("details")} className="font-serif text-xs tracking-wider">
                Edit
              </Button>
              <Button type="button" onClick={handleSubmit} className="flex-1 font-serif text-xs tracking-wider gap-1.5">
                <Sparkles className="h-3 w-3" />
                Seal this Book Offering
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookOfferingFlow;
