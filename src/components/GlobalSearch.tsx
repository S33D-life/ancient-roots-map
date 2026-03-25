/**
 * GlobalSearch — Unified search overlay powered by the Search Brain.
 * All search UIs (Firefly, Map, Header) call the same service.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Search, X, MapPin } from "lucide-react";
import {
  unifiedSearch,
  groupResults,
  FILTER_LABELS,
  type SearchResult,
  type SearchFilter,
} from "@/services/unified-search";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  embedded?: boolean;
  initialFilter?: SearchFilter;
  /** Called when a result with mapContext is selected — lets map views handle it */
  onMapNavigate?: (result: SearchResult) => void;
}

const FILTER_ORDER: SearchFilter[] = ["all", "trees", "places", "heartwood", "staffs", "wanderers", "council", "library", "support"];

const GlobalSearch = ({ open, onClose, embedded, initialFilter, onMapNavigate }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>(initialFilter || "all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Search when query or filter changes
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await unifiedSearch(query, filter, 24);
        setResults(res);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 220);

    return () => clearTimeout(debounceRef.current);
  }, [query, filter]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (onMapNavigate && result.mapContext) {
        onMapNavigate(result);
      } else {
        navigate(result.url);
      }
      onClose();
      setQuery("");
      setFilter("all");
    },
    [navigate, onClose, onMapNavigate],
  );

  const grouped = groupResults(results);

  if (!open) return null;

  const searchContent = (
    <>
      {/* Filter chips */}
      <div className="flex gap-1.5 mb-3 px-1 flex-wrap">
        {FILTER_ORDER.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-serif border transition-all duration-200 ${
              filter === f
                ? "bg-primary/20 border-primary/50 text-primary"
                : "bg-secondary/40 border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Command palette */}
      <Command
        className="rounded-xl border border-border bg-card/95 backdrop-blur shadow-2xl overflow-hidden"
        shouldFilter={false}
      >
        <CommandInput
          placeholder="Search trees, places, rooms, wanderers, support…"
          value={query}
          onValueChange={setQuery}
          className="font-serif"
        />
        <CommandList className="max-h-[50vh]">
          {loading && (
            <div className="py-6 text-center text-xs text-muted-foreground font-serif animate-pulse">
              Searching the ancient records…
            </div>
          )}

          {!loading && query.length >= 2 && grouped.length === 0 && (
            <CommandEmpty className="font-serif text-muted-foreground">
              No echoes found for "{query}"
            </CommandEmpty>
          )}

          {!loading && query.length < 2 && filter === "all" && (
            <CommandGroup heading="Quick Navigation">
              {[
                { id: "qn-map", title: "🗺 Ancient Friends Atlas", sub: "Interactive tree map", url: "/map" },
                { id: "qn-atlas", title: "🌍 The Atlas", sub: "Country portals", url: "/atlas" },
                { id: "qn-library", title: "📚 HeARTwood Library", sub: "Rooms & scrolls", url: "/library" },
                { id: "qn-council", title: "🌿 Council of Life", sub: "Community governance", url: "/council-of-life" },
                { id: "qn-support", title: "🛟 Support Hub", sub: "Help, FAQs, volunteering", url: "/support" },
              ].map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => { navigate(item.url); onClose(); setQuery(""); }}
                  className="gap-3 cursor-pointer font-serif"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading &&
            grouped.map((group, gi) => (
              <div key={group.type}>
                {gi > 0 && <CommandSeparator />}
                <CommandGroup heading={group.label}>
                  {group.items.slice(0, 6).map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                      className="gap-3 cursor-pointer font-serif"
                    >
                      <span className="text-sm shrink-0">{item.emoji || "•"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.mapContext && (
                          <MapPin className="w-3 h-3 text-primary/40" />
                        )}
                        <Badge variant="outline" className="text-[8px] uppercase tracking-widest">
                          {item.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                  {group.items.length > 6 && (
                    <div className="px-3 py-1.5 text-[10px] text-muted-foreground/50 font-serif">
                      +{group.items.length - 6} more…
                    </div>
                  )}
                </CommandGroup>
              </div>
            ))}
        </CommandList>

        {/* Footer */}
        <div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="font-serif">⌘K to search anytime</span>
          <span className="font-serif">ESC to close</span>
        </div>
      </Command>
    </>
  );

  // Embedded mode
  if (embedded) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-lg tracking-widest text-primary uppercase">Search the Grove</h2>
        </div>
        {searchContent}
      </div>
    );
  }

  // Modal overlay
  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center pt-[10vh] md:pt-[15vh]"
      onClick={onClose}
      style={{
        background: "radial-gradient(ellipse at 50% 30%, hsl(var(--card) / 0.85), hsl(var(--background) / 0.88))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        className="w-[92vw] max-w-lg animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <span className="font-serif text-sm tracking-widest text-primary uppercase">
              Search the Grove
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        {searchContent}
      </div>
    </div>
  );
};

export default GlobalSearch;
