import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { escapeHtml } from "@/utils/escapeHtml";
import { Navigation, Loader2 } from "lucide-react";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  what3words: string;
  description?: string;
  estimated_age?: number | null;
}

interface TreeOfferings {
  [treeId: string]: number;
}

interface LeafletFallbackMapProps {
  trees: Tree[];
  offeringCounts?: TreeOfferings;
  className?: string;
}

/* ── Marker tier classification ── */
function getTreeTier(age: number, offerings: number) {
  if (age >= 100) return "ancient";
  if (offerings >= 3) return "storied";
  if (offerings >= 1 || age >= 50) return "notable";
  return "seedling";
}

/* ── SVG marker builder ── */
function buildTreeSvg(tier: string): string {
  const palette: Record<string, { trunk: string; canopy: string; stroke: string; glow: string; ring?: string }> = {
    ancient:  { trunk: "hsl(30,35%,28%)", canopy: "hsl(120,50%,30%)", stroke: "hsl(42,90%,55%)", glow: "hsl(42,90%,55%)", ring: "hsl(42,80%,50%)" },
    storied:  { trunk: "hsl(30,30%,30%)", canopy: "hsl(130,45%,32%)", stroke: "hsl(42,70%,48%)", glow: "hsl(42,70%,48%)", ring: "hsl(42,60%,45%)" },
    notable:  { trunk: "hsl(28,25%,32%)", canopy: "hsl(125,40%,34%)", stroke: "hsl(45,55%,42%)", glow: "hsl(45,55%,42%)" },
    seedling: { trunk: "hsl(25,20%,35%)", canopy: "hsl(120,35%,38%)", stroke: "hsl(45,40%,38%)", glow: "hsl(45,30%,35%)" },
  };
  const p = palette[tier] || palette.seedling;

  const crownRing = p.ring
    ? `<circle cx="20" cy="20" r="19" fill="none" stroke="${p.ring}" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.5"/>`
    : "";

  const ancientDot = tier === "ancient"
    ? `<circle cx="20" cy="5" r="2.5" fill="hsl(42,95%,60%)" opacity="0.9"><animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite"/></circle>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    ${crownRing}
    <circle cx="20" cy="20" r="16" fill="${p.canopy}" stroke="${p.stroke}" stroke-width="2"/>
    <!-- Canopy detail leaves -->
    <ellipse cx="15" cy="15" rx="6" ry="5" fill="${p.canopy}" opacity="0.7" transform="rotate(-15 15 15)"/>
    <ellipse cx="25" cy="14" rx="5" ry="4.5" fill="${p.canopy}" opacity="0.6" transform="rotate(10 25 14)"/>
    <ellipse cx="20" cy="12" rx="7" ry="5" fill="${p.canopy}" opacity="0.5"/>
    <!-- Trunk -->
    <rect x="17.5" y="26" width="5" height="8" rx="1.5" fill="${p.trunk}"/>
    <!-- Root lines -->
    <line x1="17" y1="33" x2="13" y2="36" stroke="${p.trunk}" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="23" y1="33" x2="27" y2="36" stroke="${p.trunk}" stroke-width="1.2" stroke-linecap="round"/>
    ${ancientDot}
  </svg>`;
}

function getMarkerSize(tier: string) {
  switch (tier) {
    case "ancient": return 42;
    case "storied": return 36;
    case "notable": return 32;
    default: return 26;
  }
}

/* ── Popup HTML builder ── */
function buildPopupHtml(tree: Tree, offerings: number, age: number): string {
  const ageBadge = age > 0
    ? `<span style="display:inline-block;margin-left:6px;padding:2px 8px;font-size:10px;border-radius:999px;background:hsla(42,80%,50%,0.15);color:hsl(42,80%,60%);border:1px solid hsla(42,80%,50%,0.3);font-family:sans-serif;">~${age} yrs</span>`
    : "";

  const offeringLine = offerings > 0
    ? `<div style="margin:8px 0 0;display:flex;align-items:center;gap:5px;"><span style="font-size:11px;color:hsl(42,80%,60%);">✦</span><span style="font-size:11px;color:hsl(42,60%,55%);font-family:sans-serif;">${offerings} offering${offerings !== 1 ? "s" : ""}</span></div>`
    : `<div style="margin:8px 0 0;font-size:11px;color:hsl(0,0%,50%);font-style:italic;font-family:sans-serif;">No offerings yet — be the first</div>`;

  const desc = tree.description
    ? `<p style="margin:8px 0 0;font-size:11px;color:hsl(0,0%,70%);line-height:1.5;font-family:sans-serif;">${escapeHtml(tree.description.substring(0, 140))}${tree.description.length > 140 ? "…" : ""}</p>`
    : "";

  return `
    <div style="padding:14px 16px;font-family:'Cinzel',serif;min-width:230px;max-width:280px;background:hsl(30,15%,10%);border-radius:10px;border:1px solid hsla(42,40%,30%,0.5);">
      <h3 style="margin:0 0 2px;font-size:15px;color:hsl(45,80%,60%);line-height:1.3;font-weight:700;">${escapeHtml(tree.name)}${ageBadge}</h3>
      <p style="margin:0;font-size:12px;color:hsl(120,40%,65%);font-style:italic;">${escapeHtml(tree.species)}</p>
      ${tree.what3words ? `<p style="margin:5px 0 0;font-size:11px;color:hsl(45,50%,50%);font-family:sans-serif;">📍 ${escapeHtml(tree.what3words)}</p>` : ""}
      ${desc}
      ${offeringLine}
      <a href="/tree/${encodeURIComponent(tree.id)}" style="display:block;margin-top:12px;padding:9px 0;text-align:center;font-size:12px;color:hsl(80,20%,8%);background:linear-gradient(135deg,hsl(42,88%,50%),hsl(45,100%,60%));border-radius:8px;text-decoration:none;letter-spacing:0.08em;font-weight:700;font-family:sans-serif;">Visit Ancient Friend ⟶</a>
      <div style="margin-top:8px;display:flex;gap:6px;justify-content:center;">
        <a href="/tree/${encodeURIComponent(tree.id)}?add=photo" style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;font-size:15px;text-decoration:none;border:1px solid hsla(120,60%,50%,0.25);border-radius:8px;background:hsla(120,40%,20%,0.3);" title="Add Memory">📷</a>
        <a href="/tree/${encodeURIComponent(tree.id)}?add=song" style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;font-size:15px;text-decoration:none;border:1px solid hsla(200,60%,50%,0.25);border-radius:8px;background:hsla(200,40%,20%,0.3);" title="Add Song">🎵</a>
        <a href="/tree/${encodeURIComponent(tree.id)}?add=story" style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;font-size:15px;text-decoration:none;border:1px solid hsla(280,60%,50%,0.25);border-radius:8px;background:hsla(280,40%,20%,0.3);" title="Add Musing">💭</a>
      </div>
    </div>
  `;
}

/* ── Cluster style ── */
const CLUSTER_CSS = `
  .leaflet-tree-marker { background: transparent !important; border: none !important; }

  .tree-cluster {
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    font-family: 'Cinzel', serif; font-weight: 700;
    color: hsl(45, 80%, 60%);
    text-shadow: 0 1px 3px rgba(0,0,0,0.6);
    border: 2px solid hsla(42, 70%, 50%, 0.6);
    box-shadow: 0 0 12px hsla(42, 70%, 45%, 0.25), inset 0 0 8px hsla(120, 40%, 20%, 0.3);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .tree-cluster:hover {
    transform: scale(1.1);
    box-shadow: 0 0 20px hsla(42, 70%, 45%, 0.45), inset 0 0 8px hsla(120, 40%, 20%, 0.3);
  }
  .tree-cluster-small  { width:36px; height:36px; font-size:12px; background: hsla(120,40%,20%,0.85); }
  .tree-cluster-medium { width:44px; height:44px; font-size:13px; background: hsla(120,45%,18%,0.88); }
  .tree-cluster-large  { width:52px; height:52px; font-size:14px; background: hsla(120,50%,16%,0.9); }

  @keyframes ancientPulse {
    0%, 100% { filter: drop-shadow(0 0 4px hsla(42, 90%, 55%, 0.3)); transform: scale(1); }
    50% { filter: drop-shadow(0 0 12px hsla(42, 90%, 55%, 0.7)); transform: scale(1.05); }
  }
  .marker-ancient { animation: ancientPulse 4s ease-in-out infinite; }

  .atlas-leaflet-popup .leaflet-popup-content-wrapper {
    background: hsl(30, 15%, 10%) !important;
    border: 1px solid hsla(42, 40%, 30%, 0.5) !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px hsla(42, 60%, 40%, 0.1) !important;
    padding: 0 !important;
  }
  .atlas-leaflet-popup .leaflet-popup-content { margin: 0 !important; }
  .atlas-leaflet-popup .leaflet-popup-tip {
    background: hsl(30, 15%, 10%) !important;
    border: 1px solid hsla(42, 40%, 30%, 0.5) !important;
  }
  .atlas-leaflet-popup .leaflet-popup-close-button {
    color: hsl(42, 60%, 55%) !important;
    font-size: 18px !important;
    top: 6px !important;
    right: 8px !important;
  }

  .leaflet-tile-pane { filter: sepia(0.3) saturate(0.85) brightness(0.88) contrast(1.05); }
  @media (max-width: 768px) { .leaflet-tile-pane { filter: sepia(0.15) brightness(0.92); } }
`;

/**
 * Enriched Leaflet map with marker clustering, tiered tree icons, and vintage styling.
 * Automatic fallback when WebGL is unavailable.
 */
const LeafletFallbackMap = ({ trees, offeringCounts = {}, className }: LeafletFallbackMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      attributionControl: false,
      zoomControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { attribution: '&copy; OSM &copy; CARTO', maxZoom: 19, subdomains: "abcd" }
    ).addTo(map);

    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // ── Cluster group ──
    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let sizeClass = "tree-cluster-small";
        if (count >= 20) sizeClass = "tree-cluster-large";
        else if (count >= 5) sizeClass = "tree-cluster-medium";
        return L.divIcon({
          html: `<div class="tree-cluster ${sizeClass}">${count}</div>`,
          className: "leaflet-tree-marker",
          iconSize: L.point(52, 52),
        });
      },
    });

    // ── Add tree markers ──
    trees.forEach((tree) => {
      const offerings = offeringCounts[tree.id] || 0;
      const age = tree.estimated_age || 0;
      const tier = getTreeTier(age, offerings);
      const size = getMarkerSize(tier);
      const svgContent = buildTreeSvg(tier);
      const svgBase64 = btoa(svgContent);

      const icon = L.divIcon({
        className: "leaflet-tree-marker",
        html: `<div class="${tier === 'ancient' ? 'marker-ancient' : ''}" style="width:${size}px;height:${size}px;background-image:url('data:image/svg+xml;base64,${svgBase64}');background-size:contain;cursor:pointer;transition:filter 0.3s,transform 0.3s;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([tree.latitude, tree.longitude], { icon });
      marker.bindPopup(buildPopupHtml(tree, offerings, age), {
        className: "atlas-leaflet-popup",
        maxWidth: 300,
        closeButton: true,
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    // Fit bounds if trees exist
    if (trees.length > 0) {
      const bounds = L.latLngBounds(trees.map((t) => [t.latitude, t.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [trees, offeringCounts]);

  const handleFindMe = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapRef.current?.flyTo([latitude, longitude], 12, { duration: 1.5 });
        // Drop a user marker
        const userIcon = L.divIcon({
          className: "leaflet-tree-marker",
          html: `<div style="width:20px;height:20px;border-radius:50%;background:hsl(42,90%,55%);border:3px solid hsl(30,15%,10%);box-shadow:0 0 12px hsla(42,90%,55%,0.6);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        L.marker([latitude, longitude], { icon: userIcon })
          .bindPopup(`<div style="padding:8px;font-family:sans-serif;font-size:12px;color:hsl(45,60%,50%);background:hsl(30,15%,10%);border-radius:6px;">📍 You are here</div>`, { className: "atlas-leaflet-popup" })
          .addTo(mapRef.current!);
        setLocating(false);
      },
      () => { setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <div className={className || "absolute inset-0"} style={{ height: '100dvh' }}>
      <div ref={containerRef} className="w-full h-full" />

      <style>{CLUSTER_CSS}</style>

      {/* Atmospheric vignette — lighter on mobile */}
      <div
        className="absolute inset-0 pointer-events-none z-[400] hidden md:block"
        style={{ background: "radial-gradient(ellipse at center, transparent 55%, hsla(30, 20%, 8%, 0.35) 100%)" }}
      />

      {/* Top edge shadow — hidden on mobile for max map visibility */}
      <div
        className="absolute top-0 left-0 right-0 h-20 pointer-events-none z-[400] hidden md:block"
        style={{ background: "linear-gradient(to bottom, hsla(30, 20%, 8%, 0.4), transparent)" }}
      />

      {/* Find Me button */}
      <button
        onClick={handleFindMe}
        disabled={locating}
        className="absolute top-20 right-3 z-[1000] flex items-center justify-center w-10 h-10 rounded-full transition-all hover:brightness-125 active:scale-95"
        style={{
          background: "hsla(30, 30%, 12%, 0.9)",
          color: "hsl(42, 60%, 60%)",
          border: "1px solid hsla(42, 40%, 30%, 0.5)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
        title="Find my location"
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
      </button>

      {/* Lite Mode badge */}
      <div
        className="absolute bottom-6 left-4 z-[1000] px-3 py-1.5 rounded-full font-serif text-xs flex items-center gap-1.5"
        style={{
          background: "hsla(30, 30%, 12%, 0.88)",
          color: "hsl(42, 60%, 60%)",
          border: "1px solid hsla(42, 40%, 30%, 0.5)",
          backdropFilter: "blur(6px)",
        }}
      >
        🍃 Lite Mode · {trees.length} ancient friends
      </div>
    </div>
  );
};

export default LeafletFallbackMap;
