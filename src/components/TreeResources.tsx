import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, MapPin, ExternalLink, TreeDeciduous } from "lucide-react";

interface TreeProject {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  api_url: string | null;
  species: string | null;
  state: string | null;
  nation: string | null;
  bioregion: string | null;
  what3words: string | null;
  latitude: number | null;
  longitude: number | null;
  project_scope: string | null;
  created_at: string;
}

const TreeResources = () => {
  const [projects, setProjects] = useState<TreeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website_url: "",
    api_url: "",
    species: "",
    state: "",
    nation: "",
    bioregion: "",
    latitude: "",
    longitude: "",
    project_scope: "local",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("tree_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      searchQuery === "" ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecies = filterSpecies === "all" || project.species === filterSpecies;
    const matchesScope = filterScope === "all" || project.project_scope === filterScope;
    const matchesLocation =
      filterLocation === "all" ||
      project.state === filterLocation ||
      project.nation === filterLocation;
    return matchesSearch && matchesSpecies && matchesScope && matchesLocation;
  });

  const uniqueSpecies = Array.from(new Set(projects.map((p) => p.species).filter(Boolean)));
  const uniqueScopes = Array.from(new Set(projects.map((p) => p.project_scope).filter(Boolean)));
  const uniqueLocations = Array.from(
    new Set([
      ...projects.map((p) => p.state).filter(Boolean),
      ...projects.map((p) => p.nation).filter(Boolean),
    ])
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in to add projects");
      return;
    }
    try {
      const { error } = await supabase.from("tree_projects").insert({
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Project added successfully!");
      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        website_url: "",
        api_url: "",
        species: "",
        state: "",
        nation: "",
        bioregion: "",
        latitude: "",
        longitude: "",
        project_scope: "local",
      });
      fetchProjects();
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Failed to add project");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <TreeDeciduous className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-serif font-bold text-mystical mb-2">Tree Resources</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover existing databases and projects for finding ancient trees
        </p>
      </div>

      {/* Search & Filters */}
      <Card className="border-mystical bg-card/50 backdrop-blur">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterSpecies} onValueChange={setFilterSpecies}>
              <SelectTrigger>
                <SelectValue placeholder="Species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Species</SelectItem>
                {uniqueSpecies.map((species) => (
                  <SelectItem key={species} value={species!}>
                    {species}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterScope} onValueChange={setFilterScope}>
              <SelectTrigger>
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                {uniqueScopes.map((scope) => (
                  <SelectItem key={scope} value={scope!}>
                    {scope}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Showing {filteredProjects.length} of {projects.length} projects
            </span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="sacred" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Add Tree Mapping Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="res-name">Project Name *</Label>
                    <Input id="res-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="res-desc">Description</Label>
                    <Textarea id="res-desc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="res-web">Website URL</Label>
                      <Input id="res-web" type="url" value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="res-api">API URL</Label>
                      <Input id="res-api" type="url" value={formData.api_url} onChange={(e) => setFormData({ ...formData, api_url: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="res-species">Species</Label>
                      <Input id="res-species" value={formData.species} onChange={(e) => setFormData({ ...formData, species: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="res-scope">Project Scope</Label>
                      <Select value={formData.project_scope} onValueChange={(v) => setFormData({ ...formData, project_scope: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="regional">Regional</SelectItem>
                          <SelectItem value="national">National</SelectItem>
                          <SelectItem value="species-specific">Species-Specific</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="res-state">State</Label>
                      <Input id="res-state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="res-nation">Nation</Label>
                      <Input id="res-nation" value={formData.nation} onChange={(e) => setFormData({ ...formData, nation: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="res-bio">Bioregion</Label>
                      <Input id="res-bio" value={formData.bioregion} onChange={(e) => setFormData({ ...formData, bioregion: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="res-lat">Latitude</Label>
                      <Input id="res-lat" type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="res-lng">Longitude</Label>
                      <Input id="res-lng" type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} />
                    </div>
                  </div>
                  <Button type="submit" variant="sacred" className="w-full">Add Project</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Project List */}
      {loading ? (
        <p className="text-center py-8">Loading projects...</p>
      ) : filteredProjects.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {projects.length === 0 ? "No projects found. Be the first to add one!" : "No projects match your filters."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="border-mystical hover:shadow-elegant transition-mystical">
              <CardHeader>
                <CardTitle className="font-serif text-mystical flex items-start justify-between">
                  {project.name}
                  {project.website_url && (
                    <a href={project.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {project.project_scope} • {project.species || "All species"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {project.description || "No description available"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {[project.state, project.nation, project.bioregion].filter(Boolean).join(", ") || "Location not specified"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeResources;
