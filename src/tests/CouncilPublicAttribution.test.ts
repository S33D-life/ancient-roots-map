import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CURRENT_CIRCLE } from "../../supabase/functions/_shared/currentCircle";
import { renderCouncilInvite } from "../../supabase/functions/_shared/councilPublishing";
import { currentCircleShare, renderCurrentCircleInvitation } from "@/lib/council/currentCircleShare";
import { projectCircle } from "@/lib/mcp/tools/living-dream";

describe("public Council attribution", () => {
  it("uses neutral attribution in the shared source, MCP and invitation projections", () => {
    expect(CURRENT_CIRCLE.companionsLabel).toBe("This week’s companions, chosen by the Council");
    for (const value of [CURRENT_CIRCLE, projectCircle(CURRENT_CIRCLE), currentCircleShare(), renderCurrentCircleInvitation(), renderCouncilInvite()]) {
      expect(JSON.stringify(value)).not.toMatch(/chosen by Leo/i);
    }
    expect(projectCircle(CURRENT_CIRCLE)?.companionsLabel).toBe(CURRENT_CIRCLE.companionsLabel);
    expect(renderCurrentCircleInvitation()).toContain(CURRENT_CIRCLE.companionsLabel);
  });

  it("keeps the committed server bundle and generated invitation free of the attribution", () => {
    const source = readFileSync("supabase/functions/_shared/currentCircle.ts", "utf8");
    expect(source).not.toMatch(/chosen by Leo/i);
    expect(source).toContain("companions, chosen by the Council");
    const bundle = readFileSync("supabase/functions/mcp/index.ts", "utf8");
    expect(bundle).not.toMatch(/chosen by Leo/i);
    expect(bundle).toContain("companions, chosen by the Council");
    expect(readFileSync("docs/council/Circle-235-Telegram-invitation.md", "utf8")).not.toMatch(/chosen by Leo/i);
  });

  it("does not silently promote or rewrite the historical backend edition", () => {
    expect(CURRENT_CIRCLE.number).toBe(235);
    expect(CURRENT_CIRCLE.question).toBe("What is already blooming in us that we haven’t noticed yet?");
    expect(CURRENT_CIRCLE.companions).toEqual(["Fulham Palace Holm Oak", "Apple Blossom", "Dragon Fruit / Pitaya", "Fly Agaric", "Hen Harrier", "Peter Pan"]);
    expect(CURRENT_CIRCLE.links.councilDeck.url).toBe("https://www.s33d.life/tetol/circle-235/pre-fire/tetol.html#croom");
    expect(CURRENT_CIRCLE.links).not.toHaveProperty("fire");
  });
});
