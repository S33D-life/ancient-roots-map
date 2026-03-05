import { describe, expect, it } from "vitest";
import {
  buildTreeMapUrl,
  getTreeIdFromMapParams,
  parseMapFocusParams,
} from "@/utils/mapNavigation";

describe("mapNavigation", () => {
  it("builds a canonical tree deep-link URL", () => {
    const url = buildTreeMapUrl({
      treeId: "tree-123",
      lat: 10.123,
      lng: -84.55,
      zoom: 16,
      source: "country",
      countrySlug: "costa-rica",
      journey: true,
    });

    expect(url).toContain("/map?");
    expect(url).toContain("tree=tree-123");
    expect(url).toContain("treeId=tree-123");
    expect(url).toContain("lat=10.123");
    expect(url).toContain("lng=-84.55");
    expect(url).toContain("zoom=16");
    expect(url).toContain("arrival=country");
    expect(url).toContain("country=costa-rica");
    expect(url).toContain("journey=1");
  });

  it("parses treeId from tree or treeId params", () => {
    expect(getTreeIdFromMapParams(new URLSearchParams("tree=abc"))).toBe("abc");
    expect(getTreeIdFromMapParams(new URLSearchParams("treeId=xyz"))).toBe("xyz");
    expect(getTreeIdFromMapParams(new URLSearchParams("lat=1&lng=2"))).toBeNull();
  });

  it("parses map focus params with strict numeric handling", () => {
    const parsed = parseMapFocusParams(
      new URLSearchParams(
        "tree=t-1&lat=-9.19&lng=-75.01&zoom=5&bbox=-12,-77,-4,-70&arrival=country&country=peru&journey=1",
      ),
    );

    expect(parsed.treeId).toBe("t-1");
    expect(parsed.lat).toBe(-9.19);
    expect(parsed.lng).toBe(-75.01);
    expect(parsed.zoom).toBe(5);
    expect(parsed.bbox).toEqual([-12, -77, -4, -70]);
    expect(parsed.arrival).toBe("country");
    expect(parsed.country).toBe("peru");
    expect(parsed.journey).toBe(true);
  });

  it("drops invalid numeric params safely", () => {
    const parsed = parseMapFocusParams(
      new URLSearchParams("lat=nope&lng=5&zoom=nan&bbox=1,2,3&origin=search"),
    );

    expect(parsed.lat).toBeUndefined();
    expect(parsed.lng).toBe(5);
    expect(parsed.zoom).toBeUndefined();
    expect(parsed.bbox).toBeUndefined();
    expect(parsed.arrival).toBe("search");
  });
});
