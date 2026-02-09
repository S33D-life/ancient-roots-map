import { useEffect, useRef, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import MapSearch from "./MapSearch";
import MapFilters, { GroveScale } from "./MapFilters";
import TreeImportExport from "./TreeImportExport";
import ConversionStatus from "./ConversionStatus";
import FindMeButton from "./FindMeButton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

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
  nation?: string;
}

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Determine continent from coordinates (rough bounding boxes)
function getContinent(lat: number, lng: number): string {
  if (lat > 15 && lat < 72 && lng > -25 && lng < 45) return "Europe";
  if (lat > -35 && lat < 37 && lng > -20 && lng < 55) return "Africa";
  if (lat > 5 && lat < 78 && lng > 45 && lng < 180) return "Asia";
  if (lat > -50 && lat < 5 && lng > 90 && lng < 180) return "Oceania";
  if (lat > -60 && lat < -10 && lng > 110 && lng < 180) return "Oceania";
  if (lat > 15 && lat < 85 && lng > -170 && lng < -50) return "North America";
  if (lat > -60 && lat < 15 && lng > -90 && lng < -30) return "South America";
  return "Other";
}

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [viewMode, setViewMode] = useState<string>("collective");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [groveScale, setGroveScale] = useState<GroveScale>("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Get user location for local grove
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      );
    }
  }, []);

  // Fetch trees from database
  useEffect(() => {
    const fetchTrees = async () => {
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching trees:', error);
        toast({ title: "Error loading trees", description: "Failed to load tree data", variant: "destructive" });
      } else {
        setTrees(data || []);
      }
    };

    fetchTrees();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trees' }, () => fetchTrees())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  // Species counts for filter panel
  const treeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trees.forEach((t) => {
      const key = t.species.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [trees]);

  // Apply filters
  const filteredTrees = useMemo(() => {
    let filtered = trees;

    // View mode
    if (viewMode === "personal" && userId) {
      filtered = filtered.filter((t) => t.created_by === userId);
    }

    // Species filter
    if (speciesFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.species.toLowerCase() === speciesFilter.toLowerCase()
      );
    }

    // Grove scale filtering
    if (groveScale !== "all" && speciesFilter !== "all") {
      const speciesTrees = filtered;

      if (groveScale === "local") {
        // 12 nearest of same species from user location or map center
        const center = userLocation || (map.current ? map.current.getCenter() : null);
        if (center) {
          const withDist = speciesTrees.map((t) => ({
            ...t,
            dist: haversineKm(center.lat, center.lng, t.latitude, t.longitude),
          }));
          withDist.sort((a, b) => a.dist - b.dist);
          filtered = withDist.slice(0, 12);
        }
      } else if (groveScale === "regional") {
        // Within 200km of user/center
        const center = userLocation || (map.current ? map.current.getCenter() : null);
        if (center) {
          filtered = speciesTrees.filter(
            (t) => haversineKm(center.lat, center.lng, t.latitude, t.longitude) <= 200
          );
        }
      } else if (groveScale === "national") {
        // Same nation — requires user location to determine country, or just group by nation
        // We show all of the same species in the same nation as the user's nearest tree
        const center = userLocation || (map.current ? map.current.getCenter() : null);
        if (center && speciesTrees.length > 0) {
          // Find nearest tree to determine nation
          let nearest = speciesTrees[0];
          let nearestDist = Infinity;
          speciesTrees.forEach((t) => {
            const d = haversineKm(center.lat, center.lng, t.latitude, t.longitude);
            if (d < nearestDist) { nearestDist = d; nearest = t; }
          });
          if (nearest.nation) {
            filtered = speciesTrees.filter((t) => t.nation === nearest.nation);
          }
        }
      } else if (groveScale === "continental") {
        const center = userLocation || (map.current ? map.current.getCenter() : null);
        if (center) {
          const userContinent = getContinent(center.lat, center.lng);
          filtered = speciesTrees.filter(
            (t) => getContinent(t.latitude, t.longitude) === userContinent
          );
        }
      }
    }

    return filtered;
  }, [trees, viewMode, speciesFilter, groveScale, userId, userLocation]);

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

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }));

    return () => { map.current?.remove(); };
  }, []);

  // Add tree markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredTrees.forEach((tree) => {
      const el = document.createElement('div');
      el.className = 'tree-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iaHNsKDEyMCwgNDAlLCAyNSUpIiBzdHJva2U9ImhzbCg0NSwgODAlLCA2MCUpIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cGF0aCBkPSJNMTYgOEMxMy44IDggMTIgOS44IDEyIDEyQzEyIDEzLjUgMTIuNyAxNC44IDEzLjggMTUuNkMxMi43IDE2LjQgMTIgMTcuNyAxMiAxOS4yQzEyIDIxLjQgMTMuOCAyMy4yIDE2IDIzLjJDMTguMiAyMy4yIDIwIDIxLjQgMjAgMTkuMkMyMCAxNy43IDE5LjMgMTYuNCAxOC4yIDE1LjZDMTkuMyAxNC44IDIwIDEzLjUgMjAgMTJDMjAgOS44IDE4LjIgOCAxNiA4WiIgZmlsbD0iaHNsKDEyMCwgNjAlLCAzNSUpIi8+CiAgPHJlY3QgeD0iMTQuNSIgeT0iMjIiIHdpZHRoPSIzIiBoZWlnaHQ9IjYiIGZpbGw9ImhzbCgzMCwgNDAlLCAzMCUpIi8+Cjwvc3ZnPg==');
        background-size: contain;
        cursor: pointer;
        transition: filter 0.2s;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.filter = 'brightness(1.4) drop-shadow(0 0 4px hsl(45, 80%, 60%))';
      });
      el.addEventListener('mouseleave', () => {
        el.style.filter = 'none';
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
        map.current?.flyTo({ center: [tree.longitude, tree.latitude], zoom: 15, duration: 2000 });
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if grove scale is active and we have trees
    if (groveScale !== "all" && filteredTrees.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredTrees.forEach((t) => bounds.extend([t.longitude, t.latitude]));
      map.current.fitBounds(bounds, { padding: 80, duration: 1500 });
    }
  }, [filteredTrees, groveScale]);

  const handleLocationSelect = (lat: number, lng: number, what3words: string) => {
    if (map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 15, duration: 2000 });
    }
  };

  return (
    <div className="relative w-full h-screen">
      <ConversionStatus />

      {/* Top bar: view toggle + filters + count */}
      <Card className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/95 backdrop-blur border-border shadow-lg">
        <div className="flex items-center gap-3 p-3">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="bg-muted">
              <TabsTrigger value="collective">Collective</TabsTrigger>
              <TabsTrigger value="personal">Personal Groves</TabsTrigger>
            </TabsList>
          </Tabs>

          <MapFilters
            speciesFilter={speciesFilter}
            onSpeciesChange={setSpeciesFilter}
            groveScale={groveScale}
            onGroveScaleChange={setGroveScale}
            treeCounts={treeCounts}
            totalTrees={trees.length}
          />

          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredTrees.length} {filteredTrees.length === 1 ? 'tree' : 'trees'}
            {groveScale !== "all" && speciesFilter !== "all" && (
              <span className="text-primary ml-1">({groveScale} grove)</span>
            )}
          </span>
        </div>
      </Card>

      <MapSearch onLocationSelect={handleLocationSelect} />

      <div className="absolute bottom-4 left-4 z-10">
        <FindMeButton
          onLocationFound={(lat, lng) => {
            setUserLocation({ lat, lng });
            map.current?.flyTo({ center: [lng, lat], zoom: 18, duration: 2000 });
          }}
        />
      </div>

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
