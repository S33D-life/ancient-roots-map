/**
 * AncientFriendsRoom — the "gallery" tab content for the Heartwood Library.
 * Shows tree cards with filtering, explorer overlay, and offering dialogs.
 */
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOfferings, type Offering } from "@/hooks/use-offerings";
import { useWhisperCounts } from "@/hooks/use-whisper-counts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Globe, User, Users, Image as ImageIcon, FileText, Music, Link as LinkIcon } from "lucide-react";
import TreeCard from "@/components/TreeCard";
import AncientFriendsExplorer from "@/components/AncientFriendsExplorer";
import GalleryFilterDrawer from "@/components/GalleryFilterDrawer";
import NFTreeStudio from "@/components/NFTreeStudio";
import ancientFriendsWindow from "@/assets/ancient-friends-window.jpeg";
import { deduplicateForGallery, type EncounterCluster } from "@/utils/treeEncounterClustering";

interface Tree {
  id: string;
  name: string;
  species: string;
  what3words: string;
  latitude: number;
  longitude: number;
  description: string | null;
  lineage: string | null;
  state: string | null;
  nation: string | null;
  estimated_age: number | null;
  grove_scale: string | null;
  created_at: string;
  created_by: string | null;
  project_name: string | null;
}

interface AncientFriendsRoomProps {
  trees: Tree[];
  loading: boolean;
  currentUserId: string | null;
  tribeUserIds: string[];
  treesWithStaff: Record<string, string[]>;
  staffCodes: string[];
  onSelectTree: (tree: Tree) => void;
}

const AncientFriendsRoom = ({
  trees,
  loading,
  currentUserId,
  tribeUserIds,
  treesWithStaff,
  staffCodes,
  onSelectTree,
}: AncientFriendsRoomProps) => {
  const [showExplorer, setShowExplorer] = useState(false);
  const [galleryView, setGalleryView] = useState<"collective" | "individual" | "tribe">("collective");
  const [searchQuery, setSearchQuery] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [w3wFilter, setW3wFilter] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [lineageFilter, setLineageFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [groveScaleFilter, setGroveScaleFilter] = useState<string>("all");
  const [nationFilter, setNationFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [wishlistPulseId, setWishlistPulseId] = useState<string | null>(null);
  const [nftreeTarget, setNftreeTarget] = useState<{ id: string; name: string; species: string; photoUrl?: string | null } | null>(null);

  const { offerings } = useOfferings({ treeId: null });

  const uniqueSpecies = Array.from(new Set(trees.map(t => t.species)));
  const uniqueLineages = Array.from(new Set(trees.filter(t => t.lineage).map(t => t.lineage!))).sort();
  const uniqueProjects = Array.from(new Set(trees.filter(t => t.project_name).map(t => t.project_name!))).sort();
  const uniqueNations = Array.from(new Set(trees.filter(t => t.nation).map(t => t.nation!))).sort();

  const clearAllFilters = () => {
    setSearchQuery(""); setNameFilter(""); setW3wFilter("");
    setSpeciesFilter("all"); setLineageFilter("all"); setProjectFilter("all");
    setStaffFilter("all"); setGroveScaleFilter("all"); setNationFilter("all");
  };

  const filteredTrees = useMemo(() => trees.filter(tree => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      tree.name.toLowerCase().includes(q) ||
      tree.species.toLowerCase().includes(q) ||
      tree.what3words.toLowerCase().includes(q) ||
      (tree.lineage?.toLowerCase().includes(q) ?? false);
    const matchesName = !nameFilter.trim() || tree.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesW3w = !w3wFilter.trim() || tree.what3words.toLowerCase().includes(w3wFilter.toLowerCase().replace(/^\/+/, ""));
    const matchesSpecies = speciesFilter === "all" || tree.species === speciesFilter;
    const matchesLineage = lineageFilter === "all" || tree.lineage === lineageFilter;
    const matchesProject = projectFilter === "all" || tree.project_name === projectFilter;
    const matchesGroveScale = groveScaleFilter === "all" || tree.grove_scale === groveScaleFilter;
    const matchesNation = nationFilter === "all" || tree.nation === nationFilter;
    let matchesView = true;
    if (galleryView === "individual") matchesView = tree.created_by === currentUserId;
    else if (galleryView === "tribe") matchesView = tribeUserIds.includes(tree.created_by || "");
    const matchesStaff = staffFilter === "all" || (treesWithStaff[tree.id]?.includes(staffFilter) ?? false);
    return matchesSearch && matchesName && matchesW3w && matchesSpecies && matchesLineage && matchesProject && matchesGroveScale && matchesNation && matchesView && matchesStaff;
  }), [trees, searchQuery, nameFilter, w3wFilter, speciesFilter, lineageFilter, projectFilter, groveScaleFilter, nationFilter, galleryView, currentUserId, tribeUserIds, staffFilter, treesWithStaff]);

  const clusteredTrees = useMemo(() => deduplicateForGallery(filteredTrees), [filteredTrees]);

  const addToWishlist = useCallback(async (treeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in"); return; }
    const { error } = await supabase.from("tree_wishlist").insert({ user_id: user.id, tree_id: treeId });
    if (error) {
      if (error.code === '23505') toast.info("Already in your wishlist");
      else toast.error("Failed to add");
      return;
    }
    setWishlistPulseId(treeId);
    setTimeout(() => setWishlistPulseId(null), 600);
    toast.success("Tree added to your Wishing Tree!");
  }, []);

  const handleShare = useCallback(async (title: string, text: string, url?: string) => {
    const shareUrl = url || window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, text, url: shareUrl });
      else { await navigator.clipboard.writeText(`${text} ${shareUrl}`); toast.success("Link copied!"); }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') { await navigator.clipboard.writeText(`${text} ${shareUrl}`); toast.success("Link copied!"); }
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Ancient Friends Window */}
      <button
        onClick={() => setShowExplorer(true)}
        className="relative max-w-[75%] mx-auto rounded-xl overflow-hidden border border-amber-700/40 block hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-300 focus:outline-none group cursor-pointer"
      >
        <img src={ancientFriendsWindow} alt="Ancient Friends — tap to explore" className="w-full h-auto object-contain" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-serif tracking-widest opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(42 80% 60%)' }}>
          🌿 Tap to Explore
        </span>
      </button>

      {showExplorer && (
        <AncientFriendsExplorer trees={filteredTrees} onClose={() => setShowExplorer(false)} onWishlist={addToWishlist} />
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'hsla(30, 20%, 15%, 0.6)', border: '1px solid hsla(42, 40%, 30%, 0.3)' }}>
        {([
          { key: "collective" as const, label: "Collectively", icon: Globe, desc: "All mapped trees" },
          { key: "individual" as const, label: "Individually", icon: User, desc: "Your mapped trees" },
          { key: "tribe" as const, label: "Your Tribe", icon: Users, desc: "Your connections' trees" },
        ]).map(v => (
          <button
            key={v.key}
            onClick={() => setGalleryView(v.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-serif transition-all flex-1 justify-center"
            style={{
              background: galleryView === v.key ? 'hsla(42, 70%, 50%, 0.15)' : 'transparent',
              color: galleryView === v.key ? 'hsl(42, 80%, 60%)' : 'hsla(42, 20%, 60%, 0.7)',
              border: galleryView === v.key ? '1px solid hsla(42, 60%, 50%, 0.3)' : '1px solid transparent',
            }}
            title={v.desc}
          >
            <v.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <GalleryFilterDrawer
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          nameFilter={nameFilter} onNameChange={setNameFilter}
          w3wFilter={w3wFilter} onW3wChange={setW3wFilter}
          speciesFilter={speciesFilter} onSpeciesChange={setSpeciesFilter}
          lineageFilter={lineageFilter} onLineageChange={setLineageFilter}
          projectFilter={projectFilter} onProjectChange={setProjectFilter}
          staffFilter={staffFilter} onStaffChange={setStaffFilter}
          groveScaleFilter={groveScaleFilter} onGroveScaleChange={setGroveScaleFilter}
          nationFilter={nationFilter} onNationChange={setNationFilter}
          uniqueSpecies={uniqueSpecies} uniqueLineages={uniqueLineages}
          uniqueProjects={uniqueProjects} uniqueNations={uniqueNations}
          staffCodes={staffCodes} onClearAll={clearAllFilters}
        />
      </div>

      {/* Tree cards grid */}
      {loading ? (
        <p className="text-center py-12">Loading trees...</p>
      ) : clusteredTrees.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No trees found. Import some trees to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clusteredTrees.map((cluster) => {
            const tree = cluster.anchor;
            const treeOfferingCount = offerings.filter((o) => o.tree_id === tree.id).length;
            const photoOffering = offerings.find((o) => o.tree_id === tree.id && o.type === "photo" && o.media_url);
            return (
              <TreeCard
                key={tree.id}
                tree={tree}
                variant="gallery"
                cluster={cluster}
                offeringCount={treeOfferingCount}
                heroPhotoUrl={photoOffering?.media_url}
                wishlistPulseActive={wishlistPulseId === tree.id}
                onSelect={(t) => onSelectTree(t as any)}
                onWishlist={addToWishlist}
                onShare={handleShare}
                onNFTree={(data) => setNftreeTarget(data)}
              />
            );
          })}
        </div>
      )}

      {nftreeTarget && (
        <NFTreeStudio
          open={!!nftreeTarget}
          onOpenChange={(open) => { if (!open) setNftreeTarget(null); }}
          treeId={nftreeTarget.id}
          treeName={nftreeTarget.name}
          treeSpecies={nftreeTarget.species}
          photoUrl={nftreeTarget.photoUrl}
        />
      )}
    </div>
  );
};

export default AncientFriendsRoom;
