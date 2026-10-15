import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getGridStaffs } from "@/utils/staffRoomData";
import { staffRoom3DHref } from "@/lib/tetolStaffRoom";

const PRE = "public/tetol/circle-235/pre-fire";
const read = (p: string) => readFileSync(`${PRE}/${p}`, "utf8");

type Mapping = { toRecord: (id: string) => string | null; fromRecord?: (code: string) => string | null };
function weaveMapping(): Mapping {
  const src = read("runtime/staffroom/weave.js");
  const body = src.slice(src.indexOf("const DISPLAY"), src.indexOf("// Photograph fallback")).replace(/export /g, "");
  return new Function(`${body}; return { toRecord, fromRecord };`)() as Mapping;
}
function bridgeMapping(): Mapping {
  const src = read("runtime/classic-1.js");
  const body = src.slice(src.indexOf("const DISPLAY = {"), src.indexOf("// While the room is open"));
  return { toRecord: new Function(`${body}; return staffRecord;`)() as Mapping["toRecord"] };
}
function roomItems(): Record<string, { cohort: string }> {
  const w = {} as { SeedCollection?: { items: Record<string, { cohort: string }> } };
  new Function("window", read("runtime/staffroom/3-collection.js"))(w);
  return w.SeedCollection!.items;
}

describe("TETOL Staff Room restoration", () => {
  it("is generated from the preserved interior and is up to date", () => {
    expect(() => execFileSync("node", ["scripts/tetol-staffroom.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });

  it("runs under the site CSP: no inline scripts, handlers, import maps or bare three specifiers", () => {
    const page = read("staffroom.html");
    const scripts = [...page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    expect(scripts.length).toBeGreaterThan(0);
    for (const [, attrs, body] of scripts) {
      expect(attrs).toMatch(/src="\.\/runtime\/staffroom\/[\w-]+\.js"/);
      expect(body.trim()).toBe("");
    }
    expect(page).not.toMatch(/\son[a-z]+="/);
    expect(page).not.toContain("importmap");
    for (const f of ["2-stage.js", "4-roundhouse.js", "5-spiral.js"]) {
      expect(read(`runtime/staffroom/${f}`)).not.toMatch(/(from\s*|import\(\s*)['"]three/);
    }
  });

  it("keeps the public TETOL scene clear of the exported design overlay", () => {
    const bridge = read("runtime/classic-1.js");
    expect(bridge).toContain("#__claude_design_branding,body.ininterior #council-return{display:none!important}");
  });

  it("points the Tree's doorway at the same-origin room, not a bare asset id", () => {
    const bridge = read("runtime/classic-1.js");
    expect(bridge).toContain('window.STAFFROOM_URL="./staffroom.html";');
    expect(bridge).not.toMatch(/STAFFROOM_URL="5eaf7c1e/);
  });

  it("links every one of the canonical 144 to its place in the room, and back", () => {
    const items = roomItems();
    const weave = weaveMapping(), bridge = bridgeMapping();
    const codes = getGridStaffs().map((s) => s.code);
    expect(codes).toHaveLength(144);
    for (const code of codes) {
      const id = weave.fromRecord!(code);
      expect(id, code).not.toBeNull();
      expect(items[id!], code).toBeDefined();
      expect(weave.toRecord(id!)).toBe(code);
      expect(bridge.toRecord(id!)).toBe(code);
    }
    // the room's founding records are exactly the 144; nothing outside them gains a record link
    const founding = Object.entries(items).filter(([, it]) => it.cohort === "founding_144").map(([id]) => id);
    expect(founding).toHaveLength(144);
    expect(new Set(founding.map((id) => weave.toRecord(id)))).toEqual(new Set(codes));
    for (const id of Object.keys(items).filter((i) => items[i].cohort === "unresolved")) {
      expect(weave.toRecord(id)).toBeNull();
      expect(bridge.toRecord(id)).toBeNull();
    }
  });

  it("builds 2D → 3D doorways only for well-formed codes", () => {
    expect(staffRoom3DHref()).toBe("/tetol/circle-235/pre-fire/tetol.html#route=/library/staff-room");
    expect(staffRoom3DHref("cher")).toBe("/tetol/circle-235/pre-fire/tetol.html#route=/staff/CHER");
    expect(staffRoom3DHref("OAK-C1S12")).toBe("/tetol/circle-235/pre-fire/tetol.html#route=/staff/OAK-C1S12");
    expect(staffRoom3DHref("OAK-C4S1")).toBe("/tetol/circle-235/pre-fire/tetol.html#route=/library/staff-room");
    expect(staffRoom3DHref("<x>")).toBe("/tetol/circle-235/pre-fire/tetol.html#route=/library/staff-room");
  });
});
