import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { escapeHtml } from "@/utils/escapeHtml";

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

/**
 * Vintage-styled Leaflet map — automatic fallback when WebGL is unavailable.
 * Mirrors the Atlas marker hierarchy, atmospheric overlays, and popup design.
 */
const LeafletFallbackMap = ({ trees, offeringCounts = {}, className }: LeafletFallbackMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      attributionControl: false,
      zoomControl: false,
    });

    // Vintage-toned Stamen/Carto tiles for an antique cartographic feel
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: "abcd",
      }
    ).addTo(map);

    // Compact attribution
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Add tree markers with tiered hierarchy
    trees.forEach((tree) => {
      const offerings = offeringCounts[tree.id] || 0;
      const age = tree.estimated_age || 0;

      const isAncient = age >= 100;
      const isStoried = offerings >= 3;
      const isNotable = offerings >= 1 || age >= 50;

      const size = isAncient ? 38 : isStoried ? 34 : isNotable ? 30 : 24;
      const strokeColor = isAncient ? "hsl(42, 90%, 55%)" : isStoried ? "hsl(42, 70%, 50%)" : "hsl(45, 60%, 40%)";
      const strokeWidth = isAncient ? 2.5 : 2;
      const fillColor = isAncient ? "hsl(120, 45%, 28%)" : "hsl(120, 40%, 25%)";
      const leafColor = isAncient ? "hsl(120, 55%, 40%)" : "hsl(120, 60%, 35%)";

      const crownRing = isStoried
        ? `<circle cx="16" cy="16" r="15.5" fill="none" stroke="${strokeColor}" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.6"/>`
        : "";
      const ageDot = isAncient
        ? `<circle cx="16" cy="5" r="2" fill="hsl(42, 95%, 60%)" opacity="0.9"/>`
        : "";

      const svgContent = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${crownRing}
        <circle cx="16" cy="16" r="14" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <path d="M16 8C13.8 8 12 9.8 12 12C12 13.5 12.7 14.8 13.8 15.6C12.7 16.4 12 17.7 12 19.2C12 21.4 13.8 23.2 16 23.2C18.2 23.2 20 21.4 20 19.2C20 17.7 19.3 16.4 18.2 15.6C19.3 14.8 20 13.5 20 12C20 9.8 18.2 8 16 8Z" fill="${leafColor}"/>
        <rect x="14.5" y="22" width="3" height="6" fill="hsl(30, 40%, 30%)"/>
        ${ageDot}
      </svg>`;

      const pulseAnimation = isAncient
        ? "animation: ancientPulse 4s ease-in-out infinite;"
        : "";

      const icon = L.divIcon({
        className: "leaflet-tree-marker",
        html: `<div style="width:${size}px;height:${size}px;background-image:url('data:image/svg+xml;base64,${btoa(svgContent)}');background-size:contain;cursor:pointer;transition:filter 0.3s,transform 0.3s;${pulseAnimation}"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const offeringBadge =
        offerings > 0
          ? `<div style="margin:6px 0 0;display:flex;align-items:center;gap:4px;">
               <span style="font-size:10px;color:hsl(42,80%,60%);">✦</span>
               <span style="font-size:10px;color:hsl(42,60%,55%);">${offerings} offering${offerings !== 1 ? "s" : ""} left here</span>
             </div>`
          : `<div style="margin:6px 0 0;">
               <span style="font-size:10px;color:hsl(0,0%,50%);font-style:italic;">No offerings yet — be the first</span>
             </div>`;

      const ageBadge =
        age > 0
          ? `<span style="display:inline-block;margin-left:6px;padding:1px 6px;font-size:9px;border-radius:999px;background:hsla(42,80%,50%,0.15);color:hsl(42,80%,60%);border:1px solid hsla(42,80%,50%,0.3);">~${age} years</span>`
          : "";

      const popupContent = `
        <div style="padding:12px;font-family:'Cinzel',serif;min-width:220px;background:hsl(30,15%,10%);border-radius:8px;border:1px solid hsla(42,40%,30%,0.5);">
          <h3 style="margin:0 0 2px;font-size:15px;color:hsl(45,80%,60%);line-height:1.3;">${escapeHtml(tree.name)}${ageBadge}</h3>
          <p style="margin:0 0 2px;font-size:12px;color:hsl(120,40%,70%);font-style:italic;">${escapeHtml(tree.species)}</p>
          <p style="margin:4px 0 0;font-size:11px;color:hsl(45,60%,50%);">📍 ${escapeHtml(tree.what3words || "")}</p>
          ${tree.description ? `<p style="margin:6px 0 0;font-size:11px;color:hsl(0,0%,70%);line-height:1.4;">${escapeHtml(tree.description.substring(0, 120))}${tree.description.length > 120 ? "\u2026" : ""}</p>` : ""}
          ${offeringBadge}
          <a href="/tree/${encodeURIComponent(tree.id)}" style="display:block;margin-top:10px;padding:8px 0;text-align:center;font-size:12px;color:hsl(80,20%,8%);background:linear-gradient(135deg,hsl(42,88%,50%),hsl(45,100%,60%));border-radius:6px;text-decoration:none;letter-spacing:0.1em;font-weight:600;">View Ancient Friend ⟶</a>
          <div style="margin-top:8px;display:flex;gap:8px;justify-content:center;">
            <a href="/tree/${encodeURIComponent(tree.id)}?add=photo" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;font-size:16px;color:hsl(120,60%,50%);text-decoration:none;border:1px solid hsla(120,60%,50%,0.3);border-radius:8px;" title="Add Memory">📷</a>
            <a href="/tree/${encodeURIComponent(tree.id)}?add=song" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;font-size:16px;color:hsl(200,60%,50%);text-decoration:none;border:1px solid hsla(200,60%,50%,0.3);border-radius:8px;" title="Add Song">🎵</a>
            <a href="/tree/${encodeURIComponent(tree.id)}?add=story" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;font-size:16px;color:hsl(280,60%,50%);text-decoration:none;border:1px solid hsla(280,60%,50%,0.3);border-radius:8px;" title="Add Musing">💭</a>
          </div>
        </div>
      `;

      L.marker([tree.latitude, tree.longitude], { icon })
        .bindPopup(popupContent, {
          className: "atlas-leaflet-popup",
          maxWidth: 280,
          closeButton: true,
        })
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [trees, offeringCounts]);

  return (
    <div className={className || "absolute inset-0"}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Vintage CSS filter overlay applied to the tile layer */}
      <style>{`
        .leaflet-tile-pane {
          filter: sepia(0.35) saturate(0.8) brightness(0.85) contrast(1.05);
        }
        .leaflet-tree-marker {
          background: transparent !important;
          border: none !important;
        }
        @keyframes ancientPulse {
          0%, 100% { filter: drop-shadow(0 0 3px hsla(42, 90%, 55%, 0.3)); }
          50% { filter: drop-shadow(0 0 10px hsla(42, 90%, 55%, 0.7)); }
        }
        .atlas-leaflet-popup .leaflet-popup-content-wrapper {
          background: hsl(30, 15%, 10%) !important;
          border: 1px solid hsla(42, 40%, 30%, 0.5) !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px hsla(42, 60%, 40%, 0.1) !important;
          padding: 0 !important;
        }
        .atlas-leaflet-popup .leaflet-popup-content {
          margin: 0 !important;
        }
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
      `}</style>

      {/* Atmospheric vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[400]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, hsla(30, 20%, 8%, 0.4) 100%)",
        }}
      />

      {/* Top edge shadow for depth */}
      <div
        className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-[400]"
        style={{
          background: "linear-gradient(to bottom, hsla(30, 20%, 8%, 0.5), transparent)",
        }}
      />

      {/* Lite Mode badge */}
      <div
        className="absolute bottom-6 left-4 z-[1000] px-3 py-1.5 rounded-full font-serif text-xs"
        style={{
          background: "hsla(30, 30%, 12%, 0.85)",
          color: "hsl(42, 60%, 60%)",
          border: "1px solid hsla(42, 40%, 30%, 0.5)",
          backdropFilter: "blur(4px)",
        }}
      >
        🍃 Lite Mode
      </div>
    </div>
  );
};

export default LeafletFallbackMap;
