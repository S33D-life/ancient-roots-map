import { useState, useEffect } from "react";
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
import { MapPin, Plus, Image as ImageIcon, FileText, Music, Link as LinkIcon, Upload, Download, Loader2, Heart, Trash2, Wand2 } from "lucide-react";
import { parseCSV, generateCSV, downloadCSV } from "@/utils/csvHandler";
import { convertToCoordinates } from "@/utils/what3words";
import PhotoImport from "@/components/PhotoImport";
import { Progress } from "@/components/ui/progress";

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
  const [offeringForm, setOfferingForm] = useState({
    title: "",
    type: "photo",
    content: "",
    media_url: "",
    nft_link: "",
  });

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-mystical mb-2">
            Ancient Friends Gallery
          </h1>
          <p className="text-muted-foreground">
            Explore all mapped trees and manage the tree ledger
          </p>
        </div>

        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="staff-room">Staff Room</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="wishlist">Wishing Tree</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-8">
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
                          <Heart className="w-4 h-4 mr-2" />
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
            <div className="text-center mb-8">
              <Wand2 className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-serif font-bold text-mystical mb-2">The Staff Room</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                144 hand-crafted staffs, each a unique companion for the Ancient Friends game. 
                The first 36 form a sacred spiral — one for each founding species — a model for the spiral of trees you'll meet on the journey.
              </p>
            </div>

            {/* Sacred Spiral of 36 */}
            <div className="mb-12">
              <h3 className="text-xl font-serif text-primary text-center mb-6">The Spiral of Staffs</h3>
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
                  };
                  const spiralStaffs = [
                    { code: "YEW", species: "Yew", length: "—", weight: "—" },
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
                    { code: "IVY", species: "Ivy", length: "—", weight: "—" },
                    { code: "PLUM", species: "Plum", length: "—", weight: "—" },
                    { code: "PINE", species: "Pine", length: "—", weight: "—" },
                    { code: "RHOD", species: "Rhododendron", length: "—", weight: "—" },
                    { code: "PRIV", species: "Privet", length: "—", weight: "—" },
                    { code: "TBD-25", species: "—", length: "—", weight: "—" },
                    { code: "TBD-26", species: "—", length: "—", weight: "—" },
                    { code: "TBD-27", species: "—", length: "—", weight: "—" },
                    { code: "TBD-28", species: "—", length: "—", weight: "—" },
                    { code: "TBD-29", species: "—", length: "—", weight: "—" },
                    { code: "TBD-30", species: "—", length: "—", weight: "—" },
                    { code: "TBD-31", species: "—", length: "—", weight: "—" },
                    { code: "TBD-32", species: "—", length: "—", weight: "—" },
                    { code: "TBD-33", species: "—", length: "—", weight: "—" },
                    { code: "TBD-34", species: "—", length: "—", weight: "—" },
                    { code: "TBD-35", species: "—", length: "—", weight: "—" },
                    { code: "TBD-36", species: "—", length: "—", weight: "—" },
                  ];
                  const centerX = 50;
                  const centerY = 50;
                  const goldenAngle = 137.508;
                  const scaleFactor = 6.5;

                  return spiralStaffs.map((staff, i) => {
                    const angle = i * goldenAngle * (Math.PI / 180);
                    const r = scaleFactor * Math.sqrt(i + 1);
                    const x = centerX + r * Math.cos(angle);
                    const y = centerY + r * Math.sin(angle);
                    const isRevealed = !staff.code.startsWith("TBD");
                    const clampedX = Math.max(8, Math.min(92, x));
                    const clampedY = Math.max(5, Math.min(95, y));
                    const hasImage = staffImages[staff.code];

                    return (
                      <div
                        key={i}
                        className={`absolute flex flex-col items-center group cursor-pointer transition-all duration-300 hover:scale-125 hover:z-30 ${isRevealed ? '' : 'opacity-30'}`}
                        style={{
                          left: `${clampedX}%`,
                          top: `${clampedY}%`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: i,
                        }}
                        title={hasImage ? `${staff.species} — ${staff.length} · ${staff.weight}` : staff.species}
                      >
                        <div className={`w-10 h-14 sm:w-12 sm:h-16 rounded-md border overflow-hidden flex items-center justify-center ${isRevealed ? 'border-primary/60 bg-card/90 glow-subtle' : 'border-border bg-muted/30'}`}>
                          {hasImage ? (
                            <img src={hasImage} alt={`${staff.species} staff`} className="w-full h-full object-cover" />
                          ) : (
                            <Wand2 className={`w-4 h-4 ${isRevealed ? 'text-primary' : 'text-muted-foreground/30'}`} />
                          )}
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-serif text-foreground mt-0.5 whitespace-nowrap leading-tight">
                          {staff.code}
                        </span>
                        <span className="text-[7px] text-muted-foreground leading-tight">{staff.species}</span>
                        {isRevealed && (
                          <Badge variant="outline" className="mt-0.5 text-[6px] px-1 py-0 leading-tight">
                            {hasImage ? "Minted" : "Awaiting"}
                          </Badge>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Full 144 Grid */}
            <div>
              <h3 className="text-xl font-serif text-primary text-center mb-6">All 144 Staffs</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {(() => {
                  const gridImages: Record<number, { code: string; img: string }> = {
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
                  };
                  return Array.from({ length: 144 }, (_, i) => {
                    const staffData = gridImages[i];
                    return (
                      <Card key={i} className="border-mystical hover:shadow-elegant transition-mystical group cursor-pointer overflow-hidden">
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

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                {18} of 144 staffs minted as NFTs · Digital twins coming soon
              </p>
            </div>
          </TabsContent>

          <TabsContent value="ledger" className="space-y-6">
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
                      onClick={handleExport}
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

                  <div className="border-t border-mystical pt-4">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-6">
            <Card className="border-mystical bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-mystical">
                  Wishing Tree
                </CardTitle>
                <CardDescription>
                  Trees you dream of visiting someday
                </CardDescription>
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
    </div>
  );
};

export default GalleryPage;
