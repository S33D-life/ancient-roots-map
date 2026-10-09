import { beforeEach, describe, expect, it } from "vitest";
import { applySiteTheme, savedThemeIsDark } from "@/hooks/use-parchment-dark";

describe("one theme across the living Tree", () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.className = ""; });
  it("defaults to parchment and preserves an existing dark preference", () => {
    expect(savedThemeIsDark()).toBe(false);
    localStorage.setItem("s33d-theme", "dark");
    localStorage.setItem("s33d-parchment-theme", "light");
    expect(savedThemeIsDark()).toBe(true);
  });
  it("recovers the earlier parchment preference when no site preference exists", () => {
    localStorage.setItem("s33d-parchment-theme", "dark");
    expect(savedThemeIsDark()).toBe(true);
  });
  it("toggles classes and both older preference keys together", () => {
    applySiteTheme(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(localStorage.getItem("s33d-parchment-theme")).toBe("dark");
    applySiteTheme(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("s33d-theme")).toBe("light");
  });
});
