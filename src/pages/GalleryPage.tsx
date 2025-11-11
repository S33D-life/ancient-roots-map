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
import { toast } from "sonner";
import { MapPin, Plus, Image as ImageIcon, FileText, Music, Link as LinkIcon } from "lucide-react";

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

const GalleryPage = () => {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfferingDialogOpen, setIsOfferingDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [offeringForm, setOfferingForm] = useState({
    title: "",
    type: "photo",
    content: "",
    media_url: "",
    nft_link: "",
  });

  useEffect(() => {
    fetchTrees();
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
            Explore all mapped trees and their offerings
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
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
                className="border-mystical hover:shadow-elegant transition-mystical cursor-pointer"
                onClick={() => setSelectedTree(tree)}
              >
                <CardHeader>
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
                  <div className="space-y-2 text-sm">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
