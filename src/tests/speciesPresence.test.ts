import { describe, it, expect } from "vitest";
import { toPresenceWhisper } from "@/lib/species/speciesPresence";

describe("toPresenceWhisper — a quiet ecological whisper, not a paragraph", () => {
  it("returns null for empty / whitespace / nullish input (caller omits cleanly)", () => {
    expect(toPresenceWhisper(null)).toBeNull();
    expect(toPresenceWhisper(undefined)).toBeNull();
    expect(toPresenceWhisper("")).toBeNull();
    expect(toPresenceWhisper("   \n  ")).toBeNull();
  });

  it("returns a short line unchanged", () => {
    expect(toPresenceWhisper("A tree that shelters whole communities of life.")).toBe(
      "A tree that shelters whole communities of life.",
    );
  });

  it("takes only the first paragraph", () => {
    expect(toPresenceWhisper("The oak shelters many.\nA second paragraph of detail.")).toBe(
      "The oak shelters many.",
    );
  });

  it("cuts a long body at a sentence boundary when possible (no ellipsis)", () => {
    const text =
      "The yew is among the longest-lived trees in Europe. It has long been planted in churchyards and stands as a threshold between worlds.";
    const out = toPresenceWhisper(text, 140)!;
    expect(out).toBe("The yew is among the longest-lived trees in Europe.");
    expect(out.endsWith("…")).toBe(false);
  });

  it("falls back to a word-boundary cut + ellipsis when there is no early sentence break", () => {
    const text =
      "An immense spreading canopy of broad lobed leaves rising over damp meadows and quiet riverbanks across the temperate world and beyond";
    const out = toPresenceWhisper(text, 80)!;
    expect(out.length).toBeLessThanOrEqual(81);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toContain("  ");
  });

  it("never exceeds the window by more than the ellipsis", () => {
    const long = "word ".repeat(200);
    const out = toPresenceWhisper(long, 100)!;
    expect(out.length).toBeLessThanOrEqual(101);
  });
});
