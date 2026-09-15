/**
 * TreeLocationPicker — current location shown on a map with a draggable pin.
 * The original position stays visible as a faint marker so the proposed move
 * can be read at a glance. Coordinates can also be typed directly.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  originalLat: number | null;
  originalLng: number | null;
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:hsl(var(--primary));border:2px solid hsl(var(--background));box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const ghostIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:transparent;border:2px dashed hsl(var(--muted-foreground));opacity:.7"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function TreeLocationPicker({
  originalLat,
  originalLng,
  lat,
  lng,
  onChange,
  disabled,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);

  const startLat = lat ?? originalLat ?? 51.5;
  const startLng = lng ?? originalLng ?? -0.12;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [startLat, startLng],
      zoom: 18,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    if (originalLat != null && originalLng != null) {
      L.marker([originalLat, originalLng], {
        icon: ghostIcon,
        interactive: false,
      }).addTo(map);
    }

    const marker = L.marker([startLat, startLng], {
      icon: pinIcon,
      draggable: !disabled,
      keyboard: true,
      alt: "Proposed tree position",
    }).addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      onChange(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (disabled) return;
      onChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    });

    mapRef.current = map;
    markerRef.current = marker;
    setTimeout(() => map.invalidateSize(), 120);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the pin and the guide line in step with typed coordinates.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || lat == null || lng == null) return;
    marker.setLatLng([lat, lng]);
    if (lineRef.current) {
      lineRef.current.remove();
      lineRef.current = null;
    }
    if (originalLat != null && originalLng != null) {
      lineRef.current = L.polyline(
        [
          [originalLat, originalLng],
          [lat, lng],
        ],
        { color: "hsl(var(--primary))", weight: 1, dashArray: "4 4", opacity: 0.7 },
      ).addTo(map);
    }
  }, [lat, lng, originalLat, originalLng]);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="h-56 w-full overflow-hidden rounded-lg border border-border/40"
        aria-label="Map for adjusting the tree position"
      />
      <p className="text-[11px] font-serif text-muted-foreground">
        Drag the pin, or tap the map, to place the tree where it truly stands.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="tcf-lat" className="text-xs font-serif">
            Latitude
          </Label>
          <Input
            id="tcf-lat"
            inputMode="decimal"
            className="text-base"
            value={lat ?? ""}
            disabled={disabled}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v)) onChange(v, lng ?? startLng);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tcf-lng" className="text-xs font-serif">
            Longitude
          </Label>
          <Input
            id="tcf-lng"
            inputMode="decimal"
            className="text-base"
            value={lng ?? ""}
            disabled={disabled}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v)) onChange(lat ?? startLat, v);
            }}
          />
        </div>
      </div>
    </div>
  );
}
