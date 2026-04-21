/**
 * SpeciesSearch — multilingual species search. Type Oak, Roble, Chêne,
 * Quercia and they all resolve to the same species via the
 * `search_species_multilingual` RPC.
 *
 * Renders inline results as clickable links to /species/:slug.
 */
import { useState } from "react";
import { Search, Languages, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useSpeciesSearch } from "@/hooks/use-treeasurus";

interface Props {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function SpeciesSearch({
  placeholder = "Search any name — Oak · Roble · Chêne · Quercia…",
  className = "",
  autoFocus = false,
}: Props) {
  const [query, setQuery] = useState("");
  const { data: hits = [], isFetching } = useSpeciesSearch(query);

  // De-duplicate by species_id, keep first match
  const seen = new Set<string>();
  const unique = hits.filter((h) => {
    if (seen.has(h.species_id)) return false;
    seen.add(h.species_id);
    return true;
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-9 font-serif text-sm"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 animate-spin" />
        )}
      </div>

      {query.trim().length >= 2 && (
        <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
          {unique.length === 0 && !isFetching ? (
            <p className="text-xs font-serif text-muted-foreground/70 italic p-3">
              No species found by that name yet. Try the scientific name, or another language.
            </p>
          ) : (
            <ul className="divide-y divide-border/30 max-h-72 overflow-y-auto">
              {unique.map((h) => (
                <li key={h.species_id}>
                  <Link
                    to={h.slug ? `/species/${h.slug}` : "#"}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-serif text-foreground truncate">
                        {h.canonical_common_name || h.scientific_name || h.matched_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-serif italic truncate">
                        {h.scientific_name}
                        {h.family && (
                          <span className="not-italic text-muted-foreground/60"> · {h.family}</span>
                        )}
                      </p>
                    </div>
                    {h.matched_name?.toLowerCase() !== (h.canonical_common_name || "").toLowerCase() && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-serif text-muted-foreground/70 shrink-0">
                        <Languages className="w-2.5 h-2.5" />
                        {h.matched_name}
                        {h.matched_language && (
                          <span className="text-muted-foreground/40"> · {h.matched_language}</span>
                        )}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
