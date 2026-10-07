import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CURRENT_CIRCLE } from "../../../supabase/functions/_shared/currentCircle";
import { applyStaticCouncil, councilReturnUrl, staticCouncilProjection } from "./staticCouncilAdapter";
const legacy = () => {
  const source = readFileSync("public/tetol/circle-235/pre-fire/runtime/classic-2.js", "utf8");
  return JSON.parse(source.split("\n").find(line => line.startsWith("window.S33D_COUNCIL = ")).slice("window.S33D_COUNCIL = ".length).replace(/;$/, ""));
};
describe("static Council adapter", () => {
  it("binds approved labels before existing room code without changing companion presentation", () => {
    const registry = legacy(), manifest = registry.circles[235];
    const companions = JSON.stringify(manifest.companions), history = JSON.stringify(registry.circles[234]);
    const circle = staticCouncilProjection();
    applyStaticCouncil(registry, circle);
    expect(manifest.title).toBe("yOur Blooming Week");
    expect(manifest.central_question.text).toBe(CURRENT_CIRCLE.question);
    expect(manifest.fire.display_when_unknown).toBe(CURRENT_CIRCLE.openLine);
    expect(manifest.links.council_of_life).toBe(CURRENT_CIRCLE.links.council.url);
    expect(manifest.join_link.href).toBeNull();
    expect(JSON.stringify(manifest.companions)).toBe(companions);
    expect(JSON.stringify(registry.circles[234])).toBe(history);
  });
  it("fails closed for drafts and refuses to relabel this appearance as another Circle", () => {
    expect(staticCouncilProjection({ ...CURRENT_CIRCLE, approval: "draft" })).toBeNull();
    expect(() => applyStaticCouncil(legacy(), null)).toThrow();
    expect(() => applyStaticCouncil(legacy(), staticCouncilProjection({ ...CURRENT_CIRCLE, number: 236 }))).toThrow();
  });
  it("filters destinations and inherits changed weekly text", () => {
    const circle = staticCouncilProjection({ ...CURRENT_CIRCLE, title: "Changed", question: "Changed question", links: { ...CURRENT_CIRCLE.links, fire: { url: "https://meet.google.com/draft", approved: false }, guide: { url: "https://app.notion.com/private", approved: true } } });
    const registry = legacy(); applyStaticCouncil(registry, circle);
    expect(registry.circles[235].title).toBe("Changed");
    expect(registry.circles[235].central_question.text).toBe("Changed question");
    expect(circle.links.fire).toBeUndefined(); expect(circle.links.guide).toBeUndefined();
  });
  it("returns to the fixed 2D Council section and rejects missing Council approval", () => {
    expect(councilReturnUrl(staticCouncilProjection())).toBe("/council-of-life?from=spatial-council#next-gathering");
    expect(councilReturnUrl(staticCouncilProjection({ ...CURRENT_CIRCLE, links: { ...CURRENT_CIRCLE.links, council: { ...CURRENT_CIRCLE.links.council, approved: false } } }))).toBeNull();
  });
  it("loads the generated artifact before legacy consumers in the unpacked template", () => {
    const html = readFileSync("public/tetol/circle-235/pre-fire/tetol.html", "utf8");
    const template = JSON.parse(html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1]);
    expect(template.indexOf("runtime/current-circle.js")).toBeLessThan(template.indexOf("runtime/classic-2.js"));
  });
});
