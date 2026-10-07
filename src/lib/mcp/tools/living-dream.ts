import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { CURRENT_CIRCLE, approvedCircleUrl, type CurrentCircle } from "../../../../supabase/functions/_shared/currentCircle";
import { CROWN_GROWTHS, type CrownGrowth } from "../../../data/crown/growths";

const annotations = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };
const authority = "Read-only context. MCP access does not imply TEOTAG approval or permission to act.";
const failure = (message: string) => ({ content: [{ type: "text" as const, text: message }], isError: true });
const result = (payload: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  structuredContent: payload,
});
const provenance = (path: string) => ({ source: path, freshness: "Checked-in public projection in the serving MCP build; not a live Notion read.", authority });

/** Explicit public allowlist. Draft Circle content and unapproved links fail closed. */
export function projectCircle(circle: CurrentCircle) {
  if (circle.approval !== "approved") return undefined;
  const links = Object.fromEntries(Object.entries(circle.links).flatMap(([key, link]) => {
    const url = approvedCircleUrl(link);
    return url ? [[key, { url, approved: true }]] : [];
  }));
  return {
    number: circle.number, title: circle.title, weekState: circle.weekState,
    openLine: circle.openLine, question: circle.question, companions: [...circle.companions],
    peopleSeat: circle.peopleSeat, safety: circle.safety, companionsLabel: circle.companionsLabel,
    safetyLabel: circle.safetyLabel, approval: circle.approval, revision: circle.revision, links,
  };
}

export function summarizeGrowth(growth: CrownGrowth) {
  return {
    id: growth.id, title: growth.title, subtitle: growth.subtitle, maturity: growth.maturity,
    touchedRealms: growth.realms.touched.map(({ realm, weight, where }) => ({ realm, weight, where })),
    implementationSummary: growth.seams.map(({ id, surface, state }) => ({ id, surface, state })),
    decisionNeeded: growth.nextDecisions.length > 0,
  };
}

/** The existing Crown model is explicitly public-safe; never load private evidence bodies. */
export function projectGrowth(growth: CrownGrowth) {
  return {
    ...summarizeGrowth(growth), titleNote: growth.titleNote,
    maturitySetBy: { ...growth.maturitySetBy }, origin: [...growth.origin],
    realms: { touched: growth.realms.touched, notTouched: growth.realms.notTouched },
    sourceOfTruth: growth.sourceOfTruth, roadmapFeatureId: growth.roadmapFeatureId,
    releaseLine: growth.releaseLine,
    seams: growth.seams.map(({ id, surface, state, branch, commits, pr, mergeSha, evidence, testsRecorded, open }) =>
      ({ id, surface, state, branch, commits, pr, mergeSha, evidence, testsRecorded, open })),
    heartwood: growth.heartwood, handoffs: growth.handoffs,
    openItems: growth.seams.flatMap(seam => (seam.open ?? []).map(item => ({ seamId: seam.id, item }))),
    nextDecisions: [...growth.nextDecisions],
  };
}

/** Dependency injection is for tests, not an alternate store or a runtime write path. */
export function createLivingDreamTools(sources = {
  circle: (): CurrentCircle | undefined => CURRENT_CIRCLE,
  growths: (): readonly CrownGrowth[] => CROWN_GROWTHS,
}) {
  const read = (ctx: ToolContext, load: () => Record<string, unknown> | undefined) => {
    if (!ctx.isAuthenticated()) return failure("Not authenticated");
    try {
      const payload = load();
      return payload ? result(payload) : failure("No approved public item found.");
    } catch {
      return failure("Public projection unavailable.");
    }
  };
  return [
    defineTool({
      name: "get_current_circle", title: "Get approved Current Circle",
      description: "Read the approved public Current Circle, including its revision and safety wording. Read access grants no publication or TEOTAG authority.",
      inputSchema: {}, annotations,
      handler: (_input, ctx) => read(ctx, () => {
        const source = sources.circle();
        const circle = source && projectCircle(source);
        return circle ? { circle, provenance: provenance("supabase/functions/_shared/currentCircle.ts") } : undefined;
      }),
    }),
    defineTool({
      name: "list_growth_items", title: "List Crown growth items",
      description: "Read compact public Crown growth summaries. Public maturity is independent of implementation state; recorded engineering evidence is not proof of deployment.",
      inputSchema: {}, annotations,
      handler: (_input, ctx) => read(ctx, () => ({
        growths: sources.growths().map(summarizeGrowth), provenance: provenance("src/data/crown/growths.ts"),
      })),
    }),
    defineTool({
      name: "get_growth_item", title: "Get Crown growth item",
      description: "Read one public Crown growth and its related evidence references, memory references, handoffs, open items and next decisions. Does not fetch private evidence or confer approval.",
      inputSchema: { growth_id: z.string().trim().min(1).max(128).describe("The Crown growth id.") }, annotations,
      handler: ({ growth_id }, ctx) => read(ctx, () => {
        const growth = sources.growths().find(item => item.id === growth_id);
        return growth ? { growth: projectGrowth(growth), provenance: provenance("src/data/crown/growths.ts") } : undefined;
      }),
    }),
  ] as const;
}

export const livingDreamTools = createLivingDreamTools();
