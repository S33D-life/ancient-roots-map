import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import MapSearch from "./MapSearch";
import TreeImportExport from "./TreeImportExport";
import ConversionStatus from "./ConversionStatus";
import FindMeButton from "./FindMeButton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

const GOOGLE_MAPS_API_KEY = 'AIzaSyA1Zpu0X_c1buzTMuJh29j1WHmNibdYefA';

// Use a vintage/antique map style
const VINTAGE_MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  what3words: string;
  description?: string;
  created_by?: string;
}

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [filteredTrees, setFilteredTrees] = useState<Tree[]>([]);
  const [viewMode, setViewMode] = useState<string>("collective");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Fetch trees from database
  useEffect(() => {
    const fetchTrees = async () => {
      const { data, error } = await supabase
        .from('trees')
        .select('*, created_by')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching trees:', error);
        toast({
          title: "Error loading trees",
          description: "Failed to load tree data",
          variant: "destructive",
        });
      } else {
        console.log(`Loaded ${data?.length || 0} trees with coordinates`);
        setTrees(data || []);
      }
    };

    fetchTrees();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trees'
        },
        () => {
          fetchTrees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Filter trees based on view mode and species
  useEffect(() => {
    let filtered = trees;

    // Filter by view mode
    if (viewMode === "personal" && userId) {
      filtered = filtered.filter(tree => tree.created_by === userId);
    }

    // Filter by species
    if (speciesFilter !== "all") {
      filtered = filtered.filter(tree => tree.species === speciesFilter);
    }

    setFilteredTrees(filtered);
  }, [trees, viewMode, speciesFilter, userId]);

  // Get unique species for filter
  const uniqueSpecies = Array.from(new Set(trees.map(tree => tree.species))).sort();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiZWR0aHVybG93IiwiYSI6ImNtaHVqYmpodzAwaTEybHNiejQ0dWF1dTcifQ.4hKTe_0HtkKJa3CCjbHMMg';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: VINTAGE_MAP_STYLE,
      center: [0, 20],
      zoom: 2,
      attributionControl: false,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
      })
    );

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add tree markers
  useEffect(() => {
    if (!map.current || filteredTrees.length === 0) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.tree-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add new markers
    filteredTrees.forEach((tree) => {
      const el = document.createElement('div');
      el.className = 'tree-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iaHNsKDEyMCwgNDAlLCAyNSUpIiBzdHJva2U9ImhzbCg0NSwgODAlLCA2MCUpIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cGF0aCBkPSJNMTYgOEMxMy44IDggMTIgOS44IDEyIDEyQzEyIDEzLjUgMTIuNyAxNC44IDEzLjggMTUuNkMxMi43IDE2LjQgMTIgMTcuNyAxMiAxOS4yQzEyIDIxLjQgMTMuOCAyMy4yIDE2IDIzLjJDMTguMiAyMy4yIDIwIDIxLjQgMjAgMTkuMkMyMCAxNy43IDE5LjMgMTYuNCAxOC4yIDE1LjZDMTkuMyAxNC44IDIwIDEzLjUgMjAgMTJDMjAgOS44IDE4LjIgOCAxNiA4WiIgZmlsbD0iaHNsKDEyMCwgNjAlLCAzNSUpIi8+CiAgPHJlY3QgeD0iMTQuNSIgeT0iMjIiIHdpZHRoPSIzIiBoZWlnaHQ9IjYiIGZpbGw9ImhzbCgzMCwgNDAlLCAzMCUpIi8+Cjwvc3ZnPg==');
        background-size: contain;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        className: 'tree-popup',
      }).setHTML(`
        <div style="padding: 8px; font-family: 'Cinzel', serif; min-width: 200px;">
          <h3 style="margin: 0 0 4px 0; font-size: 16px; color: hsl(45, 80%, 60%);">${tree.name}</h3>
          <p style="margin: 0 0 2px 0; font-size: 12px; color: hsl(120, 40%, 70%);">${tree.species}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: hsl(45, 60%, 50%);">📍 ${tree.what3words}</p>
          ${tree.description ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: hsl(0, 0%, 70%);">${tree.description.substring(0, 100)}...</p>` : ''}
          <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="/tree/${tree.id}" style="font-size: 11px; color: hsl(45, 80%, 60%); text-decoration: underline;">View Details</a>
            <a href="/tree/${tree.id}?add=photo" style="font-size: 11px; color: hsl(120, 60%, 50%);">+ Memory</a>
            <a href="/tree/${tree.id}?add=song" style="font-size: 11px; color: hsl(200, 60%, 50%);">+ Song</a>
            <a href="/tree/${tree.id}?add=story" style="font-size: 11px; color: hsl(280, 60%, 50%);">+ Musing</a>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([tree.longitude, tree.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        map.current?.flyTo({
          center: [tree.longitude, tree.latitude],
          zoom: 15,
          duration: 2000,
        });
      });
    });
  }, [filteredTrees]);

  const handleLocationSelect = (lat: number, lng: number, what3words: string) => {
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 2000,
      });
    }
  };

  return (
    <div className="relative w-full h-screen">
      <ConversionStatus />
      
      {/* Tabs and filters at top */}
      <Card className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/95 backdrop-blur border-border shadow-lg">
        <div className="flex items-center gap-4 p-3">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="bg-muted">
              <TabsTrigger value="collective">Collective</TabsTrigger>
              <TabsTrigger value="personal">Personal Groves</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by species" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              <SelectItem value="all">All Species</SelectItem>
              {uniqueSpecies.map(species => (
                <SelectItem key={species} value={species}>{species}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-sm text-muted-foreground">
            {filteredTrees.length} {filteredTrees.length === 1 ? 'tree' : 'trees'}
          </span>
        </div>
      </Card>

      <MapSearch onLocationSelect={handleLocationSelect} />
      
      {/* Find Me button */}
      <div className="absolute bottom-4 left-4 z-10">
        <FindMeButton 
          onLocationFound={(lat, lng) => {
            map.current?.flyTo({
              center: [lng, lat],
              zoom: 18,
              duration: 2000,
            });
          }}
        />
      </div>
      
      {/* Import/Export moved to bottom right */}
      <div className="absolute bottom-4 right-4 z-10">
        <TreeImportExport />
      </div>
      
      <div ref={mapContainer} className="absolute inset-0" />
      
      <style>{`
        .tree-popup .mapboxgl-popup-content {
          background: hsl(120, 40%, 15%);
          border: 1px solid hsl(45, 60%, 40%);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }
        .tree-popup .mapboxgl-popup-tip {
          border-top-color: hsl(120, 40%, 15%);
        }
      `}</style>
    </div>
  );
};

export default Map;
