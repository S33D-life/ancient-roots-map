import { useState, useEffect, useCallback, useRef } from "react";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import AmanitaFlush from "@/components/AmanitaFlush";
import AncientFriendsExplorer from "@/components/AncientFriendsExplorer";
import HeartwoodEntrance from "@/components/HeartwoodEntrance";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import LibraryRoomTabs from "@/components/LibraryRoomTabs";
import { toast } from "sonner";
import { MapPin, Plus, Image as ImageIcon, FileText, Music, Link as LinkIcon, Upload, Download, Loader2, Heart, Trash2, Wand2, Radio, ChevronDown, Save, Share2, ExternalLink, Eye, Maximize2, Minimize2, Users, User, Globe, Map, Archive } from "lucide-react";
import {
  getSpiralStaffs,
  getGridStaffs,
  getSpeciesStaffCounts,
  getCircleDescription,
  getCircleStartIndex,
  getDisplayCode,
  isContractConfigured,
  getBaseScanUrl,
  getOpenSeaUrl,
} from "@/utils/staffRoomData";
import { SPECIES_CODES, SPECIES_MAP, type SpeciesCode } from "@/config/staffContract";
import { parseCSV, generateCSV, downloadCSV } from "@/utils/csvHandler";
import { convertToCoordinates } from "@/utils/what3words";
import PhotoImport from "@/components/PhotoImport";
import CreatorsPath from "@/components/CreatorsPath";
import MintingStatusDashboard from "@/components/MintingStatusDashboard";
import IpfsMetadataViewer from "@/components/IpfsMetadataViewer";
import StaffRoomGallery from "@/components/StaffRoomGallery";
import EarthRadioRoom from "@/components/EarthRadioRoom";
import Greenhouse from "@/components/Greenhouse";
import TreeResources from "@/components/TreeResources";
import WishingTreeUnified from "@/components/WishingTreeUnified";
import TreeReservoirLeaderboard from "@/components/TreeReservoirLeaderboard";
import HeartEconomySummary from "@/components/HeartEconomySummary";
import councilImage from "@/assets/council-of-life.jpeg";
import councilLedgerWindow from "@/assets/council-ledger-window.jpeg";
import greenhouseWindow from "@/assets/greenhouse-window.jpeg";
import { Progress } from "@/components/ui/progress";
import heartwoodLibrary from "@/assets/heartwood-library.jpeg";
import treeRadioArt from "@/assets/tree-radio-art.jpeg";
import ancientFriendsWindow from "@/assets/ancient-friends-window.jpeg";
import heartwoodSplashDay from "@/assets/heartwood-splash.png";
import heartwoodSplashNight from "@/assets/heartwood-splash-night.png";
import heartwoodLanding from "@/assets/hearth-cave.png";
import wishingTreeImage from "@/assets/wishing-tree.png";
import staffRoomWindow from "@/assets/staff-room-window.jpeg";
import Footer from "@/components/Footer";
import DashboardVault from "@/components/dashboard/DashboardVault";
import { useWallet } from "@/hooks/use-wallet";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import TetolBridge from "@/components/TetolBridge";

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
}

interface Offering {
  id: string;
  tree_id: string;
  title: string;
  type: string;
  content: string | null;
  media_url: string | null;
  nft_link: string | null;
  created_at: string;
}

interface WishlistItem {
  id: string;
  user_id: string;
  tree_id: string;
  notes: string | null;
  created_at: string;
  trees: Tree;
}

const VALID_ROOMS = ["staff-room", "gallery", "music-room", "greenhouse", "wishlist", "seed-cellar", "creators-path", "tree-resources", "ledger", "vault"];

/** Collective Vault card for DAOs */
const CollectiveVaultCard = ({ name, description, members, hearts, slug }: { name: string; description: string; members: number; hearts: number; slug: string }) => (
  <div className="rounded-xl border border-border/30 p-4 space-y-2" style={{ background: 'linear-gradient(135deg, hsl(28 20% 14% / 0.8), hsl(22 18% 11% / 0.9))' }}>
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-primary/70" />
      <h3 className="font-serif text-sm text-foreground/85 tracking-wide">{name}</h3>
    </div>
    <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">{description}</p>
    <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/70 pt-1">
      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{members} members</span>
      <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-primary/60" />{hearts.toLocaleString()} hearts</span>
    </div>
  </div>
);

/** Vault Seal — cycling logo that reveals the vault */
const VAULT_SEAL_IMAGES = [
  "/images/vault-logos/1-tree-fire.png",
  "/images/vault-logos/2-tree-face.png",
  "/images/vault-logos/3-green-orb.png",
  "/images/vault-logos/4-hobbit-door.png",
  "/images/vault-logos/5-heart-door.png",
  "/images/vault-logos/6-golden-door.png",
  "/images/vault-logos/7-vault-room.png",
];

const VaultSeal = ({ onReveal, isRevealed, onHide }: { onReveal: () => void; isRevealed: boolean; onHide: () => void }) => {
  const [imageIndex, setImageIndex] = useState(isRevealed ? VAULT_SEAL_IMAGES.length - 1 : 0);

  const handleClick = () => {
    if (isRevealed) {
      setImageIndex(0);
      onHide();
      return;
    }
    const next = imageIndex + 1;
    if (next >= VAULT_SEAL_IMAGES.length) {
      // Final image reached — reveal vault
      setImageIndex(VAULT_SEAL_IMAGES.length - 1);
      onReveal();
    } else {
      setImageIndex(next);
    }
  };

  const glowing = imageIndex >= VAULT_SEAL_IMAGES.length - 2 || isRevealed;

  return (
    <button
      onClick={handleClick}
      className="shrink-0 rounded-full overflow-hidden transition-all duration-500 hover:scale-110 focus:scale-110 focus:outline-none"
      title={isRevealed ? "Close the Vault" : `Tap to explore… (${imageIndex + 1}/${VAULT_SEAL_IMAGES.length})`}
      style={{
        width: 48,
        height: 48,
        border: glowing ? '2px solid hsl(42 70% 55%)' : '2px solid hsl(35 25% 28%)',
        boxShadow: glowing
          ? '0 0 16px hsl(42 70% 40% / 0.5), inset 0 0 8px hsl(42 80% 50% / 0.2)'
          : '0 2px 8px hsl(0 0% 0% / 0.3)',
        animation: glowing ? 'vaultGlow 2s ease-in-out infinite' : undefined,
      }}
    >
      <style>{`
        @keyframes vaultGlow {
          0%, 100% { box-shadow: 0 0 16px hsl(42 70% 40% / 0.5), inset 0 0 8px hsl(42 80% 50% / 0.2); }
          50% { box-shadow: 0 0 28px hsl(42 70% 55% / 0.7), inset 0 0 14px hsl(42 80% 60% / 0.35); }
        }
        button:hover > img.vault-seal-img,
        button:focus > img.vault-seal-img {
          filter: brightness(1.2) drop-shadow(0 0 6px hsl(42 70% 50% / 0.6));
        }
      `}</style>
      <img
        src={VAULT_SEAL_IMAGES[imageIndex]}
        alt="Vault seal"
        className="vault-seal-img w-full h-full object-cover transition-all duration-300"
      />
    </button>
  );
};

const GalleryPage = () => {
  const [searchParams] = useSearchParams();
  const { room: roomPathParam } = useParams<{ room?: string }>();
  const navigate = useNavigate();
  const roomParam = (roomPathParam && VALID_ROOMS.includes(roomPathParam)) ? roomPathParam : searchParams.get("room");
  const { showEntrance: showSplash, dismissEntrance: dismissSplash } = useEntranceOnce("gallery", !roomParam);
  const [showLanding, setShowLanding] = useState(!roomParam);
  const [activeTab, setActiveTab] = useState<string>(roomParam || "staff-room");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [vaultRevealed, setVaultRevealed] = useState(!!roomParam && roomParam === "vault");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/library/${tab}`, { replace: true });
  };

  const swipeHandlers = useSwipeNavigation({
    items: VALID_ROOMS,
    activeItem: activeTab,
    onNavigate: handleTabChange,
  });

  const [trees, setTrees] = useState<Tree[]>([]);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfferingDialogOpen, setIsOfferingDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [galleryView, setGalleryView] = useState<"collective" | "individual" | "tribe">("collective");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const wallet = useWallet(currentUserId || undefined);
  const [tribeUserIds, setTribeUserIds] = useState<string[]>([]);
  const [staffCodes, setStaffCodes] = useState<string[]>([]);
  const [treesWithStaff, setTreesWithStaff] = useState<Record<string, string[]>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, startTime: 0 });
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [activeString, setActiveString] = useState<"oak" | "yew" | "beech" | "ash" | "holly">("oak");
  const [spiralSort, setSpiralSort] = useState<string>("spiral");
  const [hoveredSpiralStaff, setHoveredSpiralStaff] = useState<string | null>(null);
  const [selectedSpiralStaff, setSelectedSpiralStaff] = useState<{ code: string; species: string; length: string; weight: string; image: string; tokenId: number } | null>(null);
  const [showCouncilEmbed, setShowCouncilEmbed] = useState(false);
  const [showAllStaffs, setShowAllStaffs] = useState(false);
  const [showMintingProgress, setShowMintingProgress] = useState(false);
   const [showSpiral, setShowSpiral] = useState(false);
  const [selectedGridStaff, setSelectedGridStaff] = useState<{ tokenId: number; code: string; speciesName: string; img: string } | null>(null);
  const [showTreeLedger, setShowTreeLedger] = useState(false);
  const [showBirdTribe, setShowBirdTribe] = useState(false);
  const [savedSongs, setSavedSongs] = useState<{ id: string; title: string; artist: string; link: string | null; notes: string | null; created_at: string }[]>([]);
  const [showSaveSongForm, setShowSaveSongForm] = useState(false);
  const [newSong, setNewSong] = useState({ title: "", artist: "", link: "" });
  const birdTribeSongs = [
    { title: "In Between", artist: "Marya Stark" },
    { title: "There Is a Bird", artist: "Alexa Sunshine Rose" },
    { title: "Come Healing", artist: "Leonard Cohen" },
    { title: "Kalyana (feat. Emily Elbert)", artist: "Bird Tribe" },
    { title: "All My Love", artist: "Bird Tribe" },
    { title: "Sound of the River", artist: "Tina Malia" },
    { title: "Welcome Back To Your Life", artist: "Natan Rabin" },
    { title: "Out of My Head", artist: "Zach Cohen" },
    { title: "Want to Release", artist: "Gregory Bogard" },
    { title: "People of Love", artist: "Snatam Kaur" },
    { title: "Wild Horses", artist: "Tina Malia" },
    { title: "Ancestral Lines", artist: "Misk'i Takiy" },
    { title: "Moving with the Spirit (Live)", artist: "Prem Leela & Mooji Mala" },
    { title: "Love Is the Medicine", artist: "Sierra Marin" },
    { title: "Light Of Your Grace (Live)", artist: "Mollie Mendoza & Sam Garrett" },
    { title: "The Blooming", artist: "Marya Stark & Equanimous" },
    { title: "Phoenix", artist: "Fia" },
    { title: "Root to Rise", artist: "Kevin Paris & Casey Kalmenson" },
    { title: "Birds of One Feather", artist: "Murray Kyle" },
    { title: "Light of This World", artist: "Mooji Mala & Shivali" },
    { title: "Faithful", artist: "Majbritte Ulrikkeholm & Søren Frieboe" },
    { title: "Oh My Beloved", artist: "Prema Love" },
    { title: "The Seed", artist: "Darpan" },
    { title: "Songbird", artist: "Fleetwood Mac" },
    { title: "Dissipate", artist: "Sam Garrett" },
    { title: "Cut the Cord", artist: "Jen Myzel" },
    { title: "Dance at the Edge of Time (432hz)", artist: "Simone Vitale" },
    { title: "One in the One", artist: "Gina Sala" },
    { title: "Knockin' on Heaven's Door (feat. Ladysmith Black Mambazo)", artist: "Ladysmith Black Mambazo" },
    { title: "Broken Wings", artist: "Mr. Mister" },
    { title: "Heal This Land", artist: "Tina Malia" },
    { title: "Oso Blanco", artist: "Bird Tribe & Diana Carr" },
    { title: "The Mountain", artist: "Trevor Hall" },
    { title: "The Return", artist: "Trevor Hall" },
    { title: "Eagle", artist: "Ilan Navah" },
    { title: "The Sun is Coming", artist: "Felipe Baldomir" },
    { title: "The Phoenix Flies", artist: "Murray Kyle" },
    { title: "Ancestors of the North", artist: "Murray Kyle" },
    { title: "Stand By Me", artist: "Ben E. King" },
    { title: "With You", artist: "Jai-Jagdeesh" },
    { title: "Allowing", artist: "Alexia Chellun" },
    { title: "Remember", artist: "Omkara" },
    { title: "Sing to the Mountain", artist: "Elephant Revival" },
    { title: "The Sacred", artist: "Yaima" },
    { title: "Have a Cigar (Live at Red Rocks)", artist: "Elephant Revival" },
    { title: "Happy to Be Here", artist: "Wookiefoot" },
    { title: "Champions", artist: "Arouna & Biko" },
    { title: "Remember Jah", artist: "Satsang" },
    { title: "Waves in Jasri", artist: "Dustin Thomas" },
    { title: "Forgiveness", artist: "Elephant Revival" },
    { title: "Heart Takes Flight", artist: "Ram Dass & AWARÉ" },
    { title: "Kikilla Lullaby", artist: "Kailash Kokopelli" },
    { title: "Feathers", artist: "Kailash Kokopelli" },
    { title: "Just Love", artist: "Ram Dass & Earthcry" },
    { title: "Silent Voices", artist: "Ayla Schafer" },
    { title: "Holy Liberation (feat. Adrian Freed)", artist: "Zed Be El Esse" },
    { title: "Hey Mama", artist: "Jonah Kest & Satsang" },
    { title: "Tending the Spark", artist: "Heather Houston" },
    { title: "May the Longtime Sun", artist: "Sara Thomsen" },
    { title: "I Wish That I Could Show You", artist: "Barbara McAfee" },
    { title: "Breathing Trees", artist: "Barbara McAfee" },
    { title: "My Sister", artist: "Andy Fischer-Price" },
    { title: "Fire Carrier", artist: "Murray Kyle" },
    { title: "Together", artist: "Natan Rabin & Felicia Falck" },
    { title: "Go In Beauty", artist: "Mirabai Ceiba" },
    { title: "Breathe Easily", artist: "Benji Fox" },
    { title: "Ancient Eyes", artist: "Mae Bird" },
    { title: "(Lakshmi) I Choose to Live", artist: "Véra Capou" },
    { title: "Exactly as It Is", artist: "Miten" },
    { title: "What the Lovers Do", artist: "Gone Gone Beyond & The Human Experience" },
    { title: "Sacredness (The Blood Song)", artist: "Shylah Ray Sunshine" },
    { title: "Open My Heart (feat. Sasha Rose)", artist: "Alexa Sunshine Rose" },
    { title: "The River", artist: "Sam Garrett" },
    { title: "Water Song", artist: "Amber Lily" },
    { title: "Shedding Skins", artist: "Fia" },
    { title: "Song of Life (feat. Joanna Macy)", artist: "Amber Lily" },
    { title: "Song of the Wild", artist: "Samara Jade" },
    { title: "Grandmother Tree & the Feathered Serpent", artist: "Deya Dova" },
    { title: "Break Free (feat. Tina Malia)", artist: "David Kai" },
    { title: "Drumming the World Awake", artist: "Diane Patterson" },
    { title: "All Along the Watchtower", artist: "Jimi Hendrix" },
  ];
  const [offeringForm, setOfferingForm] = useState({
    title: "",
    type: "photo",
    content: "",
    media_url: "",
    nft_link: "",
  });

  // Splash is now handled by HeartwoodEntrance component

  useEffect(() => {
    fetchTrees();
    fetchWishlist();
    fetchSavedSongs();
    fetchCurrentUser();
    fetchStaffCodes();
  }, []);

  useEffect(() => {
    if (selectedTree) {
      fetchOfferings(selectedTree.id);
    }
  }, [selectedTree]);

  const fetchTrees = async () => {
    try {
      const { data, error } = await supabase
        .from("trees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrees(data || []);
    } catch (error) {
      console.error("Error fetching trees:", error);
      toast.error("Failed to load trees");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // Fetch tribe (follows + companions)
        const [followsRes, companionsRes] = await Promise.all([
          supabase.from("follows").select("following_id").eq("follower_id", user.id),
          supabase.from("grove_companions").select("requester_id, recipient_id").or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).eq("status", "accepted"),
        ]);
        const tribeIds = new Set<string>();
        followsRes.data?.forEach(f => tribeIds.add(f.following_id));
        companionsRes.data?.forEach(c => {
          tribeIds.add(c.requester_id === user.id ? c.recipient_id : c.requester_id);
        });
        setTribeUserIds(Array.from(tribeIds));
      }
    } catch (err) {
      console.error("Error fetching user/tribe:", err);
    }
  };

  const fetchStaffCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("offerings")
        .select("sealed_by_staff, tree_id")
        .not("sealed_by_staff", "is", null);
      if (error) throw error;
      const codes = new Set<string>();
      const treeStaffMap: Record<string, string[]> = {};
      (data || []).forEach(o => {
        if (o.sealed_by_staff) {
          codes.add(o.sealed_by_staff);
          if (!treeStaffMap[o.tree_id]) treeStaffMap[o.tree_id] = [];
          if (!treeStaffMap[o.tree_id].includes(o.sealed_by_staff)) {
            treeStaffMap[o.tree_id].push(o.sealed_by_staff);
          }
        }
      });
      setStaffCodes(Array.from(codes).sort());
      setTreesWithStaff(treeStaffMap);
    } catch (err) {
      console.error("Error fetching staff codes:", err);
    }
  };

  const fetchOfferings = async (treeId: string) => {
    try {
      const { data, error } = await supabase
        .from("offerings")
        .select("*")
        .eq("tree_id", treeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOfferings(data || []);
    } catch (error) {
      console.error("Error fetching offerings:", error);
      toast.error("Failed to load offerings");
    }
  };

  const fetchWishlist = async () => {
    setWishlistLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setWishlist([]);
        return;
      }

      const { data, error } = await supabase
        .from("tree_wishlist")
        .select("*, trees(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWishlist(data || []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to load wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const [wishlistPulseId, setWishlistPulseId] = useState<string | null>(null);

  const fetchSavedSongs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSavedSongs([]); return; }
      const { data, error } = await supabase
        .from("saved_songs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSavedSongs(data || []);
    } catch (error) {
      console.error("Error fetching saved songs:", error);
    }
  };

  const addSavedSong = async () => {
    if (!newSong.title.trim() || !newSong.artist.trim()) {
      toast.error("Title and artist are required");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in to save songs"); return; }
      const { error } = await supabase.from("saved_songs").insert({
        user_id: user.id,
        title: newSong.title.trim(),
        artist: newSong.artist.trim(),
        link: newSong.link.trim() || null,
      });
      if (error) throw error;
      toast.success("Song saved to your Earth Radio!");
      setNewSong({ title: "", artist: "", link: "" });
      setShowSaveSongForm(false);
      fetchSavedSongs();
    } catch (error) {
      console.error("Error saving song:", error);
      toast.error("Failed to save song");
    }
  };

  const deleteSavedSong = async (id: string) => {
    try {
      const { error } = await supabase.from("saved_songs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Song removed");
      fetchSavedSongs();
    } catch (error) {
      console.error("Error deleting saved song:", error);
      toast.error("Failed to remove song");
    }
  };

  const handleShare = async (title: string, text: string, url?: string) => {
    const shareUrl = url || window.location.href;
    const shareData = { title, text, url: shareUrl };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${text} ${shareUrl}`);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(`${text} ${shareUrl}`);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  const addToWishlist = async (treeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to add trees to your wishlist");
        return;
      }

      const { error } = await supabase
        .from("tree_wishlist")
        .insert({ user_id: user.id, tree_id: treeId });

      if (error) {
        if (error.code === '23505') {
          toast.info("This tree is already in your wishlist");
        } else {
          throw error;
        }
        return;
      }

      setWishlistPulseId(treeId);
      setTimeout(() => setWishlistPulseId(null), 600);
      toast.success("Tree added to your Wishing Tree!");
      fetchWishlist();
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add tree to wishlist");
    }
  };

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from("tree_wishlist")
        .delete()
        .eq("id", wishlistId);

      if (error) throw error;

      toast.success("Tree removed from your wishlist");
      fetchWishlist();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove tree from wishlist");
    }
  };

  const updateWishlistNotes = async (wishlistId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("tree_wishlist")
        .update({ notes })
        .eq("id", wishlistId);

      if (error) throw error;

      toast.success("Notes updated");
      fetchWishlist();
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    }
  };

  const handleAddOffering = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please log in to add offerings");
      return;
    }

    if (!selectedTree) return;

    try {
      const offeringData: any = {
        tree_id: selectedTree.id,
        title: offeringForm.title,
        type: offeringForm.type,
        created_by: user.id,
      };

      if (offeringForm.content) offeringData.content = offeringForm.content;
      if (offeringForm.media_url) offeringData.media_url = offeringForm.media_url;
      if (offeringForm.nft_link) offeringData.nft_link = offeringForm.nft_link;

      const { error } = await supabase.from("offerings").insert(offeringData);

      if (error) throw error;

      toast.success("Offering added successfully!");
      setIsOfferingDialogOpen(false);
      setOfferingForm({
        title: "",
        type: "photo",
        content: "",
        media_url: "",
        nft_link: "",
      });
      fetchOfferings(selectedTree.id);
    } catch (error) {
      console.error("Error adding offering:", error);
      toast.error("Failed to add offering");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const startTime = Date.now();

    try {
      const text = await file.text();
      const csvRows = parseCSV(text);

      if (csvRows.length === 0) {
        toast.error("No valid tree data found in the CSV file");
        setIsImporting(false);
        return;
      }

      const totalTrees = csvRows.length;
      setImportProgress({ current: 0, total: totalTrees, startTime });
      
      toast.success(`Processing ${totalTrees} trees...`);

      // Convert coordinates with progress tracking and graceful quota handling
      const treeData: any[] = [];
      let consecutiveFailures = 0;

      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];
        try {
          const coords = await convertToCoordinates(row.what3words);

          if (coords) {
            treeData.push({
              ...row,
              latitude: coords.coordinates.lat,
              longitude: coords.coordinates.lng,
            });
            consecutiveFailures = 0;
          } else {
            consecutiveFailures += 1;
          }

          // Update progress
          setImportProgress({ 
            current: i + 1, 
            total: totalTrees, 
            startTime 
          });

          // If consecutive failures suggest a service-wide issue (e.g., quota), abort early to avoid spamming
          if (consecutiveFailures >= 1 && i < Math.min(5, totalTrees)) {
            toast.error("what3words limit reached or unavailable. Try again later or upgrade your plan.");
            break;
          }
        } catch (error) {
          console.error(`Failed to convert ${row.what3words}:`, error);
          consecutiveFailures += 1;
          if (consecutiveFailures >= 1 && i < Math.min(5, totalTrees)) {
            toast.error("what3words limit reached or unavailable. Try again later or upgrade your plan.");
            break;
          }
        }
      }

      if (treeData.length === 0) {
        toast.error("Could not convert any what3words addresses to coordinates");
        setIsImporting(false);
        setImportProgress({ current: 0, total: 0, startTime: 0 });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const treesToInsert = treeData.map(tree => ({
        ...tree,
        created_by: user?.id,
      }));

      const { error } = await supabase
        .from('trees')
        .insert(treesToInsert);

      if (error) throw error;

      toast.success(`Successfully imported ${treeData.length} trees!`);
      fetchTrees();

      // Reset the input
      event.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast.error("An error occurred while importing the CSV");
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0, startTime: 0 });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const { data: trees, error } = await supabase
        .from('trees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!trees || trees.length === 0) {
        toast.error("There are no trees in the database to export");
        setIsExporting(false);
        return;
      }

      const csv = generateCSV(trees);
      const filename = `ancient-friends-ledger-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, filename);

      toast.success(`Exported ${trees.length} trees to ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("An error occurred while exporting the CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const uniqueSpecies = Array.from(new Set(trees.map(t => t.species)));

  const filteredTrees = trees.filter(tree => {
    const matchesSearch = 
      tree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.what3words.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecies = speciesFilter === "all" || tree.species === speciesFilter;

    // View filter
    let matchesView = true;
    if (galleryView === "individual") {
      matchesView = tree.created_by === currentUserId;
    } else if (galleryView === "tribe") {
      matchesView = tribeUserIds.includes(tree.created_by || "");
    }

    // Staff filter
    const matchesStaff = staffFilter === "all" || (treesWithStaff[tree.id]?.includes(staffFilter) ?? false);
    
    return matchesSearch && matchesSpecies && matchesView && matchesStaff;
  });

  const getOfferingIcon = (type: string) => {
    switch (type) {
      case "photo": return <ImageIcon className="w-4 h-4" />;
      case "poem": return <FileText className="w-4 h-4" />;
      case "song": return <Music className="w-4 h-4" />;
      case "story": return <FileText className="w-4 h-4" />;
      case "nft": return <LinkIcon className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (showSplash) {
    return (
      <HeartwoodEntrance onComplete={() => dismissSplash()} />
    );
  }

  if (showLanding) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <Header />
        {/* Background */}
        <div className="absolute inset-0">
          <img src={heartwoodLanding} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 80%' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 md:from-black/80 md:via-black/30 md:to-black/50" />
        </div>

        {/* Mushrooms & Moss — dissolve after 3.3s */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[3] pointer-events-none hidden md:block"
          style={{
            animation: 'mushroomDissolve 1.2s ease-out 3.3s forwards',
          }}
        >
          <AmanitaFlush position="bottom" />
        </div>
        <style>{`
          @keyframes mushroomDissolve {
            0% { opacity: 1; filter: blur(0px); }
            60% { opacity: 0.4; filter: blur(2px); }
            100% { opacity: 0; filter: blur(6px); }
          }
        `}</style>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-24 pb-12 px-4">
          <h1 className="text-5xl md:text-7xl font-serif text-amber-400/90 tracking-wider mb-4 text-center" style={{ textShadow: '0 0 40px hsl(35 80% 30% / 0.6)' }}>
            HEARTWOOD
          </h1>
          <p className="text-amber-200/60 font-serif text-lg md:text-xl mb-12 text-center max-w-md">
            A Library of Love
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-2xl w-full">
            {[
              { key: "staff-room", label: "Staff Room", desc: "144 Sacred Staffs" },
              { key: "gallery", label: "Ancient Friends", desc: "The Living Atlas" },
              { key: "music-room", label: "Music Room", desc: "Tree Radio" },
              { key: "greenhouse", label: "Greenhouse", desc: "Houseplants & Saplings" },
              { key: "wishlist", label: "Wishing Tree", desc: "Trees you dream to visit" },
              { key: "seed-cellar", label: "Seed Cellar", desc: "Living Data Archive" },
              { key: "creators-path", label: "Creator's Path", desc: "Your Journey" },
              { key: "tree-resources", label: "Tree Resources", desc: "Project Directory" },
              { key: "ledger", label: "Ledger", desc: "Data & Strings" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); setShowLanding(false); }}
                className="group relative rounded-xl border border-amber-700/40 p-5 md:p-6 text-left transition-all duration-300 hover:border-amber-500/60 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, hsl(28 30% 10% / 0.85), hsl(25 25% 8% / 0.9))' }}
              >
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at center, hsl(35 70% 40% / 0.15), transparent 70%)' }} />
                <h3 className="font-serif text-amber-300/90 text-sm md:text-base mb-1 relative z-10">{item.label}</h3>
                <p className="text-amber-200/40 text-xs relative z-10">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, hsl(220 40% 12%) 0%, hsl(160 50% 18%) 25%, hsl(120 40% 22%) 45%, hsl(80 45% 20%) 60%, hsl(50 60% 25%) 80%, hsl(220 35% 15%) 100%)' }}>
      <Header />
      <TetolBreadcrumb />
      <main className="container mx-auto px-4 pt-28 pb-12">
        <div className="mb-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLanding(true)} className="text-amber-400/70 hover:text-amber-300 transition-colors font-serif text-sm border border-amber-700/30 rounded-lg px-3 py-1.5 hover:border-amber-600/50" style={{ background: 'hsl(28 30% 12% / 0.8)' }}>
              ← Heartwood
            </button>
            <div>
              <div>
                <h1 className="text-4xl font-serif font-bold text-mystical mb-0">
                  Heartwood
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-serif font-bold text-mystical">Library</span>
                  <VaultSeal
                    isRevealed={vaultRevealed}
                    onReveal={() => { setVaultRevealed(true); handleTabChange("vault"); }}
                    onHide={() => setVaultRevealed(false)}
                  />
                </div>
              </div>
              <p className="text-muted-foreground hidden md:block">
                Explore all mapped trees and manage the tree ledger
              </p>
            </div>
          </div>
          <div className="hidden md:block shrink-0">
            <img src={heartwoodLibrary} alt="Heartwood Library" className="h-24 w-36 object-cover rounded-lg border border-mystical shadow-lg" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <LibraryRoomTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                vaultRevealed={vaultRevealed}
              />
            </div>
            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="shrink-0 p-2 rounded-lg border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen mode"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>

          <div
            {...swipeHandlers}
            className={isFullscreen
              ? "fixed inset-0 z-50 bg-background overflow-y-auto touch-pan-y p-4 pt-16"
              : "touch-pan-y"
            }
          >
            {/* Fullscreen close button */}
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="fixed top-4 right-4 z-[60] p-2 rounded-lg border border-border bg-card/90 text-muted-foreground hover:text-foreground hover:bg-card transition-colors backdrop-blur-sm"
                title="Exit fullscreen"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            )}
          {/* Music Room — Earth Radio powered by offerings */}
          <TabsContent value="music-room" className="space-y-6">
            <EarthRadioRoom />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-8">

            {/* Ancient Friends Window — tap to explore */}
            <button
              onClick={() => setShowExplorer(true)}
              className="relative max-w-[75%] mx-auto rounded-xl overflow-hidden border border-amber-700/40 block hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-300 focus:outline-none group cursor-pointer"
            >
              <img 
                src={ancientFriendsWindow} 
                alt="Ancient Friends — tap to explore" 
                className="w-full h-auto object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-serif tracking-widest opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(42 80% 60%)' }}>
                🌿 Tap to Explore
              </span>
            </button>

            {/* Explorer overlay */}
            {showExplorer && (
              <AncientFriendsExplorer
                trees={filteredTrees}
                onClose={() => setShowExplorer(false)}
                onWishlist={addToWishlist}
              />
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

            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search by name, species, or what3words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  {uniqueSpecies.map((species) => (
                    <SelectItem key={species} value={species}>
                      {species}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {staffCodes.length > 0 && (
                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staffs</SelectItem>
                    {staffCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {loading ? (
              <p className="text-center py-12">Loading trees...</p>
            ) : filteredTrees.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                No trees found. Import some trees to get started!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTrees.map((tree) => (
                  <Card
                    key={tree.id}
                    className="border-mystical hover:shadow-elegant transition-mystical"
                  >
                    <CardHeader className="cursor-pointer" onClick={() => setSelectedTree(tree)}>
                      <CardTitle className="font-serif text-mystical line-clamp-1">
                        {tree.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="outline" className="font-serif">
                          {tree.species}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm cursor-pointer" onClick={() => setSelectedTree(tree)}>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">/{tree.what3words}</span>
                        </div>
                        {tree.estimated_age && (
                          <p className="text-muted-foreground">
                            Est. Age: {tree.estimated_age} years
                          </p>
                        )}
                        {tree.description && (
                          <p className="text-muted-foreground line-clamp-2">
                            {tree.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToWishlist(tree.id);
                          }}
                          className="flex-1"
                        >
                          <Heart
                            className="w-4 h-4 mr-2 transition-all duration-300"
                            style={wishlistPulseId === tree.id ? {
                              transform: 'scale(1.3)',
                              color: 'hsl(39, 80%, 55%)',
                              filter: 'drop-shadow(0 0 8px hsl(39, 80%, 55% / 0.6))',
                            } : {
                              color: 'hsl(39, 50%, 72%)',
                            }}
                          />
                          Wishing Tree
                        </Button>
                        {(tree.latitude || tree.what3words) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (tree.latitude && tree.longitude) {
                                navigate(`/map?lat=${tree.latitude}&lng=${tree.longitude}&zoom=16`);
                              } else if (tree.what3words) {
                                navigate(`/map?w3w=${tree.what3words}`);
                              }
                            }}
                            title="View on Map"
                          >
                            <Map className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(
                              tree.name,
                              `${tree.name} — a ${tree.species} on the Ancient Friends Map`,
                              `${window.location.origin}/tree/${tree.id}`
                            );
                          }}
                          title="Share this tree"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="staff-room" className="space-y-8">
            <StaffRoomGallery />
          </TabsContent>

          <TabsContent value="creators-path">
            <CreatorsPath userId={currentUserId || undefined} activeStaff={wallet.activeStaff} />
          </TabsContent>

          <TabsContent value="tree-resources" className="space-y-6">
            <TreeResources />
          </TabsContent>

          <TabsContent value="seed-cellar" className="space-y-6">
            <Card className="border-mystical bg-card/50 backdrop-blur overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-primary tracking-wide">
                  🌱 The Seed Cellar
                </CardTitle>
                <CardDescription className="font-serif">
                  A living data archive — seeds of knowledge waiting to sprout
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  src="https://airtable.com/embed/appE4ajI4oqPaV8hl/shrTq2DuEhwOJblAB?viewControls=on"
                  className="w-full border-t border-border"
                  style={{ height: '70vh', minHeight: 500, background: 'transparent' }}
                  title="The Seed Cellar"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger" className="space-y-6">
            {/* Ledger Window Banner */}
            <div className="relative max-w-[50%] mx-auto rounded-xl overflow-hidden border border-amber-700/40">
              <img src={councilLedgerWindow} alt="Council of Life Ledger" className="w-full h-auto object-contain" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Tree Ledger - Click to open */}
            <div
              className="relative rounded-xl overflow-hidden cursor-pointer group border border-primary/30 hover:border-primary/60 transition-all duration-500"
              onClick={() => setShowTreeLedger(!showTreeLedger)}
            >
              <div className="p-6 bg-card/50 backdrop-blur border-mystical">
                <div className="flex flex-col items-center justify-center py-4">
                  <h3 className="text-2xl md:text-3xl font-serif text-primary drop-shadow-lg">Tree Ledger</h3>
                  <p className="text-sm text-muted-foreground mt-1">{showTreeLedger ? "Click to close" : "Click to open the Ledger"}</p>
                </div>
              </div>
            </div>

            {/* Heart Reservoir Rankings */}
            <TreeReservoirLeaderboard />

            {/* Council of Life Window */}
            <div
              className="relative rounded-xl overflow-hidden cursor-pointer group border border-primary/30 hover:border-primary/60 transition-all duration-500"
              onClick={() => setShowCouncilEmbed(!showCouncilEmbed)}
            >
              <img
                src={councilImage}
                alt="Council of Life"
                className="w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-end pb-6">
                <h3 className="text-2xl md:text-3xl font-serif text-primary drop-shadow-lg">Council of Life</h3>
                <p className="text-sm text-foreground/70 mt-1">{showCouncilEmbed ? "Click to close" : "Click to open the Council"}</p>
              </div>
            </div>
            {showCouncilEmbed && (
              <div className="animate-fade-in">
                <iframe
                  src="https://clammy-viscount-ddb.notion.site/ebd/1e415b58480d8042a722ef57e01e3228"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  allowFullScreen
                  className="rounded-xl border border-border/40"
                  title="Council of Life"
                />
              </div>
            )}

            {showTreeLedger && (
              <div className="animate-fade-in">
                <Card className="border-mystical bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif text-mystical">
                      Tree Ledger
                    </CardTitle>
                    <CardDescription>
                      Import and export tree data from what3words CSV files
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-serif font-semibold mb-3">Ledger Stats</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 border border-mystical rounded-lg bg-background/50">
                            <p className="text-2xl font-bold text-mystical">{trees.length}</p>
                            <p className="text-sm text-muted-foreground">Total Trees</p>
                          </div>
                          <div className="p-4 border border-mystical rounded-lg bg-background/50">
                            <p className="text-2xl font-bold text-mystical">{uniqueSpecies.length}</p>
                            <p className="text-sm text-muted-foreground">Species</p>
                          </div>
                          <div className="p-4 border border-mystical rounded-lg bg-background/50">
                            <p className="text-2xl font-bold text-mystical">
                              {new Set(trees.map(t => t.nation).filter(Boolean)).size}
                            </p>
                            <p className="text-sm text-muted-foreground">Nations</p>
                          </div>
                          <div className="p-4 border border-mystical rounded-lg bg-background/50">
                            <p className="text-2xl font-bold text-mystical">
                              {new Set(trees.map(t => t.state).filter(Boolean)).size}
                            </p>
                            <p className="text-sm text-muted-foreground">States/Regions</p>
                          </div>
                        </div>
                      </div>

                      {/* Heart Economy Summary */}
                      <div className="border-t border-mystical pt-4">
                        <HeartEconomySummary />
                      </div>

                      <div className="border-t border-mystical pt-4">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-serif font-semibold">Strings</h3>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { key: "oak" as const, label: "Oak" },
                              { key: "yew" as const, label: "Yew" },
                              { key: "beech" as const, label: "Beech" },
                              { key: "ash" as const, label: "Ash" },
                              { key: "holly" as const, label: "Holly" },
                            ].map((s) => (
                              <Button
                                key={s.key}
                                variant={activeString === s.key ? "default" : "outline"}
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setActiveString(s.key); }}
                              >
                                {s.label} String
                              </Button>
                            ))}
                          </div>
                        </div>
                        <iframe
                          src={
                            {
                              oak: "https://clammy-viscount-ddb.notion.site/ebd/2fc15b58480d8023b4ade8b40e4b5156",
                              yew: "https://clammy-viscount-ddb.notion.site/ebd/2fc15b58480d80468a76dd551cff272b",
                              beech: "https://clammy-viscount-ddb.notion.site/ebd/2fc15b58480d80c6a871d19d6dc35bd3",
                              ash: "https://clammy-viscount-ddb.notion.site/ebd/2fc15b58480d8079b3e3d68121c9e133",
                              holly: "https://clammy-viscount-ddb.notion.site/ebd/2fc15b58480d801eb6a8f4e80aa5a574",
                            }[activeString]
                          }
                          width="100%"
                          height="600"
                          frameBorder="0"
                          allowFullScreen
                          className="rounded-lg border border-border"
                        />
                      </div>

                      <div className="border-t border-mystical pt-4">
                        <h3 className="text-lg font-serif font-semibold mb-3">Import Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload CSV files exported from what3words containing tree locations and data
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <PhotoImport />
                          
                          <div className="relative">
                            <input
                              type="file"
                              accept=".csv"
                              onChange={handleImport}
                              className="hidden"
                              id="csv-upload-ledger"
                              disabled={isImporting}
                            />
                            <label htmlFor="csv-upload-ledger">
                              <Button
                                variant="secondary"
                                size="default"
                                disabled={isImporting}
                                className="cursor-pointer"
                                asChild
                              >
                                <span>
                                  {isImporting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4 mr-2" />
                                  )}
                                  Import what3words CSV
                                </span>
                              </Button>
                            </label>
                          </div>
                        </div>
                        
                        {isImporting && importProgress.total > 0 && (
                          <div className="mt-4 p-4 border border-mystical rounded-lg bg-background/50 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground">
                                Converting trees: {importProgress.current} / {importProgress.total}
                              </span>
                              <span className="text-muted-foreground">
                                {(() => {
                                  const elapsed = (Date.now() - importProgress.startTime) / 1000;
                                  const rate = importProgress.current / elapsed;
                                  const remaining = (importProgress.total - importProgress.current) / rate;
                                  const minutes = Math.floor(remaining / 60);
                                  const seconds = Math.floor(remaining % 60);
                                  return isFinite(remaining) && remaining > 0
                                    ? `Est. ${minutes}m ${seconds}s remaining`
                                    : 'Calculating...';
                                })()}
                              </span>
                            </div>
                            <Progress 
                              value={importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>

                      <div className="border-t border-mystical pt-4">
                        <h3 className="text-lg font-serif font-semibold mb-3">Export Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Download all tree data as a CSV file for backup or external use
                        </p>
                        <Button
                          variant="secondary"
                          onClick={(e) => { e.stopPropagation(); handleExport(); }}
                          disabled={isExporting}
                        >
                          {isExporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Export All Trees to CSV
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="greenhouse" className="space-y-6">
            <Greenhouse />
            <div className="relative max-w-[50%] mx-auto rounded-xl overflow-hidden border border-amber-700/40">
              <img src={greenhouseWindow} alt="Greenhouse" className="w-full h-auto object-contain" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-6">
            <WishingTreeUnified />
          </TabsContent>

          {/* Vaults Tab */}
          <TabsContent value="vault" className="space-y-6">
            {/* IAM Heartwood Vault — personal */}
            <div className="rounded-2xl border border-amber-600/30 p-6 space-y-4" style={{ background: 'linear-gradient(135deg, hsl(28 30% 12% / 0.9), hsl(22 25% 10% / 0.95))', boxShadow: '0 0 30px hsl(42 70% 40% / 0.15), inset 0 0 20px hsl(42 60% 30% / 0.08)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Archive className="w-5 h-5 text-amber-400/80" />
                <h2 className="text-lg font-serif text-amber-300/90 tracking-wide">IAM Heartwood Vault</h2>
                <span className="text-[10px] font-serif text-amber-400/40 ml-auto">Personal</span>
              </div>
              {currentUserId ? (
                <DashboardVault userId={currentUserId} />
              ) : (
                <p className="text-center py-8 text-muted-foreground font-serif text-sm">
                  Please log in to access your IAM Heartwood Vault
                </p>
              )}
            </div>

            {/* Collective Vaults (DAOs) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary/80" />
                <h2 className="text-lg font-serif text-foreground/90 tracking-wide">Collective Vaults</h2>
                <span className="text-[10px] font-serif text-muted-foreground ml-auto">DAOs</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CollectiveVaultCard
                  name="Oak Hive DAO"
                  description="Collective treasury for the Oak species family — funding conservation, research, and community stewardship."
                  members={42}
                  hearts={1250}
                  slug="oak"
                />
                <CollectiveVaultCard
                  name="Yew Hive DAO"
                  description="Ancient guardians treasury — preserving yew heritage sites and supporting elder tree care."
                  members={28}
                  hearts={890}
                  slug="yew"
                />
                <CollectiveVaultCard
                  name="Beech Hive DAO"
                  description="Beech woodland collective — supporting biodiversity corridors and community mapping initiatives."
                  members={19}
                  hearts={560}
                  slug="beech"
                />
                <CollectiveVaultCard
                  name="S33D Commons DAO"
                  description="The global commons vault — cross-hive initiatives, platform development, and ecosystem-wide proposals."
                  members={134}
                  hearts={4200}
                  slug="commons"
                />
              </div>
            </div>
          </TabsContent>

          {/* Hidden Vault Room — revealed by whistle (legacy access) */}
          {vaultRevealed && activeTab !== "vault" && (
            <div className="mt-8 rounded-2xl border border-amber-600/30 p-6 space-y-4" style={{ background: 'linear-gradient(135deg, hsl(28 30% 12% / 0.9), hsl(22 25% 10% / 0.95))', boxShadow: '0 0 30px hsl(42 70% 40% / 0.15), inset 0 0 20px hsl(42 60% 30% / 0.08)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Archive className="w-5 h-5 text-amber-400/80" />
                <h2 className="text-lg font-serif text-amber-300/90 tracking-wide">IAM Heartwood Vault</h2>
                <span className="text-[10px] font-serif text-amber-400/40 ml-auto">Hidden Room</span>
              </div>
              {currentUserId ? (
                <DashboardVault userId={currentUserId} />
              ) : (
                <p className="text-center py-8 text-muted-foreground font-serif text-sm">
                  Please log in to access your IAM Heartwood Vault
                </p>
              )}
            </div>
          )}
          </div>
        </Tabs>

      </main>

      <Dialog open={!!selectedTree} onOpenChange={(open) => !open && setSelectedTree(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedTree && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-3xl text-mystical">
                  {selectedTree.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Species</Label>
                    <p className="font-serif text-lg">{selectedTree.species}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="font-mono">/{selectedTree.what3words}</p>
                  </div>
                  {selectedTree.estimated_age && (
                    <div>
                      <Label className="text-muted-foreground">Estimated Age</Label>
                      <p>{selectedTree.estimated_age} years</p>
                    </div>
                  )}
                  {selectedTree.lineage && (
                    <div>
                      <Label className="text-muted-foreground">Lineage</Label>
                      <p>{selectedTree.lineage}</p>
                    </div>
                  )}
                  {selectedTree.state && (
                    <div>
                      <Label className="text-muted-foreground">State</Label>
                      <p>{selectedTree.state}</p>
                    </div>
                  )}
                  {selectedTree.nation && (
                    <div>
                      <Label className="text-muted-foreground">Nation</Label>
                      <p>{selectedTree.nation}</p>
                    </div>
                  )}
                </div>

                {selectedTree.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1">{selectedTree.description}</p>
                  </div>
                )}

                <div className="border-t border-mystical pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif font-bold">Offerings</h3>
                    <Dialog open={isOfferingDialogOpen} onOpenChange={setIsOfferingDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="sacred" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Offering
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="font-serif">Add Offering</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddOffering} className="space-y-4">
                          <div>
                            <Label htmlFor="offeringTitle">Title *</Label>
                            <Input
                              id="offeringTitle"
                              value={offeringForm.title}
                              onChange={(e) => setOfferingForm({ ...offeringForm, title: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="offeringType">Type *</Label>
                            <Select
                              value={offeringForm.type}
                              onValueChange={(value) => setOfferingForm({ ...offeringForm, type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="photo">Photo</SelectItem>
                                <SelectItem value="poem">Poem</SelectItem>
                                <SelectItem value="song">Song</SelectItem>
                                <SelectItem value="story">Story</SelectItem>
                                <SelectItem value="nft">NFT Link</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {offeringForm.type === "photo" && (
                            <div>
                              <Label htmlFor="mediaUrl">Photo URL</Label>
                              <Input
                                id="mediaUrl"
                                type="url"
                                value={offeringForm.media_url}
                                onChange={(e) => setOfferingForm({ ...offeringForm, media_url: e.target.value })}
                              />
                            </div>
                          )}
                          {offeringForm.type === "nft" && (
                            <div>
                              <Label htmlFor="nftLink">NFT Link</Label>
                              <Input
                                id="nftLink"
                                type="url"
                                value={offeringForm.nft_link}
                                onChange={(e) => setOfferingForm({ ...offeringForm, nft_link: e.target.value })}
                              />
                            </div>
                          )}
                          {["poem", "song", "story"].includes(offeringForm.type) && (
                            <div>
                              <Label htmlFor="content">Content</Label>
                              <Textarea
                                id="content"
                                value={offeringForm.content}
                                onChange={(e) => setOfferingForm({ ...offeringForm, content: e.target.value })}
                                rows={6}
                              />
                            </div>
                          )}
                          <Button type="submit" variant="sacred" className="w-full">
                            Add Offering
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {offerings.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No offerings yet. Be the first to add one!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {offerings.map((offering) => (
                        <Card key={offering.id} className="border-mystical">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              {getOfferingIcon(offering.type)}
                              {offering.title}
                              <Badge variant="outline" className="ml-auto">
                                {offering.type}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {offering.content && (
                              <p className="text-sm whitespace-pre-wrap">{offering.content}</p>
                            )}
                            {offering.media_url && (
                              <a
                                href={offering.media_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline text-sm"
                              >
                                View Media
                              </a>
                            )}
                            {offering.nft_link && (
                              <a
                                href={offering.nft_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline text-sm"
                              >
                                View NFT
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Staff dialogs now handled by StaffRoomGallery component */}
      <TetolBridge />
      <Footer />
    </div>
  );
};

export default GalleryPage;
