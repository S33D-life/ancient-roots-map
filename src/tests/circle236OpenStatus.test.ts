import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CURRENT_WEBSITE_CIRCLE } from "@/data/council/currentWebsiteCircle";
import { CURRENT_CIRCLE } from "../../supabase/functions/_shared/currentCircle";

describe("Circle 236 website weekly status", () => {
  it("uses its own seven companions and leaves the question unapproved", () => {
    expect(CURRENT_WEBSITE_CIRCLE.number).toBe(236);
    expect(CURRENT_WEBSITE_CIRCLE.status).toBe("OPEN");
    expect(CURRENT_WEBSITE_CIRCLE.question).toBeNull();
    expect(CURRENT_WEBSITE_CIRCLE.companions.map(c => c.id)).toEqual(["birch-companion", "ely-plane-companion", "rose-companion", "tomato-companion", "bay-bolete-companion", "toucan-companion", "winnie-the-pooh-companion"]);
    expect(CURRENT_WEBSITE_CIRCLE.route).toBe("/review/council/236");
  });
  it("preserves the Circle 235 historical projection", () => {
    expect(CURRENT_CIRCLE.number).toBe(235);
    expect(CURRENT_CIRCLE.question).toBe("What is already blooming in us that we haven’t noticed yet?");
    expect(CURRENT_CIRCLE.companions).toContain("Fulham Palace Holm Oak");
  });
  it("updates the spatial parser with the OPEN manifest", () => {
    const runtime = readFileSync("public/tetol/circle-235/pre-fire/runtime/companion-frames.js", "utf8");
    expect(runtime).toContain("circle.status !== 'OPEN'");
    expect(runtime).not.toContain("PREPARING");
    expect(runtime).toContain("Fire reference · Tuesday 13 October · 19:30 UK");
  });
});
