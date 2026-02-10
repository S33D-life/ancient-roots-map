import { useState, useEffect } from "react";
import AmanitaFlush from "@/components/AmanitaFlush";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MapPin, Plus, Image as ImageIcon, FileText, Music, Link as LinkIcon, Upload, Download, Loader2, Heart, Trash2, Wand2, Radio, ChevronDown } from "lucide-react";
import { parseCSV, generateCSV, downloadCSV } from "@/utils/csvHandler";
import { convertToCoordinates } from "@/utils/what3words";
import PhotoImport from "@/components/PhotoImport";
import CreatorsPath from "@/components/CreatorsPath";
import Greenhouse from "@/components/Greenhouse";
import TreeResources from "@/components/TreeResources";
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

const GalleryPage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("staff-room");
  const [trees, setTrees] = useState<Tree[]>([]);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfferingDialogOpen, setIsOfferingDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, startTime: 0 });
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [activeString, setActiveString] = useState<"oak" | "yew" | "beech" | "ash" | "holly">("oak");
  const [spiralSort, setSpiralSort] = useState<string>("spiral");
  const [hoveredSpiralStaff, setHoveredSpiralStaff] = useState<string | null>(null);
  const [selectedSpiralStaff, setSelectedSpiralStaff] = useState<{ code: string; species: string; length: string; weight: string; image: string } | null>(null);
  const [showCouncilEmbed, setShowCouncilEmbed] = useState(false);
  const [showAllStaffs, setShowAllStaffs] = useState(false);
  const [showSpiral, setShowSpiral] = useState(false);
  const [showTreeLedger, setShowTreeLedger] = useState(false);
  const [showBirdTribe, setShowBirdTribe] = useState(false);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => setShowSplash(false), 800);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchTrees();
    fetchWishlist();
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
    
    return matchesSearch && matchesSpecies;
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
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-700 ${splashFading ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
          <img 
            src={(() => { const h = new Date().getHours(); return h >= 18 || h < 6 ? heartwoodSplashNight : heartwoodSplashDay; })()} 
            alt="Welcome to Heartwood, A Library of Love" 
            className="max-h-[70vh] md:max-h-full md:h-full w-auto md:w-full object-contain md:object-cover animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
          <AmanitaFlush position="bottom" />
        </div>
      </div>
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
      <main className="container mx-auto px-4 pt-32 pb-12">
        <div className="mb-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLanding(true)} className="text-amber-400/70 hover:text-amber-300 transition-colors font-serif text-sm border border-amber-700/30 rounded-lg px-3 py-1.5 hover:border-amber-600/50" style={{ background: 'hsl(28 30% 12% / 0.8)' }}>
              ← Heartwood
            </button>
            <div>
              <h1 className="text-4xl font-serif font-bold text-mystical mb-2">
                Heartwood Library
              </h1>
              <p className="text-muted-foreground hidden md:block">
                Explore all mapped trees and manage the tree ledger
              </p>
            </div>
          </div>
          <div className="hidden md:block shrink-0">
            <img src={heartwoodLibrary} alt="Heartwood Library" className="h-24 w-36 object-cover rounded-lg border border-mystical shadow-lg" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative -mx-4 px-4 mb-8">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:max-w-6xl md:grid-cols-9 gap-1" style={{ background: 'linear-gradient(90deg, hsl(28 30% 20%), hsl(22 28% 16%), hsl(30 32% 22%))', border: '1px solid hsl(35 25% 28%)' }}>
                <TabsTrigger value="staff-room" className="whitespace-nowrap text-xs md:text-sm px-3 md:px-4">Staff Room</TabsTrigger>
                <TabsTrigger value="gallery" className="whitespace-nowrap text-xs md:text-sm px-3 md:px-4">Ancient Friends</TabsTrigger>
                <TabsTrigger value="music-room" className="whitespace-nowrap text-xs md:text-sm px-3 md:px-4">Music Room</TabsTrigger>
                <TabsTrigger value="greenhouse" className="whitespace-nowrap text-xs md:text-sm px-3 md:px-4">Greenhouse</TabsTrigger>
                <TabsTrigger value="wishlist" className="whitespace-nowrap text-xs md:text-sm px-3 md:px-4">Wishing Tree</TabsTrigger>
                <TabsTrigger value="seed-cellar" className="whitespace-nowrap text-xs md:text-sm px-3 md:px-4">Seed Cellar</TabsTrigger>
                <TabsTrigger value="creators-path" className="whitespace-nowrap text-xs md:text-sm px-3 md:px-4">Creator's Path</TabsTrigger>
                <TabsTrigger value="tree-resources" className="whitespace-nowrap text-xs md:text-sm px-3 md:px-4">Tree Resources</TabsTrigger>
                <TabsTrigger value="ledger" className="whitespace-nowrap text-xs md:text-sm px-3 md:px-4">Ledger</TabsTrigger>
              </TabsList>
            </div>
            {/* Scroll hint gradient - mobile only */}
            <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-background/80 to-transparent pointer-events-none md:hidden" />
          </div>

          {/* Music Room */}
          <TabsContent value="music-room" className="space-y-6">
            <Card className="border-mystical bg-card/50 backdrop-blur overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-primary tracking-wide flex items-center gap-3">
                  <Music className="h-6 w-6" />
                  Music Room
                </CardTitle>
                <CardDescription className="font-serif">
                  Tune into Tree Radio — a shuffled stream of songs offered to the ancient groves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hero artwork */}
                <div className="relative rounded-xl overflow-hidden border border-primary/30 w-fit mx-auto">
                  <img
                    src={treeRadioArt}
                    alt="Tree Radio"
                    className="h-24 md:h-28 w-auto object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                    <h3 className="text-lg md:text-xl font-serif text-primary tracking-wider" style={{ textShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}>
                      Tree Radio
                    </h3>
                    <p className="text-xs text-foreground/70 font-serif mt-0.5">
                      Every tree has a song. Tune in on the Arboreal Atlas.
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-serif text-lg text-primary/90 tracking-wide">How it works</h4>
                    <div className="space-y-3 text-sm text-foreground/70 font-serif leading-relaxed">
                      <p>
                        When visitors offer a song to an ancient tree, it becomes part of that species' 
                        living soundtrack. Tree Radio shuffles all songs shared with a species into a 
                        continuous stream.
                      </p>
                      <p>
                        Select a species filter on the Arboreal Atlas and tap the 
                        <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs">
                          <Music className="h-3 w-3" /> Tree Radio
                        </span>
                        button to start listening.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-serif text-lg text-primary/90 tracking-wide">Stations</h4>
                    <div className="space-y-2">
                      {["All Species", "Yew", "Oak", "Beech", "Ash", "Holly"].map((station) => (
                        <div
                          key={station}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/30"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <Music className="h-4 w-4 text-primary/70" />
                          </div>
                          <span className="font-serif text-sm text-foreground/80">{station} Radio</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* DJ Zambrezi's Song List */}
                <div className="mt-6 p-5 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg text-primary tracking-wide">The Zambrezi Wizard's Earth Radio</h4>
                      <p className="text-xs text-muted-foreground font-serif">Songs to carry to the trees on your next visit</p>
                    </div>
                  </div>

                  {/* Curated Picks */}
                  <div className="space-y-2">
                    <h5 className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Curated Picks</h5>
                    {[
                      { title: "Opening", artist: "Penguin Cafe", album: "Handfuls of Night", link: "https://music.apple.com/gb/album/opening/1600717991?i=1600717992", species: "All Species" },
                      { title: "We All Come from God", artist: "Penguin Cafe", album: "Rain Before 7...", link: "https://music.apple.com/gb/album/we-all-come-from-god/1625918325?i=1625918336", species: "Oak" },
                      { title: "Music for a Found Harmonium", artist: "Penguin Cafe Orchestra", album: "Broadcasting from Home", link: "https://music.apple.com/gb/album/music-for-a-found-harmonium/724033807?i=724033817", species: "Yew" },
                      { title: "Air à Danser", artist: "Penguin Cafe Orchestra", album: "Signs of Life", link: "https://music.apple.com/gb/album/air-%C3%A0-danser/724017583?i=724017746", species: "Ash" },
                      { title: "Solaris", artist: "Penguin Cafe", album: "The Imperfect Sea", link: "https://music.apple.com/gb/album/solaris/1209606498?i=1209606748", species: "Beech" },
                    ].map((song, i) => (
                      <a key={i} href={song.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/30 hover:bg-primary/10 hover:border-primary/30 transition-colors group">
                        <span className="w-6 text-center text-xs text-muted-foreground font-serif">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-sm text-foreground/90 truncate group-hover:text-primary transition-colors">{song.title}</p>
                          <p className="text-xs text-muted-foreground font-serif truncate">{song.artist} · {song.album}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-serif shrink-0">{song.species}</Badge>
                        <LinkIcon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>

                  {/* Bird Tribe Playlist */}
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <button
                      onClick={() => setShowBirdTribe(!showBirdTribe)}
                      className="flex items-center gap-2 w-full text-left group"
                    >
                      <ChevronDown className={`h-4 w-4 text-primary transition-transform ${showBirdTribe ? 'rotate-0' : '-rotate-90'}`} />
                      <h5 className="text-xs uppercase tracking-widest text-muted-foreground font-serif group-hover:text-primary transition-colors">
                        Bird Tribe Playlist
                      </h5>
                      <span className="text-[10px] text-muted-foreground/50 font-serif ml-auto">
                        {birdTribeSongs.length} songs
                      </span>
                    </button>
                    {showBirdTribe && (
                      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                        {birdTribeSongs.map((song, i) => (
                          <a
                            key={i}
                            href="https://music.apple.com/gb/playlist/bird-tribe/pl.u-6mo4zkmU4ZzeVZ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 bg-card/20 hover:bg-primary/10 hover:border-primary/30 transition-colors group"
                          >
                            <span className="w-6 text-center text-[10px] text-muted-foreground/60 font-serif">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-serif text-sm text-foreground/80 truncate group-hover:text-primary transition-colors">{song.title}</p>
                              <p className="text-xs text-muted-foreground font-serif truncate">{song.artist}</p>
                            </div>
                            <LinkIcon className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground/60 font-serif italic text-center pt-2">
                    Curated by The Zambrezi Wizard for Earth Radio — bring these songs as offerings on your next grove walk
                  </p>
                </div>

                {/* CTA to Atlas */}
                <div className="flex justify-center gap-3 pt-4">
                  <Button
                    onClick={() => window.location.href = "/radio"}
                    className="gap-2 font-serif tracking-wider"
                    style={{
                      background: 'linear-gradient(135deg, hsl(28 40% 18%), hsl(35 50% 22%))',
                      color: 'hsl(42 95% 55%)',
                      border: '1px solid hsl(42 50% 35% / 0.5)',
                    }}
                  >
                    <Radio className="h-4 w-4" />
                    Open Tree Radio
                  </Button>
                  <Button
                    onClick={() => window.location.href = "/map"}
                    variant="ghost"
                    className="gap-2 font-serif tracking-wider text-muted-foreground"
                  >
                    <MapPin className="h-4 w-4" />
                    Radio on the Atlas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-8">

            {/* Ancient Friends Window Banner */}
            <div className="relative max-w-[50%] mx-auto rounded-xl overflow-hidden border border-amber-700/40">
              <img 
                src={ancientFriendsWindow} 
                alt="Ancient Friends" 
                className="w-full h-auto object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToWishlist(tree.id);
                          }}
                          className="w-full"
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
                          Add to Wishing Tree
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="staff-room" className="space-y-8">
            {/* Staff Room Window Banner */}
            <div className="relative rounded-xl overflow-hidden h-56 md:h-72 mb-8">
              <img src={staffRoomWindow} alt="The Staff Room" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="relative z-10 flex flex-col items-center justify-end h-full pb-6 text-center px-4">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-mystical mb-2">The Staff Room</h2>
                <p className="text-foreground/80 max-w-2xl mx-auto text-sm">
                  144 hand-crafted staffs, each a unique companion for the Ancient Friends game.
                </p>
                <p className="text-foreground/60 max-w-xl mx-auto text-xs mt-1 italic">
                  The first 36 form a sacred spiral — one for each founding species — a living model of the spiral of trees you'll meet on the journey.
                </p>
              </div>
            </div>

            {/* Sacred Spiral of 36 — Toggle */}
            <div className="mb-12">
              <button
                onClick={() => setShowSpiral(!showSpiral)}
                className="w-full flex items-center justify-center gap-2 py-4 text-primary/80 hover:text-primary font-serif text-lg transition-colors group"
              >
                <span>{showSpiral ? 'Hide' : 'Show'} The Spiral of Species</span>
                <span className={`transition-transform duration-300 ${showSpiral ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showSpiral && (
              <div className="animate-fade-in">
              <div className="flex justify-center gap-2 mb-6">
                <Select value={spiralSort} onValueChange={setSpiralSort}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Order by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spiral">Golden Spiral</SelectItem>
                    <SelectItem value="name">Code (A–Z)</SelectItem>
                    <SelectItem value="species">Species (A–Z)</SelectItem>
                    <SelectItem value="weight-desc">Heaviest First</SelectItem>
                    <SelectItem value="weight-asc">Lightest First</SelectItem>
                    <SelectItem value="length-desc">Longest First</SelectItem>
                    <SelectItem value="length-asc">Shortest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full max-w-3xl mx-auto overflow-hidden" style={{ height: '800px' }}>
                {(() => {
                  const staffImages: Record<string, string> = {
                    OAK: "/images/staffs/oak.jpeg",
                    HORN: "/images/staffs/horn.jpeg",
                    HOL: "/images/staffs/hol.jpeg",
                    HAW: "/images/staffs/haw.jpeg",
                    PLA: "/images/staffs/pla.jpeg",
                    ASH: "/images/staffs/ash.jpeg",
                    GOA: "/images/staffs/goa.jpeg",
                    ELD: "/images/staffs/eld.jpeg",
                    BEE: "/images/staffs/bee.jpeg",
                    APP: "/images/staffs/app.jpeg",
                    ROSE: "/images/staffs/rose.jpeg",
                    CHER: "/images/staffs/cher.jpeg",
                    ROW: "/images/staffs/row.jpeg",
                    ALD: "/images/staffs/ald.jpeg",
                    SYC: "/images/staffs/syc.jpeg",
                    BIR: "/images/staffs/bir.jpeg",
                    HAZ: "/images/staffs/haz.jpeg",
                    SWE: "/images/staffs/swe.jpeg",
                    IVY: "/images/staffs/ivy.jpeg",
                    PLUM: "/images/staffs/plum.jpeg",
                    PINE: "/images/staffs/pine.jpeg",
                    RHOD: "/images/staffs/rhod.jpeg",
                    PRIV: "/images/staffs/priv.jpeg",
                    WIL: "/images/staffs/wil.jpeg",
                    BOX: "/images/staffs/box.jpeg",
                    BUCK: "/images/staffs/buck.jpeg",
                    YEW: "/images/staffs/yew.jpeg",
                    DAWN: "/images/staffs/dawn.jpeg",
                    BUD: "/images/staffs/bud.jpeg",
                    CRAB: "/images/staffs/crab.jpeg",
                    WITC: "/images/staffs/witc.jpeg",
                    PEAR: "/images/staffs/pear.jpeg",
                    JAPA: "/images/staffs/japa.jpeg",
                    SLOE: "/images/staffs/sloe.jpeg",
                    MED: "/images/staffs/med.jpeg",
                    HORS: "/images/staffs/hors.jpeg",
                  };
                  const spiralStaffs = [
                    { code: "YEW", species: "Yew", length: "161 cm", weight: "1,252 g" },
                    { code: "OAK", species: "Oak", length: "119 cm", weight: "550 g" },
                    { code: "HORN", species: "Hornbeam", length: "133 cm", weight: "990 g" },
                    { code: "HOL", species: "Holly", length: "157 cm", weight: "600 g" },
                    { code: "HAW", species: "Hawthorn", length: "102 cm", weight: "603 g" },
                    { code: "PLA", species: "London Plane", length: "152 cm", weight: "1,844 g" },
                    { code: "ASH", species: "Ash", length: "131 cm", weight: "816 g" },
                    { code: "GOA", species: "Goat Willow", length: "119 cm", weight: "292 g" },
                    { code: "ELD", species: "Elder", length: "127 cm", weight: "505 g" },
                    { code: "BEE", species: "Beech", length: "128 cm", weight: "1,315 g" },
                    { code: "APP", species: "Apple", length: "114 cm", weight: "1,000 g" },
                    { code: "ROSE", species: "Rose", length: "122 cm", weight: "599 g" },
                    { code: "CHER", species: "Cherry", length: "94 cm", weight: "433 g" },
                    { code: "ROW", species: "Rowan", length: "138 cm", weight: "911 g" },
                    { code: "ALD", species: "Alder", length: "93 cm", weight: "955 g" },
                    { code: "SYC", species: "Sycamore", length: "124 cm", weight: "613 g" },
                    { code: "BIR", species: "Birch", length: "144 cm", weight: "888 g" },
                    { code: "HAZ", species: "Hazel", length: "99 cm", weight: "734 g" },
                    { code: "SWE", species: "Sweet Chestnut", length: "98 cm", weight: "1,210 g" },
                    { code: "IVY", species: "Ivy", length: "94 cm", weight: "901 g" },
                    { code: "PLUM", species: "Plum", length: "103 cm", weight: "505 g" },
                    { code: "PINE", species: "Pine", length: "159 cm", weight: "1,337 g" },
                    { code: "RHOD", species: "Rhododendron", length: "116 cm", weight: "560 g" },
                    { code: "PRIV", species: "Privet", length: "104 cm", weight: "666 g" },
                    { code: "WIL", species: "Willow", length: "118 cm", weight: "646 g" },
                    { code: "BOX", species: "Box", length: "161 cm", weight: "1,332 g" },
                    { code: "BUCK", species: "Buckthorn", length: "161 cm", weight: "663 g" },
                    { code: "DAWN", species: "Dawn Redwood", length: "142 cm", weight: "500 g" },
                    { code: "BUD", species: "Buddleia", length: "115 cm", weight: "393 g" },
                    { code: "CRAB", species: "Crab Apple", length: "119 cm", weight: "644 g" },
                    { code: "WITC", species: "Witch Hazel", length: "84 cm", weight: "433 g" },
                    { code: "PEAR", species: "Pear", length: "137 cm", weight: "848 g" },
                    { code: "JAPA", species: "Japanese Maple", length: "103 cm", weight: "1,100 g" },
                    { code: "SLOE", species: "Blackthorn", length: "177 cm", weight: "1,844 g" },
                    { code: "MED", species: "Medlar", length: "109 cm", weight: "2,525 g" },
                    { code: "HORS", species: "Horse Chestnut", length: "101 cm", weight: "1,333 g" },
                  ];

                  const parseNum = (s: string) => parseFloat(s.replace(/,/g, '')) || 0;

                  const sortedStaffs = [...spiralStaffs];
                  if (spiralSort !== "spiral") {
                    sortedStaffs.sort((a, b) => {
                      switch (spiralSort) {
                        case "name": return a.code.localeCompare(b.code);
                        case "species": return a.species.localeCompare(b.species);
                        case "weight-desc": return parseNum(b.weight) - parseNum(a.weight);
                        case "weight-asc": return parseNum(a.weight) - parseNum(b.weight);
                        case "length-desc": return parseNum(b.length) - parseNum(a.length);
                        case "length-asc": return parseNum(a.length) - parseNum(b.length);
                        default: return 0;
                      }
                    });
                  }

                  const centerX = 50;
                  const centerY = 50;
                  const goldenAngle = 137.508;
                  const scaleFactor = 6.5;

                  const positions = sortedStaffs.map((_, i) => {
                    const angle = i * goldenAngle * (Math.PI / 180);
                    const r = scaleFactor * Math.sqrt(i + 1);
                    return {
                      x: Math.max(8, Math.min(92, centerX + r * Math.cos(angle))),
                      y: Math.max(5, Math.min(95, centerY + r * Math.sin(angle))),
                    };
                  });

                  return (
                    <>
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{ zIndex: 0 }}
                      >
                        <polyline
                          points={positions.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke="hsl(var(--primary) / 0.35)"
                          strokeWidth="0.3"
                          strokeDasharray="0.8 0.6"
                          strokeLinecap="round"
                        />
                        {positions.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="0.4" fill="hsl(var(--primary) / 0.5)" />
                        ))}
                      </svg>

                       {sortedStaffs.map((staff, i) => {
                        const { x: clampedX, y: clampedY } = positions[i];
                        const hasImage = staffImages[staff.code];

                        // Count total staffs for this species (1 original + circles)
                        const speciesStaffCounts: Record<string, number> = {
                          YEW: 37, OAK: 37, ASH: 13, BEE: 13, HOL: 13,
                          HORN: 1, HAW: 1, PLA: 1, GOA: 1, ELD: 1, APP: 1,
                          ROSE: 1, CHER: 1, ROW: 1, ALD: 1, SYC: 1, BIR: 1,
                          HAZ: 1, SWE: 1, IVY: 1, PLUM: 1, PINE: 1, RHOD: 1,
                          PRIV: 1, WIL: 1, BOX: 1, BUCK: 1, DAWN: 1, BUD: 1,
                          CRAB: 1, WITC: 1, PEAR: 1, JAPA: 1, SLOE: 1, MED: 1,
                          HORS: 1,
                        };
                        const totalForSpecies = speciesStaffCounts[staff.code] || 1;
                        const isHovered = hoveredSpiralStaff === staff.code;

                        return (
                          <div
                            key={staff.code}
                            className="absolute flex flex-col items-center cursor-pointer transition-all duration-300"
                            style={{
                              left: `${clampedX}%`,
                              top: `${clampedY}%`,
                              transform: `translate(-50%, -50%) scale(${isHovered ? 1.6 : 1})`,
                              zIndex: isHovered ? 100 : i + 1,
                              filter: isHovered ? 'drop-shadow(0 0 12px hsl(var(--primary) / 0.6))' : 'none',
                            }}
                            onMouseEnter={() => setHoveredSpiralStaff(staff.code)}
                            onMouseLeave={() => setHoveredSpiralStaff(null)}
                            onClick={() => setSelectedSpiralStaff({
                              code: staff.code,
                              species: staff.species,
                              length: staff.length,
                              weight: staff.weight,
                              image: hasImage || "",
                            })}
                          >
                            <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary/80 text-primary-foreground text-[6px] flex items-center justify-center font-bold z-10">
                              {i + 1}
                            </div>
                            <div className={`w-10 h-14 sm:w-12 sm:h-16 rounded-md border overflow-hidden flex items-center justify-center ${hasImage ? 'border-primary/60 bg-card/90 glow-subtle' : 'border-border bg-muted/30'}`}>
                              {hasImage ? (
                                <img src={hasImage} alt={`${staff.species} staff`} className="w-full h-full object-cover" />
                              ) : (
                                <Wand2 className="w-4 h-4 text-muted-foreground/30" />
                              )}
                            </div>
                            <span className="text-[8px] sm:text-[9px] font-serif text-foreground mt-0.5 whitespace-nowrap leading-tight">
                              {staff.code}
                            </span>
                            <span className="text-[7px] text-muted-foreground leading-tight">{staff.species}</span>
                            <Badge variant="outline" className="mt-0.5 text-[6px] px-1 py-0 leading-tight">
                              {hasImage ? "Minted" : "Awaiting"}
                            </Badge>

                            {/* Hover tooltip */}
                            {isHovered && (
                              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-card border border-primary/40 rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap z-50 animate-fade-in">
                                <p className="text-[10px] font-serif font-bold text-primary">{staff.species}</p>
                                <p className="text-[9px] text-muted-foreground">
                                  {totalForSpecies} staff{totalForSpecies > 1 ? 's' : ''} total · {staff.length} · {staff.weight}
                                </p>
                                {totalForSpecies > 1 && (
                                  <button
                                    className="mt-1 text-[9px] text-primary underline underline-offset-2 hover:text-accent transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const code = staff.code;
                                      // Find the first circle staff index in grid for this species
                                      const circleStartIndices: Record<string, number> = {
                                        YEW: 36, OAK: 72, ASH: 108, BEE: 120, HOL: 132,
                                      };
                                      const idx = circleStartIndices[code];
                                      if (idx !== undefined) {
                                        const el = document.getElementById(`staff-grid-${idx}`);
                                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      }
                                    }}
                                  >
                                    View {totalForSpecies - 1} Circle staffs ↓
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
              )}
            </div>

            {/* Full 144 Grid — Collapsible */}
            <div>
              <button
                onClick={() => setShowAllStaffs(!showAllStaffs)}
                className="w-full flex items-center justify-center gap-2 py-4 text-primary/80 hover:text-primary font-serif text-lg transition-colors group"
              >
                <span>{showAllStaffs ? 'Hide' : 'Show'} All 144 Staffs</span>
                <span className={`transition-transform duration-300 ${showAllStaffs ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showAllStaffs && (
                <div className="animate-fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {(() => {
                  const gridImages: Record<number, { code: string; img: string }> = {
                    0: { code: "YEW", img: "/images/staffs/yew.jpeg" },
                    1: { code: "OAK", img: "/images/staffs/oak.jpeg" },
                    2: { code: "HORN", img: "/images/staffs/horn.jpeg" },
                    3: { code: "HOL", img: "/images/staffs/hol.jpeg" },
                    4: { code: "HAW", img: "/images/staffs/haw.jpeg" },
                    5: { code: "PLA", img: "/images/staffs/pla.jpeg" },
                    6: { code: "ASH", img: "/images/staffs/ash.jpeg" },
                    7: { code: "GOA", img: "/images/staffs/goa.jpeg" },
                    8: { code: "ELD", img: "/images/staffs/eld.jpeg" },
                    9: { code: "BEE", img: "/images/staffs/bee.jpeg" },
                    10: { code: "APP", img: "/images/staffs/app.jpeg" },
                    11: { code: "ROSE", img: "/images/staffs/rose.jpeg" },
                    12: { code: "CHER", img: "/images/staffs/cher.jpeg" },
                    13: { code: "ROW", img: "/images/staffs/row.jpeg" },
                    14: { code: "ALD", img: "/images/staffs/ald.jpeg" },
                    15: { code: "SYC", img: "/images/staffs/syc.jpeg" },
                    16: { code: "BIR", img: "/images/staffs/bir.jpeg" },
                    17: { code: "HAZ", img: "/images/staffs/haz.jpeg" },
                    18: { code: "SWE", img: "/images/staffs/swe.jpeg" },
                    19: { code: "IVY", img: "/images/staffs/ivy.jpeg" },
                    20: { code: "PLUM", img: "/images/staffs/plum.jpeg" },
                    21: { code: "PINE", img: "/images/staffs/pine.jpeg" },
                    22: { code: "RHOD", img: "/images/staffs/rhod.jpeg" },
                    23: { code: "PRIV", img: "/images/staffs/priv.jpeg" },
                    24: { code: "WIL", img: "/images/staffs/wil.jpeg" },
                    25: { code: "BOX", img: "/images/staffs/box.jpeg" },
                    26: { code: "BUCK", img: "/images/staffs/buck.jpeg" },
                    27: { code: "HORS", img: "/images/staffs/hors.jpeg" },
                    28: { code: "DAWN", img: "/images/staffs/dawn.jpeg" },
                    29: { code: "BUD", img: "/images/staffs/bud.jpeg" },
                    30: { code: "CRAB", img: "/images/staffs/crab.jpeg" },
                    31: { code: "WITC", img: "/images/staffs/witc.jpeg" },
                    32: { code: "PEAR", img: "/images/staffs/pear.jpeg" },
                    33: { code: "JAPA", img: "/images/staffs/japa.jpeg" },
                    34: { code: "SLOE", img: "/images/staffs/sloe.jpeg" },
                    35: { code: "MED", img: "/images/staffs/med.jpeg" },
                    36: { code: "YEW-C1S1", img: "/images/staffs/yew-c1-s1.jpeg" },
                    37: { code: "YEW-C1S2", img: "/images/staffs/yew-c1-s2.jpeg" },
                    38: { code: "YEW-C1S3", img: "/images/staffs/yew-c1-s3.jpeg" },
                    39: { code: "YEW-C1S4", img: "/images/staffs/yew-c1-s4.jpeg" },
                    40: { code: "YEW-C1S5", img: "/images/staffs/yew-c1-s5.jpeg" },
                    41: { code: "YEW-C1S6", img: "/images/staffs/yew-c1-s6.jpeg" },
                    42: { code: "YEW-C1S7", img: "/images/staffs/yew-c1-s7.jpeg" },
                    43: { code: "YEW-C1S8", img: "/images/staffs/yew-c1-s8.jpeg" },
                    44: { code: "YEW-C1S9", img: "/images/staffs/yew-c1-s9.jpeg" },
                    45: { code: "YEW-C1S10", img: "/images/staffs/yew-c1-s10.jpeg" },
                    46: { code: "YEW-C1S11", img: "/images/staffs/yew-c1-s11.jpeg" },
                    47: { code: "YEW-C1S12", img: "/images/staffs/yew-c1-s12.jpeg" },
                    48: { code: "YEW-C2S1", img: "/images/staffs/yew-c2-s1.jpeg" },
                    49: { code: "YEW-C2S2", img: "/images/staffs/yew-c2-s2.jpeg" },
                    50: { code: "YEW-C2S3", img: "/images/staffs/yew-c2-s3.jpeg" },
                    51: { code: "YEW-C2S4", img: "/images/staffs/yew-c2-s4.jpeg" },
                    52: { code: "YEW-C2S5", img: "/images/staffs/yew-c2-s5.jpeg" },
                    53: { code: "YEW-C2S6", img: "/images/staffs/yew-c2-s6.jpeg" },
                    54: { code: "YEW-C2S7", img: "/images/staffs/yew-c2-s7.jpeg" },
                    55: { code: "YEW-C2S8", img: "/images/staffs/yew-c2-s8.jpeg" },
                    56: { code: "YEW-C2S9", img: "/images/staffs/yew-c2-s9.jpeg" },
                    57: { code: "YEW-C2S10", img: "/images/staffs/yew-c2-s10.jpeg" },
                    58: { code: "YEW-C2S11", img: "/images/staffs/yew-c2-s11.jpeg" },
                    59: { code: "YEW-C2S12", img: "/images/staffs/yew-c2-s12.jpeg" },
                    60: { code: "YEW-C3S1", img: "/images/staffs/yew-c3-s1.jpeg" },
                    61: { code: "YEW-C3S2", img: "/images/staffs/yew-c3-s2.jpeg" },
                    62: { code: "YEW-C3S3", img: "/images/staffs/yew-c3-s3.jpeg" },
                    63: { code: "YEW-C3S4", img: "/images/staffs/yew-c3-s4.jpeg" },
                    64: { code: "YEW-C3S5", img: "/images/staffs/yew-c3-s5.jpeg" },
                    65: { code: "YEW-C3S6", img: "/images/staffs/yew-c3-s6.jpeg" },
                    66: { code: "YEW-C3S7", img: "/images/staffs/yew-c3-s7.jpeg" },
                    67: { code: "YEW-C3S8", img: "/images/staffs/yew-c3-s8.jpeg" },
                    68: { code: "YEW-C3S9", img: "/images/staffs/yew-c3-s9.jpeg" },
                    69: { code: "YEW-C3S10", img: "/images/staffs/yew-c3-s10.jpeg" },
                    70: { code: "YEW-C3S11", img: "/images/staffs/yew-c3-s11.jpeg" },
                    71: { code: "YEW-C3S12", img: "/images/staffs/yew-c3-s12.jpeg" },
                    72: { code: "OAK-C1S1", img: "/images/staffs/oak-c1-s1.jpeg" },
                    73: { code: "OAK-C1S2", img: "/images/staffs/oak-c1-s2.jpeg" },
                    74: { code: "OAK-C1S3", img: "/images/staffs/oak-c1-s3.jpeg" },
                    75: { code: "OAK-C1S4", img: "/images/staffs/oak-c1-s4.jpeg" },
                    76: { code: "OAK-C1S5", img: "/images/staffs/oak-c1-s5.jpeg" },
                    77: { code: "OAK-C1S6", img: "/images/staffs/oak-c1-s6.jpeg" },
                    78: { code: "OAK-C1S7", img: "/images/staffs/oak-c1-s7.jpeg" },
                    79: { code: "OAK-C1S8", img: "/images/staffs/oak-c1-s8.jpeg" },
                    80: { code: "OAK-C1S9", img: "/images/staffs/oak-c1-s9.jpeg" },
                    81: { code: "OAK-C1S10", img: "/images/staffs/oak-c1-s10.jpeg" },
                    82: { code: "OAK-C1S11", img: "/images/staffs/oak-c1-s11.jpeg" },
                    83: { code: "OAK-C1S12", img: "/images/staffs/oak-c1-s12.jpeg" },
                    84: { code: "OAK-C2S1", img: "/images/staffs/oak-c2-s1.jpeg" },
                    85: { code: "OAK-C2S2", img: "/images/staffs/oak-c2-s2.jpeg" },
                    86: { code: "OAK-C2S3", img: "/images/staffs/oak-c2-s3.jpeg" },
                    87: { code: "OAK-C2S4", img: "/images/staffs/oak-c2-s4.jpeg" },
                    88: { code: "OAK-C2S5", img: "/images/staffs/oak-c2-s5.jpeg" },
                    89: { code: "OAK-C2S6", img: "/images/staffs/oak-c2-s6.jpeg" },
                    90: { code: "OAK-C2S7", img: "/images/staffs/oak-c2-s7.jpeg" },
                    91: { code: "OAK-C2S8", img: "/images/staffs/oak-c2-s8.jpeg" },
                    92: { code: "OAK-C2S9", img: "/images/staffs/oak-c2-s9.jpeg" },
                    93: { code: "OAK-C2S10", img: "/images/staffs/oak-c2-s10.jpeg" },
                    94: { code: "OAK-C2S11", img: "/images/staffs/oak-c2-s11.jpeg" },
                    95: { code: "OAK-C2S12", img: "/images/staffs/oak-c2-s12.jpeg" },
                    96: { code: "OAK-C3S1", img: "/images/staffs/oak-c3-s1.jpeg" },
                    97: { code: "OAK-C3S2", img: "/images/staffs/oak-c3-s2.jpeg" },
                    98: { code: "OAK-C3S3", img: "/images/staffs/oak-c3-s3.jpeg" },
                    99: { code: "OAK-C3S4", img: "/images/staffs/oak-c3-s4.jpeg" },
                    100: { code: "OAK-C3S5", img: "/images/staffs/oak-c3-s5.jpeg" },
                    101: { code: "OAK-C3S6", img: "/images/staffs/oak-c3-s6.jpeg" },
                    102: { code: "OAK-C3S7", img: "/images/staffs/oak-c3-s7.jpeg" },
                    103: { code: "OAK-C3S8", img: "/images/staffs/oak-c3-s8.jpeg" },
                    104: { code: "OAK-C3S9", img: "/images/staffs/oak-c3-s9.jpeg" },
                    105: { code: "OAK-C3S10", img: "/images/staffs/oak-c3-s10.jpeg" },
                    106: { code: "OAK-C3S11", img: "/images/staffs/oak-c3-s11.jpeg" },
                    107: { code: "OAK-C3S12", img: "/images/staffs/oak-c3-s12.jpeg" },
                    108: { code: "ASH-C1S1", img: "/images/staffs/ash-c1-s1.jpeg" },
                    109: { code: "ASH-C1S2", img: "/images/staffs/ash-c1-s2.jpeg" },
                    110: { code: "ASH-C1S3", img: "/images/staffs/ash-c1-s3.jpeg" },
                    111: { code: "ASH-C1S4", img: "/images/staffs/ash-c1-s4.jpeg" },
                    112: { code: "ASH-C1S5", img: "/images/staffs/ash-c1-s5.jpeg" },
                    113: { code: "ASH-C1S6", img: "/images/staffs/ash-c1-s6.jpeg" },
                    114: { code: "ASH-C1S7", img: "/images/staffs/ash-c1-s7.jpeg" },
                    115: { code: "ASH-C1S8", img: "/images/staffs/ash-c1-s8.jpeg" },
                    116: { code: "ASH-C1S9", img: "/images/staffs/ash-c1-s9.jpeg" },
                    117: { code: "ASH-C1S10", img: "/images/staffs/ash-c1-s10.jpeg" },
                    118: { code: "ASH-C1S11", img: "/images/staffs/ash-c1-s11.jpeg" },
                    119: { code: "ASH-C1S12", img: "/images/staffs/ash-c1-s12.jpeg" },
                    120: { code: "BEE-C1S1", img: "/images/staffs/bee-c1-s1.jpeg" },
                    121: { code: "BEE-C1S2", img: "/images/staffs/bee-c1-s2.jpeg" },
                    122: { code: "BEE-C1S3", img: "/images/staffs/bee-c1-s3.jpeg" },
                    123: { code: "BEE-C1S4", img: "/images/staffs/bee-c1-s4.jpeg" },
                    124: { code: "BEE-C1S5", img: "/images/staffs/bee-c1-s5.jpeg" },
                    125: { code: "BEE-C1S6", img: "/images/staffs/bee-c1-s6.jpeg" },
                    126: { code: "BEE-C1S7", img: "/images/staffs/bee-c1-s7.jpeg" },
                    127: { code: "BEE-C1S8", img: "/images/staffs/bee-c1-s8.jpeg" },
                    128: { code: "BEE-C1S9", img: "/images/staffs/bee-c1-s9.jpeg" },
                    129: { code: "BEE-C1S10", img: "/images/staffs/bee-c1-s10.jpeg" },
                    130: { code: "BEE-C1S11", img: "/images/staffs/bee-c1-s11.jpeg" },
                    131: { code: "BEE-C1S12", img: "/images/staffs/bee-c1-s12.jpeg" },
                    132: { code: "HOL-C1S1", img: "/images/staffs/hol-c1-s1.jpeg" },
                    133: { code: "HOL-C1S2", img: "/images/staffs/hol-c1-s2.jpeg" },
                    134: { code: "HOL-C1S3", img: "/images/staffs/hol-c1-s3.jpeg" },
                    135: { code: "HOL-C1S4", img: "/images/staffs/hol-c1-s4.jpeg" },
                    136: { code: "HOL-C1S5", img: "/images/staffs/hol-c1-s5.jpeg" },
                    137: { code: "HOL-C1S6", img: "/images/staffs/hol-c1-s6.jpeg" },
                    138: { code: "HOL-C1S7", img: "/images/staffs/hol-c1-s7.jpeg" },
                    139: { code: "HOL-C1S8", img: "/images/staffs/hol-c1-s8.jpeg" },
                    140: { code: "HOL-C1S9", img: "/images/staffs/hol-c1-s9.jpeg" },
                    141: { code: "HOL-C1S10", img: "/images/staffs/hol-c1-s10.jpeg" },
                    142: { code: "HOL-C1S11", img: "/images/staffs/hol-c1-s11.jpeg" },
                    143: { code: "HOL-C1S12", img: "/images/staffs/hol-c1-s12.jpeg" },
                  };
                  return Array.from({ length: 144 }, (_, i) => {
                    const staffData = gridImages[i];
                    return (
                      <Card key={i} id={`staff-grid-${i}`} className="border-mystical hover:shadow-elegant transition-mystical group cursor-pointer overflow-hidden">
                        <CardContent className="p-4 text-center">
                          <div className="w-full aspect-[3/4] rounded-md bg-muted/50 border border-border flex items-center justify-center mb-3 group-hover:border-primary transition-colors overflow-hidden">
                            {staffData ? (
                              <img src={staffData.img} alt={`Staff ${staffData.code}`} className="w-full h-full object-cover" />
                            ) : (
                              <Wand2 className="w-8 h-8 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            )}
                          </div>
                          <p className="text-sm font-serif font-medium text-foreground">Staff #{String(i + 1).padStart(3, '0')}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {staffData ? "Minted" : "Awaiting Mint"}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
                  </div>
                </div>
              )}
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  All 144 staffs minted as NFTs · Digital twins coming soon
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="creators-path">
            <CreatorsPath />
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
            <div className="relative rounded-xl overflow-hidden border border-primary/20">
              <img
                src={councilLedgerWindow}
                alt="Council of Life Ledger"
                className="w-full h-40 md:h-56 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end justify-center pb-5">
                <h2 className="text-2xl md:text-3xl font-serif text-primary drop-shadow-lg tracking-wide">Council of Life Ledger</h2>
              </div>
            </div>

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
                  src="https://clammy-viscount-ddb.notion.site/ebd//1e415b58480d8042a722ef57e01e3228"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  allowFullScreen
                  className="rounded-xl border border-border/40"
                  title="Council of Life"
                />
              </div>
            )}

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
                              oak: "https://clammy-viscount-ddb.notion.site/ebd//2fc15b58480d8023b4ade8b40e4b5156",
                              yew: "https://clammy-viscount-ddb.notion.site/ebd//2fc15b58480d80468a76dd551cff272b",
                              beech: "https://clammy-viscount-ddb.notion.site/ebd//2fc15b58480d80c6a871d19d6dc35bd3",
                              ash: "https://clammy-viscount-ddb.notion.site/ebd//2fc15b58480d8079b3e3d68121c9e133",
                              holly: "https://clammy-viscount-ddb.notion.site/ebd//2fc15b58480d801eb6a8f4e80aa5a574",
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
            <div className="relative rounded-xl overflow-hidden border border-primary/20 max-w-sm mx-auto">
              <img
                src={greenhouseWindow}
                alt="Greenhouse"
                className="w-full h-32 md:h-40 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>
            <Greenhouse />
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-6">
            <Card className="border-mystical bg-card/50 backdrop-blur overflow-hidden">
              {/* Wishing Tree painting header */}
              <div className="flex items-center gap-4 p-4 border-b border-border/30">
                <div className="relative w-16 h-20 shrink-0 rounded-md overflow-hidden border border-border shadow" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  <img
                    src={wishingTreeImage}
                    alt="Wishing Tree"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-serif text-primary">
                    Wishing Tree
                  </h2>
                  <p className="text-xs font-serif text-muted-foreground">
                    Trees you dream of visiting someday
                  </p>
                </div>
              </div>
              <CardHeader className="sr-only">
                <CardTitle>Wishing Tree</CardTitle>
              </CardHeader>
              <CardContent>
                {wishlistLoading ? (
                  <p className="text-center py-12">Loading your wishlist...</p>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">
                      Your Wishing Tree is empty
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add trees from the Gallery that you would like to visit
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlist.map((item) => (
                      <Card key={item.id} className="border-mystical/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="font-serif text-mystical line-clamp-1">
                                {item.trees.name}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="font-serif">
                                  {item.trees.species}
                                </Badge>
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromWishlist(item.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">/{item.trees.what3words}</span>
                          </div>
                          
                          {item.trees.state && (
                            <p className="text-sm text-muted-foreground">
                              {item.trees.state}{item.trees.nation ? `, ${item.trees.nation}` : ''}
                            </p>
                          )}

                          <div className="pt-2 border-t border-border">
                            <Label className="text-xs text-muted-foreground">Personal Notes</Label>
                            <Textarea
                              value={item.notes || ""}
                              onChange={(e) => updateWishlistNotes(item.id, e.target.value)}
                              placeholder="Why do you want to visit this tree?"
                              className="mt-1 min-h-[60px] text-sm"
                            />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTree(item.trees)}
                            className="w-full"
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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

      {/* Spiral Staff Fullscreen Dialog */}
      <Dialog open={!!selectedSpiralStaff} onOpenChange={(open) => !open && setSelectedSpiralStaff(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-primary/40">
          {selectedSpiralStaff && (
            <div className="flex flex-col">
              {selectedSpiralStaff.image ? (
                <div className="w-full aspect-[3/4] bg-card overflow-hidden">
                  <img
                    src={selectedSpiralStaff.image}
                    alt={`${selectedSpiralStaff.species} staff`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[3/4] bg-muted/30 flex items-center justify-center">
                  <Wand2 className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
              <div className="p-6 space-y-3">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl text-primary">
                    {selectedSpiralStaff.species}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Code</span>
                    <span className="font-mono text-foreground">{selectedSpiralStaff.code}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Length</span>
                    <span className="text-foreground">{selectedSpiralStaff.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="text-foreground">{selectedSpiralStaff.weight}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Total in Collection</span>
                    <span className="text-foreground font-semibold">
                      {({
                        YEW: 37, OAK: 37, ASH: 13, BEE: 13, HOL: 13,
                      } as Record<string, number>)[selectedSpiralStaff.code] || 1} staff{(({
                        YEW: 37, OAK: 37, ASH: 13, BEE: 13, HOL: 13,
                      } as Record<string, number>)[selectedSpiralStaff.code] || 1) > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-muted-foreground">Circles</span>
                    <span className="text-foreground">
                      {({
                        YEW: "3 circles (36 + original)", OAK: "3 circles (36 + original)",
                        ASH: "1 circle (12 + original)", BEE: "1 circle (12 + original)",
                        HOL: "1 circle (12 + original)",
                      } as Record<string, string>)[selectedSpiralStaff.code] || "Original only"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic pt-2">
                  The {selectedSpiralStaff.species} staff — position #{
                    ["YEW","OAK","HORN","HOL","HAW","PLA","ASH","GOA","ELD","BEE","APP","ROSE","CHER","ROW","ALD","SYC","BIR","HAZ","SWE","IVY","PLUM","PINE","RHOD","PRIV","WIL","BOX","BUCK","DAWN","BUD","CRAB","WITC","PEAR","JAPA","SLOE","MED","HORS"].indexOf(selectedSpiralStaff.code) + 1
                  } on the sacred spiral. Hand-crafted from fallen wood, each staff carries the spirit of its species.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default GalleryPage;
