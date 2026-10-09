import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import NextCouncilCard from "@/components/council/NextCouncilCard";

describe("Circle 235 open doorway", () => {
  it("offers the public hosted journey without advertising an elapsed Fire", () => {
    render(<NextCouncilCard onJoinCouncil={vi.fn()} />);
    expect(screen.getByText(/The Circle is open now. Times will be shared/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter the Circle →" })).toBeInTheDocument();
    expect(screen.queryByText(/Tuesday|19:30|4th May/)).not.toBeInTheDocument();
    expect(screen.getByText(/open seventh seat/)).toBeInTheDocument();
    expect(screen.getByText("What is already blooming in us that we haven’t noticed yet?")).toBeInTheDocument();
    expect(screen.getByText("Fly Agaric: Toxic · Meet with care · Never eat.")).toBeInTheDocument();
  });
});


describe("gathered companion reading", () => {
  it("opens only an existing appearance and retains care", () => {
    const open = vi.fn();
    render(<NextCouncilCard onJoinCouncil={vi.fn()} onMeetCompanion={open} />);
    fireEvent.click(screen.getByRole("button", { name: "Fly Agaric" }));
    expect(screen.getByRole("button", { name: "Fly Agaric" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Toxic · Meet with care · Never eat.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Follow this companion in the Circle →" }));
    expect(open).toHaveBeenCalledWith("c235_flyagaric");
    fireEvent.click(screen.getByRole("button", { name: "Fly Agaric" }));
    expect(screen.queryByRole("button", { name: "Follow this companion in the Circle →" })).not.toBeInTheDocument();
  });
  it("does not offer a spatial doorway when unavailable", () => {
    cleanup();
    render(<NextCouncilCard onJoinCouncil={vi.fn()} deckAvailable={false} />);
    expect(screen.queryByRole("button", { name: "Enter the Circle →" })).not.toBeInTheDocument();
  });
});
describe("Circle 235 CSP-compatible package", () => {
  it("serves every executable script from the package without inline code or an import map", () => {
    const root = path.resolve("public/tetol/circle-235/pre-fire");
    const html = readFileSync(path.join(root, "tetol.html"), "utf8");
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelector("script:not([type])")?.getAttribute("src")).toBe("./loader.js");
    const template = JSON.parse(doc.querySelector('script[type="__bundler/template"]')!.textContent!);
    const page = new DOMParser().parseFromString(template, "text/html");
    expect(page.querySelector('script[type="importmap"]')).toBeNull();
    expect(page.querySelector("[onclick]")).toBeNull();
    const scripts = Array.from(page.querySelectorAll("script"));
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      const src = script.getAttribute("src")!;
      expect(src).toMatch(/^\.\/runtime\/[^/]+\.js$/);
      expect(script.textContent).toBe("");
      expect(existsSync(path.join(root, src))).toBe(true);
      expect(readFileSync(path.join(root, src)).byteLength).toBeLessThan(512000);
    }
    const manifest = JSON.parse(doc.querySelector('script[type="__bundler/manifest"]')!.textContent!);
    for (const entry of Object.values(manifest) as { mime: string }[]) {
      expect(entry.mime).not.toMatch(/javascript/);
    }
  });
});
