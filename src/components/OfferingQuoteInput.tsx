import { useState, useCallback } from "react";
import { ChevronDown, Quote, Search, Sparkles, Loader2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import OfferingQuoteBlock from "@/components/OfferingQuoteBlock";

export interface QuoteData {
  text: string;
  author: string;
  source: string;
}

interface OfferingQuoteInputProps {
  value: QuoteData;
  onChange: (v: QuoteData) => void;
}

const MAX_TEXT = 500;
const MAX_AUTHOR = 120;
const MAX_SOURCE = 200;

interface SearchResult {
  content: string;
  author: string;
}

/**
 * Fetch quotes from the free Quotable API.
 * Falls back gracefully on network errors.
 */
async function searchQuotes(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.quotable.io/search/quotes?query=${encodeURIComponent(query)}&limit=5`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((q: any) => ({
      content: q.content,
      author: q.author,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch a single random inspirational quote.
 * Uses Quotable random endpoint; falls back to a built-in set.
 */
async function getRandomQuote(): Promise<SearchResult> {
  const FALLBACKS: SearchResult[] = [
    { content: "In the depth of winter, I finally learned that within me there lay an invincible summer.", author: "Albert Camus" },
    { content: "The creation of a thousand forests is in one acorn.", author: "Ralph Waldo Emerson" },
    { content: "Between every two pines is a doorway to a new world.", author: "John Muir" },
    { content: "He who plants a tree plants a hope.", author: "Lucy Larcom" },
    { content: "The best time to plant a tree was twenty years ago. The second best time is now.", author: "Chinese Proverb" },
    { content: "Trees are poems the earth writes upon the sky.", author: "Kahlil Gibran" },
  ];
  try {
    const res = await fetch("https://api.quotable.io/random?tags=nature|wisdom|inspirational", {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return { content: data.content, author: data.author };
  } catch {
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }
}

const OfferingQuoteInput = ({ value, onChange }: OfferingQuoteInputProps) => {
  const [open, setOpen] = useState(!!value.text);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [inspiring, setInspiring] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const set = (field: keyof QuoteData, v: string) => {
    onChange({ ...value, [field]: v });
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchQuotes(searchQuery.trim());
    setSearchResults(results);
    setSearching(false);
  }, [searchQuery]);

  const handleSelectResult = useCallback((result: SearchResult) => {
    onChange({ text: result.content, author: result.author, source: "" });
    setSearchResults([]);
    setSearchQuery("");
    setShowSearch(false);
  }, [onChange]);

  const handleInspire = useCallback(async () => {
    setInspiring(true);
    const result = await getRandomQuote();
    onChange({ text: result.content, author: result.author, source: "" });
    setInspiring(false);
  }, [onChange]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-xs font-serif text-muted-foreground hover:text-foreground tracking-wider transition-colors w-full py-1">
        <Quote className="h-3 w-3" />
        {open ? "Quote" : "+ Add a Quote"}
        <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-2">
        {/* ── Mode bar: Search + Inspire ── */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-[10px] font-serif h-7 px-2.5"
            onClick={() => setShowSearch(!showSearch)}
            style={{
              borderColor: showSearch ? "hsl(var(--primary) / 0.4)" : undefined,
              color: showSearch ? "hsl(var(--primary))" : undefined,
            }}
          >
            <Search className="w-3 h-3" />
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-[10px] font-serif h-7 px-2.5"
            onClick={handleInspire}
            disabled={inspiring}
          >
            {inspiring ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Inspire me
          </Button>
        </div>

        {/* ── Search panel ── */}
        {showSearch && (
          <div className="space-y-2 rounded-lg border border-border/30 bg-card/30 p-3">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quotes or authors…"
                className="bg-secondary/20 border-border/40 font-serif text-sm h-8 flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
              />
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Go"}
              </Button>
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-hide">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectResult(r)}
                    className="w-full text-left rounded-lg border border-border/20 bg-secondary/10 p-2.5 hover:bg-primary/5 hover:border-primary/30 transition-all touch-manipulation"
                  >
                    <p className="font-serif text-xs italic text-foreground/80 leading-relaxed line-clamp-3">
                      "{r.content}"
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-serif">— {r.author}</p>
                  </button>
                ))}
              </div>
            )}

            {searching && (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                <span className="text-[10px] font-serif text-muted-foreground">Searching…</span>
              </div>
            )}

            {!searching && searchResults.length === 0 && searchQuery.trim() && (
              <p className="text-[10px] font-serif text-muted-foreground/60 text-center py-2 italic">
                No results — try different words, or write your own below.
              </p>
            )}
          </div>
        )}

        {/* ── Manual entry fields ── */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label className="font-serif text-[10px] tracking-wider text-muted-foreground uppercase">Quote</Label>
            <span className={`text-[10px] font-mono ${value.text.length > MAX_TEXT ? "text-destructive" : "text-muted-foreground/50"}`}>
              {value.text.length}/{MAX_TEXT}
            </span>
          </div>
          <Textarea
            value={value.text}
            onChange={(e) => set("text", e.target.value)}
            placeholder="Leave a few words for this tree…"
            className="bg-secondary/20 border-border/50 font-serif min-h-[72px] text-sm italic leading-relaxed"
            maxLength={MAX_TEXT + 10}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="font-serif text-[10px] tracking-wider text-muted-foreground uppercase">Author</Label>
              <span className="text-[10px] font-mono text-muted-foreground/50">{value.author.length}/{MAX_AUTHOR}</span>
            </div>
            <Input
              value={value.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="Hermann Hesse"
              className="bg-secondary/20 border-border/50 font-serif text-sm"
              maxLength={MAX_AUTHOR + 5}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="font-serif text-[10px] tracking-wider text-muted-foreground uppercase">Source</Label>
              <span className="text-[10px] font-mono text-muted-foreground/50">{value.source.length}/{MAX_SOURCE}</span>
            </div>
            <Input
              value={value.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="Wandering"
              className="bg-secondary/20 border-border/50 font-serif text-sm"
              maxLength={MAX_SOURCE + 5}
            />
          </div>
        </div>

        {/* ── Live preview ── */}
        {value.text.trim() ? (
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: "hsl(var(--primary) / 0.15)",
              background: "linear-gradient(135deg, hsl(var(--card) / 0.6), hsl(var(--secondary) / 0.2))",
            }}
          >
            <p className="text-[9px] text-muted-foreground/40 font-serif mb-2 uppercase tracking-[0.2em]">
              How it will appear
            </p>
            <OfferingQuoteBlock
              text={value.text.trim()}
              author={value.author.trim() || null}
              source={value.source.trim() || null}
              maxLines={0}
            />
          </div>
        ) : (
          <div
            className="rounded-xl border border-dashed p-4 text-center"
            style={{ borderColor: "hsl(var(--muted-foreground) / 0.15)" }}
          >
            <Quote className="w-5 h-5 text-muted-foreground/20 mx-auto mb-1.5" />
            <p className="text-xs font-serif text-muted-foreground/40 italic">
              Leave a few words for this tree…
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default OfferingQuoteInput;
