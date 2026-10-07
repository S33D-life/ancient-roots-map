import { CURRENT_CIRCLE, approvedCircleUrl, type CurrentCircle } from "../../../supabase/functions/_shared/currentCircle";

/** Only labels/destinations. Geometry, companion objects and learning threads stay owned by the static package. */
export function staticCouncilProjection(circle: CurrentCircle = CURRENT_CIRCLE) {
  if (circle.approval !== "approved") return null;
  return { number: circle.number, title: circle.title, question: circle.question, weekState: circle.weekState,
    openLine: circle.openLine, companionsLabel: circle.companionsLabel, revision: circle.revision,
    links: Object.fromEntries(Object.entries(circle.links).flatMap(([key, link]) => {
      const url = approvedCircleUrl(link); return url ? [[key, url]] : [];
    })) };
}

export function applyStaticCouncil(registry, circle: ReturnType<typeof staticCouncilProjection>) {
  const manifest = registry.circles[registry.registry.current];
  // Package IDs/assets still describe one appearance: never relabel them as a later Circle.
  if (!circle || circle.number !== manifest.circle_number) throw new Error("Approved Current Circle does not match this static Council package");
  manifest.title = circle.title.replace(`Circle ${circle.number} · `, "");
  manifest.central_question.text = manifest.central_question.final = circle.question;
  manifest.central_question.status = "TEOTAG APPROVED";
  manifest.fire.display_note = manifest.fire.display_when_unknown = circle.openLine;
  manifest.fire.fires = []; // Scheduling is not part of the accepted projection.
  manifest.join_link.href = circle.links.fire || null;
  manifest.join_link.platform = circle.links.fire ? "Council room" : "TBC";
  manifest.join_link.status = circle.links.fire ? "APPROVED" : "TBC";
  Object.assign(manifest.tetol_surfaces, { fire_unknown: circle.openLine, fire_unknown_short: circle.weekState,
    welcome_fire_unknown: circle.openLine, join_pending: circle.openLine });
  Object.assign(manifest.links, { council_of_life: circle.links.council || null, s33d_council: circle.links.council || null,
    tetol: circle.links.tetol || null, group: circle.links.group || null, councilDeck: circle.links.councilDeck || null, join: circle.links.fire || null });
  return circle;
}

/** A fixed Council return section; no caller-provided redirect destination. */
export function councilReturnUrl(circle: ReturnType<typeof staticCouncilProjection>) {
  if (!circle?.links.council) return null;
  const url = new URL(circle.links.council);
  if (url.pathname !== "/council-of-life") return null;
  return url.pathname + "?from=spatial-council#next-gathering";
}
