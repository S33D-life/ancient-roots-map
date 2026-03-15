import { describe, it, expect } from "vitest";
import { sanitizeLikeQuery, prepareQuery, scoreMatch } from "../unified-search";

describe("sanitizeLikeQuery", () => {
  it("escapes % wildcard", () => {
    expect(sanitizeLikeQuery("100%")).toBe("100\\%");
  });

  it("escapes _ single-char wildcard", () => {
    expect(sanitizeLikeQuery("a_b")).toBe("a\\_b");
  });

  it("escapes backslashes before other chars", () => {
    expect(sanitizeLikeQuery("a\\%b")).toBe("a\\\\\\%b");
  });

  it("passes clean input through", () => {
    expect(sanitizeLikeQuery("oak tree")).toBe("oak tree");
  });

  it("handles combined special chars", () => {
    expect(sanitizeLikeQuery("%_\\")).toBe("\\%\\_\\\\");
  });
});

describe("prepareQuery", () => {
  it("returns null for empty string", () => {
    expect(prepareQuery("")).toBeNull();
  });

  it("returns null for single char", () => {
    expect(prepareQuery("a")).toBeNull();
  });

  it("trims whitespace", () => {
    const result = prepareQuery("  oak  ");
    expect(result?.original).toBe("oak");
    expect(result?.safe).toBe("oak");
  });

  it("truncates long queries to 200 chars", () => {
    const long = "a".repeat(300);
    const result = prepareQuery(long);
    expect(result?.original.length).toBe(200);
  });

  it("sanitizes LIKE chars in safe output", () => {
    const result = prepareQuery("100% oak_tree");
    expect(result?.original).toBe("100% oak_tree");
    expect(result?.safe).toBe("100\\% oak\\_tree");
  });
});

describe("scoreMatch", () => {
  it("returns 100 for exact title match", () => {
    expect(scoreMatch("oak", { title: "oak" })).toBe(100);
  });

  it("returns 80 for title starts-with", () => {
    expect(scoreMatch("oak", { title: "oak tree" })).toBe(80);
  });

  it("returns 60 for title contains", () => {
    expect(scoreMatch("oak", { title: "big oak" })).toBe(60);
  });

  it("returns 40 for subtitle match", () => {
    expect(scoreMatch("swiss", { title: "tree", subtitle: "switzerland" })).toBe(40);
  });

  it("returns 30 for keyword match", () => {
    expect(scoreMatch("pine", { title: "tree", keywords: ["pine", "forest"] })).toBe(30);
  });

  it("returns 0 for no match", () => {
    expect(scoreMatch("xyz", { title: "oak", subtitle: "tree", keywords: ["forest"] })).toBe(0);
  });

  it("is case-insensitive", () => {
    expect(scoreMatch("OAK", { title: "Oak Tree" })).toBe(80);
  });
});
