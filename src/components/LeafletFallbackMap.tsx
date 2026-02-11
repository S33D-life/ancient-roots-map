import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  what3words: string;
  description?: string;
}

interface LeafletFallbackMapProps {
  trees: Tree[];
  className?: string;
}

/**
 * Lightweight Leaflet map used as an automatic fallback
 * when WebGL is unavailable and MapLibre cannot render.
 */
const LeafletFallbackMap = ({ trees, className }: LeafletFallbackMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Custom tree icon
    const treeIcon = L.divIcon({
      className: "leaflet-tree-marker",
      html: `<div style="width:24px;height:24px;border-radius:50%;background:hsl(120,40%,25%);border:2px solid hsl(42,80%,55%);box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    trees.forEach((tree) => {
      L.marker([tree.latitude, tree.longitude], { icon: treeIcon })
        .bindPopup(
          `<div style="font-family:serif;padding:4px;">
            <strong>${tree.name}</strong><br/>
            <em>${tree.species}</em><br/>
            ${tree.what3words ? `<small>📍 ${tree.what3words}</small><br/>` : ""}
            <a href="/tree/${tree.id}" style="color:hsl(42,80%,55%);">View Ancient Friend →</a>
          </div>`
        )
        .addTo(map);
    });

    mapRef.current = map;

    // Fix leaflet's default icon path issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [trees]);

  return (
    <div className={className || "absolute inset-0"}>
      <div ref={containerRef} className="w-full h-full" />
      <div
        className="absolute top-4 left-4 z-[1000] px-3 py-1.5 rounded-full font-serif text-xs"
        style={{
          background: "hsla(30, 30%, 12%, 0.85)",
          color: "hsl(42, 60%, 60%)",
          border: "1px solid hsla(42, 40%, 30%, 0.5)",
          backdropFilter: "blur(4px)",
        }}
      >
        🍃 Lite Mode — WebGL unavailable
      </div>
    </div>
  );
};

export default LeafletFallbackMap;
