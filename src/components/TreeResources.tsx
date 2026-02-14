import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, MapPin, ExternalLink, TreeDeciduous, Globe, Code, ChevronRight, Scroll } from "lucide-react";
import { Link } from "react-router-dom";
import treeResourcesBg from "@/assets/tree-resources-bg.jpeg";

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

const ProjectCard = ({ project }: { project: TreeProject }) => (
  <Card className="border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
    <CardHeader className="pb-3">
      <CardTitle className="font-serif text-lg text-foreground flex items-start justify-between gap-2">
        <span className="group-hover:text-primary transition-colors">{project.name}</span>
        <div className="flex gap-1.5 shrink-0">
          {project.api_url && (
            <a
              href={project.api_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              title="API endpoint"
              onClick={(e) => e.stopPropagation()}
            >
              <Code className="w-3.5 h-3.5" />
            </a>
          )}
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              title="Visit website"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </CardTitle>
      <div className="flex flex-wrap gap-1.5">
        {project.project_scope && (
          <Badge variant="secondary" className="text-xs capitalize">{project.project_scope}</Badge>
        )}
        {project.species && (
          <Badge variant="outline" className="text-xs">{project.species}</Badge>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground line-clamp-3">
        {project.description || "No description available"}
      </p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="w-3 h-3 shrink-0" />
        <span>
          {[project.state, project.nation, project.bioregion].filter(Boolean).join(", ") || "Global"}
        </span>
      </div>
      {/* Prominent link buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        {project.website_url && (
          <a
            href={project.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Visit Project
            <ChevronRight className="w-3 h-3" />
          </a>
        )}
        {project.api_url && (
          <a
            href={project.api_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-foreground/70 hover:text-primary transition-colors"
          >
            <Code className="w-3 h-3" />
            API Docs
            <ChevronRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </CardContent>
  </Card>
);

const LocationGroup = ({ label, projects }: { label: string; projects: TreeProject[] }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <h3 className="text-lg font-serif text-primary">{label}</h3>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {projects.length} project{projects.length !== 1 ? "s" : ""}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  </div>
);

const TreeResources = () => {
  const [projects, setProjects] = useState<TreeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [browseTab, setBrowseTab] = useState("all");
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

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (searchQuery === "") return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.species?.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q) ||
        p.nation?.toLowerCase().includes(q)
      );
    });
  }, [projects, searchQuery]);

  const byNation = useMemo(() => {
    const groups: Record<string, TreeProject[]> = {};
    filtered.forEach((p) => {
      const key = p.nation || "Global / Unspecified";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const byState = useMemo(() => {
    const groups: Record<string, TreeProject[]> = {};
    filtered.forEach((p) => {
      const key = p.state || "Unspecified";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const byScope = useMemo(() => {
    const groups: Record<string, TreeProject[]> = {};
    filtered.forEach((p) => {
      const key = p.project_scope || "unspecified";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

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
        name: "", description: "", website_url: "", api_url: "", species: "",
        state: "", nation: "", bioregion: "", latitude: "", longitude: "", project_scope: "local",
      });
      fetchProjects();
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Failed to add project");
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative rounded-xl overflow-hidden mb-8">
        <img src={treeResourcesBg} alt="Tree Resources" className="w-full h-48 md:h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent flex flex-col items-center justify-end pb-6">
          <TreeDeciduous className="w-10 h-10 mb-2 text-primary drop-shadow-lg" />
          <h2 className="text-2xl font-serif font-bold text-primary mb-1">Tree Projects Directory</h2>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto text-center px-4">
            Browse tree mapping projects by nation, state, or scope — with direct links to their APIs and databases
          </p>
        </div>
      </div>

      {/* Research Portals */}
      <Card className="border-primary/20 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <Scroll className="w-4 h-4 text-primary" /> Research Portals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            to="/atlas/south-africa"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-primary/10 border border-border/30 hover:border-primary/30 transition-all group"
          >
            <span className="text-2xl">🇿🇦</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-serif text-foreground group-hover:text-primary transition-colors">Champion Trees (DFFE) — South Africa Portal</p>
              <p className="text-xs text-muted-foreground">Official research layer with provenance from DFFE documents</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </Link>
        </CardContent>
      </Card>

      {/* Search bar + Add button */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search projects, species, nations…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="sacred" size="sm" className="shrink-0">
              <Plus className="w-4 h-4 mr-1" /> Add
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
                  <Label htmlFor="res-state">State / Region</Label>
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

      {/* Browse tabs */}
      <Tabs value={browseTab} onValueChange={setBrowseTab}>
        <TabsList className="bg-card/50 border border-primary/20">
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="nation">By Nation</TabsTrigger>
          <TabsTrigger value="state">By State</TabsTrigger>
          <TabsTrigger value="scope">By Scope</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading projects…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {projects.length === 0 ? "No projects yet. Be the first to add one!" : "No projects match your search."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="nation" className="mt-6 space-y-8">
          {byNation.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No projects found.</p>
          ) : (
            byNation.map(([nation, list]) => (
              <LocationGroup key={nation} label={nation} projects={list} />
            ))
          )}
        </TabsContent>

        <TabsContent value="state" className="mt-6 space-y-8">
          {byState.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No projects found.</p>
          ) : (
            byState.map(([state, list]) => (
              <LocationGroup key={state} label={state} projects={list} />
            ))
          )}
        </TabsContent>

        <TabsContent value="scope" className="mt-6 space-y-8">
          {byScope.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No projects found.</p>
          ) : (
            byScope.map(([scope, list]) => (
              <LocationGroup key={scope} label={scope.charAt(0).toUpperCase() + scope.slice(1)} projects={list} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreeResources;
