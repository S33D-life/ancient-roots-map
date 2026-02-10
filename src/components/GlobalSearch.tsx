import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  TreeDeciduous, MapPin, Sprout, BookOpen, Search, Leaf,
  Sparkles, X, ScrollText, BarChart3,
} from "lucide-react";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

type SearchCategory = "all" | "trees" | "species" | "greenhouse" | "pages";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: SearchCategory;
  icon: React.ReactNode;
  route: string;
}

const STATIC_PAGES: SearchResult[] = [
  { id: "page-atlas", title: "Ancient Friend Arboreal Atlas", subtitle: "Map of ancient trees", category: "pages", icon: <MapPin className="w-4 h-4" />, route: "/map" },
  { id: "page-library", title: "HeARTwood Library", subtitle: "Gallery & rooms", category: "pages", icon: <BookOpen className="w-4 h-4" />, route: "/gallery" },
  { id: "page-council", title: "Council of Life", subtitle: "Community council", category: "pages", icon: <Leaf className="w-4 h-4" />, route: "/council-of-life" },
  { id: "page-dream", title: "yOur Golden Dream", subtitle: "Vision & offerings", category: "pages", icon: <Sparkles className="w-4 h-4" />, route: "/golden-dream" },
  { id: "page-dashboard", title: "My Grove (Dashboard)", subtitle: "Wishlist, seed pods, profile", category: "pages", icon: <Sprout className="w-4 h-4" />, route: "/dashboard" },
  { id: "page-assets", title: "Staff Room & Assets", subtitle: "NFT gallery", category: "pages", icon: <ScrollText className="w-4 h-4" />, route: "/assets" },
  { id: "page-groves", title: "Groves & Projects", subtitle: "Tree projects", category: "pages", icon: <TreeDeciduous className="w-4 h-4" />, route: "/groves" },
  { id: "page-ledger", title: "Ledger", subtitle: "Stats, Notion strings, import/export", category: "pages", icon: <BarChart3 className="w-4 h-4" />, route: "/gallery" },
];

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  all: "All",
  trees: "Ancient Trees",
  species: "Species",
  greenhouse: "Seed Pods",
  pages: "Pages & Rooms",
};

const CATEGORY_FILTERS: SearchCategory[] = ["all", "trees", "species", "greenhouse", "pages"];

const GlobalSearch = ({ open, onClose }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchCategory>("all");
  const [treeResults, setTreeResults] = useState<SearchResult[]>([]);
  const [speciesResults, setSpeciesResults] = useState<SearchResult[]>([]);
  const [greenhouseResults, setGreenhouseResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Ctrl/Cmd+K opens search from anywhere
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Search database when query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setTreeResults([]);
      setSpeciesResults([]);
      setGreenhouseResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const q = query.trim();

      const [treesRes, speciesRes, greenhouseRes] = await Promise.all([
        // Trees by name
        supabase
          .from("trees")
          .select("id, name, species, nation")
          .or(`name.ilike.%${q}%,species.ilike.%${q}%,what3words.ilike.%${q}%`)
          .limit(8),
        // Distinct species
        supabase
          .from("trees")
          .select("species")
          .ilike("species", `%${q}%`)
          .limit(10),
        // Greenhouse / seed pods
        supabase
          .from("greenhouse_plants")
          .select("id, name, species")
          .or(`name.ilike.%${q}%,species.ilike.%${q}%`)
          .limit(6),
      ]);

      if (treesRes.data) {
        setTreeResults(
          treesRes.data.map((t) => ({
            id: `tree-${t.id}`,
            title: t.name,
            subtitle: [t.species, t.nation].filter(Boolean).join(" · "),
            category: "trees" as const,
            icon: <TreeDeciduous className="w-4 h-4" />,
            route: `/tree/${t.id}`,
          }))
        );
      }

      if (speciesRes.data) {
        const unique = [...new Set(speciesRes.data.map((s) => s.species))];
        setSpeciesResults(
          unique.map((sp) => ({
            id: `species-${sp}`,
            title: sp,
            subtitle: "Species",
            category: "species" as const,
            icon: <Leaf className="w-4 h-4" />,
            route: `/map?species=${encodeURIComponent(sp)}`,
          }))
        );
      }

      if (greenhouseRes.data) {
        setGreenhouseResults(
          greenhouseRes.data.map((p) => ({
            id: `plant-${p.id}`,
            title: p.name,
            subtitle: p.species || "Seed Pod",
            category: "greenhouse" as const,
            icon: <Sprout className="w-4 h-4" />,
            route: "/dashboard",
          }))
        );
      }

      setLoading(false);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = useCallback(
    (route: string) => {
      navigate(route);
      onClose();
      setQuery("");
      setFilter("all");
    },
    [navigate, onClose]
  );

  // Filter pages by query
  const pageResults = STATIC_PAGES.filter(
    (p) =>
      !query.trim() ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.subtitle?.toLowerCase().includes(query.toLowerCase())
  );

  const allGroups: { key: SearchCategory; label: string; items: SearchResult[] }[] = [
    { key: "trees", label: "Ancient Trees", items: treeResults },
    { key: "species", label: "Species", items: speciesResults },
    { key: "greenhouse", label: "Seed Pods", items: greenhouseResults },
    { key: "pages", label: "Pages & Rooms", items: pageResults },
  ];

  const filteredGroups =
    filter === "all"
      ? allGroups.filter((g) => g.items.length > 0)
      : allGroups.filter((g) => g.key === filter && g.items.length > 0);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center pt-[10vh] md:pt-[15vh]"
      onClick={onClose}
      style={{
        background: "radial-gradient(ellipse at 50% 30%, hsl(80 15% 10% / 0.7), hsl(80 15% 6% / 0.75))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        className="w-[92vw] max-w-lg animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <span className="font-serif text-sm tracking-widest text-primary uppercase">
              Search the Grove
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 mb-3 px-1 flex-wrap">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-serif border transition-all duration-200 ${
                filter === cat
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-secondary/40 border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Command palette */}
        <Command
          className="rounded-xl border border-border bg-card/95 backdrop-blur shadow-2xl overflow-hidden"
          shouldFilter={false}
        >
          <CommandInput
            placeholder="Search trees, species, seed pods, pages…"
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

            {!loading && query.length >= 2 && filteredGroups.length === 0 && (
              <CommandEmpty className="font-serif text-muted-foreground">
                No echoes found for "{query}"
              </CommandEmpty>
            )}

            {!loading && query.length < 2 && filter === "all" && (
              <CommandGroup heading="Quick Navigation">
                {STATIC_PAGES.slice(0, 5).map((page) => (
                  <CommandItem
                    key={page.id}
                    value={page.id}
                    onSelect={() => handleSelect(page.route)}
                    className="gap-3 cursor-pointer font-serif"
                  >
                    <span className="text-primary">{page.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{page.title}</p>
                      {page.subtitle && (
                        <p className="text-[10px] text-muted-foreground truncate">{page.subtitle}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!loading &&
              filteredGroups.map((group, gi) => (
                <div key={group.key}>
                  {gi > 0 && <CommandSeparator />}
                  <CommandGroup heading={group.label}>
                    {group.items.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item.route)}
                        className="gap-3 cursor-pointer font-serif"
                      >
                        <span className="text-primary">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[8px] uppercase tracking-widest shrink-0">
                          {item.category}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              ))}
          </CommandList>

          {/* Footer hint */}
          <div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-serif">⌘K to search anytime</span>
            <span className="font-serif">ESC to close</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default GlobalSearch;
