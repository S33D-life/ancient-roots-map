import { describe, expect, it } from "vitest";
import { CURRENT_CIRCLE, type CurrentCircle } from "../../../supabase/functions/_shared/currentCircle";
import { currentCircleShare, renderCurrentCircleInvitation } from "./currentCircleShare";

const fixture = (): CurrentCircle => ({ ...CURRENT_CIRCLE, companions: [...CURRENT_CIRCLE.companions], links: { ...CURRENT_CIRCLE.links } });
describe("Current Circle invitation projection", () => {
  it("derives every weekly field from the accepted state", () => {
    const circle = { ...fixture(), number: 999, title: "Another Circle", question: "Another question?", companions: ["Another companion"], companionsLabel: "Another curator", weekState: "Another state", peopleSeat: "Another seat", safetyLabel: "Another label", safety: "Another safety", openLine: "Another opening" };
    const share = currentCircleShare(circle);
    expect(share).toMatchObject({ circle_number: 999, title: circle.title, central_question: circle.question, companions: circle.companions, state: circle.weekState });
    const text = renderCurrentCircleInvitation(circle);
    for (const value of [circle.title, circle.question, ...circle.companions, circle.companionsLabel, circle.weekState, circle.peopleSeat, circle.safetyLabel, circle.safety, circle.openLine]) expect(text).toContain(value);
    expect(text).toContain("Enter Circle 999");
    expect(text).not.toContain("Circle 235");
  });
  it("uses only approved destinations including Deck", () => {
    const circle = fixture();
    circle.links.fire = { url: "https://meet.google.com/approved", approved: true };
    expect(currentCircleShare(circle)?.links.fire).toBe(circle.links.fire.url);
    expect(renderCurrentCircleInvitation(circle)).toContain("Open the Council Deck");
    circle.links.councilDeck = { url: "https://www.s33d.life/draft", approved: false };
    circle.links.fire = { url: "https://app.notion.com/private", approved: true };
    expect(renderCurrentCircleInvitation(circle)).not.toContain("Open the Council Deck");
    expect(renderCurrentCircleInvitation(circle)).not.toContain("private");
    expect(renderCurrentCircleInvitation(circle)).not.toContain("/draft");
  });
  it("never passes through working manifest templates or private metadata", () => {
    const circle = { ...fixture(), invitation: { message_main: "PRIVATE DRAFT" }, observations: "PRIVATE DRAFT", links: { ...fixture().links, guide: { url: "https://www.s33d.life/unapproved", approved: false } } };
    expect(JSON.stringify(currentCircleShare(circle))).not.toContain("PRIVATE DRAFT");
    expect(renderCurrentCircleInvitation(circle)).not.toContain("unapproved");
  });
  it("emits nothing for a draft Circle even with approved links", () => {
    const circle = { ...fixture(), approval: "draft" as const, title: "SECRET" };
    expect(currentCircleShare(circle)).toBeUndefined();
    expect(renderCurrentCircleInvitation(circle)).toBeUndefined();
  });
  it("omits missing links and never falls back to historical fire", () => {
    const text = renderCurrentCircleInvitation();
    expect(text).not.toContain("meet.google.com");
    expect(text).toContain(CURRENT_CIRCLE.links.group.url);
    expect(currentCircleShare()?.links).toEqual(Object.fromEntries(Object.entries(CURRENT_CIRCLE.links).map(([k, v]) => [k, v.url])));
  });
});
