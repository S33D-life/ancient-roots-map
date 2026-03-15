import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock LeafletFallbackMap to verify Map delegates to it with all props
vi.mock("../LeafletFallbackMap", () => ({
  default: (props: any) => (
    <div data-testid="leaflet-fallback-map" data-props={JSON.stringify({
      hasInitialTreeId: !!props.initialTreeId,
      hasInitialW3w: !!props.initialW3w,
      hasInitialCountry: !!props.initialCountry,
      hasInitialHive: !!props.initialHive,
      hasInitialBbox: !!props.initialBbox,
      hasOnJourneyEnd: typeof props.onJourneyEnd === "function",
      hasOnFullscreenToggle: typeof props.onFullscreenToggle === "function",
      initialLat: props.initialLat,
      initialLng: props.initialLng,
      initialZoom: props.initialZoom,
    })} />
  ),
}));

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}));

vi.mock("@/hooks/use-tree-map-data", () => ({
  useTreeMapData: () => ({
    trees: [],
    birdsongCounts: {},
    birdsongHeatPoints: [],
    bloomedSeeds: [],
  }),
}));

vi.mock("@/hooks/use-offering-counts", () => ({
  useOfferingCounts: () => ({ counts: {}, photos: {} }),
}));

import Map from "../Map";

describe("Map component — renderer delegation", () => {
  it("renders LeafletFallbackMap (not MapLibre)", async () => {
    render(
      <MemoryRouter initialEntries={["/map"]}>
        <Map />
      </MemoryRouter>
    );

    const el = await screen.findByTestId("leaflet-fallback-map");
    expect(el).toBeInTheDocument();
  });

  it("passes all deep-link props to LeafletFallbackMap", async () => {
    const journeyEnd = vi.fn();
    const fullscreenToggle = vi.fn();

    render(
      <MemoryRouter initialEntries={["/map"]}>
        <Map
          initialLat={51.5}
          initialLng={-0.1}
          initialZoom={14}
          initialTreeId="tree-123"
          initialW3w="filled.count.soap"
          initialCountry="united-kingdom"
          initialHive="oak"
          initialBbox="51,-1,52,0"
          onJourneyEnd={journeyEnd}
          onFullscreenToggle={fullscreenToggle}
        />
      </MemoryRouter>
    );

    const el = await screen.findByTestId("leaflet-fallback-map");
    const props = JSON.parse(el.getAttribute("data-props") || "{}");

    expect(props.hasInitialTreeId).toBe(true);
    expect(props.hasInitialW3w).toBe(true);
    expect(props.hasInitialCountry).toBe(true);
    expect(props.hasInitialHive).toBe(true);
    expect(props.hasInitialBbox).toBe(true);
    expect(props.hasOnJourneyEnd).toBe(true);
    expect(props.hasOnFullscreenToggle).toBe(true);
    expect(props.initialLat).toBe(51.5);
    expect(props.initialLng).toBe(-0.1);
    expect(props.initialZoom).toBe(14);
  });

  it("does NOT render MapLibreRecoveryMap", async () => {
    render(
      <MemoryRouter initialEntries={["/map"]}>
        <Map />
      </MemoryRouter>
    );

    await screen.findByTestId("leaflet-fallback-map");
    expect(screen.queryByText("MapLibreRecoveryMap")).not.toBeInTheDocument();
  });
});
