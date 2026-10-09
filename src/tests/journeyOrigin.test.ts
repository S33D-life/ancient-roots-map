import { describe, it, expect } from "vitest";
import { journeyOrigin, hallReturnState } from "@/lib/journeyOrigin";

describe("journey origins", () => {
  it("keeps a tree encounter and its reading tab through the Hall", () => {
    const path = "/tree/a1b2c3d4-1111-4aaa-bbbb-000000000001?tab=memory";
    expect(journeyOrigin(path)).toMatchObject({ to: path, label: "Back to the Ancient Friend" });
    expect(hallReturnState({ from: "/library", hallOrigin: path })).toEqual({ from: path });
  });
  it.each(["https://evil.invalid", "//evil.invalid", "/auth", "/library/unknown", "/tree/a/b", "javascript:alert(1)", undefined])("rejects unsupported origin %s", value => {
    expect(journeyOrigin(value)).toBeUndefined();
    expect(hallReturnState({ hallOrigin: value })).toBeUndefined();
  });
  it("does not invent an origin on direct entry", () => {
    expect(hallReturnState(null)).toBeUndefined();
  });
});
