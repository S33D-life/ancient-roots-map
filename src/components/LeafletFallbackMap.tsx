import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { escapeHtml } from "@/utils/escapeHtml";
import { Navigation, Loader2 } from "lucide-react";
import LiteMapFilters, { LitePerspective } from "./LiteMapFilters";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  what3words: string;
  description?: string;
  estimated_age?: number | null;
  created_by?: string;
}

interface TreeOfferings {
  [treeId: string]: number;
}

interface LeafletFallbackMapProps {
  trees: Tree[];
  offeringCounts?: TreeOfferings;
  className?: string;
  userId?: string | null;
}

/* ── Marker tier classification ── */
type Tier = "ancient" | "storied" | "notable" | "seedling";

function getTreeTier(age: number, offerings: number): Tier {
  if (age >= 100) return "ancient";
  if (offerings >= 3) return "storied";
  if (offerings >= 1 || age >= 50) return "notable";
  return "seedling";
}

/* ── Pre-built SVG data URIs cached per tier ── */
const SVG_CACHE: Record<string, string> = {};

function getSvgDataUri(tier: Tier): string {
  if (SVG_CACHE[tier]) return SVG_CACHE[tier];

  const palette = {
    ancient:  { trunk: "hsl(30,35%,28%)", canopy: "hsl(120,50%,30%)", stroke: "hsl(42,90%,55%)", ring: "hsl(42,80%,50%)" },
    storied:  { trunk: "hsl(30,30%,30%)", canopy: "hsl(130,45%,32%)", stroke: "hsl(42,70%,48%)", ring: "hsl(42,60%,45%)" },
    notable:  { trunk: "hsl(28,25%,32%)", canopy: "hsl(125,40%,34%)", stroke: "hsl(45,55%,42%)", ring: "" },
    seedling: { trunk: "hsl(25,20%,35%)", canopy: "hsl(120,35%,38%)", stroke: "hsl(45,40%,38%)", ring: "" },
  }[tier];

  const crownRing = palette.ring
    ? `<circle cx="20" cy="20" r="19" fill="none" stroke="${palette.ring}" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.5"/>`
    : "";
  const dot = tier === "ancient"
    ? `<circle cx="20" cy="5" r="2.5" fill="hsl(42,95%,60%)" opacity="0.85"/>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${crownRing}<circle cx="20" cy="20" r="16" fill="${palette.canopy}" stroke="${palette.stroke}" stroke-width="2"/><ellipse cx="15" cy="15" rx="6" ry="5" fill="${palette.canopy}" opacity="0.6" transform="rotate(-15 15 15)"/><ellipse cx="25" cy="14" rx="5" ry="4.5" fill="${palette.canopy}" opacity="0.5" transform="rotate(10 25 14)"/><ellipse cx="20" cy="12" rx="7" ry="5" fill="${palette.canopy}" opacity="0.4"/><rect x="17.5" y="26" width="5" height="8" rx="1.5" fill="${palette.trunk}"/><line x1="17" y1="33" x2="13" y2="36" stroke="${palette.trunk}" stroke-width="1.2" stroke-linecap="round"/><line x1="23" y1="33" x2="27" y2="36" stroke="${palette.trunk}" stroke-width="1.2" stroke-linecap="round"/>${dot}</svg>`;

  SVG_CACHE[tier] = `data:image/svg+xml;base64,${btoa(svg)}`;
  return SVG_CACHE[tier];
}

const MARKER_SIZES: Record<Tier, number> = { ancient: 40, storied: 34, notable: 30, seedling: 24 };

/* ── Popup HTML ── */
function buildPopupHtml(tree: Tree, offerings: number, age: number): string {
  const ageBadge = age > 0
    ? `<span style="margin-left:6px;padding:1px 6px;font-size:10px;border-radius:99px;background:hsla(42,80%,50%,0.15);color:hsl(42,80%,60%);border:1px solid hsla(42,80%,50%,0.25);font-family:sans-serif;vertical-align:middle;">~${age}y</span>`
    : "";
  const offeringLine = offerings > 0
    ? `<p style="margin:6px 0 0;font-size:11px;color:hsl(42,60%,55%);font-family:sans-serif;">✦ ${offerings} offering${offerings !== 1 ? "s" : ""}</p>`
    : `<p style="margin:6px 0 0;font-size:11px;color:hsl(0,0%,48%);font-style:italic;font-family:sans-serif;">No offerings yet</p>`;
  const desc = tree.description
    ? `<p style="margin:6px 0 0;font-size:11px;color:hsl(0,0%,68%);line-height:1.45;font-family:sans-serif;">${escapeHtml(tree.description.substring(0, 100))}${tree.description.length > 100 ? "…" : ""}</p>`
    : "";

  return `<div style="padding:12px 14px;font-family:'Cinzel',serif;min-width:200px;max-width:260px;background:hsl(30,15%,10%);border-radius:10px;border:1px solid hsla(42,40%,30%,0.4);">
    <h3 style="margin:0;font-size:14px;color:hsl(45,80%,60%);line-height:1.3;font-weight:700;">${escapeHtml(tree.name)}${ageBadge}</h3>
    <p style="margin:2px 0 0;font-size:11px;color:hsl(120,40%,62%);font-style:italic;">${escapeHtml(tree.species)}</p>
    ${tree.what3words ? `<p style="margin:4px 0 0;font-size:10px;color:hsl(45,45%,48%);font-family:sans-serif;">📍 ${escapeHtml(tree.what3words)}</p>` : ""}
    ${desc}${offeringLine}
    <a href="/tree/${encodeURIComponent(tree.id)}" style="display:block;margin-top:10px;padding:8px 0;text-align:center;font-size:12px;color:hsl(80,20%,8%);background:linear-gradient(135deg,hsl(42,88%,50%),hsl(45,100%,60%));border-radius:7px;text-decoration:none;letter-spacing:0.06em;font-weight:700;font-family:sans-serif;">Visit Ancient Friend ⟶</a>
    <div style="margin-top:6px;display:flex;gap:5px;justify-content:center;">
      <a href="/tree/${encodeURIComponent(tree.id)}?add=photo" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;font-size:16px;text-decoration:none;border:1px solid hsla(120,50%,50%,0.2);border-radius:8px;" title="Photo">📷</a>
      <a href="/tree/${encodeURIComponent(tree.id)}?add=song" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;font-size:16px;text-decoration:none;border:1px solid hsla(200,50%,50%,0.2);border-radius:8px;" title="Song">🎵</a>
      <a href="/tree/${encodeURIComponent(tree.id)}?add=story" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;font-size:16px;text-decoration:none;border:1px solid hsla(280,50%,50%,0.2);border-radius:8px;" title="Musing">💭</a>
    </div>
  </div>`;
}

/* ── CSS ── */
const LITE_CSS = `
.leaflet-tree-marker{background:transparent!important;border:none!important}
.tree-cluster{display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:'Cinzel',serif;font-weight:700;color:hsl(45,80%,60%);text-shadow:0 1px 2px rgba(0,0,0,0.5);border:2px solid hsla(42,70%,50%,0.55);transition:transform .15s ease-out,box-shadow .15s ease-out}
.tree-cluster:active{transform:scale(0.95)}
.tree-cluster-sm{width:34px;height:34px;font-size:11px;background:hsla(120,40%,20%,0.85);box-shadow:0 0 8px hsla(42,60%,45%,0.2)}
.tree-cluster-md{width:42px;height:42px;font-size:13px;background:hsla(120,45%,18%,0.88);box-shadow:0 0 10px hsla(42,60%,45%,0.25)}
.tree-cluster-lg{width:50px;height:50px;font-size:14px;background:hsla(120,50%,16%,0.9);box-shadow:0 0 14px hsla(42,60%,45%,0.3)}
@keyframes ancientGlow{0%,100%{filter:drop-shadow(0 0 3px hsla(42,90%,55%,0.25))}50%{filter:drop-shadow(0 0 8px hsla(42,90%,55%,0.6))}}
.marker-ancient{animation:ancientGlow 3.5s ease-in-out infinite;will-change:filter}
.atlas-leaflet-popup .leaflet-popup-content-wrapper{background:hsl(30,15%,10%)!important;border:1px solid hsla(42,40%,30%,0.4)!important;border-radius:12px!important;box-shadow:0 6px 24px rgba(0,0,0,0.5),0 0 12px hsla(42,60%,40%,0.08)!important;padding:0!important}
.atlas-leaflet-popup .leaflet-popup-content{margin:0!important}
.atlas-leaflet-popup .leaflet-popup-tip{background:hsl(30,15%,10%)!important;border:1px solid hsla(42,40%,30%,0.4)!important}
.atlas-leaflet-popup .leaflet-popup-close-button{color:hsl(42,60%,55%)!important;font-size:18px!important;top:6px!important;right:8px!important}
.leaflet-tile-pane{filter:sepia(0.25) saturate(0.85) brightness(0.9)}
@media(max-width:768px){.leaflet-tile-pane{filter:sepia(0.1) brightness(0.95)}}
.leaflet-control-zoom a{background:hsla(30,30%,12%,0.9)!important;color:hsl(42,60%,60%)!important;border:1px solid hsla(42,40%,30%,0.4)!important;border-radius:8px!important;width:34px!important;height:34px!important;line-height:34px!important;font-size:16px!important}
.leaflet-control-zoom{border:none!important;border-radius:8px!important;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.25)!important}
.leaflet-control-attribution{font-size:9px!important;background:hsla(30,20%,10%,0.7)!important;color:hsl(42,40%,50%)!important;border-radius:4px 0 0 0!important;padding:2px 6px!important}
.leaflet-control-attribution a{color:hsl(42,50%,55%)!important}
`;

const LeafletFallbackMap = ({ trees, offeringCounts = {}, className, userId }: LeafletFallbackMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);

  // Filter state — managed locally for fast, lightweight filtering
  const [species, setSpecies] = useState("all");
  const [perspective, setPerspective] = useState<LitePerspective>("collective");

  // Compute species counts from all trees
  const speciesCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trees.forEach((t) => {
      const key = t.species.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [trees]);

  // Apply filters client-side
  const filteredTrees = useMemo(() => {
    let result = trees;

    // Perspective filter
    if (perspective === "personal" && userId) {
      result = result.filter((t) => t.created_by === userId);
    }
    // "tribe" — for now show all (same as collective until social graph is wired)

    // Species filter
    if (species !== "all") {
      result = result.filter((t) => t.species.toLowerCase() === species.toLowerCase());
    }

    return result;
  }, [trees, species, perspective, userId]);

  // Pre-compute icon instances by tier
  const iconCache = useMemo(() => {
    const cache: Record<Tier, L.DivIcon> = {} as any;
    const tiers: Tier[] = ["ancient", "storied", "notable", "seedling"];
    tiers.forEach((tier) => {
      const size = MARKER_SIZES[tier];
      const uri = getSvgDataUri(tier);
      cache[tier] = L.divIcon({
        className: "leaflet-tree-marker",
        html: `<div class="${tier === 'ancient' ? 'marker-ancient' : ''}" style="width:${size}px;height:${size}px;background-image:url('${uri}');background-size:contain;cursor:pointer;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    });
    return cache;
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [30, 0],
      zoom: 2,
      attributionControl: false,
      zoomControl: false,
      preferCanvas: true,
      tap: true,
      tapTolerance: 15,
    } as any);

    const isRetina = window.devicePixelRatio > 1;
    L.tileLayer(
      isRetina
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { attribution: '&copy; OSM &copy; CARTO', maxZoom: 19, subdomains: "abcd", keepBuffer: 4 }
    ).addTo(map);

    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // Update markers when filteredTrees change (no full map re-init)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old cluster layer
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      animate: true,
      animateAddingMarkers: false,
      disableClusteringAtZoom: 16,
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 10,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        const sizeClass = count >= 20 ? "tree-cluster-lg" : count >= 5 ? "tree-cluster-md" : "tree-cluster-sm";
        const dim = count >= 20 ? 50 : count >= 5 ? 42 : 34;
        return L.divIcon({
          html: `<div class="tree-cluster ${sizeClass}">${count}</div>`,
          className: "leaflet-tree-marker",
          iconSize: L.point(dim, dim),
        });
      },
    });

    filteredTrees.forEach((tree) => {
      const offerings = offeringCounts[tree.id] || 0;
      const age = tree.estimated_age || 0;
      const tier = getTreeTier(age, offerings);

      const marker = L.marker([tree.latitude, tree.longitude], { icon: iconCache[tier] });
      marker.bindPopup(() => buildPopupHtml(tree, offerings, age), {
        className: "atlas-leaflet-popup",
        maxWidth: 280,
        closeButton: true,
        autoPanPadding: L.point(20, 60),
      });
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterRef.current = clusterGroup;

    // Fit bounds
    if (filteredTrees.length > 0) {
      const bounds = L.latLngBounds(filteredTrees.map((t) => [t.latitude, t.longitude]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5, animate: true, duration: 0.8 });
    }
  }, [filteredTrees, offeringCounts, iconCache]);

  const handleFindMe = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (userMarkerRef.current && mapRef.current) {
          mapRef.current.removeLayer(userMarkerRef.current);
        }
        mapRef.current?.flyTo([latitude, longitude], 12, { duration: 1.2 });
        const userIcon = L.divIcon({
          className: "leaflet-tree-marker",
          html: `<div style="width:16px;height:16px;border-radius:50%;background:hsl(42,90%,55%);border:2.5px solid hsl(30,15%,10%);box-shadow:0 0 10px hsla(42,90%,55%,0.5),0 0 20px hsla(42,90%,55%,0.2);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 })
          .bindPopup(`<div style="padding:6px 10px;font-family:sans-serif;font-size:11px;color:hsl(45,60%,50%);background:hsl(30,15%,10%);border-radius:6px;">📍 You are here</div>`, { className: "atlas-leaflet-popup" })
          .addTo(mapRef.current!);
        setLocating(false);
      },
      () => { setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  return (
    <div className={className || "absolute inset-0"} style={{ height: '100dvh' }}>
      <div ref={containerRef} className="w-full h-full" style={{ background: '#f0ede6' }} />
      <style>{LITE_CSS}</style>

      {/* Filters */}
      <LiteMapFilters
        species={species}
        onSpeciesChange={setSpecies}
        perspective={perspective}
        onPerspectiveChange={setPerspective}
        speciesCounts={speciesCounts}
        totalVisible={filteredTrees.length}
      />

      {/* Find Me */}
      <button
        onClick={handleFindMe}
        disabled={locating}
        className="absolute bottom-20 right-3 z-[1000] flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90"
        style={{
          background: "hsla(30, 30%, 12%, 0.92)",
          color: locating ? "hsl(42, 40%, 45%)" : "hsl(42, 60%, 60%)",
          border: "1px solid hsla(42, 40%, 30%, 0.5)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
        title="Find my location"
      >
        {locating ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Navigation className="w-[18px] h-[18px]" />}
      </button>

      {/* Lite Mode badge */}
      <div
        className="absolute bottom-6 left-3 z-[1000] px-2.5 py-1 rounded-full font-serif flex items-center gap-1.5"
        style={{
          background: "hsla(30, 30%, 12%, 0.85)",
          color: "hsl(42, 55%, 58%)",
          border: "1px solid hsla(42, 40%, 30%, 0.4)",
          backdropFilter: "blur(6px)",
          fontSize: "11px",
        }}
      >
        🍃 Lite
      </div>
    </div>
  );
};

export default LeafletFallbackMap;
