import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, X, MapPin } from "lucide-react";
import {
  unifiedSearch,
  groupResults,
  type SearchResult,
} from "@/services/unified-search";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
}

interface LiteMapSearchProps {
  trees: Tree[];
  onSelect: (tree: Tree) => void;
  /** Called when a unified search result with mapContext is selected */
  onSearchResult?: (result: SearchResult) => void;
}

const LiteMapSearch = ({ trees, onSelect, onSearchResult }: LiteMapSearchProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [unifiedResults, setUnifiedResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Local tree results (instant)
  const localResults = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return trees
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.species.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [trees, query]);

  // Unified search (debounced)
  useEffect(() => {
    if (query.length < 2) {
      setUnifiedResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await unifiedSearch(query, "all", 8);
        // Filter out trees already in local results
        const localIds = new Set(localResults.map(t => t.id));
        setUnifiedResults(res.filter(r => !(r.type === "tree" && localIds.has(r.id.replace("tree-", "")))));
      } catch {
        setUnifiedResults([]);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, localResults]);

  const handleSelect = useCallback(
    (tree: Tree) => {
      onSelect(tree);
      setQuery("");
      setOpen(false);
    },
    [onSelect]
  );

  const handleUnifiedSelect = useCallback(
    (result: SearchResult) => {
      if (onSearchResult) {
        onSearchResult(result);
      }
      setQuery("");
      setOpen(false);
    },
    [onSearchResult]
  );

  // Close on outside click
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const grouped = groupResults(unifiedResults.filter(r => r.type !== "tree"));

  return (
    <div ref={wrapRef} className="absolute top-[5rem] left-2 right-14 z-[1002]" style={{ maxWidth: open ? "calc(100% - 120px)" : "44px" }}>
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90 glow-button"
          style={{
            background: "hsla(30, 30%, 12%, 0.92)",
            border: "1px solid hsla(42, 40%, 30%, 0.5)",
            backdropFilter: "blur(6px)",
            color: "hsl(42, 60%, 60%)",
          }}
          title="Search Everything"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>
      ) : (
        <div
          className="rounded-2xl overflow-hidden animate-fade-in"
          style={{
            background: "hsla(30, 20%, 8%, 0.96)",
            border: "1px solid hsla(42, 40%, 30%, 0.4)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <Search className="w-4 h-4 shrink-0" style={{ color: "hsl(42, 55%, 55%)" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trees, places, rooms…"
              className="flex-1 bg-transparent text-[13px] font-serif outline-none placeholder:text-[hsl(42,30%,40%)]"
              style={{ color: "hsl(42, 70%, 65%)" }}
            />
            <button
              onClick={() => { setQuery(""); setOpen(false); }}
              className="shrink-0 p-1 rounded-full transition-colors active:scale-90"
              style={{ color: "hsl(42, 50%, 50%)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Local tree results */}
          {localResults.length > 0 && (
            <div className="border-t" style={{ borderColor: "hsla(42, 40%, 30%, 0.2)" }}>
              <div className="px-3 py-1.5">
                <span className="text-[9px] uppercase tracking-widest font-serif" style={{ color: "hsl(42, 35%, 45%)" }}>
                  Ancient Friends
                </span>
              </div>
              {localResults.map((tree) => (
                <button
                  key={tree.id}
                  onClick={() => handleSelect(tree)}
                  className="w-full text-left px-3 py-2.5 transition-colors flex items-center gap-2"
                  style={{ color: "hsl(42, 60%, 60%)" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "hsla(42, 50%, 40%, 0.1)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="text-sm">🌳</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-serif truncate" style={{ color: "hsl(42, 70%, 60%)" }}>
                      {tree.name}
                    </p>
                    <p className="text-[10px] font-serif truncate" style={{ color: "hsl(42, 40%, 48%)" }}>
                      {tree.species}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Unified results (non-tree) */}
          {grouped.length > 0 && (
            <div className="border-t" style={{ borderColor: "hsla(42, 40%, 30%, 0.2)" }}>
              {grouped.map((group) => (
                <div key={group.type}>
                  <div className="px-3 py-1.5">
                    <span className="text-[9px] uppercase tracking-widest font-serif" style={{ color: "hsl(42, 35%, 45%)" }}>
                      {group.label}
                    </span>
                  </div>
                  {group.items.slice(0, 3).map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleUnifiedSelect(result)}
                      className="w-full text-left px-3 py-2.5 transition-colors flex items-center gap-2"
                      style={{ color: "hsl(42, 60%, 60%)" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "hsla(42, 50%, 40%, 0.1)")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span className="text-sm">{result.emoji || "•"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-serif truncate" style={{ color: "hsl(42, 70%, 60%)" }}>
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-[10px] font-serif truncate" style={{ color: "hsl(42, 40%, 48%)" }}>
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      {result.mapContext && (
                        <MapPin className="w-3 h-3 shrink-0" style={{ color: "hsl(42, 40%, 50%)" }} />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Loading */}
          {searching && query.length >= 2 && localResults.length === 0 && (
            <div className="px-3 py-3 text-center border-t" style={{ borderColor: "hsla(42, 40%, 30%, 0.2)" }}>
              <p className="text-[11px] font-serif animate-pulse" style={{ color: "hsl(42, 35%, 45%)" }}>
                Searching the grove…
              </p>
            </div>
          )}

          {/* Empty */}
          {query.length >= 2 && !searching && localResults.length === 0 && unifiedResults.length === 0 && (
            <div className="px-3 py-3 text-center border-t" style={{ borderColor: "hsla(42, 40%, 30%, 0.2)" }}>
              <p className="text-[11px] font-serif" style={{ color: "hsl(42, 35%, 45%)" }}>
                No echoes found for "{query}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiteMapSearch;
