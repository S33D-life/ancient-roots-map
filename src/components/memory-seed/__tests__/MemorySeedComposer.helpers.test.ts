/**
 * Focused unit tests for pure helpers inside MemorySeedComposer.
 *
 * The composer's submit flow (offering / whisper / both, partial failure,
 * retry) is exercised manually via the matrix in
 * `docs/memory-seed-composer-verification.md`. These tests cover only the
 * pure pieces that can be verified in isolation without mocking Supabase,
 * the auth hook, the resonance hook, the toast layer, and Radix dialogs.
 */
import { describe, it, expect } from "vitest";
import { toOfferingType } from "../MemorySeedComposer";

describe("MemorySeedComposer › toOfferingType", () => {
  it("passes through native offering types", () => {
    expect(toOfferingType("song")).toBe("song");
    expect(toOfferingType("book")).toBe("book");
    expect(toOfferingType("poem")).toBe("poem");
    expect(toOfferingType("photo")).toBe("photo");
  });

  it("maps voice_note → voice", () => {
    expect(toOfferingType("voice_note")).toBe("voice");
  });

  it("folds quote / recipe / artwork / bloom into story (no schema yet)", () => {
    expect(toOfferingType("story")).toBe("story");
    expect(toOfferingType("quote")).toBe("story");
    expect(toOfferingType("recipe")).toBe("story");
    expect(toOfferingType("artwork")).toBe("story");
    expect(toOfferingType("bloom")).toBe("story");
  });
});
