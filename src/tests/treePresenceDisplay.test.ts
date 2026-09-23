import { describe, expect, it } from "vitest";
import { treePresenceDisplay } from "@/lib/tree/treePresenceDisplay";

describe("treePresenceDisplay — shared presence display contract", () => {
  it("defaults nullish state to none", () => {
    expect(treePresenceDisplay()).toMatchObject({
      state: "none",
      label: null,
      title: null,
      tone: "none",
    });
    expect(treePresenceDisplay({ state: null })).toMatchObject({
      state: "none",
      label: null,
      title: null,
      tone: "none",
    });
  });

  it("normalizes invalid state to none", () => {
    expect(treePresenceDisplay({ state: "elsewhere" as any, count: 4 })).toMatchObject({
      state: "none",
      label: null,
      title: null,
      tone: "none",
    });
  });

  it("normalizes zero, negative, and non-finite counts safely", () => {
    expect(treePresenceDisplay({ state: "here_now", count: 0 }).label).toBe("Someone is here now");
    expect(treePresenceDisplay({ state: "here_now", count: -3 }).label).toBe("Someone is here now");
    expect(treePresenceDisplay({ state: "recently_met", count: Number.NaN }).label).toBe("Recently met");
    expect(treePresenceDisplay({ state: "recently_met", count: Number.POSITIVE_INFINITY }).label).toBe("Recently met");
  });

  it("formats here_now singular and plural labels", () => {
    expect(treePresenceDisplay({ state: "here_now", count: 1 })).toMatchObject({
      state: "here_now",
      label: "Someone is here now",
      title: "Someone is here now",
      tone: "live",
    });
    expect(treePresenceDisplay({ state: "here_now", count: 3 })).toMatchObject({
      state: "here_now",
      label: "3 wanderers here now",
      title: "3 wanderers here now",
      tone: "live",
    });
  });

  it("formats recently_met singular and plural labels", () => {
    expect(treePresenceDisplay({ state: "recently_met", count: 1 })).toMatchObject({
      state: "recently_met",
      label: "Recently met",
      title: "Recently met",
      tone: "recent",
    });
    expect(treePresenceDisplay({ state: "recently_met", count: 2 })).toMatchObject({
      state: "recently_met",
      label: "2 wanderers here recently",
      title: "2 wanderers here recently",
      tone: "recent",
    });
  });

  it("returns null label and title for none", () => {
    expect(treePresenceDisplay({ state: "none", count: 9 })).toEqual({
      state: "none",
      label: null,
      title: null,
      tone: "none",
      dot: {
        colorHsl: "transparent",
        glow: false,
        animate: false,
      },
    });
  });

  it("maps tones and dots for each state", () => {
    expect(treePresenceDisplay({ state: "here_now" })).toMatchObject({
      tone: "live",
      dot: {
        colorHsl: "hsl(145, 55%, 48%)",
        glow: true,
        animate: true,
      },
    });
    expect(treePresenceDisplay({ state: "recently_met" })).toMatchObject({
      tone: "recent",
      dot: {
        colorHsl: "hsl(210, 35%, 58%)",
        glow: false,
        animate: false,
      },
    });
    expect(treePresenceDisplay({ state: "none" })).toMatchObject({
      tone: "none",
      dot: {
        colorHsl: "transparent",
        glow: false,
        animate: false,
      },
    });
  });

  it("floors fractional counts deterministically", () => {
    expect(treePresenceDisplay({ state: "here_now", count: 2.9 }).label).toBe("2 wanderers here now");
  });

  it("is deterministic for the same input", () => {
    const input = { state: "recently_met" as const, count: 5 };
    expect(treePresenceDisplay(input)).toEqual(treePresenceDisplay(input));
  });
});
