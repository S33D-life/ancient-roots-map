import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TreeCard from "@/components/TreeCard";
import PageShell from "@/components/PageShell";
import { type TreeCardData } from "@/utils/treeCardTypes";
import { Search, Globe, MapPin, TreeDeciduous, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

type DiscoveryList = "all" | "global_notable" | "european_monumental" | "uk_ancient";

const LIST_LABELS: Record<DiscoveryList, { label: string; icon: React.ReactNode; description: string }> = {
  all: { label: "All Ancient Trees", icon: <TreeDeciduous className="w-4 h-4" />, description: "Browse the complete curated collection" },
  global_notable: { label: "Globally Notable", icon: <Globe className="w-4 h-4" />, description: "The world's most remarkable trees" },
  european_monumental: { label: "European Monumental", icon: <MapPin className="w-4 h-4" />, description: "Ancient sentinels across Europe" },
  uk_ancient: { label: "UK & Ireland Ancient", icon: <TreeDeciduous className="w-4 h-4" />, description: "Sacred yews, mighty oaks, and storied trees of Britain and Ireland" },
};

const DiscoveryPage = () => {
  const navigate = useNavigate();
  const [activeList, setActiveList] = useState<DiscoveryList>("all");
  const [search, setSearch] = useState("");

  // Fetch curated trees
  const { data: trees = [], isLoading } = useQuery({
    queryKey: ["discovery-trees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trees")
        .select("*")
        .not("source_name" as any, "is", null)
        .order("estimated_age", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data ?? []) as (TreeCardData & { source_name?: string; source_url?: string; discovery_list?: string })[];
    },
  });

  // Fetch user wishlist IDs
  const { data: wishlistIds = [], refetch: refetchWishlist } = useQuery({
    queryKey: ["discovery-wishlist"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("tree_wishlist")
        .select("tree_id")
        .eq("user_id", user.id);
      return (data ?? []).map((w) => w.tree_id);
    },
  });

  // Filter by list + search
  const filtered = useMemo(() => {
    let result = trees;
    if (activeList !== "all") {
      result = result.filter((t: any) => t.discovery_list === activeList);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.species.toLowerCase().includes(q) ||
          (t.nation && t.nation.toLowerCase().includes(q)) ||
          (t.lineage && t.lineage.toLowerCase().includes(q))
      );
    }
    return result;
  }, [trees, activeList, search]);

  // Source counts
  const counts = useMemo(() => {
    const c = { all: trees.length, global_notable: 0, european_monumental: 0, uk_ancient: 0 };
    trees.forEach((t: any) => {
      if (t.discovery_list && c[t.discovery_list as keyof typeof c] !== undefined) {
        c[t.discovery_list as keyof typeof c]++;
      }
    });
    return c;
  }, [trees]);

  const handleWishlist = async (treeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sign in to add to your Wishing Tree");
      navigate("/auth");
      return;
    }

    const isWished = wishlistIds.includes(treeId);
    if (isWished) {
      await supabase.from("tree_wishlist").delete().eq("tree_id", treeId).eq("user_id", user.id);
      toast.success("Removed from Wishing Tree");
    } else {
      await supabase.from("tree_wishlist").insert({ tree_id: treeId, user_id: user.id });
      toast.success("Added to your Wishing Tree 🌟");
    }
    refetchWishlist();
  };

  const handleSelect = (tree: TreeCardData) => {
    navigate(`/tree/${tree.id}`);
  };

  const handleShare = (name: string, description: string, url: string) => {
    if (navigator.share) {
      navigator.share({ title: name, text: description, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl text-primary tracking-wide">
            Living Library of Ancient Trees
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed">
            Discover the world's most remarkable trees — from monumental European oaks to sacred yews 
            and champion trees across the globe. Add them to your Wishing Tree and one day, visit them as Ancient Friends.
          </p>
        </div>

        {/* List selector */}
        <div className="flex flex-wrap gap-2 justify-center">
          {(Object.keys(LIST_LABELS) as DiscoveryList[]).map((key) => {
            const { label, icon } = LIST_LABELS[key];
            const isActive = activeList === key;
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveList(key)}
                className="gap-1.5 font-serif text-xs"
              >
                {icon}
                {label}
                <Badge
                  variant="secondary"
                  className={`ml-1 text-[10px] h-4 min-w-[18px] ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : ""}`}
                >
                  {counts[key]}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Active list description */}
        <p className="text-center text-xs text-muted-foreground/70 font-serif italic">
          {LIST_LABELS[activeList].description}
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, species, or country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-serif text-sm"
          />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm font-serif">
            No trees found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tree) => (
              <div key={tree.id} className="relative">
                {/* Source attribution badge */}
                {(tree as any).source_name && (
                  <div className="absolute top-2 right-2 z-20">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-serif bg-background/80 backdrop-blur-sm border-muted-foreground/20"
                    >
                      {(tree as any).source_name === "champion_trees"
                        ? "Champion Trees"
                        : (tree as any).source_name === "monumental_trees"
                        ? "Monumental Trees"
                        : "Ancient Tree Inventory"}
                    </Badge>
                  </div>
                )}
                <TreeCard
                  tree={tree}
                  variant="gallery"
                  onSelect={handleSelect}
                  onWishlist={handleWishlist}
                  onShare={handleShare}
                  wishlistPulseActive={wishlistIds.includes(tree.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer attribution */}
        <div className="text-center text-[11px] text-muted-foreground/50 space-y-1 pt-8 border-t border-border/20">
          <p className="font-serif">Data sourced with care from</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="https://www.monumentaltrees.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Monumental Trees
            </a>
            <span>·</span>
            <a href="https://www.championtrees.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Champion Trees
            </a>
            <span>·</span>
            <a href="https://ati.woodlandtrust.org.uk" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Ancient Tree Inventory (Woodland Trust)
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default DiscoveryPage;
