import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MapPage from "@/pages/MapPage";

vi.mock("@/components/Map", () => ({
  default: () => <div data-testid="map-core">map core</div>,
}));

vi.mock("@/components/Header", () => ({
  default: () => <div data-testid="map-header">header</div>,
}));

vi.mock("@/components/ActiveFilterChips", () => ({
  default: () => <div data-testid="active-filter-chips">filters</div>,
}));

vi.mock("@/components/MapJourneyOverlay", () => ({
  default: () => <div data-testid="journey-overlay">journey</div>,
}));

vi.mock("@/components/MapArrivalBanner", () => ({
  default: () => <div data-testid="arrival-banner">arrival</div>,
}));

vi.mock("@/components/seasonal/SeasonalLensBanner", () => ({
  default: () => null,
}));

vi.mock("@/contexts/SeasonalLensContext", () => ({
  useSeasonalLens: () => ({
    activeLens: "gregorian",
    setActiveLens: vi.fn(),
    lensConfig: { slug: "gregorian", label: "Gregorian", icon: "📅" },
  }),
  SeasonalLensProvider: ({ children }: { children: React.ReactNode }) => children,
  LENS_CONFIGS: {},
}));

vi.mock("@/components/PublicTesterBlessing", () => ({
  default: () => <div data-testid="blessing">blessing</div>,
  isBlessingDismissed: () => true,
}));

vi.mock("@/components/LevelEntrance", () => ({
  default: () => <div data-testid="level-entrance">entrance</div>,
}));

vi.mock("@/hooks/use-fullscreen-map", () => ({
  useFullscreenMap: () => ({
    isFullscreen: false,
    toggleFullscreen: vi.fn(),
    exitFullscreen: vi.fn(),
  }),
}));

describe("MapPage route shell", () => {
  beforeEach(() => {
    localStorage.setItem("entrance_seen_map", "1");
  });

  it("renders map route content and arrival banner for deep-link params", async () => {
    render(
      <MemoryRouter initialEntries={["/map?arrival=country&country=peru&lat=-9.19&lng=-75.01&zoom=5"]}>
        <Routes>
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("map-core")).toBeInTheDocument();
    expect(screen.getByTestId("journey-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("arrival-banner")).toBeInTheDocument();
  });
});
