import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import MapSearch from "./MapSearch";
import TreeImportExport from "./TreeImportExport";
import { useToast } from "@/hooks/use-toast";

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
}

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [trees, setTrees] = useState<Tree[]>([]);
  const { toast } = useToast();

  // Fetch trees from database
  useEffect(() => {
    const fetchTrees = async () => {
      const { data, error } = await supabase
        .from('trees')
        .select('*');

      if (error) {
        console.error('Error fetching trees:', error);
        toast({
          title: "Error loading trees",
          description: "Failed to load tree data",
          variant: "destructive",
        });
      } else {
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
    if (!map.current || trees.length === 0) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.tree-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add new markers
    trees.forEach((tree) => {
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
        closeButton: false,
        className: 'tree-popup',
      }).setHTML(`
        <div style="padding: 8px; font-family: 'Cinzel', serif;">
          <h3 style="margin: 0 0 4px 0; font-size: 16px; color: hsl(45, 80%, 60%);">${tree.name}</h3>
          <p style="margin: 0 0 2px 0; font-size: 12px; color: hsl(120, 40%, 70%);">${tree.species}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: hsl(45, 60%, 50%);">📍 ${tree.what3words}</p>
          ${tree.description ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: hsl(0, 0%, 70%);">${tree.description.substring(0, 100)}...</p>` : ''}
          <a href="/tree/${tree.id}" style="display: inline-block; margin-top: 8px; font-size: 11px; color: hsl(45, 80%, 60%); text-decoration: underline;">View Details</a>
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
  }, [trees]);

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
      <MapSearch onLocationSelect={handleLocationSelect} />
      <TreeImportExport />
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
