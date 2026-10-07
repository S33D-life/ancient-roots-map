import { afterEach, describe, expect, it, vi } from "vitest";
import L from "leaflet";
import { getRasterBasemapStyle } from "@/config/mapbox";
import { getBasemapConfig, mountBasemap } from "@/utils/mapBasemap";

vi.mock("leaflet", () => ({ default: { tileLayer: vi.fn() } }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });
function setup(key?: string) {
  const layers: Array<{ fire: (event: string) => void; off: ReturnType<typeof vi.fn> }> = [];
  vi.mocked(L.tileLayer).mockImplementation(() => {
    const handlers: Record<string, () => void> = {};
    const layer = {
      on: vi.fn((event: string, fn: () => void) => { handlers[event] = fn; }),
      off: vi.fn(),
      addTo: vi.fn(() => { handlers.loading?.(); }),
      fire: (event: string) => handlers[event]?.(),
    };
    layers.push(layer);
    return layer as unknown as L.TileLayer;
  });
  const map = { removeLayer: vi.fn() } as unknown as L.Map;
  const status = vi.fn();
  const control = mountBasemap(map, key, false, status);
  return { layers, status, control, map };
}
describe("basemap recovery", () => {
  it.each([undefined, "", "   "])("uses OSM across both renderer configurations with key %s", key => {
    expect(getBasemapConfig(key).provider).toBe("osm");
    const source = getRasterBasemapStyle(key).sources.carto as { tiles: string[]; attribution: string };
    expect(source.tiles).toEqual(["https://tile.openstreetmap.org/{z}/{x}/{y}.png"]);
    expect(source.attribution).toContain("OpenStreetMap");
    expect(source.attribution).not.toContain("CARTO");
  });
  it("retains keyed Voyager without leaking an unkeyed URL", () => {
    const source = getRasterBasemapStyle("  test&a=b  ").sources.carto as { tiles: string[]; attribution: string };
    expect(source.tiles).toHaveLength(3);
    expect(source.tiles.every(url => url.endsWith("?key=test%26a%3Db"))).toBe(true);
    expect(source.attribution).toContain("CARTO");
  });
  it("never requests CARTO without a key and retains linked attribution", () => {
    expect(getBasemapConfig("  ").url).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(getBasemapConfig("a&b").url).toContain("?key=a%26b");
    expect(getBasemapConfig("key", true).provider).toBe("osm");
    expect(getBasemapConfig().options.attribution).toContain("https://www.openstreetmap.org/copyright");
  });
  it("recovers on a small failed viewport and reports fallback success", () => {
    const { layers, status, control } = setup("test-key");
    layers[0].fire("tileerror");
    layers[0].fire("load");
    expect(layers).toHaveLength(2);
    layers[1].fire("tileload");
    layers[1].fire("load");
    expect(status).toHaveBeenLastCalledWith({ provider: "osm", tileStatus: "loaded", tileLoads: 1, tileErrors: 0 });
    control.dispose();
  });
  it("does not report an all-failed OSM batch as loaded or create an endless fallback loop", () => {
    const { layers, status, control } = setup();
    layers[0].fire("tileerror");
    layers[0].fire("load");
    expect(layers).toHaveLength(1);
    expect(status.mock.lastCall?.[0].tileStatus).toBe("failed");
    control.retry();
    expect(layers).toHaveLength(2);
    layers[1].fire("tileload"); layers[1].fire("load");
    expect(status.mock.lastCall?.[0].tileStatus).toBe("loaded");
    control.dispose();
  });
  it("bounds stalled requests and ignores detached provider events", () => {
    vi.useFakeTimers();
    const { layers, status, control } = setup("key");
    vi.advanceTimersByTime(12000);
    expect(layers).toHaveLength(2);
    layers[0].fire("load");
    expect(status.mock.lastCall?.[0].provider).toBe("osm");
    vi.advanceTimersByTime(12000);
    expect(status.mock.lastCall?.[0].tileStatus).toBe("failed");
    control.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("reports partial OSM failures and removes only its own tile layer on retry", () => {
    const { layers, status, control, map } = setup();
    layers[0].fire("tileload");
    layers[0].fire("tileerror");
    layers[0].fire("load");
    expect(status.mock.lastCall?.[0].tileStatus).toBe("failed");
    control.retry();
    expect(map.removeLayer).toHaveBeenCalledExactlyOnceWith(layers[0]);
    expect(layers[0].off).toHaveBeenCalledOnce();
    control.dispose();
    const calls = status.mock.calls.length;
    layers[1].fire("loading"); layers[1].fire("load");
    control.retry(); control.useOsm();
    expect(layers).toHaveLength(2);
    expect(status).toHaveBeenCalledTimes(calls);
  });
  it("allows a manual switch when warning images arrive as successful tiles", () => {
    const { layers, status, control, map } = setup("key");
    layers[0].fire("tileload"); layers[0].fire("load");
    control.useOsm();
    expect(status.mock.lastCall?.[0].provider).toBe("osm");
    expect(map.removeLayer).toHaveBeenCalledWith(layers[0]);
    control.dispose();
  });
});
