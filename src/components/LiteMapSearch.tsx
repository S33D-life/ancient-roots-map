import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

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
}

const LiteMapSearch = ({ trees, onSelect }: LiteMapSearchProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return trees
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.species.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [trees, query]);

  const handleSelect = useCallback(
    (tree: Tree) => {
      onSelect(tree);
      setQuery("");
      setOpen(false);
    },
    [onSelect]
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

  return (
    <div ref={wrapRef} className="absolute top-14 left-2 right-14 z-[1002]" style={{ maxWidth: open ? "calc(100% - 120px)" : "44px" }}>
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90"
          style={{
            background: "hsla(30, 30%, 12%, 0.92)",
            border: "1px solid hsla(42, 40%, 30%, 0.5)",
            backdropFilter: "blur(6px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            color: "hsl(42, 60%, 60%)",
          }}
          title="Search Ancient Friends"
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
              placeholder="Search by name or species…"
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

          {results.length > 0 && (
            <div className="border-t" style={{ borderColor: "hsla(42, 40%, 30%, 0.2)" }}>
              {results.map((tree) => (
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

          {query.length >= 2 && results.length === 0 && (
            <div className="px-3 py-3 text-center border-t" style={{ borderColor: "hsla(42, 40%, 30%, 0.2)" }}>
              <p className="text-[11px] font-serif" style={{ color: "hsl(42, 35%, 45%)" }}>
                No trees found for "{query}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiteMapSearch;
