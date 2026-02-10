import { useState, useEffect, useRef } from "react";
import { escapeHtml } from "@/utils/escapeHtml";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, MapPin, ExternalLink } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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

const GrovesPage = () => {
  const [projects, setProjects] = useState<TreeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapToken, setMapToken] = useState<string>('pk.eyJ1IjoiZWR0aHVybG93IiwiYSI6ImNtaHVqYmpodzAwaTEybHNiejQ0dWF1dTcifQ.4hKTe_0HtkKJa3CCjbHMMg');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSpecies, setFilterSpecies] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
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


  useEffect(() => {
    if (!mapContainer.current || map.current || !mapToken) return;

    mapboxgl.accessToken = mapToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [-98, 39],
      zoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapToken]);

  // Filter projects based on search and filters
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = searchQuery === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecies = filterSpecies === 'all' || project.species === filterSpecies;
    const matchesScope = filterScope === 'all' || project.project_scope === filterScope;
    const matchesLocation = filterLocation === 'all' || 
      project.state === filterLocation || 
      project.nation === filterLocation;
    
    return matchesSearch && matchesSpecies && matchesScope && matchesLocation;
  });

  // Get unique values for filters
  const uniqueSpecies = Array.from(new Set(projects.map(p => p.species).filter(Boolean)));
  const uniqueScopes = Array.from(new Set(projects.map(p => p.project_scope).filter(Boolean)));
  const uniqueLocations = Array.from(new Set([
    ...projects.map(p => p.state).filter(Boolean),
    ...projects.map(p => p.nation).filter(Boolean)
  ]));

  useEffect(() => {
    if (!map.current || filteredProjects.length === 0) return;

    // Clear existing markers
    const markers = document.querySelectorAll(".project-marker");
    markers.forEach((marker) => marker.remove());

    // Add markers for each filtered project
    filteredProjects.forEach((project) => {
      if (project.latitude && project.longitude) {
        const el = document.createElement("div");
        el.className = "project-marker";
        el.style.cssText = `
          background-color: hsl(var(--primary));
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid hsl(var(--background));
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${escapeHtml(project.name)}</h3>
            <p style="font-size: 12px; margin-bottom: 4px;">${escapeHtml(project.description || "")}</p>
            <p style="font-size: 11px; color: #666;">${escapeHtml(project.project_scope || "")} | ${escapeHtml(project.species || "All species")}</p>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([project.longitude, project.latitude])
          .setPopup(popup)
          .addTo(map.current!);
      }
    });
  }, [filteredProjects]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-serif font-bold text-mystical mb-2">
                Tree Mapping Resources
              </h1>
              <p className="text-muted-foreground">
                Discover existing databases and projects for finding ancient trees
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="sacred" size="lg">
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
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="api_url">API URL</Label>
                    <Input
                      id="api_url"
                      type="url"
                      value={formData.api_url}
                      onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="species">Species</Label>
                    <Input
                      id="species"
                      value={formData.species}
                      onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="project_scope">Project Scope</Label>
                    <Select
                      value={formData.project_scope}
                      onValueChange={(value) => setFormData({ ...formData, project_scope: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nation">Nation</Label>
                    <Input
                      id="nation"
                      value={formData.nation}
                      onChange={(e) => setFormData({ ...formData, nation: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bioregion">Bioregion</Label>
                    <Input
                      id="bioregion"
                      value={formData.bioregion}
                      onChange={(e) => setFormData({ ...formData, bioregion: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" variant="sacred" className="w-full">
                  Add Project
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-mystical mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search Projects</Label>
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filterSpecies">Filter by Species</Label>
                <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                  <SelectTrigger id="filterSpecies">
                    <SelectValue />
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
              </div>
              <div>
                <Label htmlFor="filterScope">Filter by Scope</Label>
                <Select value={filterScope} onValueChange={setFilterScope}>
                  <SelectTrigger id="filterScope">
                    <SelectValue />
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
            </div>
            <div className="mt-4">
              <Label htmlFor="filterLocation">Filter by Location</Label>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger id="filterLocation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location!}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredProjects.length} of {projects.length} projects
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-0">
              <div
                ref={mapContainer}
                className="w-full h-[600px] rounded-lg border border-mystical shadow-lg"
              />
          </TabsContent>

          <TabsContent value="list" className="mt-0">
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
                          <a
                            href={project.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
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
                          {[project.state, project.nation, project.bioregion]
                            .filter(Boolean)
                            .join(", ") || "Location not specified"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GrovesPage;
