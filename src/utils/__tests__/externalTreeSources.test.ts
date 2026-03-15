import { describe, it, expect } from "vitest";
import { sanitizeBBox } from "../externalTreeSources";

describe("sanitizeBBox", () => {
  it("passes valid bbox through", () => {
    const bbox = { south: 46.5, west: 6.5, north: 47.5, east: 7.5 };
    expect(sanitizeBBox(bbox)).toEqual(bbox);
  });

  it("rejects NaN coordinates", () => {
    expect(sanitizeBBox({ south: NaN, west: 6, north: 47, east: 7 })).toBeNull();
  });

  it("rejects Infinity coordinates", () => {
    expect(sanitizeBBox({ south: -Infinity, west: 6, north: 47, east: 7 })).toBeNull();
  });

  it("rejects inverted lat (south >= north)", () => {
    expect(sanitizeBBox({ south: 48, west: 6, north: 47, east: 7 })).toBeNull();
  });

  it("clamps out-of-range latitude", () => {
    const result = sanitizeBBox({ south: -100, west: 6, north: 47, east: 7 });
    expect(result).toEqual({ south: -90, west: 6, north: 47, east: 7 });
  });

  it("clamps out-of-range longitude", () => {
    const result = sanitizeBBox({ south: 46, west: -200, north: 47, east: 200 });
    expect(result).toEqual({ south: 46, west: -180, north: 47, east: 180 });
  });

  it("rejects equal south/north after clamping", () => {
    // Both clamp to 90
    expect(sanitizeBBox({ south: 95, west: 0, north: 100, east: 10 })).toBeNull();
  });
});
