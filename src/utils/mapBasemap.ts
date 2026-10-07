import L from "leaflet";

export type BasemapProvider = "carto" | "osm";
export interface BasemapStatus {
  provider: BasemapProvider;
  tileStatus: "idle" | "loading" | "loaded" | "failed";
  tileLoads: number;
  tileErrors: number;
}

export function getBasemapConfig(key?: string, forceOsm = false) {
  const apiKey = key?.trim();
  const provider: BasemapProvider = apiKey && !forceOsm ? "carto" : "osm";
  return {
    provider,
    // CARTO warning images return success, so never request unkeyed tiles.
    url: provider === "carto"
      ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(apiKey!)}`
      : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      subdomains: "abcd",
      keepBuffer: 2,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        + (provider === "carto" ? ' &copy; <a href="https://carto.com/attributions">CARTO</a>' : ""),
    },
  };
}

/** Owns only the basemap: switching/retrying leaves markers and map position intact. */
export function mountBasemap(
  map: L.Map,
  key: string | undefined,
  forceOsm: boolean,
  onStatus: (status: BasemapStatus) => void,
) {
  let layer: L.TileLayer;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout>;
  let provider = getBasemapConfig(key, forceOsm).provider;

  function start(next: BasemapProvider) {
    clearTimeout(timer);
    if (layer) {
      layer.off();
      map.removeLayer(layer);
    }
    provider = next;
    const config = getBasemapConfig(key, next === "osm");
    const current = L.tileLayer(config.url, config.options);
    layer = current;
    let loads = 0;
    let errors = 0;
    const publish = (tileStatus: BasemapStatus["tileStatus"]) => {
      if (!disposed && layer === current) onStatus({ provider: next, tileStatus, tileLoads: loads, tileErrors: errors });
    };
    const fail = () => {
      if (disposed || layer !== current) return;
      clearTimeout(timer);
      if (next === "carto") start("osm");
      else publish("failed");
    };
    current.on("loading", () => {
      if (disposed || layer !== current) return;
      loads = 0;
      errors = 0;
      publish("loading");
      clearTimeout(timer);
      timer = setTimeout(fail, 12000);
    });
    current.on("tileload", () => { loads += 1; });
    current.on("tileerror", () => { errors += 1; });
    // Leaflet's load event means requests settled, not that any tile succeeded.
    current.on("load", () => {
      if (disposed || layer !== current) return;
      clearTimeout(timer);
      if (loads === 0 || errors >= 3) fail();
      else publish(errors ? "failed" : "loaded");
    });
    publish("loading");
    current.addTo(map);
  }
  start(provider);
  return {
    retry: () => { if (!disposed) start(provider); },
    // Also allows recovery when a provider sends a successful warning image.
    useOsm: () => { if (!disposed) start("osm"); },
    dispose: () => {
      disposed = true;
      clearTimeout(timer);
      layer.off();
      map.removeLayer(layer);
    },
  };
}
