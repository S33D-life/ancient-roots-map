import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CURRENT_CIRCLE } from "../../supabase/functions/_shared/currentCircle";
import { renderCouncilInvite } from "../../supabase/functions/_shared/councilPublishing";
import { currentCircleShare, renderCurrentCircleInvitation } from "@/lib/council/currentCircleShare";
import { projectCircle } from "@/lib/mcp/tools/living-dream";

describe("public Council attribution", () => {
  it("uses neutral attribution in shared source, compatibility projection and invitation", () => {
    expect(CURRENT_CIRCLE.companionsLabel).toBe("This week’s companions, chosen by the Council");
    expect(projectCircle(CURRENT_CIRCLE)?.companionsLabel).toBe(CURRENT_CIRCLE.companionsLabel);
    expect(currentCircleShare()?.companionsLabel).toBe(CURRENT_CIRCLE.companionsLabel);
    expect(renderCurrentCircleInvitation()).toContain(CURRENT_CIRCLE.companionsLabel);
    expect(renderCouncilInvite().text).toContain("This week’s companions:");
    expect(readFileSync("docs/council/Circle-235-Telegram-invitation.md", "utf8")).toContain("chosen by the Council");
  });
  it("does not promote or rewrite the historical compatibility edition", () => {
    expect(CURRENT_CIRCLE.number).toBe(235);
    expect(CURRENT_CIRCLE.question).toBe("What is already blooming in us that we haven’t noticed yet?");
    expect(CURRENT_CIRCLE.companions).toEqual(["Fulham Palace Holm Oak", "Apple Blossom", "Dragon Fruit / Pitaya", "Fly Agaric", "Hen Harrier", "Peter Pan"]);
    expect(CURRENT_CIRCLE.links.councilDeck.url).toBe("https://www.s33d.life/tetol/circle-235/pre-fire/tetol.html#croom");
    expect(CURRENT_CIRCLE.links).not.toHaveProperty("fire");
  });
});
