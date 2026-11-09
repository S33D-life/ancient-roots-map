import { describe, expect, it } from "vitest";
import { councilLibraryLinks } from "../../public/council/library-links.js";
import catalog from "../../public/council/library-links.json";
import { SEED_CONFIGS } from "@/components/seed-library/seed-3d/seed-configs";

describe("Council library connections", () => {
  it("keeps later knowledge separate by edition and companion", () => {
    expect(councilLibraryLinks(catalog, 239, "tomato-seeds")).toEqual([]);
    expect(councilLibraryLinks(catalog, 240, "rosemary")).toEqual([]);
    expect(councilLibraryLinks(catalog, 240, "tomato-seeds")).toEqual([
      { label: "Tomato in the 3D Seed Cellar", href: "/library/seed-cellar?seed=tomato-seed" },
    ]);
  });

  it("labels unreviewed and unsafe targets as planned", () => {
    const base = { edition: 240, companionKey: "test", label: "A library entry" };
    const links = [
      { ...base, status: "planned", href: "/species/test" },
      { ...base, status: "verified", href: "//example.com/library" },
      { ...base, status: "verified", href: "/library/../secret" },
    ];
    expect(councilLibraryLinks({ links }, 240, "test")).toEqual(
      links.map(({ label }) => ({ label, href: null })),
    );
    expect(councilLibraryLinks(null, 240, "test")).toEqual([]);
  });

  it("retains the three existing seeds and resolves the distinct tomato model", () => {
    expect(SEED_CONFIGS.map(seed => seed.slug)).toEqual([
      "oak-acorn", "hopi-rainbow-corn", "hemp-seed", "tomato-seed",
    ]);
    expect(SEED_CONFIGS.find(seed => seed.slug === "tomato-seed")?.fallbackShapeType).toBe("tomato");
  });
});
